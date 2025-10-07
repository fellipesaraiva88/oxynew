import { apiClient } from '@/lib/api';

export interface Contact {
  id: string;
  organization_id: string;
  phone_number: string;
  full_name?: string;
  email?: string;
  notes?: string;
  tags?: string[];
  is_blocked: boolean;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContactData {
  phone_number: string;
  full_name?: string;
  email?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateContactData {
  full_name?: string;
  email?: string;
  notes?: string;
  tags?: string[];
  is_blocked?: boolean;
  attendance_stage?: string;
}

class ContactsService {
  async list(params?: { search?: string; limit?: number; offset?: number }): Promise<{ contacts: Contact[]; total: number }> {
    const response = await apiClient.get<{ contacts: Contact[]; total: number }>('/api/contacts', { params });
    return response.data;
  }

  async getById(contactId: string): Promise<Contact> {
    const response = await apiClient.get<{ contact: Contact }>(`/api/contacts/${contactId}`);
    return response.data.contact;
  }

  async create(data: CreateContactData): Promise<Contact> {
    const response = await apiClient.post<{ contact: Contact }>('/api/contacts', data);
    return response.data.contact;
  }

  async update(contactId: string, data: UpdateContactData): Promise<Contact> {
    const response = await apiClient.patch<{ contact: Contact }>(`/api/contacts/${contactId}`, data);
    return response.data.contact;
  }

  async delete(contactId: string): Promise<void> {
    await apiClient.delete(`/api/contacts/${contactId}`);
  }

  async block(contactId: string): Promise<void> {
    await apiClient.post(`/api/contacts/${contactId}/block`);
  }

  async unblock(contactId: string): Promise<void> {
    await apiClient.post(`/api/contacts/${contactId}/unblock`);
  }
}

export const contactsService = new ContactsService();
