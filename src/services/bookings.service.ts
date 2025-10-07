import { apiClient } from '@/lib/api';

export interface Appointment {
  id: string;
  organization_id: string;
  contact_id: string;
  patient_id?: string;
  service_id: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  reminder_sent: boolean;
  created_by_ai: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingData {
  contact_id: string;
  patient_id?: string;
  service_id: string;
  scheduled_start: string;
  scheduled_end: string;
  notes?: string;
}

export interface UpdateBookingData {
  scheduled_start?: string;
  scheduled_end?: string;
  status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  actual_start?: string;
  actual_end?: string;
}

class BookingsService {
  async list(params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    contactId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ appointments: Appointment[]; total: number }> {
    const response = await apiClient.get<{ appointments: Appointment[]; total: number }>('/api/appointments', { params });
    return response.data;
  }

  async getById(bookingId: string): Promise<Appointment> {
    const response = await apiClient.get<{ appointment: Appointment }>(`/api/appointments/${bookingId}`);
    return response.data.appointment;
  }

  async create(data: CreateBookingData): Promise<Appointment> {
    const response = await apiClient.post<{ appointment: Appointment }>('/api/appointments', data);
    return response.data.appointment;
  }

  async update(bookingId: string, data: UpdateBookingData): Promise<Appointment> {
    const response = await apiClient.patch<{ appointment: Appointment }>(`/api/appointments/${bookingId}`, data);
    return response.data.appointment;
  }

  async delete(bookingId: string): Promise<void> {
    await apiClient.delete(`/api/appointments/${bookingId}`);
  }

  async confirm(bookingId: string): Promise<Appointment> {
    const response = await apiClient.post<{ appointment: Appointment }>(`/api/appointments/${bookingId}/confirm`);
    return response.data.appointment;
  }

  async cancel(bookingId: string, reason?: string): Promise<Appointment> {
    const response = await apiClient.post<{ appointment: Appointment }>(`/api/appointments/${bookingId}/cancel`, { reason });
    return response.data.appointment;
  }

  async start(bookingId: string): Promise<Appointment> {
    const response = await apiClient.post<{ appointment: Appointment }>(`/api/appointments/${bookingId}/start`);
    return response.data.appointment;
  }

  async complete(bookingId: string): Promise<Appointment> {
    const response = await apiClient.post<{ appointment: Appointment }>(`/api/appointments/${bookingId}/complete`);
    return response.data.appointment;
  }

  async sendReminder(bookingId: string): Promise<void> {
    await apiClient.post(`/api/appointments/${bookingId}/reminder`);
  }
}

export const bookingsService = new BookingsService();
