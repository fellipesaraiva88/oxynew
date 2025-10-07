import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';

export type InternalRole =
  | 'super_admin'
  | 'tech'
  | 'cs'
  | 'sales'
  | 'marketing'
  | 'viewer';

export interface InternalUser {
  id: string;
  name: string;
  email: string;
  role: InternalRole;
  is_active: boolean;
  last_login_at: string | null;
}

export interface AdminJWTPayload {
  sub: string; // user id
  email: string;
  role: InternalRole;
  type: 'internal'; // para diferenciar de JWT de clientes
}

export interface LoginResult {
  success: boolean;
  token?: string;
  user?: InternalUser;
  error?: string;
}

/**
 * Serviço de autenticação para usuários internos (admin panel)
 * Separado da autenticação de clientes (Supabase Auth)
 */
export class AdminAuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN = '8h'; // 8 horas

  constructor() {
    this.JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET!;

    if (!this.JWT_SECRET) {
      throw new Error('ADMIN_JWT_SECRET or JWT_SECRET must be set');
    }
  }

  /**
   * Login de usuário interno
   */
  async login(email: string, password: string, ipAddress?: string): Promise<LoginResult> {
    try {
      logger.info({ email }, '[AdminAuth] Login attempt started');

      // Buscar usuário (service role bypass RLS)
      const { data: user, error } = await (supabaseAdmin as any)
        .from('internal_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single() as { data: any; error: any };

      if (error) {
        logger.error({ email, error }, '[AdminAuth] Database query error');
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      if (!user) {
        logger.warn({ email }, '[AdminAuth] User not found or inactive');
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      logger.info({ email, userId: user.id, hasHash: !!user.password_hash }, '[AdminAuth] User found, verifying password');

      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      logger.info({ email, userId: user.id, isValidPassword }, '[AdminAuth] Password verification result');

      if (!isValidPassword) {
        logger.warn({ email, userId: user.id }, '[AdminAuth] Invalid password for internal user');

        // Log tentativa de login falha
        await this.logAction(user.id, 'login', 'auth', null, {
          success: false,
          reason: 'invalid_password'
        }, ipAddress);

        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Atualizar last_login_at
      await (supabaseAdmin as any)
        .from('internal_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id) as { data: any; error: any };

      // Gerar JWT
      const payload: AdminJWTPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'internal'
      };

      const token = jwt.sign(payload, this.JWT_SECRET, {
        expiresIn: this.JWT_EXPIRES_IN
      });

      // Log login bem-sucedido
      await this.logAction(user.id, 'login', 'auth', null, {
        success: true
      }, ipAddress);

      logger.info({ userId: user.id, email: user.email, role: user.role }, 'Internal user logged in');

      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          last_login_at: user.last_login_at
        }
      };
    } catch (error) {
      logger.error({ error, email }, 'Error during internal login');
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Verificar e decodificar JWT
   */
  verifyToken(token: string): AdminJWTPayload | null {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as AdminJWTPayload;

      // Verificar que é token interno
      if (payload.type !== 'internal') {
        logger.warn({ payload }, 'Invalid token type for admin panel');
        return null;
      }

      return payload;
    } catch (error) {
      logger.debug({ error }, 'Invalid or expired admin token');
      return null;
    }
  }

  /**
   * Buscar usuário por ID
   */
  async getUserById(userId: string): Promise<InternalUser | null> {
    try {
      const { data: user, error } = await (supabaseAdmin as any)
        .from('internal_users')
        .select('id, name, email, role, is_active, last_login_at')
        .eq('id', userId)
        .eq('is_active', true)
        .single() as { data: any; error: any };

      if (error || !user) {
        return null;
      }

      return user;
    } catch (error) {
      logger.error({ error, userId }, 'Error fetching internal user');
      return null;
    }
  }

  /**
   * Trocar senha (require senha antiga)
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Buscar usuário
      const { data: user, error } = await (supabaseAdmin as any)
        .from('internal_users')
        .select('password_hash')
        .eq('id', userId)
        .single() as { data: any; error: any };

      if (error || !user) {
        return false;
      }

      // Verificar senha antiga
      const isValidOldPassword = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isValidOldPassword) {
        return false;
      }

      // Hash nova senha
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Atualizar
      const { error: updateError } = await (supabaseAdmin as any)
        .from('internal_users')
        .update({ password_hash: newPasswordHash })
        .eq('id', userId) as { data: any; error: any };

      if (updateError) {
        logger.error({ error: updateError, userId }, 'Error updating password');
        return false;
      }

      // Log ação
      await this.logAction(userId, 'update', 'user', userId, {
        field: 'password',
        action: 'changed'
      });

      logger.info({ userId }, 'Password changed for internal user');
      return true;
    } catch (error) {
      logger.error({ error, userId }, 'Error changing password');
      return false;
    }
  }

  /**
   * Resetar senha (admin action)
   */
  async resetPassword(targetUserId: string, adminUserId: string, newPassword: string): Promise<boolean> {
    try {
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      const { error } = await (supabaseAdmin as any)
        .from('internal_users')
        .update({ password_hash: newPasswordHash })
        .eq('id', targetUserId) as { data: any; error: any };

      if (error) {
        logger.error({ error, targetUserId }, 'Error resetting password');
        return false;
      }

      // Log ação
      await this.logAction(adminUserId, 'update', 'user', targetUserId, {
        field: 'password',
        action: 'reset_by_admin'
      });

      logger.info({ targetUserId, adminUserId }, 'Password reset by admin');
      return true;
    } catch (error) {
      logger.error({ error, targetUserId, adminUserId }, 'Error resetting password');
      return false;
    }
  }

  /**
   * Log de auditoria
   */
  private async logAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string | null,
    changes?: any,
    ipAddress?: string
  ): Promise<void> {
    try {
      await (supabaseAdmin as any).rpc('log_internal_action', {
        p_user_id: userId,
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_changes: changes ? JSON.stringify(changes) : null,
        p_ip_address: ipAddress || null,
        p_user_agent: null
      });
    } catch (error) {
      logger.error({ error, userId, action }, 'Error logging internal action');
    }
  }
}

export const adminAuthService = new AdminAuthService();
