import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AIHealthBadgeProps {
  status: 'connected' | 'disconnected' | 'error';
  lastUpdate?: string;
  phoneNumber?: string;
  details?: {
    instanceId: string;
    uptime?: string;
  };
}

export function AIHealthBadge({ status, lastUpdate, phoneNumber, details }: AIHealthBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  const isHealthy = status === 'connected';
  const statusText = isHealthy ? 'Tudo Funcionando' : 'Precisa de Atenção';
  const statusColor = isHealthy ? 'bg-green-500' : 'bg-yellow-500';

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${statusColor} animate-pulse`} />
            <div>
              <div className="flex items-center gap-2">
                {isHealthy ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                )}
                <span className="font-semibold">{statusText}</span>
              </div>
              {lastUpdate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Atualizado{' '}
                  {formatDistanceToNow(new Date(lastUpdate), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Ocultar
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Detalhes
              </>
            )}
          </Button>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-2 text-sm">
            {phoneNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Número:</span>
                <span className="font-mono">{phoneNumber}</span>
              </div>
            )}
            {details?.instanceId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID da Instância:</span>
                <span className="font-mono text-xs">{details.instanceId}</span>
              </div>
            )}
            {details?.uptime && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tempo Online:</span>
                <span>{details.uptime}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={isHealthy ? 'default' : 'secondary'} className={isHealthy ? 'bg-green-500' : 'bg-yellow-500'}>
                {status === 'connected' ? 'Conectado' : status === 'disconnected' ? 'Desconectado' : 'Erro'}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
