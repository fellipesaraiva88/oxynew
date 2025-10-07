import { Progress } from '../ui/progress';
import { Card } from '../ui/card';
import { Loader2, CheckCircle, Clock } from 'lucide-react';
import type { ProgressoVasculhada } from '../../hooks/useClientesEsquecidos';

interface ProgressoDaIAProps {
  progresso: ProgressoVasculhada | null;
  vasculhandoAgora: boolean;
}

/**
 * Componente ProgressoDaIA
 * Mostra progresso da vasculhada em tempo real
 * Tom: "Trabalhando aqui... 🤖"
 */
export function ProgressoDaIA({ progresso, vasculhandoAgora }: ProgressoDaIAProps) {
  if (!vasculhandoAgora && !progresso) {
    return null;
  }

  const formatarTempo = (segundos: number) => {
    if (segundos < 60) return `${segundos}s`;
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}m ${segs}s`;
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              🤖 Trabalhando aqui...
            </h3>
            <p className="text-sm text-gray-600">
              Tô vasculhando suas conversas pra achar dinheiro esquecido
            </p>
          </div>
        </div>

        {/* Progresso */}
        {progresso && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 font-medium">
                {progresso.current} de {progresso.total} conversas analisadas
              </span>
              <span className="text-gray-600">
                {progresso.percentage}%
              </span>
            </div>

            <Progress value={progresso.percentage} className="h-2" />

            {progresso.eta_seconds > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  Tempo restante: ~{formatarTempo(progresso.eta_seconds)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Steps */}
        <div className="space-y-2 border-t border-gray-200 pt-4">
          <Step
            completed={true}
            label="Conectei no WhatsApp"
            icon={<CheckCircle className="w-4 h-4" />}
          />

          <Step
            completed={!!progresso}
            inProgress={vasculhandoAgora && !progresso}
            label="Vasculhando conversas..."
            icon={
              progresso ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin" />
              )
            }
          />

          <Step
            completed={false}
            pending={true}
            label="Calculando valores..."
            icon={<div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
          />

          <Step
            completed={false}
            pending={true}
            label="Escrevendo respostas com IA..."
            icon={<div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
          />
        </div>
      </div>
    </Card>
  );
}

interface StepProps {
  completed?: boolean;
  inProgress?: boolean;
  pending?: boolean;
  label: string;
  icon: React.ReactNode;
}

function Step({ completed, inProgress, pending, label, icon }: StepProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`
          flex-shrink-0
          ${completed ? 'text-green-600' : ''}
          ${inProgress ? 'text-blue-600' : ''}
          ${pending ? 'text-gray-400' : ''}
        `}
      >
        {icon}
      </div>
      <span
        className={`
          text-sm
          ${completed ? 'text-gray-900 font-medium' : ''}
          ${inProgress ? 'text-blue-600 font-medium' : ''}
          ${pending ? 'text-gray-500' : ''}
        `}
      >
        {label}
      </span>
    </div>
  );
}
