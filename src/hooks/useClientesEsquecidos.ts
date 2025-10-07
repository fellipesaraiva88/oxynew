import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useSocket } from './useSocket';
import { toast } from '@/lib/toast';

/**
 * Types para Clientes Esquecidos
 */
export interface ClienteEsquecido {
  id: string;
  organization_id: string;
  instance_id: string;
  telefone_cliente: string;
  nome_cliente: string | null;
  contact_id: string | null;
  tipo_vacuo: 'voce_vacuou' | 'cliente_vacuou';
  ultima_mensagem: string;
  quem_mandou_ultima: 'cliente' | 'voce';
  quando_foi: string;
  horas_de_vacuo: number;
  temperatura: number;
  temperatura_label: 'Quente' | 'Morno' | 'Frio';
  temperatura_emoji: string;
  temperatura_explicacao: string | null;
  valor_estimado_centavos: number;
  resposta_pronta: string;
  explicacao_ia: string;
  status: 'achei' | 'ja_respondi' | 'virou_cliente' | 'deixei_quieto';
  quando_respondi: string | null;
  quando_converteu: string | null;
  valor_real_convertido_centavos: number | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EstatisticasEsquecidos {
  total_clientes: number;
  total_quentes: number;
  total_mornos: number;
  total_frios: number;
  total_achei: number;
  total_ja_respondi: number;
  total_virou_cliente: number;
  total_deixei_quieto: number;
  valor_total_estimado_reais: number;
  valor_real_convertido_reais: number;
  taxa_conversao: number;
}

export interface ProgressoVasculhada {
  current: number;
  total: number;
  percentage: number;
  eta_seconds: number;
}

export interface ResultadoVasculhada {
  total_conversas_analisadas: number;
  total_clientes_esquecidos: number;
  total_quentes: number;
  total_mornos: number;
  total_frios: number;
  valor_total_estimado_reais: number;
  tempo_processamento_segundos: number;
  clientes_esquecidos: ClienteEsquecido[];
}

/**
 * Hook para gerenciar Clientes Esquecidos
 */
export function useClientesEsquecidos() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [progresso, setProgresso] = useState<ProgressoVasculhada | null>(null);
  const [vasculhandoAgora, setVasculhandoAgora] = useState(false);
  const [resultadoVasculhada, setResultadoVasculhada] = useState<ResultadoVasculhada | null>(null);

  // Fetch clientes esquecidos
  const {
    data: clientes,
    isLoading: carregandoClientes,
    refetch: recarregarClientes
  } = useQuery<ClienteEsquecido[]>({
    queryKey: ['clientes-esquecidos'],
    queryFn: async () => {
      const response = await apiClient.get('/api/esquecidos');
      return response.data.clientes;
    }
  });

