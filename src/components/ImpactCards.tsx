import { DollarSign, Target, TrendingUp, Clock } from "lucide-react";
import { useDashboardStats, useImpactMetrics } from "@/hooks/useDashboard";

export function ImpactCards() {
  const { data: stats } = useDashboardStats();
  const { data: impact } = useImpactMetrics();

  // Calculate hours and minutes from hoursWorked
  const hours = Math.floor(impact?.hoursWorked || 0);
  const minutes = Math.round(((impact?.hoursWorked || 0) % 1) * 60);

  const cards = [
    {
      icon: DollarSign,
      title: "Dinheiro em Movimento",
      value: `${stats?.activeConversations || 0} conversas`,
      subtitle: "acontecendo agora",
      badge: "🤖 IA gerenciando",
      color: "text-ai-success",
      bgColor: "bg-ai-success/10",
    },
    {
      icon: Target,
      title: "Receita Garantida",
      value: `${impact?.salesClosed || 0} vendas`,
      subtitle: "fechadas nos últimos 7 dias",
      badge: "🎉 Caixa futuro",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: TrendingUp,
      title: "Potencial Sendo Usado",
      value: `${stats?.automationRate || 0}%`,
      subtitle: "automação ativa",
      badge: "📊 Taxa ótima",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Clock,
      title: "Você estava Livre",
      value: `${hours}h ${minutes}min`,
      subtitle: "últimos 7 dias",
      badge: "💡 IA trabalhando",
      color: "text-ai-pending",
      bgColor: "bg-ai-pending/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <div
          key={index}
          className="neuro-card rounded-2xl p-6 hover-scale group"
        >
          <div className={`${card.bgColor} rounded-xl p-3 w-fit mb-4 smooth-transition group-hover:scale-110`}>
            <card.icon className={`w-6 h-6 ${card.color}`} />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            {card.title}
          </h3>
          <div className="text-3xl font-bold text-foreground mb-1">
            {card.value}
          </div>
          <p className="text-sm text-muted-foreground mb-3">{card.subtitle}</p>
          <div className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
            {card.badge}
          </div>
        </div>
      ))}
    </div>
  );
}
