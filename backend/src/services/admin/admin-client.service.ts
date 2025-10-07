import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import crypto from 'crypto';
import type { Tables, TablesInsert } from '../../types/database.types.js';

export interface CreateClientData {
  organizationName: string;
  email: string;
  phone?: string;
  fullName: string;
  password?: string;
  subscriptionPlan?: 'free' | 'starter' | 'pro' | 'enterprise';
}

export interface ListClientsFilters {
  isActive?: boolean;
  subscriptionPlan?: string;
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

class AdminClientService {
  /**
   * Criar novo cliente
   */
  async createClient(data: CreateClientData, adminId: string) {
    try {
      const password = data.password || crypto.randomBytes(6).toString('hex');

      // 1. Criar usuário Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password,
        email_confirm: true
      });

      if (authError || !authUser) {
        throw new Error(authError?.message || 'Failed to create auth user');
      }

      // 2. Criar organização
      const orgData: TablesInsert<'organizations'> = {
        name: data.organizationName,
        email: data.email,
        phone: data.phone,
        subscription_plan: data.subscriptionPlan || 'free',
        is_active: true,
        settings: {}
      };

      const { data: org, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert(orgData)
        .select()
        .single();

      if (orgError || !org) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw new Error(orgError?.message || 'Failed to create organization');
      }

      // 3. Criar usuário guardian
      const userData: TablesInsert<'users'> = {
        organization_id: org.id,
        email: data.email,
        full_name: data.fullName,
        role: 'guardian',
        auth_user_id: authUser.user.id
      };

      const { data: guardian, error: userError } = await supabaseAdmin
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (userError || !guardian) {
        await supabaseAdmin.from('organizations').delete().eq('id', org.id);
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw new Error(userError?.message || 'Failed to create guardian user');
      }

      // 4. Criar organization_settings
      await supabaseAdmin
        .from('organization_settings')
        .insert({
          organization_id: org.id,
          ai_enabled: true,
          aurora_enabled: true
        });

      logger.info({ organizationId: org.id, adminId }, 'Client created by admin');

