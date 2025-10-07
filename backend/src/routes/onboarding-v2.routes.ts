import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { TenantRequest, tenantMiddleware } from '../middleware/tenant.middleware.js';
import { standardLimiter } from '../middleware/rate-limiter.js';
import { PersonalityService } from '../services/personality/personality.service.js';

const router = Router();
const personalityService = new PersonalityService();

// Apply middleware
router.use(tenantMiddleware);
router.use(standardLimiter);

/**
 * GET /api/v1/onboarding-v2/status
 * Retorna status atual do onboarding
 */
router.get('/status', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    const { data, error } = await supabaseAdmin
      .from('organization_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    res.json({
      currentStep: data.onboarding_step || 0,
      ownerProfile: data.owner_profile || {},
      completed: data.onboarding_completed === true || (data.onboarding_step ?? 0) >= 7
    });
  } catch (error: any) {
    logger.error('Get onboarding status error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/onboarding-v2/step/:stepNumber
 * Salva dados de um step específico
 */
router.post('/step/:stepNumber', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const stepNumber = parseInt(req.params.stepNumber);
    const stepData = req.body;

    if (stepNumber < 0 || stepNumber > 7) {
      res.status(400).json({ error: 'Invalid step number. Must be 0-7.' });
      return;
    }

    // Buscar configuração atual
    const { data: current, error: fetchError } = await supabaseAdmin
      .from('organization_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (fetchError) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    const currentProfile = (current.owner_profile as Record<string, any>) || {};
    let updatedProfile = { ...currentProfile };
    const updateData: any = {
      onboarding_step: Math.max(stepNumber, current.onboarding_step || 0)
    };

    // Processar dados baseado no step
    switch (stepNumber) {
      case 1: // Guardian Profile
        updatedProfile = {
          ...updatedProfile,
          name: stepData.owner_name,
          avatar_url: stepData.avatar_url,
          business_mission: stepData.business_mission
        };
        break;

      case 2: // Guardian Patients
        updatedProfile = {
          ...updatedProfile,
          patients: stepData.patients || []
        };
        break;

      case 3: // AI Personality
        // Salvar configuração de personalidade
        const existingPersonalityConfig = (current.ai_personality_config as Record<string, any>) || {};
        const personalityConfig = {
          client_ai: {
            name: stepData.ai_name || 'Assistente',
            personality: stepData.personality,
            tone: stepData.tone,
            emoji_frequency: stepData.emoji_frequency,
            brazilian_slang: stepData.brazilian_slang || false,
            empathy_level: stepData.empathy_level || 7
          },
          oxy_assistant: existingPersonalityConfig.oxy_assistant || {
            name: 'OxyAssistant',
            personality: 'parceira-proxima',
            tone: 'coleguinha',
            data_driven_style: 'celebratorio'
          }
        };

        updateData.ai_personality_config = personalityConfig;
        break;

      case 4: // Services
        // Services são salvos em outra tabela, apenas marcamos o step
        break;

      case 5: // Operating Hours
        // Operating hours também são salvos em outra estrutura
        break;

      case 6: // OxyAssistant Config
        // Atualizar configuração da OxyAssistant
        const currentPersonalityConfig = (current.ai_personality_config as Record<string, any>) || {};
        updateData.ai_personality_config = {
          ...currentPersonalityConfig,
          oxy_assistant: {
            ...(currentPersonalityConfig.oxy_assistant || {}),
            personality: stepData.aurora_personality,
            tone: stepData.aurora_tone,
            data_driven_style: stepData.data_driven_style
          }
        };
        break;

      case 7: // Completion
        updatedProfile = {
          ...updatedProfile,
          onboarding_completed_at: new Date().toISOString()
        };
        break;
    }

    // Atualizar owner_profile se modificado
    if (stepNumber === 1 || stepNumber === 2 || stepNumber === 7) {
      updateData.owner_profile = updatedProfile;
    }

    // Salvar no banco
    const { error: updateError } = await supabaseAdmin
      .from('organization_settings')
      .update(updateData)
      .eq('organization_id', organizationId);

    if (updateError) {
      throw updateError;
    }

    logger.info({
      organizationId,
      stepNumber,
      onboarding_step: updateData.onboarding_step
    }, 'Onboarding step saved');

    res.json({
      success: true,
      currentStep: updateData.onboarding_step,
      message: `Step ${stepNumber} saved successfully`
    });
  } catch (error: any) {
    logger.error('Save onboarding step error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/onboarding-v2/complete
 * Marca onboarding como completo e ativa a IA
 */
router.post('/complete', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    // Marcar onboarding como completo
    const { data: current, error: fetchError } = await supabaseAdmin
      .from('organization_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (fetchError) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    const updatedProfile = {
      ...((current.owner_profile as Record<string, any>) || {}),
      onboarding_completed_at: new Date().toISOString()
    };

    const updatePayload: any = {
      onboarding_step: 7,
      owner_profile: updatedProfile,
      onboarding_completed: true
    };

    const { error: updateError } = await supabaseAdmin
      .from('organization_settings')
      .update(updatePayload)
      .eq('organization_id', organizationId);

    if (updateError) {
      throw updateError;
    }

    logger.info({ organizationId }, '🎉 Onboarding V2 completed successfully');

    res.json({
      success: true,
      message: 'Onboarding completed! AI activated.'
    });
  } catch (error: any) {
    logger.error('Complete onboarding error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/onboarding-v2/preview-personality
 * Retorna preview de resposta da IA com personalidade escolhida
 */
router.post('/preview-personality', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { personality, tone, emoji_frequency, test_message } = req.body;

    // Gerar preview baseado na personalidade
    const previews: Record<string, string> = {
      'amigavel-casual-medium': 'Oi! 😊 Como posso te ajudar hoje? Estou aqui pra qualquer coisa que você precisar!',
      'amigavel-semi-formal-low': 'Olá! Como posso ajudar você hoje? Fico feliz em atendê-lo.',
      'profissional-caloroso-semi-formal-low': 'Bom dia! Estou à disposição para te atender. Em que posso ajudar?',
      'profissional-caloroso-casual-medium': 'Oi, tudo bem? 😊 Estou aqui para te ajudar. O que você precisa?',
      'energetico-informal-high': 'E aí! 🚀 Bora marcar algo pro seu doguinho? Conta pra mim! 🏥',
      'energetico-casual-high': 'Opa! 🎉 Tô aqui pra te ajudar! Que tal agendar algo massa pro patient? 😎'
    };

    const key = `${personality}-${tone}-${emoji_frequency}`;
    const preview = previews[key] || 'Olá! Como posso ajudar você?';

    res.json({
      preview,
      personality,
      tone,
      emoji_frequency
    });
  } catch (error: any) {
    logger.error('Preview personality error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
