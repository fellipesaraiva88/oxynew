import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { TenantRequest } from './tenant.middleware.js';

/**
 * Middleware para validar se o número de telefone é autorizado a usar OxyAssistant
 * Apenas donos/admins da organização podem conversar com OxyAssistant
 * IMPORTANTE: Este middleware REQUER que tenantMiddleware seja aplicado primeiro
 */
export async function auroraAuthMiddleware(
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const organizationId = req.organizationId!; // From JWT via tenantMiddleware
    const phoneNumber = req.body.phoneNumber || req.query.phoneNumber;

    // Validar phone number obrigatório
    if (!phoneNumber) {
      logger.warn('Missing phone number in OxyAssistant request');
      res.status(400).json({
        error: 'Missing phone number',
        code: 'MISSING_PHONE'
      });
      return;
    }

    // Buscar organização
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      logger.warn({ organizationId }, 'Organization not found');
      res.status(404).json({
        error: 'Organization not found',
        code: 'ORG_NOT_FOUND'
      });
      return;
    }

    // Normalizar números de telefone (remover caracteres especiais)
    const normalizePhone = (phone: string): string => {
      return phone.replace(/\D/g, '');
    };

    const normalizedInput = normalizePhone(phoneNumber);

    // Buscar números autorizados (donos da organização)
    const { data: authorizedNumbers, error: authError } = await supabase
      .from('authorized_owner_numbers')
      .select('phone_number, owner_name, is_active')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (authError) {
      logger.error({ error: authError }, 'Error fetching authorized numbers');
      res.status(500).json({
        error: 'Error validating authorization',
        code: 'AUTH_ERROR'
      });
      return;
    }

    // Verificar se está na lista de autorizados
    const authorizedNumber = authorizedNumbers?.find(auth =>
      normalizePhone(auth.phone_number) === normalizedInput
    );

    if (!authorizedNumber) {
      logger.warn(
        { phoneNumber: normalizedInput, organizationId },
        'Unauthorized OxyAssistant access attempt'
      );
      res.status(403).json({
        error: 'Acesso não autorizado. OxyAssistant está disponível apenas para proprietários autorizados.',
        code: 'UNAUTHORIZED',
        message: 'Only authorized organization owners can access OxyAssistant'
      });
      return;
    }

    // Adicionar informações ao request para uso posterior
    req.auroraContext = {
      organizationId,
      phoneNumber: normalizedInput,
      organizationName: organization.name,
      ownerName: authorizedNumber.owner_name,
      isOwner: true,
      role: 'guardian'
    };

    logger.info(
      {
        phoneNumber: normalizedInput,
        organizationId,
        ownerName: authorizedNumber.owner_name
      },
      'OxyAssistant access authorized'
    );

    next();
  } catch (error) {
    logger.error({ error }, 'Error in OxyAssistant auth middleware');
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}
