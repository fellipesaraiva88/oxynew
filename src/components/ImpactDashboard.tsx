import { DollarSign, Clock, TrendingUp, Zap, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";

interface ImpactMetrics {
  timesSaved: {
    hours: number;
    minutes: number;
    label: string;
  };
  revenueInProgress: {
    amount: number;
    conversations: number;
    label: string;
  };
  guaranteedRevenue: {
    amount: number;
    appointments: number;
    label: string;
  };
  capacityUsage: {
    percentage: number;
    used: number;
    total: number;
    label: string;
  };
}

interface ImpactDashboardProps {
  metrics: ImpactMetrics;
  isLoading?: boolean;
}

export function ImpactDashboard({ metrics, isLoading = false }: ImpactDashboardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      
      {/* Tempo Economizado */}
      <Card className="neuro-card hover-scale group border-l-4 border-l-ai-success">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metrics.timesSaved.label}
            </CardTitle>
            <div className="bg-ai-success/10 rounded-xl p-2 group-hover:scale-110 smooth-transition">
              <Clock className="w-5 h-5 text-ai-success" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground mb-1">
            {metrics.timesSaved.hours}h {metrics.timesSaved.minutes}min
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs bg-ai-success/10 text-ai-success border-0">
              💡 IA trabalhando
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Você estava livre hoje
          </p>
        </CardContent>
      </Card>

      {/* Dinheiro em Movimento */}
      <Card className="neuro-card hover-scale group border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metrics.revenueInProgress.label}
            </CardTitle>
            <div className="bg-primary/10 rounded-xl p-2 group-hover:scale-110 smooth-transition">
              <Zap className="w-5 h-5 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground mb-1">
            R$ {metrics.revenueInProgress.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
              🤖 {metrics.revenueInProgress.conversations} conversas ativas
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            IA negociando agora
          </p>
        </CardContent>
      </Card>

      {/* Receita Garantida */}
      <Card className="neuro-card hover-scale group border-l-4 border-l-accent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metrics.guaranteedRevenue.label}
            </CardTitle>
            <div className="bg-accent/10 rounded-xl p-2 group-hover:scale-110 smooth-transition">
              <Target className="w-5 h-5 text-accent" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground mb-1">
            R$ {metrics.guaranteedRevenue.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs bg-accent/10 text-accent border-0">
              🎉 {metrics.guaranteedRevenue.appointments} agendamentos
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Confirmados esta semana
          </p>
        </CardContent>
      </Card>

      {/* Capacidade Utilizada */}
      <Card className="neuro-card hover-scale group border-l-4 border-l-ai-pending">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metrics.capacityUsage.label}
            </CardTitle>
            <div className="bg-ai-pending/10 rounded-xl p-2 group-hover:scale-110 smooth-transition">
              <TrendingUp className="w-5 h-5 text-ai-pending" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground mb-1">
            {metrics.capacityUsage.percentage}%
          </div>
          <Progress 
            value={metrics.capacityUsage.percentage} 
            className="h-2 mb-2"
          />
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs bg-ai-pending/10 text-ai-pending border-0">
              📊 {metrics.capacityUsage.used}/{metrics.capacityUsage.total} vagas
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Taxa de ocupação
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
