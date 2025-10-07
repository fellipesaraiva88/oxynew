import { Request, Response, NextFunction } from 'express';
import { adminAuthService, type InternalRole } from '../services/admin-auth.service.js';
import { logger } from '../config/logger.js';

/**
 * Type alias for Express Request with admin context
 * Actual extension is in src/types/express.d.ts
 */
export type AdminRequest = Request;

/**
 * Middleware de autenticação para admin panel
 * Verifica JWT e popula req.admin
 */
export function requireAdminAuth(req: AdminRequest, res: Response, next: NextFunction): void {
  try {
    // Extrair token: Authorization header ou cookie httpOnly
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if ((req as any).cookies?.admin_token) {
      token = (req as any).cookies.admin_token;
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
      return;
    }

    // Verificar token
    const payload = adminAuthService.verifyToken(token);

    if (!payload) {
      res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    // Adicionar ao request
    req.admin = {
      id: payload.sub,
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      type: payload.type
    };

    logger.debug({
      adminId: req.admin.id,
      email: req.admin.email,
      role: req.admin.role,
      path: req.path,
      method: req.method
    }, 'Admin authenticated');

    next();
  } catch (error) {
    logger.error({ error }, 'Error in admin auth middleware');
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}

/**
 * Middleware de autorização por role
 * Uso: requireAdminRole(['super_admin', 'tech'])
 */
export function requireAdminRole(allowedRoles: InternalRole[]) {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    try {
      // requireAdminAuth deve vir antes
      if (!req.admin) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      // Verificar role
      if (!allowedRoles.includes(req.admin.role)) {
        logger.warn({
          adminId: req.admin.id,
          role: req.admin.role,
          requiredRoles: allowedRoles,
          path: req.path,
          method: req.method
        }, 'Insufficient permissions');

        res.status(403).json({
          error: 'Insufficient permissions',
          code: 'FORBIDDEN',
          requiredRoles: allowedRoles,
          yourRole: req.admin.role
        });
        return;
      }

      next();
    } catch (error) {
      logger.error({ error }, 'Error in role authorization middleware');
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };
}

/**
 * Helper: Verificar se é super admin
 */
export function requireSuperAdmin(req: AdminRequest, res: Response, next: NextFunction): void {
  requireAdminRole(['super_admin'])(req, res, next);
}

/**
 * Helper: Verificar se é admin ou tech
 */
export function requireAdminOrTech(req: AdminRequest, res: Response, next: NextFunction): void {
  requireAdminRole(['super_admin', 'tech'])(req, res, next);
}

/**
 * Helper: Verificar se é admin, tech ou CS
 */
export function requireAdminTechOrCS(req: AdminRequest, res: Response, next: NextFunction): void {
  requireAdminRole(['super_admin', 'tech', 'cs'])(req, res, next);
}

/**
 * Matriz de permissões por role
 */
export const ROLE_PERMISSIONS = {
  super_admin: {
    canManageClients: true,
    canDeleteClients: true,
    canManageTeam: true,
    canAccessLogs: true,
    canAccessTechLogs: true,
    canForceReconnect: true,
    canChangePlans: true,
    canResetPasswords: true,
    canAccessBilling: true,
    canExportData: true
  },
  tech: {
    canManageClients: false,
    canDeleteClients: false,
    canManageTeam: false,
    canAccessLogs: true,
    canAccessTechLogs: true,
    canForceReconnect: true,
    canChangePlans: false,
    canResetPasswords: false,
    canAccessBilling: false,
    canExportData: true
  },
  cs: {
    canManageClients: false,
    canDeleteClients: false,
    canManageTeam: false,
    canAccessLogs: true,
    canAccessTechLogs: false,
    canForceReconnect: false,
    canChangePlans: false,
    canResetPasswords: false,
    canAccessBilling: false,
    canExportData: true
  },
  sales: {
    canManageClients: true,
    canDeleteClients: false,
    canManageTeam: false,
    canAccessLogs: false,
    canAccessTechLogs: false,
    canForceReconnect: false,
    canChangePlans: true,
    canResetPasswords: false,
    canAccessBilling: true,
    canExportData: true
  },
  marketing: {
    canManageClients: false,
    canDeleteClients: false,
    canManageTeam: false,
    canAccessLogs: false,
    canAccessTechLogs: false,
    canForceReconnect: false,
    canChangePlans: false,
    canResetPasswords: false,
    canAccessBilling: false,
    canExportData: true
  },
  viewer: {
    canManageClients: false,
    canDeleteClients: false,
    canManageTeam: false,
    canAccessLogs: false,
    canAccessTechLogs: false,
    canForceReconnect: false,
    canChangePlans: false,
    canResetPasswords: false,
    canAccessBilling: false,
    canExportData: false
  }
};

/**
 * Helper para checar permissão específica
 */
export function hasPermission(role: InternalRole, permission: keyof typeof ROLE_PERMISSIONS.super_admin): boolean {
  return ROLE_PERMISSIONS[role][permission] || false;
}
