import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import {
  Send,
  RefreshCw,
  XCircle,
  CheckCircle,
  Clock,
  Lightbulb,
  Edit2,
  DollarSign
} from 'lucide-react';
import type { ClienteEsquecido } from '../../hooks/useClientesEsquecidos';

interface CardClienteEsquecidoProps {
  cliente: ClienteEsquecido;
  onResponder: (id: string) => void;
  onReescrever: (id: string) => void;
  onDeixarQuieto: (id: string) => void;
  onMarcarConvertido: (id: string, valorCentavos: number) => void;
}

/**
 * Card de Cliente Esquecido
 * Design: Transparência total - IA mostrando o que fez
 */
export function CardClienteEsquecido({
  cliente,
  onResponder,
  onReescrever,
  onDeixarQuieto,
  onMarcarConvertido
}: CardClienteEsquecidoProps) {
  const [editandoResposta, setEditandoResposta] = useState(false);
  const [respostaEditada, setRespostaEditada] = useState(cliente.resposta_pronta);

  const getTemperaturaColor = () => {
    if (cliente.temperatura >= 8) return 'bg-red-100 text-red-800 border-red-200';
    if (cliente.temperatura >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getTipoVacuoLabel = () => {
    return cliente.tipo_vacuo === 'voce_vacuou'
      ? 'Você que vacuou 😅'
      : 'Cliente vacuou';
  };

  const getTipoVacuoColor = () => {
    return cliente.tipo_vacuo === 'voce_vacuou'
      ? 'bg-orange-100 text-orange-800'
      : 'bg-purple-100 text-purple-800';
  };

  const formatarTempo = (horas: number) => {
    if (horas < 24) return `há ${horas}h`;
    const dias = Math.floor(horas / 24);
    return `há ${dias}d`;
  };

  const formatarValor = (centavos: number) => {
    return (centavos / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <Card className={`p-6 border-2 ${getTemperaturaColor()} transition-all hover:shadow-lg`}>
      <div className="space-y-4">
        {/* Header - Info Cliente */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900">
                {cliente.nome_cliente || 'Cliente'}
              </h3>
              <Badge variant="outline" className={getTipoVacuoColor()}>
                {getTipoVacuoLabel()}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{cliente.telefone_cliente}</p>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 justify-end mb-1">
              <span className="text-2xl">{cliente.temperatura_emoji}</span>
              <span className="text-sm font-semibold text-gray-700">
                {cliente.temperatura_label}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">
                ~{formatarValor(cliente.valor_estimado_centavos)}
              </span>
            </div>
          </div>
        </div>

        {/* O que aconteceu */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-start gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">
                {cliente.quem_mandou_ultima === 'cliente' ? 'Cliente perguntou:' : 'Você disse:'}
              </p>
              <p className="text-sm font-medium text-gray-900">
                "{cliente.ultima_mensagem}"
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatarTempo(cliente.horas_de_vacuo)}
              </p>
            </div>
          </div>
        </div>

        {/* Explicação da Temperatura */}
        {cliente.temperatura_explicacao && (
          <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
            <Lightbulb className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p>{cliente.temperatura_explicacao}</p>
          </div>
        )}

        {/* IA Section - Transparência! */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs font-semibold text-blue-900 mb-1">
                  Já escrevi isso aqui pra você:
                </p>

                {editandoResposta ? (
                  <div className="space-y-2">
                    <Textarea
                      value={respostaEditada}
                      onChange={(e) => setRespostaEditada(e.target.value)}
                      className="min-h-[100px] text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditandoResposta(false);
                          setRespostaEditada(cliente.resposta_pronta);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          // TODO: Salvar resposta editada
                          setEditandoResposta(false);
                        }}
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {cliente.resposta_pronta}
                    </p>
                  </div>
                )}
              </div>

              {/* Explicação da IA */}
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-700">
                  <span className="font-medium">Por quê:</span> {cliente.explicacao_ia}
                </p>
              </div>

              {!editandoResposta && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7"
                  onClick={() => setEditandoResposta(true)}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Editar resposta
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => onResponder(cliente.id)}
          >
            <Send className="w-4 h-4 mr-2" />
            Mandar essa resposta
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onReescrever(cliente.id)}
            title="Gerar nova resposta com IA"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onDeixarQuieto(cliente.id)}
            title="Deixar quieto"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>

        {/* Ações Secundárias */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => {
              const valor = prompt('Quanto esse cliente converteu? (em reais)');
              if (valor) {
                const centavos = Math.round(parseFloat(valor) * 100);
                onMarcarConvertido(cliente.id, centavos);
              }
            }}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Virou cliente
          </Button>
        </div>
      </div>
    </Card>
  );
}
