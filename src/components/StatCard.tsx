import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
}

export function StatCard({ icon: Icon, title, value, subtitle, trend }: StatCardProps) {
  return (
    <Card className="card-premium hover-lift group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-blue/20 to-sky-blue/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 text-ocean-blue" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
            </div>
            <p className="text-4xl font-bold font-display gradient-text mb-2">{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
              trend.positive 
                ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                : 'bg-red-500/10 text-red-600 border border-red-500/20'
            }`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
