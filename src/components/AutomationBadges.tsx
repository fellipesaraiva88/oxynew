import { Bot, Users, Calendar, DollarSign, MessageCircle, AlertTriangle } from "lucide-react";
import { useAutomationStatus } from "@/hooks/useAutomations";
import { DashboardCardSkeleton, ErrorState } from "./LoadingStates";

export function AutomationBadges() {
  const { data: status, isLoading, error, refetch } = useAutomationStatus();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <ErrorState
          message="Erro ao carregar automações"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!status) return null;

  const badges = [
    {
      icon: Bot,
      label: "Patients Cadastrados",
      value: status.petsRegistered,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Users,
      label: "Clientes Atualizados",
      value: status.contactsUpdated,
      color: "text-ai-success",
      bgColor: "bg-ai-success/10",
    },
    {
      icon: Calendar,
      label: "Agendas Criadas",
      value: status.bookingsCreated,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: DollarSign,
      label: "Vendas Registradas",
      value: status.salesRegistered,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: MessageCircle,
      label: "Follow-ups Enviados",
      value: status.followupsSent,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: AlertTriangle,
      label: "Escalações",
      value: status.escalations,
      color: "text-ai-escalated",
      bgColor: "bg-ai-escalated/10",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">
            🤖 Ações Automáticas Hoje
          </h3>
          <p className="text-sm text-muted-foreground">
            Tudo que a IA já fez por você hoje
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-ai-success animate-pulse"></div>
          <span className="text-xs font-medium text-ai-success">
            Atualizando em tempo real
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 fade-in">
        {badges.map((badge, index) => {
          const Icon = badge.icon;
          return (
            <div
              key={index}
              className="glass-card rounded-xl p-4 hover-scale group cursor-pointer"
            >
              <div className={`${badge.bgColor} rounded-lg p-2 w-fit mb-3 group-hover:scale-110 smooth-transition`}>
                <Icon className={`w-4 h-4 ${badge.color}`} />
              </div>
              <div className="text-2xl font-bold gradient-text mb-1">
                {badge.value}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                {badge.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="glass-card rounded-xl p-4 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
        <p className="text-sm text-center text-muted-foreground">
          <span className="font-semibold text-foreground">
            💡 Total: {status.petsRegistered + status.contactsUpdated + status.bookingsCreated + status.salesRegistered + status.followupsSent} ações
          </span>
          {" "}realizadas automaticamente pela IA enquanto você foca no que importa
        </p>
      </div>
    </div>
  );
}
