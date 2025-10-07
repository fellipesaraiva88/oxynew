import axios, { AxiosInstance } from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://oxy-backend-8xyx.onrender.com';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api/v1`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.client.interceptors.request.use(async (config) => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }

      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await supabase.auth.signOut();
        }
        return Promise.reject(error);
      }
    );
  }

  // WhatsApp APIs
  async getWhatsAppStatus(instanceId: string) {
    const { data } = await this.client.get(`/whatsapp/${instanceId}/status`);
    return data;
  }

  async generatePairingCode(instanceId: string) {
    const { data } = await this.client.post(`/whatsapp/${instanceId}/pairing-code`);
    return data;
  }

  // Contacts APIs
  async getContacts(params?: { search?: string; limit?: number; offset?: number }) {
    const { data } = await this.client.get('/contacts', { params });
    return data;
  }

  async getContactById(id: string) {
    const { data } = await this.client.get(`/contacts/${id}`);
    return data;
  }

  async createContact(contact: any) {
    const { data } = await this.client.post('/contacts', contact);
    return data;
  }

  async updateContact(id: string, contact: any) {
    const { data } = await this.client.put(`/contacts/${id}`, contact);
    return data;
  }

  // Pets APIs
  async getPets(contactId: string) {
    const { data } = await this.client.get(`/contacts/${contactId}/pets`);
    return data;
  }

  async createPet(contactId: string, pet: any) {
    const { data } = await this.client.post(`/contacts/${contactId}/pets`, pet);
    return data;
  }

  // Bookings APIs
  async getBookings(params?: { startDate?: string; endDate?: string }) {
    const { data } = await this.client.get('/bookings', { params });
    return data;
  }

  async createBooking(booking: any) {
    const { data } = await this.client.post('/bookings', booking);
    return data;
  }

  async updateBooking(id: string, booking: any) {
    const { data } = await this.client.put(`/bookings/${id}`, booking);
    return data;
  }

  async cancelBooking(id: string) {
    const { data } = await this.client.delete(`/bookings/${id}`);
    return data;
  }

  // Conversations APIs
  async getConversations(params?: { limit?: number; offset?: number }) {
    const { data } = await this.client.get('/conversations', { params });
    return data;
  }

  async getConversationById(id: string) {
    const { data } = await this.client.get(`/conversations/${id}`);
    return data;
  }

  async getMessages(conversationId: string, params?: { limit?: number; offset?: number }) {
    const { data } = await this.client.get(`/conversations/${conversationId}/messages`, { params });
    return data;
  }

  async sendMessage(conversationId: string, message: { content: string; type?: string }) {
    const { data } = await this.client.post(`/conversations/${conversationId}/messages`, message);
    return data;
  }

  // Aurora APIs
  async sendAuroraMessage(message: string) {
    const { data } = await this.client.post('/aurora/message', { message });
    return data;
  }

  async getAuroraContext() {
    const { data } = await this.client.get('/aurora/context');
    return data;
  }

  // Dashboard/Analytics APIs
  async getDashboardStats() {
    const { data } = await this.client.get('/analytics/dashboard');
    return data;
  }

  async getActivityFeed(params?: { limit?: number }) {
    const { data } = await this.client.get('/analytics/activity', { params });
    return data;
  }
}

export const api = new ApiClient();
