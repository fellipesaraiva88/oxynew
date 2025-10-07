import { apiClient } from '../lib/api';

const api = apiClient;

export const trainingService = {
  async list(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await api.get('/training/plans', { params: filters });
    return response.data;
  },

  async getById(planId: string) {
    const response = await api.get(`/training/plans/${planId}`);
    return response.data;
  },

  async create(data: {
    patient_id: string;
    contact_id: string;
    initial_assessment: Record<string, unknown>;
    plan_type: '1x_semana' | '2x_semana' | '3x_semana';
    start_date: string;
    goals?: string[];
    notes?: string;
  }) {
    const response = await api.post('/training/plans', data);
    return response.data;
  },

  async update(planId: string, updates: {
    status?: 'active' | 'completed' | 'cancelled';
    progress?: Record<string, unknown>;
    notes?: string;
  }) {
    const response = await api.put(`/training/plans/${planId}`, updates);
    return response.data;
  },

  async recordProgress(planId: string, progressData: {
    session_number: number;
    date: string;
    achievements: string[];
    challenges: string[];
    trainer_notes: string;
  }) {
    const response = await api.post(`/training/plans/${planId}/progress`, progressData);
    return response.data;
  },

  // ==================== SESSION METHODS ====================

  sessions: {
    async list(filters?: {
      planId?: string;
      status?: string;
      fromDate?: string;
      toDate?: string;
      limit?: number;
      offset?: number;
    }) {
      const response = await api.get('/training/sessions', { params: filters });
      return response.data;
    },

    async getById(sessionId: string) {
      const response = await api.get(`/training/sessions/${sessionId}`);
      return response.data;
    },

    async create(data: {
      planId: string;
      sessionNumber: number;
      scheduledAt: string;
      topics: string[];
      notes?: string;
      durationMinutes?: number;
    }) {
      const response = await api.post('/training/sessions', data);
      return response.data;
    },

    async update(sessionId: string, updates: {
      scheduledAt?: string;
      status?: string;
      topics?: string[];
      notes?: string;
      trainerNotes?: string;
      durationMinutes?: number;
    }) {
      const response = await api.put(`/training/sessions/${sessionId}`, updates);
      return response.data;
    },

    async complete(sessionId: string, completionData: {
      completedAt?: string;
      trainerNotes?: string;
      achievements?: string[];
      challenges?: string[];
      petBehaviorRating?: number;
      skillsWorked?: Record<string, unknown>[];
      homework?: string;
    }) {
      const response = await api.post(`/training/sessions/${sessionId}/complete`, completionData);
      return response.data;
    },

    async cancel(sessionId: string, reason?: string) {
      const response = await api.delete(`/training/sessions/${sessionId}`, {
        data: { reason }
      });
      return response.data;
    },

    async upcoming(days: number = 7, limit: number = 10) {
      const response = await api.get('/training/sessions/upcoming', {
        params: { days, limit }
      });
      return response.data;
    },

    async byPlan(planId: string) {
      const response = await api.get(`/training/plans/${planId}/sessions`);
      return response.data;
    }
  }
};
