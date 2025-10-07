import { Bot, Clock, ChevronDown, Sparkles, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { useState, ElementType } from "react";
import { useAutomationStatus, useAutomationActivities } from "@/hooks/useAutomations";
import { DashboardCardSkeleton } from "./LoadingStates";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AITimeline() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { data: status, isLoading: statusLoading } = useAutomationStatus();
  const { data: activitiesData, isLoading: activitiesLoading } = useAutomationActivities();

  const isLoading = statusLoading || activitiesLoading;
  const activities = activitiesData?.activities || [];

  // Map activity types to icons and colors
  const getActivityConfig = (type: string) => {
    const configs: Record<string, { icon: ElementType; color: string; bgColor: string; emoji: string }> = {
      pet_registered: { icon: Sparkles, color: "text-ai-success", bgColor: "bg-ai-success/10", emoji: "🎉" },
      booking_created: { icon: DollarSign, color: "text-primary", bgColor: "bg-primary/10", emoji: "💰" },
      sale_completed: { icon: ShoppingCart, color: "text-accent", bgColor: "bg-accent/10", emoji: "💵" },
      contact_updated: { icon: Bot, color: "text-blue-500", bgColor: "bg-blue-500/10", emoji: "👥" },
      followup_sent: { icon: Clock, color: "text-ai-pending", bgColor: "bg-ai-pending/10", emoji: "🔔" },
    };
    return configs[type] || { icon: Bot, color: "text-primary", bgColor: "bg-primary/10", emoji: "🤖" };
  };

  return (
    <div className="glass-card rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between cursor-pointer mb-6" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-2">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              🤖 Máquina de Resultados (Últimas 24h)
            </h2>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground smooth-transition ${isExpanded ? "rotate-180" : ""}`} />
      </div>

      {/* Stats Grid - 6 cards em 2 linhas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-muted/30 rounded-xl p-4">
                <DashboardCardSkeleton />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/10 hover-scale">
              <div className="text-2xl font-bold text-foreground mb-1">{status?.petsRegistered || 0}</div>
              <div className="text-xs text-muted-foreground">🏥 Patients Cadastrados</div>
            </div>
            <div className="bg-gradient-to-br from-ai-success/5 to-primary/5 rounded-xl p-4 border border-ai-success/10 hover-scale">
              <div className="text-2xl font-bold text-foreground mb-1">{status?.contactsUpdated || 0}</div>
              <div className="text-xs text-muted-foreground">👥 Clientes Atualizados</div>
            </div>
            <div className="bg-gradient-to-br from-accent/5 to-ai-pending/5 rounded-xl p-4 border border-accent/10 hover-scale">
              <div className="text-2xl font-bold text-foreground mb-1">{status?.bookingsCreated || 0}</div>
              <div className="text-xs text-muted-foreground">📅 Agendas Criadas</div>
            </div>
            <div className="bg-muted/30 rounded-xl p-4 hover-scale">
              <div className="text-2xl font-bold text-foreground mb-1">{status?.salesRegistered || 0}</div>
              <div className="text-xs text-muted-foreground">💰 Vendas Registradas</div>
            </div>
            <div className="bg-muted/30 rounded-xl p-4 hover-scale">
              <div className="text-2xl font-bold text-foreground mb-1">{status?.followupsSent || 0}</div>
              <div className="text-xs text-muted-foreground">🔔 Follow-ups Enviados</div>
            </div>
            <div className="bg-ai-escalated/5 rounded-xl p-4 border border-ai-escalated/20 hover-scale">
              <div className="text-2xl font-bold text-ai-escalated mb-1">{status?.escalations || 0}</div>
              <div className="text-xs text-muted-foreground">⚠️ Escalações Necessárias</div>
            </div>
          </>
        )}
      </div>

      {isExpanded && (
        <div className="border-t border-border/50 pt-6 fade-in">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            📋 Últimas Ações (real-time):
          </h3>
          <div className="space-y-3">
            {isLoading ? (
              <>
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 bg-muted/30 rounded-xl">
                    <DashboardCardSkeleton />
                  </div>
                ))}
              </>
            ) : activities.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma atividade recente</p>
              </div>
            ) : (
              activities.slice(0, 5).map((activity) => {
                const config = getActivityConfig(activity.action_type);
                const Icon = config.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-4 p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl hover:from-muted/50 hover:to-muted/20 smooth-transition hover-scale">
                    <div className={`${config.bgColor} rounded-lg p-2.5 mt-0.5`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-foreground text-sm">
                          {config.emoji} {activity.description}
                        </h4>
                        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                          ⏰ {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1.5">
                        {activity.entity_type} - {activity.metadata?.name || activity.entity_id}
                      </p>
                      <div className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        ⚡ Ação automática
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
