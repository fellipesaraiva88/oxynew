import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * Type alias for Express Request with tenant context
 * Actual extension is in src/types/express.d.ts
 */
export type TenantRequest = Request;

/**
 * Middleware para isolamento multi-tenant
 *
 * REGRAS:
 * - SEMPRE extrair organization_id do contexto autenticado
 * - SEMPRE validar acesso ao recurso
 * - SEMPRE injetar organizationId no request
 * - Suporta autenticação via JWT (Supabase Auth) ou API key
 */
export class TenantMiddleware {
  /**
   * Extrai e valida organization_id do token JWT
   */
  static async fromJWT(req: TenantRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extrair token do header Authorization
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
      }

      const token = authHeader.replace('Bearer ', '');

      // Validar token com Supabase Auth
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        logger.warn({ error }, 'Invalid JWT token');
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }

      // Buscar organization_id do usuário
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('organization_id, role')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!userData || userError) {
        logger.error({
          userError,
          userId: user.id
        }, 'User not found in users table');
        res.status(403).json({ error: 'User not found or not associated with an organization' });
        return;
      }

      // Injetar contexto no request
      req.organizationId = userData.organization_id;
      req.userId = user.id;
      req.userRole = userData.role as 'guardian' | 'admin' | 'agent';

      logger.debug(
        { organizationId: req.organizationId, userId: req.userId, role: req.userRole },
        'Tenant context injected'
      );

      next();
    } catch (error) {
      logger.error({ error }, 'Tenant middleware error');
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Extrai organization_id de API key (para integrações)
   * TODO: Implementar quando tabela api_keys for criada
   */
  static async fromAPIKey(_req: TenantRequest, res: Response, _next: NextFunction): Promise<void> {
    res.status(501).json({ error: 'API key authentication not yet implemented' });
  }

  /**
   * Middleware combinado: tenta JWT primeiro, fallback para API key
   */
  static async auto(req: TenantRequest, res: Response, next: NextFunction): Promise<void> {
    const hasJWT = req.headers.authorization?.startsWith('Bearer ');
    const hasAPIKey = !!req.headers['x-api-key'];

    if (hasJWT) {
      return TenantMiddleware.fromJWT(req, res, next);
    } else if (hasAPIKey) {
      return TenantMiddleware.fromAPIKey(req, res, next);
    } else {
      res.status(401).json({ error: 'Authentication required (JWT or API key)' });
    }
  }

  /**
   * Valida acesso a recurso específico
   * Usado após fromJWT/fromAPIKey para validar ownership
   */
  static validateResourceAccess(resourceIdParam: string = 'id', resourceTable: string) {
    return async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const organizationId = req.organizationId;
        const resourceId = req.params[resourceIdParam];

        if (!organizationId) {
          res.status(401).json({ error: 'Organization context missing' });
          return;
        }

        if (!resourceId) {
          res.status(400).json({ error: `Missing ${resourceIdParam} parameter` });
          return;
        }

        // Validar que o recurso pertence à organização
        const { data, error } = await supabaseAdmin
          .from(resourceTable as any)
          .select('organization_id')
          .eq('id', resourceId)
          .single();

        if (error || !data) {
          res.status(404).json({ error: 'Resource not found' });
          return;
        }

        if ((data as any).organization_id !== organizationId) {
          logger.warn(
            { organizationId, resourceId, resourceTable },
            'Unauthorized resource access attempt'
          );
          res.status(403).json({ error: 'Unauthorized: Resource belongs to different organization' });
          return;
        }

        next();
      } catch (error) {
        logger.error({ error }, 'Resource validation error');
        res.status(500).json({ error: 'Internal server error' });
      }
    };
  }

  /**
   * Requer role específica (guardian, admin, agent)
   */
  static requireRole(...allowedRoles: Array<'guardian' | 'admin' | 'agent'>) {
    return (req: TenantRequest, res: Response, next: NextFunction): void => {
      const userRole = req.userRole;

      if (!userRole) {
        res.status(401).json({ error: 'User role not found' });
        return;
      }

      if (!allowedRoles.includes(userRole)) {
        logger.warn(
          { userId: req.userId, userRole, allowedRoles },
          'Insufficient permissions'
        );
        res.status(403).json({ error: `Insufficient permissions. Required: ${allowedRoles.join(' or ')}` });
        return;
      }

      next();
    };
  }

  /**
   * Apenas para owners (OxyAssistant endpoints)
   */
  static ownerOnly(req: TenantRequest, res: Response, next: NextFunction): void {
    return TenantMiddleware.requireRole('guardian')(req, res, next);
  }

  /**
   * Para owners e admins
   */
  static adminOrOwner(req: TenantRequest, res: Response, next: NextFunction): void {
    return TenantMiddleware.requireRole('guardian', 'admin')(req, res, next);
  }

  /**
   * Extrai organization_id do body (para criação de recursos)
   */
  static validateBodyOrganization(req: TenantRequest, res: Response, next: NextFunction): void {
    const bodyOrgId = req.body.organization_id;
    const contextOrgId = req.organizationId;

    if (!contextOrgId) {
      res.status(401).json({ error: 'Organization context missing' });
      return;
    }

    // Se body tem organization_id, validar que é o mesmo
    if (bodyOrgId && bodyOrgId !== contextOrgId) {
      logger.warn(
        { bodyOrgId, contextOrgId },
        'Organization ID mismatch in request body'
      );
      res.status(403).json({ error: 'Cannot create resources for different organization' });
      return;
    }

    // Injetar organization_id no body se não existir
    if (!bodyOrgId) {
      req.body.organization_id = contextOrgId;
    }

    next();
  }

  /**
   * Rate limiting por organização
   */
  static async trackOrganizationUsage(req: TenantRequest, _res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.organizationId;

      if (!organizationId) {
        next();
        return;
      }

      // TODO: Implementar tracking de uso quando tabela organization_usage for criada
      // supabaseAdmin
      //   .from('organization_usage')
      //   .upsert({
      //     organization_id: organizationId,
      //     last_api_call: new Date().toISOString(),
      //     api_calls_count: 1
      //   })
      //   .then(() => logger.debug({ organizationId }, 'Organization usage tracked'))
      //   .catch((error: any) => logger.error({ error, organizationId }, 'Failed to track usage'));

      next();
    } catch (error) {
      logger.error({ error }, 'Usage tracking error');
      next(); // Não bloquear por erro de tracking
    }
  }
}

/**
 * Helpers para usar nos routes
 */
export const tenantMiddleware = TenantMiddleware.fromJWT;
export const tenantFromAPIKey = TenantMiddleware.fromAPIKey;
export const tenantAuto = TenantMiddleware.auto;
export const validateResource = TenantMiddleware.validateResourceAccess;
export const requireRole = TenantMiddleware.requireRole;
export const ownerOnly = TenantMiddleware.ownerOnly;
export const adminOrOwner = TenantMiddleware.adminOrOwner;
export const validateBodyOrg = TenantMiddleware.validateBodyOrganization;
export const trackUsage = TenantMiddleware.trackOrganizationUsage;
