import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import type { Tables, TablesInsert } from '../../types/database.types.js';

export type Contact = Tables<'contacts'>;

export interface ContactLegacy {
  id: string;
  organization_id: string;
  whatsapp_instance_id: string | null;
  phone_number: string;
  full_name: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  tags: string[];
  last_interaction_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateContactData {
  organization_id: string;
  phone_number: string;
  whatsapp_instance_id?: string;
  full_name?: string;
  email?: string;
  address?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateContactData {
  full_name?: string;
  email?: string;
  address?: string;
  notes?: string;
  tags?: string[];
  is_active?: boolean;
  whatsapp_push_name?: string;
  profile_picture_url?: string;
  attendance_stage?: string;
}

export class ContactsService {
  /**
   * Busca ou cria contato por número de telefone
   */
  async findOrCreateByPhone(
    organizationId: string,
    phoneNumber: string,
    instanceId?: string
  ): Promise<Contact> {
    try {
      // Buscar contato existente
      const { data: existing, error: findError } = await supabaseAdmin
        .from('contacts')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('phone_number', phoneNumber)
        .single();

      if (existing && !findError) {
        // Atualizar última interação
        await this.updateLastInteraction(existing.id);
        return existing as Contact;
      }

      // Criar novo contato
      const contactData: TablesInsert<'contacts'> = {
        organization_id: organizationId,
        phone_number: phoneNumber,
        whatsapp_instance_id: instanceId,
        last_interaction_at: new Date().toISOString(),
        is_active: true,
        tags: []
      };
      const { data: newContact, error: createError } = await supabaseAdmin
        .from('contacts')
        .insert(contactData)
        .select()
        .single() as { data: Contact | null; error: any };

      if (createError || !newContact) {
        throw createError || new Error('Failed to create contact');
      }

      logger.info({ contactId: newContact.id, phoneNumber }, 'New contact created');
      return newContact;
    } catch (error) {
      logger.error({ error, phoneNumber }, 'Error finding/creating contact');
      throw error;
    }
  }

  /**
   * Busca contato por ID
   */
  async findById(contactId: string): Promise<Contact | null> {
    const { data, error } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (error) {
      logger.error({ error, contactId }, 'Error finding contact by ID');
      return null;
    }

    return data as Contact;
  }

  /**
   * Lista contatos de uma organização
   */
  async listByOrganization(
    organizationId: string,
    filters?: {
      isActive?: boolean;
      tags?: string[];
      searchQuery?: string;
    }
  ): Promise<Contact[]> {
    let query = supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('last_interaction_at', { ascending: false, nullsFirst: false });

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    if (filters?.searchQuery) {
      query = query.or(
        `full_name.ilike.%${filters.searchQuery}%,phone_number.ilike.%${filters.searchQuery}%,email.ilike.%${filters.searchQuery}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ error, organizationId }, 'Error listing contacts');
      return [];
    }

    return data as Contact[];
  }

  /**
   * Atualiza contato
   */
  async update(contactId: string, data: UpdateContactData): Promise<Contact | null> {
    const { data: updated, error } = await supabaseAdmin
      .from('contacts')
      .update(data)
      .eq('id', contactId)
      .select()
      .single() as { data: Contact | null; error: any };

    if (error) {
      logger.error({ error, contactId }, 'Error updating contact');
      return null;
    }

    logger.info({ contactId }, 'Contact updated');
    return updated as Contact;
  }

  /**
   * Atualiza última interação
   */
  async updateLastInteraction(contactId: string): Promise<void> {
    await supabaseAdmin
      .from('contacts')
      .update({ last_interaction_at: new Date().toISOString() })
      .eq('id', contactId);
  }

  /**
   * 📸 Atualiza dados do WhatsApp (nome e foto de perfil)
   * Chamado automaticamente quando mensagem é recebida
   */
  async updateWhatsAppData(contactId: string, data: {
    pushName?: string;
    profilePictureUrl?: string;
  }): Promise<void> {
    try {
      const updateData: Partial<UpdateContactData> = {};

      // Atualizar pushName se fornecido e contato não tem full_name ainda
      if (data.pushName) {
        const contact = await this.findById(contactId);
        if (contact && !contact.full_name) {
          updateData.full_name = data.pushName;
        }
        updateData.whatsapp_push_name = data.pushName;
      }

      // Atualizar foto de perfil se fornecida
      if (data.profilePictureUrl) {
        updateData.profile_picture_url = data.profilePictureUrl;
      }

      if (Object.keys(updateData).length > 0) {
        await supabaseAdmin
          .from('contacts')
          .update(updateData)
          .eq('id', contactId);

        logger.info({ contactId, updateData }, '📸 WhatsApp data updated for contact');
      }
    } catch (error) {
      logger.error({ error, contactId }, 'Error updating WhatsApp data');
    }
  }

  /**
   * Adiciona tags ao contato
   */
  async addTags(contactId: string, tags: string[]): Promise<void> {
    const contact = await this.findById(contactId);
    if (!contact) return;

    const currentTags = contact.tags || [];
    const newTags = [...new Set([...currentTags, ...tags])];

    await this.update(contactId, { tags: newTags });
  }

  /**
   * Remove tags do contato
   */
  async removeTags(contactId: string, tags: string[]): Promise<void> {
    const contact = await this.findById(contactId);
    if (!contact) return;

    const currentTags = contact.tags || [];
    const newTags = currentTags.filter(tag => !tags.includes(tag));

    await this.update(contactId, { tags: newTags });
  }

  /**
   * Busca contatos inativos (sem interação há X dias)
   */
  async findInactive(organizationId: string, daysInactive: number = 30): Promise<Contact[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const { data, error } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .lt('last_interaction_at', cutoffDate.toISOString())
      .order('last_interaction_at', { ascending: true });

    if (error) {
      logger.error({ error, organizationId, daysInactive }, 'Error finding inactive contacts');
      return [];
    }

    return data as Contact[];
  }

  /**
   * Desativa contato
   */
  async deactivate(contactId: string): Promise<void> {
    await this.update(contactId, { is_active: false });
  }

  /**
   * Reativa contato
   */
  async reactivate(contactId: string): Promise<void> {
    await this.update(contactId, { is_active: true });
  }
}

export const contactsService = new ContactsService();
