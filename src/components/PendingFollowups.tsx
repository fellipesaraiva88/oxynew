import { Clock, Calendar, User, X } from "lucide-react";
import { useFollowups, useCancelFollowup } from "@/hooks/useFollowups";
import { DashboardCardSkeleton, ErrorState, EmptyState } from "./LoadingStates";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function PendingFollowupsCard() {
  const { data, isLoading, error, refetch } = useFollowups('pending');
  const cancelFollowup = useCancelFollowup();

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Follow-ups Pendentes</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <DashboardCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Follow-ups Pendentes</h3>
        </div>
        <ErrorState
          message="Erro ao carregar follow-ups"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const followups = data?.followups || [];

  if (followups.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Follow-ups Pendentes</h3>
        </div>
        <EmptyState
          icon={<Calendar className="w-8 h-8 text-muted-foreground" />}
          title="Nenhum follow-up agendado"
          message="Quando a IA agendar follow-ups, eles aparecerão aqui"
        />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Follow-ups Pendentes</h3>
        </div>
        <span className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
          {followups.length}
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {followups.map((followup) => (
          <div
            key={followup.id}
            className="p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl hover:from-muted/50 hover:to-muted/20 smooth-transition group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-semibold text-foreground truncate">
                    {followup.contacts?.name || 'Contato'}
                  </span>
                  {followup.contacts?.patients && followup.contacts.patients.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      • {followup.contacts.patients[0].name}
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {followup.message}
                </p>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Agendado para {formatDistanceToNow(new Date(followup.scheduled_for), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </span>
                </div>
              </div>

              <button
                onClick={() => cancelFollowup.mutate(followup.id)}
                disabled={cancelFollowup.isPending}
                className="text-red-500 hover:text-red-600 p-1 rounded opacity-0 group-hover:opacity-100 smooth-transition disabled:opacity-50"
                title="Cancelar follow-up"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border/50 text-center">
        <button className="text-sm text-primary hover:underline font-medium">
          Ver todos os follow-ups →
        </button>
      </div>
    </div>
  );
}
