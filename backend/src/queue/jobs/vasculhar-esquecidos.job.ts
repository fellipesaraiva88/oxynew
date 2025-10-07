import { Job, Queue } from 'bullmq';
import { redisConnection } from '../../config/redis.js';
import { logger } from '../../config/logger.js';
import { baileysService } from '../../services/baileys/baileys.service.js';
import { vasculhadorService } from '../../services/esquecidos/vasculhador.service.js';
import { respostaProntaService } from '../../services/esquecidos/resposta-pronta.service.js';

/**
 * Job: Vasculhar Esquecidos
 *
 * Executado automaticamente na primeira conexão do WhatsApp
 * para buscar clientes que ficaram no vácuo.
 *
 * Fluxo:
 * 1. WhatsApp conecta pela primeira vez
 * 2. Aguarda 10s (estabilização)
 * 3. Vasculha todas as conversas
 * 4. Gera respostas com IA
 * 5. Emite eventos Socket.IO em tempo real
 */

export interface VasculharEsquecidosJobData {
  organization_id: string;
  instance_id: string;
}

/**
 * Queue para processamento de vasculhadas
 */
export const vasculharQueue = new Queue<VasculharEsquecidosJobData>('vasculhar-esquecidos', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1, // Apenas uma tentativa (é custoso)
    removeOnComplete: {
      count: 10 // Manter últimos 10
    },
    removeOnFail: false // Manter falhas para análise
  }
});

/**
 * Trigger vasculhada (chamar quando WhatsApp conecta pela primeira vez)
 */
export async function triggerVasculhada(
  organizationId: string,
  instanceId: string
): Promise<void> {
  try {
    logger.info({ organizationId, instanceId }, 'Agendando vasculhada de clientes esquecidos...');

    await vasculharQueue.add(
      'vasculhar',
      {
        organization_id: organizationId,
        instance_id: instanceId
      },
      {
        delay: 10000 // Aguardar 10s antes de começar
      }
    );

    logger.info('Vasculhada agendada com sucesso!');
  } catch (error) {
    logger.error({ error }, 'Erro ao agendar vasculhada');
    throw error;
  }
}

/**
 * Processa vasculhada
 */
export async function processarVasculhada(job: Job<VasculharEsquecidosJobData>): Promise<void> {
  const { organization_id, instance_id } = job.data;

  try {
    logger.info({ organization_id, instance_id }, '🔍 Iniciando vasculhada de clientes esquecidos...');

    // 1. Obter instância WhatsApp conectada
    const instances = baileysService.listInstances(organization_id);
    const instance = instances.find(i => i.instanceId === instance_id);

    if (!instance || !instance.sock) {
      throw new Error('Instância WhatsApp não encontrada ou desconectada');
    }

    logger.info('Instância encontrada e conectada ✅');

    // 2. Vasculhar conversas
    const resultado = await vasculhadorService.vasculharConversas(
      instance.sock,
      organization_id,
      instance_id
    );

    logger.info(resultado, `✅ Vasculhada concluída! Encontrados ${resultado.total_clientes_esquecidos} clientes`);

    // 3. Gerar respostas com IA (em lote)
    if (resultado.total_clientes_esquecidos > 0) {
      logger.info('Gerando respostas com IA...');

      const processados = await respostaProntaService.processarLoteRespostas(organization_id);

      logger.info({ processados }, `✅ ${processados} respostas geradas com IA`);
    }

    logger.info('🎉 Vasculhada 100% concluída!');
  } catch (error) {
    logger.error({ error, job: job.data }, '❌ Erro na vasculhada');
    throw error;
  }
}

/**
 * Verifica se já foi feita vasculhada para esta instância
 * Checando se já tem clientes esquecidos no banco
 */
export async function jaFezVasculhada(
  organizationId: string,
  instanceId: string
): Promise<boolean> {
  try {
    const { supabaseAdmin } = await import('../../config/supabase.js');

    const { data, error } = await supabaseAdmin
      .from('clientes_esquecidos')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('instance_id', instanceId)
      .limit(1);

    if (error) {
      logger.error({ error }, 'Erro ao verificar vasculhadas anteriores');
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    logger.error({ error }, 'Erro ao verificar histórico de vasculhadas');
    return false;
  }
}
