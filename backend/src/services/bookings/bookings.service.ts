import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import type { Tables, TablesInsert } from '../../types/database.types.js';

export type Appointment = Tables<'appointments'>;

export interface BookingLegacy {
  id: string;
  organization_id: string;
  contact_id: string;
  patient_id: string | null;
  service_id: string;
  whatsapp_instance_id: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  cancellation_reason: string | null;
  notes: string | null;
  reminder_sent_at: string | null;
  price_cents: number | null;
  created_by_ai: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingData {
  organization_id: string;
  contact_id: string;
  service_id: string;
  scheduled_start: string;
  scheduled_end: string;
  patient_id?: string;
  whatsapp_instance_id?: string;
  status?: 'pending' | 'confirmed';
  notes?: string;
  price_cents?: number;
  created_by_ai?: boolean;
}

export interface UpdateBookingData {
  scheduled_start?: string;
  scheduled_end?: string;
  status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  cancellation_reason?: string;
  notes?: string;
  reminder_sent_at?: string;
  price_cents?: number;
}

export class BookingsService {
  /**
   * Cria um novo agendamento
   */
  async create(data: CreateBookingData): Promise<Appointment> {
    try {
      // Verificar disponibilidade
      const isAvailable = await this.checkAvailability(
        data.organization_id,
        data.scheduled_start,
        data.scheduled_end
      );

      if (!isAvailable) {
        throw new Error('Horário não disponível');
      }

      const bookingData: TablesInsert<'appointments'> = {
        ...data,
        status: data.status || 'pending',
        created_by_ai: data.created_by_ai || false
      };
      const { data: appointment, error } = await supabaseAdmin
        .from('appointments')
        .insert(bookingData)
        .select()
        .single() as { data: Appointment | null; error: any };

      if (error || !appointment) {
        throw error || new Error('Failed to create appointment');
      }

      logger.info({ bookingId: appointment.id }, 'Appointment created');
      return appointment;
    } catch (error) {
      logger.error({ error, data }, 'Error creating appointment');
      throw error;
    }
  }

  /**
   * Busca agendamento por ID
   */
  async findById(bookingId: string): Promise<Appointment | null> {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        contacts(full_name, phone_number),
        patients(name, gender_identity),
        services(name, type, duration_minutes)
      `)
      .eq('id', bookingId)
      .single();

    if (error) {
      logger.error({ error, bookingId }, 'Error finding appointment by ID');
      return null;
    }

    return data as any;
  }

  /**
   * Lista agendamentos de uma organização
   */
  async listByOrganization(
    organizationId: string,
    filters?: {
      status?: string[];
      startDate?: string;
      endDate?: string;
      contactId?: string;
      patientId?: string;
    }
  ): Promise<Appointment[]> {
    let query = supabaseAdmin
      .from('appointments')
      .select(`
        *,
        contacts(full_name, phone_number),
        patients(name, gender_identity),
        services(name, type)
      `)
      .eq('organization_id', organizationId)
      .order('scheduled_start', { ascending: true });

    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    if (filters?.startDate) {
      query = query.gte('scheduled_start', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('scheduled_end', filters.endDate);
    }

    if (filters?.contactId) {
      query = query.eq('contact_id', filters.contactId);
    }

    if (filters?.patientId) {
      query = query.eq('patient_id', filters.patientId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ error, organizationId }, 'Error listing appointments');
      return [];
    }

    return data as any[];
  }

  /**
   * Lista agendamentos de hoje
   */
  async listToday(organizationId: string): Promise<Appointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.listByOrganization(organizationId, {
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
      status: ['pending', 'confirmed', 'in_progress']
    });
  }

  /**
   * Atualiza agendamento
   */
  async update(bookingId: string, data: UpdateBookingData): Promise<Appointment | null> {
    const { data: updated, error } = await supabaseAdmin
      .from('appointments')
      .update(data)
      .eq('id', bookingId)
      .select()
      .single() as { data: Appointment | null; error: any };

    if (error) {
      logger.error({ error, bookingId }, 'Error updating appointment');
      return null;
    }

    logger.info({ bookingId, status: data.status }, 'Appointment updated');
    return updated as Appointment;
  }

  /**
   * Confirma agendamento
   */
  async confirm(bookingId: string): Promise<void> {
    await this.update(bookingId, { status: 'confirmed' });
  }

  /**
   * Cancela agendamento
   */
  async cancel(bookingId: string, reason?: string): Promise<void> {
    await this.update(bookingId, {
      status: 'cancelled',
      cancellation_reason: reason
    });
  }

  /**
   * Marca como no-show
   */
  async markNoShow(bookingId: string): Promise<void> {
    await this.update(bookingId, { status: 'no_show' });
  }

  /**
   * Completa agendamento
   */
  async complete(bookingId: string): Promise<void> {
    await this.update(bookingId, { status: 'completed' });
  }

  /**
   * Marca lembrete como enviado
   */
  async markReminderSent(bookingId: string): Promise<void> {
    await this.update(bookingId, { reminder_sent_at: new Date().toISOString() });
  }

  /**
   * Verifica disponibilidade de horário
   */
  async checkAvailability(
    organizationId: string,
    start: string,
    end: string,
    excludeBookingId?: string
  ): Promise<boolean> {
    let query = supabaseAdmin
      .from('appointments')
      .select('id')
      .eq('organization_id', organizationId)
      .in('status', ['pending', 'confirmed', 'in_progress'])
      .or(`and(scheduled_start.lte.${end},scheduled_end.gte.${start})`);

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ error }, 'Error checking availability');
      return false;
    }

    return data.length === 0;
  }

  /**
   * Busca agendamentos pendentes de lembrete
   */
  async findPendingReminders(
    organizationId: string,
    hoursAhead: number = 24
  ): Promise<Appointment[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        contacts(full_name, phone_number),
        patients(name),
        services(name)
      `)
      .eq('organization_id', organizationId)
      .in('status', ['pending', 'confirmed'])
      .is('reminder_sent_at', null)
      .gte('scheduled_start', now.toISOString())
      .lte('scheduled_start', futureDate.toISOString());

    if (error) {
      logger.error({ error }, 'Error finding pending reminders');
      return [];
    }

    return data as any[];
  }

  /**
   * Reagenda appointment
   */
  async reschedule(
    bookingId: string,
    newStart: string,
    newEnd: string
  ): Promise<Appointment | null> {
    const appointment = await this.findById(bookingId);
    if (!appointment) return null;

    // Verificar disponibilidade do novo horário
    const isAvailable = await this.checkAvailability(
      appointment.organization_id,
      newStart,
      newEnd,
      bookingId
    );

    if (!isAvailable) {
      throw new Error('Novo horário não disponível');
    }

    return this.update(bookingId, {
      scheduled_start: newStart,
      scheduled_end: newEnd,
      status: 'pending' // Reset para pending após reagendar
    });
  }

  /**
   * Deleta appointment
   */
  async delete(bookingId: string): Promise<void> {
    await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('id', bookingId);

    logger.info({ bookingId }, 'Appointment deleted');
  }
}

export const bookingsService = new BookingsService();
