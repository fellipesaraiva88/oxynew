import { Badge } from '@/components/ui/badge';
import { Activity, AlertCircle, Loader2 } from 'lucide-react';

interface InstanceStatusBadgeProps {
  status: 'connected' | 'disconnected' | 'connecting' | 'qr_pending';
}

const STATUS_CONFIG = {
  connected: {
    label: 'Conectado',
    variant: 'default' as const,
    icon: Activity,
    className: 'bg-green-100 text-green-800 border-green-200'
  },
  disconnected: {
    label: 'Desconectado',
    variant: 'destructive' as const,
    icon: AlertCircle,
    className: 'bg-red-100 text-red-800 border-red-200'
  },
  connecting: {
    label: 'Conectando',
    variant: 'secondary' as const,
    icon: Loader2,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  qr_pending: {
    label: 'QR Pendente',
    variant: 'secondary' as const,
    icon: AlertCircle,
    className: 'bg-blue-100 text-blue-800 border-blue-200'
  }
};

export function InstanceStatusBadge({ status }: InstanceStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.disconnected;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className={`h-3 w-3 mr-1 ${status === 'connecting' ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  );
}
