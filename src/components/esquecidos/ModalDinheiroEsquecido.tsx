import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  Clock,
  DollarSign,
  Flame,
  ThermometerSun,
  Snowflake
} from 'lucide-react';
import { CardClienteEsquecido } from './CardClienteEsquecido';
import { useClientesEsquecidos } from '../../hooks/useClientesEsquecidos';

interface ModalDinheiroEsquecidoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal "Olha o que EU achei!"
 * O grande momento - IA mostrando serviço com orgulho
 */
export function ModalDinheiroEsquecido({ open, onOpenChange }: ModalDinheiroEsquecidoProps) {
  const {
    clientes,
    estatisticas,
    responderCliente,
    reescreverResposta,
    deixarQuieto,
    marcarConvertido
  } = useClientesEsquecidos();

  const [currentIndex, setCurrentIndex] = useState(0);

  // Filtrar apenas clientes "achei" (não respondidos)
  const clientesAtivos = clientes.filter((c) => c.status === 'achei');

  const clienteAtual = clientesAtivos[currentIndex];
  const temClientes = clientesAtivos.length > 0;

  const proximoCliente = () => {
    if (currentIndex < clientesAtivos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const clienteAnterior = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatarTempo = (segundos: number) => {
    if (segundos < 60) return `${segundos}s`;
    const minutos = Math.floor(segundos / 60);
    return `${minutos}min`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {temClientes ? (
          <>
            {/* Header - "Olha o que EU fiz!" */}
            <DialogHeader>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg">
                    🤖
                  </div>
                </div>

                <div className="flex-1">
                  <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                    Oi! Fiz a lição de casa enquanto você configurava
                  </DialogTitle>
                  <DialogDescription className="text-base text-gray-700">
                    Dei uma vasculhada nas suas conversas e achei dinheiro esquecido
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Stats - Mostrando trabalho */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Conversas analisadas"
                value={estatisticas?.total_clientes.toString() || '0'}
                color="text-blue-600"
              />
              <StatCard
                icon={<DollarSign className="w-5 h-5" />}
                label="Dinheiro esquecido"
                value={formatarValor(estatisticas?.valor_total_estimado_reais || 0)}
                color="text-green-600"
                highlight
              />
              <StatCard
                icon={<Flame className="w-5 h-5" />}
                label="Quentes"
                value={`${estatisticas?.total_quentes || 0} 🔥`}
                color="text-red-600"
              />
              <StatCard
                icon={<Clock className="w-5 h-5" />}
                label="Já escrevi as respostas"
                value="100%"
                color="text-purple-600"
              />
            </div>

            {/* Info Badge */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <ThermometerSun className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Temperatura:</span> Calculei o quanto cada
                  cliente tá "quente" baseado em quanto tempo faz e no que ele perguntou
                </p>
              </div>
            </div>

            {/* Cliente Atual */}
            {clienteAtual && (
              <CardClienteEsquecido
                cliente={clienteAtual}
                onResponder={responderCliente}
                onReescrever={reescreverResposta}
                onDeixarQuieto={deixarQuieto}
                onMarcarConvertido={marcarConvertido}
              />
            )}

            {/* Navegação */}
            <div className="mt-6 space-y-4">
              {/* Progress indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Mostrando {currentIndex + 1} de {clientesAtivos.length} clientes
                  </span>
                  <span>{Math.round(((currentIndex + 1) / clientesAtivos.length) * 100)}%</span>
                </div>
                <Progress value={((currentIndex + 1) / clientesAtivos.length) * 100} />
              </div>

              {/* Botões */}
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={clienteAnterior}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>

                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-red-50">
                    <Flame className="w-3 h-3 mr-1" />
                    {estatisticas?.total_quentes} quentes
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-50">
                    <ThermometerSun className="w-3 h-3 mr-1" />
                    {estatisticas?.total_mornos} mornos
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50">
                    <Snowflake className="w-3 h-3 mr-1" />
                    {estatisticas?.total_frios} frios
                  </Badge>
                </div>

                {currentIndex < clientesAtivos.length - 1 ? (
                  <Button onClick={proximoCliente}>
                    Próximo
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={() => onOpenChange(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Fechar
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Sem clientes */
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎉</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Nenhum cliente esquecido!
            </h3>
            <p className="text-gray-600 mb-6">
              Você tá em dia com todas as conversas. Parabéns! 🎊
            </p>
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  highlight?: boolean;
}

function StatCard({ icon, label, value, color, highlight }: StatCardProps) {
  return (
    <div
      className={`
        rounded-lg p-4 border-2
        ${highlight ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}
      `}
    >
      <div className={`flex items-center gap-2 mb-1 ${color}`}>{icon}</div>
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-green-700' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}
