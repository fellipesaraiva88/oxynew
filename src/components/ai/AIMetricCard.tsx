import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface AIMetricCardProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  iconColor?: string;
  iconBg?: string;
}

export function AIMetricCard({ 
  icon: Icon, 
  value, 
  label,
  iconColor = 'text-ocean-blue',
  iconBg = 'bg-ocean-blue/10'
}: AIMetricCardProps) {
  return (
    <Card className="glass-card hover-scale">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-16 h-16 rounded-2xl ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-8 h-8 ${iconColor}`} />
          </div>
        </div>
        <div className="text-4xl font-bold mb-2">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