  // Fetch estatísticas
  const {
    data: estatisticas,
    isLoading: carregandoEstatisticas,
    refetch: recarregarEstatisticas
  } = useQuery<EstatisticasEsquecidos>({
    queryKey: ['clientes-esquecidos-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/esquecidos/resumo');
      return response.data;
    }
  });

  // Mutation: Trigger vasculhada
  const triggerVasculhada = useMutation({
    mutationFn: async (instanceId: string) => {
      const response = await apiClient.post('/api/esquecidos/vasculhar', {
        instance_id: instanceId
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('🔍 Vasculhada iniciada! Aguarde...');
      setVasculhandoAgora(true);
    },
    onError: (error: any) => {
      toast.error('Erro ao iniciar vasculhada: ' + error.message);
    }
  });

  // Mutation: Responder cliente
  const responderCliente = useMutation({
    mutationFn: async (clienteId: string) => {
      const response = await apiClient.post(`/api/esquecidos/${clienteId}/responder`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('✅ Mensagem enviada com sucesso!');
      recarregarClientes();
      recarregarEstatisticas();
    },
    onError: (error: any) => {
      toast.error('Erro ao enviar mensagem: ' + error.message);
    }
  });

  // Mutation: Reescrever resposta
  const reescreverResposta = useMutation({
    mutationFn: async (clienteId: string) => {
      const response = await apiClient.post(`/api/esquecidos/${clienteId}/reescrever`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('✨ Nova resposta gerada!');
      recarregarClientes();
    },
    onError: (error: any) => {
      toast.error('Erro ao gerar resposta: ' + error.message);
    }
  });

  // Mutation: Deixar quieto
  const deixarQuieto = useMutation({
    mutationFn: async (clienteId: string) => {
      const response = await apiClient.post(`/api/esquecidos/${clienteId}/deixar-quieto`);
      return response.data;
    },
    onSuccess: () => {
      toast.info('Cliente marcado como ignorado');
      recarregarClientes();
      recarregarEstatisticas();
    },
    onError: (error: any) => {
      toast.error('Erro ao ignorar cliente: ' + error.message);
    }
  });

  // Mutation: Marcar convertido
  const marcarConvertido = useMutation({
    mutationFn: async ({
      clienteId,
      valorCentavos
    }: {
      clienteId: string;
      valorCentavos: number;
    }) => {
      const response = await apiClient.post(`/api/esquecidos/${clienteId}/marcar-convertido`, {
        valor_real_centavos: valorCentavos
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`🎉 ${data.message}`);
      recarregarClientes();
      recarregarEstatisticas();
    },
    onError: (error: any) => {
      toast.error('Erro ao marcar conversão: ' + error.message);
    }
  });

  // Socket.IO: Escutar eventos de vasculhada
  useEffect(() => {
    if (!socket) return;

    // Vasculhada começou
    socket.on('vasculhada:comecou', () => {
      setVasculhandoAgora(true);
      setProgresso(null);
      setResultadoVasculhada(null);
    });

    // Progresso
    socket.on('vasculhada:progresso', (data: ProgressoVasculhada) => {
      setProgresso(data);
    });

    // Cliente encontrado
    socket.on('vasculhada:cliente-encontrado', (cliente: ClienteEsquecido) => {
      // Invalidar query para atualizar lista
      queryClient.invalidateQueries({ queryKey: ['clientes-esquecidos'] });
    });

    // Vasculhada terminou
    socket.on('vasculhada:terminou', (resultado: ResultadoVasculhada) => {
      setResultadoVasculhada(resultado);
      setVasculhandoAgora(false);
      setProgresso(null);

      // Atualizar dados
      recarregarClientes();
      recarregarEstatisticas();

      // Notificar
      if (resultado.total_clientes_esquecidos > 0) {
        toast.success(
          `🎉 Encontrei ${resultado.total_clientes_esquecidos} clientes esquecidos!`,
          {
            description: `Somam R$ ${resultado.valor_total_estimado_reais.toFixed(2)} em oportunidades`
          }
        );
      } else {
        toast.info('Nenhum cliente esquecido encontrado. Parabéns! 🎉');
      }
    });

    // Erro
    socket.on('vasculhada:erro', (data: { error: string }) => {
      setVasculhandoAgora(false);
      setProgresso(null);
      toast.error('Erro na vasculhada: ' + data.error);
    });

    return () => {
      socket.off('vasculhada:comecou');
      socket.off('vasculhada:progresso');
      socket.off('vasculhada:cliente-encontrado');
      socket.off('vasculhada:terminou');
      socket.off('vasculhada:erro');
    };
  }, [socket, queryClient, recarregarClientes, recarregarEstatisticas]);

  return {
    // Data
    clientes: clientes || [],
    estatisticas,
    progresso,
    vasculhandoAgora,
    resultadoVasculhada,

    // Loading states
    carregandoClientes,
    carregandoEstatisticas,

    // Actions
    triggerVasculhada: triggerVasculhada.mutate,
    responderCliente: responderCliente.mutate,
    reescreverResposta: reescreverResposta.mutate,
    deixarQuieto: deixarQuieto.mutate,
    marcarConvertido: marcarConvertido.mutate,

    // Refetch
    recarregarClientes,
    recarregarEstatisticas
  };
}