      return {
        organization: org,
        guardian,
        generatedPassword: password
      };
    } catch (error) {
      logger.error({ error, data }, 'Error creating client');
      throw error;
    }
  }

  /**
   * Listar clientes com filtros
   */
  async listClients(filters: ListClientsFilters = {}) {
    try {
      let query = supabaseAdmin
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters.subscriptionPlan) {
        query = query.eq('subscription_plan', filters.subscriptionPlan);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Buscar métricas para cada cliente
      const clientsWithMetrics = await Promise.all(
        (data || []).map(async (org) => {
          const metrics = await this.getClientMetrics(org.id);
          return { ...org, metrics };
        })
      );

      return {
        clients: clientsWithMetrics,
        total: count || clientsWithMetrics.length
      };
    } catch (error) {
      logger.error({ error, filters }, 'Error listing clients');
      throw error;
    }
  }

  /**
   * Buscar cliente por ID (view 360°)
   */
  async getClient(clientId: string) {
    try {
      const { data: org, error: orgError } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .eq('id', clientId)
        .single();

      if (orgError || !org) {
        throw new Error('Organization not found');
      }

      const { data: users } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('organization_id', clientId);

      const { data: instances } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('*')
        .eq('organization_id', clientId);

      const { data: settings } = await supabaseAdmin
        .from('organization_settings')
        .select('*')
        .eq('organization_id', clientId)
        .single();

      const metrics = await this.getClientMetrics(clientId);

      return {
        organization: org,
        guardian: users?.find(u => u.role === 'guardian'),
        users: users || [],
        instances: instances || [],
        settings,
        metrics
      };
    } catch (error) {
      logger.error({ error, clientId }, 'Error fetching client');
      throw error;
    }
  }

  /**
   * Atualizar cliente
   */
  async updateClient(clientId: string, data: any, adminId: string) {
    try {
      const { data: updated, error } = await supabaseAdmin
        .from('organizations')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', clientId)
        .select()
        .single();

      if (error || !updated) {
        throw new Error(error?.message || 'Failed to update client');
      }

      logger.info({ clientId, adminId, updates: Object.keys(data) }, 'Client updated');

      return updated;
    } catch (error) {
      logger.error({ error, clientId }, 'Error updating client');
      throw error;
    }
  }

  /**
   * Arquivar cliente (soft delete)
   */
  async archiveClient(clientId: string, adminId: string) {
    try {
      const { error } = await supabaseAdmin
        .from('organizations')
        .update({
          is_active: false,
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error) throw error;

      logger.info({ clientId, adminId }, 'Client archived');
    } catch (error) {
      logger.error({ error, clientId }, 'Error archiving client');
      throw error;
    }
  }

  /**
   * Restaurar cliente arquivado
   */
  async restoreClient(clientId: string, adminId: string) {
    try {
      const { error } = await supabaseAdmin
        .from('organizations')
        .update({
          is_active: true,
          archived_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error) throw error;

      logger.info({ clientId, adminId }, 'Client restored');
    } catch (error) {
      logger.error({ error, clientId }, 'Error restoring client');
      throw error;
    }
  }

  /**
   * Deletar cliente PERMANENTEMENTE
   */
  async deleteClientPermanently(clientId: string, adminId: string) {
    try {
      // 1. Deletar usuários auth
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('auth_user_id')
        .eq('organization_id', clientId);

      for (const user of users || []) {
        if (user.auth_user_id) {
          await supabaseAdmin.auth.admin.deleteUser(user.auth_user_id);
        }
      }

      // 2. Deletar organização (cascade)
      const { error } = await supabaseAdmin
        .from('organizations')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      logger.info({ clientId, adminId }, 'Client permanently deleted');
    } catch (error) {
      logger.error({ error, clientId }, 'Error deleting client permanently');
      throw error;
    }
  }

  /**
   * Listar usuários da organização
   */
  async getOrganizationUsers(clientId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('organization_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error({ error, clientId }, 'Error fetching organization users');
      throw error;
    }
  }

  /**
   * Adicionar usuário à organização
   */
  async addOrganizationUser(clientId: string, data: any, adminId: string) {
    try {
      const password = data.password || crypto.randomBytes(6).toString('hex');

      // 1. Criar auth user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password,
        email_confirm: true
      });

      if (authError || !authUser) {
        throw new Error(authError?.message || 'Failed to create auth user');
      }

      // 2. Criar user record
      const userData: TablesInsert<'users'> = {
        organization_id: clientId,
        email: data.email,
        full_name: data.fullName,
        role: data.role || 'user',
        auth_user_id: authUser.user.id
      };

      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (userError || !user) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw new Error(userError?.message || 'Failed to create user');
      }

      logger.info({ userId: user.id, clientId, adminId }, 'User added to organization');

      return {
        user,
        generatedPassword: password
      };
    } catch (error) {
      logger.error({ error, clientId }, 'Error adding organization user');
      throw error;
    }
  }

  /**
   * Remover usuário da organização
   */
  async removeOrganizationUser(userId: string, adminId: string) {
    try {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('auth_user_id')
        .eq('id', userId)
        .single();

      if (user?.auth_user_id) {
        await supabaseAdmin.auth.admin.deleteUser(user.auth_user_id);
      }

      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      logger.info({ userId, adminId }, 'User removed from organization');
    } catch (error) {
      logger.error({ error, userId }, 'Error removing organization user');
      throw error;
    }
  }

  /**
   * Resetar senha de usuário
   */
  async resetUserPassword(userId: string, newPassword: string | undefined, adminId: string) {
    try {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('auth_user_id, email')
        .eq('id', userId)
        .single();

      if (!user?.auth_user_id) {
        throw new Error('User not found');
      }

      const password = newPassword || crypto.randomBytes(6).toString('hex');

      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        user.auth_user_id,
        { password }
      );

      if (error) throw error;

      logger.info({ userId, adminId, userEmail: user.email }, 'User password reset');

      return { password };
    } catch (error) {
      logger.error({ error, userId }, 'Error resetting user password');
      throw error;
    }
  }

  /**
   * Exportar dados do cliente
   */
  async exportClientData(clientId: string) {
    try {
      const client = await this.getClient(clientId);

      const { data: messages } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('organization_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1000);

      const { data: conversations } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('organization_id', clientId);

      const { data: contacts } = await supabaseAdmin
        .from('contacts')
        .select('*')
        .eq('organization_id', clientId);

      return {
        client,
        messages: messages || [],
        conversations: conversations || [],
        contacts: contacts || [],
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error({ error, clientId }, 'Error exporting client data');
      throw error;
    }
  }

  /**
   * Calcular métricas do cliente
   */
  private async getClientMetrics(clientId: string) {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const { count: messagesToday } = await supabaseAdmin
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', clientId)
        .gte('created_at', today.toISOString());

      const { count: messagesMonth } = await supabaseAdmin
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', clientId)
        .gte('created_at', monthStart.toISOString());

      const { count: activeConversations } = await supabaseAdmin
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', clientId)
        .eq('status', 'active');

      const { count: instancesCount } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', clientId);

      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('quota_messages_monthly')
        .eq('id', clientId)
        .single();

      const quota = org?.quota_messages_monthly || 1000;
      const quotaUsagePct = Math.round((messagesMonth || 0) / quota * 100);

      return {
        messages_today: messagesToday || 0,
        messages_month: messagesMonth || 0,
        active_conversations: activeConversations || 0,
        instances_count: instancesCount || 0,
        quota_usage_pct: quotaUsagePct
      };
    } catch (error) {
      logger.error({ error, clientId }, 'Error calculating metrics');
      return {
        messages_today: 0,
        messages_month: 0,
        active_conversations: 0,
        instances_count: 0,
        quota_usage_pct: 0
      };
    }
  }
}

export const adminClientService = new AdminClientService();
