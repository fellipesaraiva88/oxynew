import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';

/**
 * Tipos de ações admin que podem ser auditadas
 */
export type AdminActionType =
  // Client Management
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'client_archived'
  | 'client_restored'
  // User Management
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_role_changed'
  | 'password_reset'
  // WhatsApp Management
  | 'qr_generated'
  | 'pairing_code_generated'
  | 'instance_reconnected'
  | 'instance_disconnected'
  // Financial
  | 'plan_changed'
  | 'credits_injected'
  | 'invoice_generated'
  // Configuration
  | 'feature_flag_toggled'
  | 'quota_updated'
  | 'settings_updated'
  // Advanced Actions
  | 'impersonation_started'
  | 'impersonation_ended'
  | 'aurora_message_sent'
  | 'data_exported'
  | 'backup_created'
  // Status Changes
  | 'status_toggled'
  | 'subscription_updated';

/**
 * Interface para entrada de log de auditoria
 */
export interface AuditLogEntry {
  adminId: string;
  targetClientId?: string;
  targetUserId?: string;
  actionType: AdminActionType;
  actionDetails?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Interface para filtros de histórico
 */
export interface AuditHistoryFilters {
  clientId?: string;
  adminId?: string;
  userId?: string;
  actionType?: AdminActionType;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

/**
 * Serviço de Auditoria Admin
 *
 * Responsabilidades:
 * - Registrar todas as ações executadas por admins
 * - Consultar histórico de auditoria
 * - Gerar relatórios de atividades
 * - Gerenciar sessões de impersonation
 */
class AdminAuditService {

  /**
   * Registra uma ação admin no log de auditoria
   */
  async logAction(entry: AuditLogEntry): Promise<string | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_actions_log')
        .insert({
          admin_id: entry.adminId,
          target_client_id: entry.targetClientId,
          target_user_id: entry.targetUserId,
          action_type: entry.actionType,
          action_details: entry.actionDetails,
          metadata: entry.metadata || {},
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent
        })
        .select('id')
        .single();

      if (error) throw error;

      logger.info({
        logId: data.id,
        adminId: entry.adminId,
        action: entry.actionType,
        target: entry.targetClientId || entry.targetUserId
      }, 'Admin action logged successfully');

      return data.id;
    } catch (error) {
      logger.error({ error, entry }, 'Failed to log admin action');
      return null;
    }
  }

  /**
   * Busca histórico de auditoria do cliente
   */
  async getClientAuditHistory(clientId: string, limit = 50) {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_audit_history')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error({ error, clientId }, 'Failed to fetch client audit history');
      throw error;
    }
  }

  /**
   * Busca histórico de auditoria com filtros avançados
   */
  async getAuditHistory(filters: AuditHistoryFilters = {}) {
    try {
      let query = supabaseAdmin
        .from('admin_audit_history')
        .select('*');

      if (filters.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      if (filters.adminId) {
        query = query.eq('admin_id', filters.adminId);
      }

      if (filters.userId) {
        query = query.eq('target_user_id', filters.userId);
      }

      if (filters.actionType) {
        query = query.eq('action_type', filters.actionType);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(filters.limit || 100);

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error({ error, filters }, 'Failed to fetch audit history');
      throw error;
    }
  }

  /**
   * Busca atividades recentes de um admin
   */
  async getAdminActivity(adminId: string, limit = 50) {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_audit_history')
        .select('*')
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error({ error, adminId }, 'Failed to fetch admin activity');
      throw error;
    }
  }

  /**
   * Registra início de sessão de impersonation
   */
  async logImpersonationStart(
    adminId: string,
    targetClientId: string,
    targetUserId: string,
    token: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_impersonation_sessions')
        .insert({
          admin_id: adminId,
          target_client_id: targetClientId,
          target_user_id: targetUserId,
          impersonation_token: token,
          expires_at: expiresAt.toISOString(),
          ip_address: ipAddress,
          user_agent: userAgent,
          is_active: true
        })
        .select('id')
        .single();

      if (error) throw error;

      // Também registrar no log geral
      await this.logAction({
        adminId,
        targetClientId,
        targetUserId,
        actionType: 'impersonation_started',
        actionDetails: `Admin iniciou impersonation como usuário`,
        metadata: { sessionId: data.id, expiresAt: expiresAt.toISOString() },
        ipAddress,
        userAgent
      });

      logger.info({
        sessionId: data.id,
        adminId,
        targetClientId,
        targetUserId
      }, 'Impersonation session started');

      return data.id;
    } catch (error) {
      logger.error({ error, adminId, targetClientId }, 'Failed to log impersonation start');
      return null;
    }
  }

  /**
   * Finaliza sessão de impersonation
   */
  async endImpersonationSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('admin_impersonation_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      logger.info({ sessionId }, 'Impersonation session ended');
      return true;
    } catch (error) {
      logger.error({ error, sessionId }, 'Failed to end impersonation session');
      return false;
    }
  }

  /**
   * Busca sessões ativas de impersonation
   */
  async getActiveImpersonationSessions() {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_impersonation_sessions')
        .select(`
          *,
          admin:admin_id(full_name, email),
          client:target_client_id(name, email),
          user:target_user_id(full_name, email)
        `)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error({ error }, 'Failed to fetch active impersonation sessions');
      throw error;
    }
  }

  /**
   * Limpa sessões expiradas de impersonation
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_impersonation_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString()
        })
        .eq('is_active', true)
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) throw error;

      const count = data?.length || 0;
      logger.info({ count }, 'Cleaned up expired impersonation sessions');
      return count;
    } catch (error) {
      logger.error({ error }, 'Failed to cleanup expired sessions');
      return 0;
    }
  }

  /**
   * Gera relatório de ações por período
   */
  async getActionsSummary(startDate: string, endDate: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_actions_log')
        .select('action_type')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      // Agrupar por tipo de ação
      const summary = data.reduce((acc, item) => {
        acc[item.action_type] = (acc[item.action_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalActions: data.length,
        period: { start: startDate, end: endDate },
        actionsByType: summary
      };
    } catch (error) {
      logger.error({ error, startDate, endDate }, 'Failed to generate actions summary');
      throw error;
    }
  }

  /**
   * Busca últimas ações de um tipo específico
   */
  async getRecentActionsByType(actionType: AdminActionType, limit = 20) {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_audit_history')
        .select('*')
        .eq('action_type', actionType)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error({ error, actionType }, 'Failed to fetch recent actions by type');
      throw error;
    }
  }
}

export const adminAuditService = new AdminAuditService();
