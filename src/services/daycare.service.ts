import { apiClient } from '../lib/api';

export const daycareService = {
  async list(filters?: {
    status?: string;
    stayType?: 'daycare' | 'hotel';
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await apiClient.get('/api/daycare/reservations', { params: filters });
    return response.data;
  },

  async getById(stayId: string) {
    const response = await apiClient.get(`/api/daycare/reservations/${stayId}`);
    return response.data;
  },

  async create(data: {
    patient_id: string;
    contact_id: string;
    health_assessment: {
      vacinas: boolean;
      vermifugo: boolean;
      exames?: string[];
      restricoes_alimentares?: string[];
    };
    behavior_assessment: {
      socializacao: string;
      ansiedade: string;
      energia: string;
      teste_adaptacao?: string;
    };
    stay_type: 'daycare' | 'hotel';
    check_in_date: string;
    check_out_date?: string;
    extra_services?: string[];
    notes?: string;
  }) {
    // Transform frontend format to backend format
    const payload = {
      contactId: data.contact_id,
      patientId: data.patient_id,
      stayType: data.stay_type === 'daycare' ? 'daycare_diario' : 'hospedagem_pernoite',
      checkInDate: data.check_in_date,
      checkOutDate: data.check_out_date || '',
      healthAssessment: data.health_assessment,
      behaviorAssessment: data.behavior_assessment,
      specialRequests: data.notes || '',
      medicalHistory: ''
    };

    const response = await apiClient.post('/api/daycare/reservations', payload);
    return response.data;
  },

  async update(stayId: string, updates: {
    status?: 'aguardando_avaliacao' | 'aprovado' | 'em_estadia' | 'finalizado' | 'cancelado';
    extra_services?: string[];
    check_out_date?: string;
    notes?: string;
  }) {
    // Transform to backend format
    const payload = {
      status: updates.status,
      extraServices: updates.extra_services,
      checkOutDate: updates.check_out_date,
      notes: updates.notes
    };

    const response = await apiClient.put(`/api/daycare/reservations/${stayId}`, payload);
    return response.data;
  },

  async getUpsells(stayId: string) {
    const response = await apiClient.get(`/api/daycare/reservations/${stayId}/upsells`);
    return response.data;
  },

  async addExtraService(stayId: string, service: string) {
    // Use the update endpoint to add service to extra_services array
    const response = await apiClient.put(`/api/daycare/reservations/${stayId}`, {
      extraServices: [service] // Backend will merge with existing
    });
    return response.data;
  },

  async getTimeline(stayId: string) {
    const response = await apiClient.get(`/api/daycare/reservations/${stayId}/timeline`);
    return response.data;
  },

  async addTimelineEvent(stayId: string, event: {
    activityType: string;
    description: string;
    timestamp?: string;
    notes?: string;
  }) {
    const response = await apiClient.post(`/api/daycare/reservations/${stayId}/activity`, event);
    return response.data;
  },

  async getPendingReports() {
    const response = await apiClient.get('/api/daycare/reports/pending');
    return response.data;
  },

  async sendReport(stayId: string) {
    const response = await apiClient.post(`/api/daycare/reports/${stayId}/send`);
    return response.data;
  }
};
