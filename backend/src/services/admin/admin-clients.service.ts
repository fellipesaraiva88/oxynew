import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';

/**
 * AdminClientsService
 *
 * TRANSFORMAÇÃO: Tech nunca mais entra no banco, CS gerencia petshops sozinho.
 *
 * Permite:
 * - CRUD completo de organizations
 * - Ativar/desativar contas
 * - Ver estatísticas de uso
 * - Criar primeiro guardian automaticamente
 */
export class AdminClientsService {
  /**
   * Listar todas organizations
   *
   * Impacto: Ver todos clientes filtrados em 1 request
   */
  async listClients(filters: {
    subscription_plan?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('organizations')
        .select('*, users!inner(count)', { count: 'exact' });

      // Filtros
      if (filters.subscription_plan) {
        query = query.eq('subscription_plan', filters.subscription_plan);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      logger.error({ error, filters }, 'Failed to list clients');
      throw error;
    }
  }

  /**
   * Detalhes completos de uma organization
   *
   * Impacto: Visão 360° do cliente em 1 click
   */
  async getClient(organizationId: string) {
    try {
      // Organization base
      const { data: org, error: orgError } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (orgError || !org) throw new Error('Organization not found');

      // Users
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, email, role, created_at')
        .eq('organization_id', organizationId);

      // WhatsApp instances
      const { data: instances } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('id, name, phone_number, status')
        .eq('organization_id', organizationId);

      // Stats (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: messagesCount } = await supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { count: bookingsCount } = await supabaseAdmin
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { count: contactsCount } = await supabaseAdmin
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      return {
        organization: org,
        users: users || [],
        instances: instances || [],
        stats: {
          messages_30d: messagesCount || 0,
          bookings_30d: bookingsCount || 0,
          total_contacts: contactsCount || 0
        }
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Failed to get client');
      throw error;
    }
  }

  /**
   * Criar nova organization (admin action)
   *
   * Impacto: Onboarding automatizado, guardian criado junto
   */
  async createClient(data: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    subscription_plan?: 'free' | 'pro' | 'enterprise';
    owner_email: string;
    owner_password: string;
  }) {
    try {
      // 1. Criar organization
      const { data: org, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          subscription_plan: data.subscription_plan || 'free',
          is_active: true
        })
        .select()
        .single();

      if (orgError || !org) throw new Error('Failed to create organization');

      // 2. Criar auth user no Supabase Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.owner_email,
        password: data.owner_password,
        email_confirm: true
      });

      if (authError || !authUser.user) throw new Error('Failed to create auth user');

      // 3. Criar user na tabela users
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          organization_id: org.id,
          auth_user_id: authUser.user.id,
          email: data.owner_email,
          full_name: data.owner_email.split('@')[0],
          role: 'guardian'
        });

      if (userError) {
        // Rollback: deletar org e auth user
        await supabaseAdmin.from('organizations').delete().eq('id', org.id);
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw new Error('Failed to create user record');
      }

      // 4. Criar organization_settings
      await supabaseAdmin
        .from('organization_settings')
        .insert({
          organization_id: org.id,
          business_hours: { monday: { open: '09:00', close: '18:00' } },
          auto_reply_enabled: true
        });

      logger.info({ organizationId: org.id, ownerEmail: data.owner_email }, 'Client created by admin');

      return org;
    } catch (error) {
      logger.error({ error, data }, 'Failed to create client');
      throw error;
    }
  }

  /**
   * Atualizar organization
   *
   * Impacto: Mudança de plano, quotas, configs em 1 request
   */
  async updateClient(organizationId: string, updates: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    subscription_plan?: 'free' | 'pro' | 'enterprise';
    quota_messages?: number;
    quota_whatsapp_instances?: number;
  }) {
    try {
      const { data, error } = await supabaseAdmin
        .from('organizations')
        .update(updates)
        .eq('id', organizationId)
        .select()
        .single();

      if (error) throw error;

      logger.info({ organizationId, updates }, 'Client updated by admin');

      return data;
    } catch (error) {
      logger.error({ error, organizationId, updates }, 'Failed to update client');
      throw error;
    }
  }

  /**
   * Soft delete organization
   *
   * Impacto: Cancelamento seguro, dados preservados
   */
  async deleteClient(organizationId: string) {
    try {
      const { error } = await supabaseAdmin
        .from('organizations')
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .eq('id', organizationId);

      if (error) throw error;

      logger.info({ organizationId }, 'Client soft deleted by admin');

      return { success: true };
    } catch (error) {
      logger.error({ error, organizationId }, 'Failed to delete client');
      throw error;
    }
  }

  /**
   * Ativar organization
   */
  async activateClient(organizationId: string) {
    try {
      const { error } = await supabaseAdmin
        .from('organizations')
        .update({ is_active: true, deleted_at: null })
        .eq('id', organizationId);

      if (error) throw error;

      logger.info({ organizationId }, 'Client activated by admin');

      return { success: true };
    } catch (error) {
      logger.error({ error, organizationId }, 'Failed to activate client');
      throw error;
    }
  }

  /**
   * Desativar organization
   */
  async deactivateClient(organizationId: string) {
    try {
      const { error } = await supabaseAdmin
        .from('organizations')
        .update({ is_active: false })
        .eq('id', organizationId);

      if (error) throw error;

      logger.info({ organizationId }, 'Client deactivated by admin');

      return { success: true };
    } catch (error) {
      logger.error({ error, organizationId }, 'Failed to deactivate client');
      throw error;
    }
  }
}

export const adminClientsService = new AdminClientsService();
