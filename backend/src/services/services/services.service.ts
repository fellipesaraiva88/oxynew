import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import type { Tables } from '../../types/database.types.js';

export type Service = Tables<'services'>;

export interface ServiceStats {
  total_services: number;
  active_services: number;
  top_services: Array<{
    id: string;
    name: string;
    type: string;
    price_cents: number;
    bookings_count: number;
  }>;
}

export interface ServiceRevenue {
  service_id: string;
  service_name: string;
  total_bookings: number;
  total_revenue_cents: number;
  avg_price_cents: number;
}

export class ServicesService {
  /**
   * Lista todos os serviços de uma organização
   */
  async listByOrganization(
    organizationId: string,
    activeOnly: boolean = true
  ): Promise<Service[]> {
    try {
      let query = supabaseAdmin
        .from('services')
        .select('*')
        .eq('organization_id', organizationId);

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query.order('name');

      if (error) {
        logger.error({ error, organizationId }, 'Error listing services');
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error({ error, organizationId }, 'Failed to list services');
      return [];
    }
  }

  /**
   * Busca estatísticas de serviços (top 3 mais vendidos)
   */
  async getStats(organizationId: string): Promise<ServiceStats> {
    try {
      // Buscar todos os serviços
      const services = await this.listByOrganization(organizationId);

      // Buscar contagem de appointments por serviço (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: appointments, error: bookingsError } = await supabaseAdmin
        .from('appointments')
        .select('service_id')
        .eq('organization_id', organizationId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (bookingsError) {
        logger.error({ error: bookingsError }, 'Error fetching appointment stats');
      }

      // Contar appointments por serviço
      const bookingCounts = new Map<string, number>();
      appointments?.forEach(appointment => {
        if (appointment.service_id) {
          const count = bookingCounts.get(appointment.service_id) || 0;
          bookingCounts.set(appointment.service_id, count + 1);
        }
      });

      // Combinar dados
      const servicesWithCounts = services.map(service => ({
        id: service.id,
        name: service.name,
        type: service.type,
        price_cents: service.price_cents,
        bookings_count: bookingCounts.get(service.id) || 0
      }));

      // Top 3 serviços
      const topServices = servicesWithCounts
        .sort((a, b) => b.bookings_count - a.bookings_count)
        .slice(0, 3);

      return {
        total_services: services.length,
        active_services: services.filter(s => s.is_active).length,
        top_services: topServices
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Failed to get service stats');
      return {
        total_services: 0,
        active_services: 0,
        top_services: []
      };
    }
  }

  /**
   * Calcula receita por serviço em um período
   */
  async getRevenue(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ServiceRevenue[]> {
    try {
      const { data: appointments, error } = await supabaseAdmin
        .from('appointments')
        .select(`
          service_id,
          services (
            id,
            name,
            price_cents
          )
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'completed')
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString());

      if (error) {
        logger.error({ error }, 'Error fetching revenue data');
        throw error;
      }

      // Agrupar por serviço
      const revenueMap = new Map<string, {
        name: string;
        appointments: number;
        revenue: number;
        prices: number[];
      }>();

      appointments?.forEach((appointment: any) => {
        if (appointment.services && appointment.service_id) {
          const serviceId = appointment.service_id;
          const serviceName = appointment.services.name;
          const price = Number(appointment.services.price_cents) || 0;

          const existing = revenueMap.get(serviceId) || {
            name: serviceName,
            appointments: 0,
            revenue: 0,
            prices: [] as number[]
          };

          existing.appointments += 1;
          existing.revenue += price;
          existing.prices.push(price);

          revenueMap.set(serviceId, existing);
        }
      });

      // Converter para array
      const revenues: ServiceRevenue[] = Array.from(revenueMap.entries()).map(
        ([serviceId, data]) => ({
          service_id: serviceId,
          service_name: data.name,
          total_bookings: data.appointments,
          total_revenue_cents: data.revenue,
          avg_price_cents: Math.round(data.revenue / data.appointments)
        })
      );

      return revenues.sort((a, b) => b.total_revenue_cents - a.total_revenue_cents);
    } catch (error) {
      logger.error({ error, organizationId }, 'Failed to calculate revenue');
      return [];
    }
  }

  /**
   * Busca serviço por categoria
   */
  async getByCategory(
    organizationId: string,
    category: string
  ): Promise<Service[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('services')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('type', category)
        .eq('is_active', true)
        .order('name');

      if (error) {
        logger.error({ error }, 'Error fetching services by category');
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error({ error }, 'Failed to get services by category');
      return [];
    }
  }
}

export const servicesService = new ServicesService();
