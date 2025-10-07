import { Moon, CheckCircle2, Calendar, DollarSign, Bell, Sparkles } from "lucide-react";
import { useOvernightActivity } from "@/hooks/useDashboard";
import { ChartSkeleton, ErrorState } from "./LoadingStates";

export function OvernightActivity() {
  const { data: overnight, isLoading, error, refetch } = useOvernightActivity();

  if (error) {
    return <ErrorState message="Erro ao carregar atividade noturna" onRetry={refetch} />;
  }

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!overnight) return null;

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 mb-6 md:mb-8 hover-scale">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-3 shadow-lg">
          <Moon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            🚀 Enquanto Você Dormia
          </h2>
          <p className="text-sm text-muted-foreground">Última noite (22h às 8h)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-600 uppercase">Clientes</span>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            {overnight.clientsServed}
          </div>
          <p className="text-xs text-muted-foreground">atendidos</p>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-green-600" />
            <span className="text-xs font-semibold text-green-600 uppercase">Agendamentos</span>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            {overnight.bookingsConfirmed}
          </div>
          <p className="text-xs text-muted-foreground">confirmados para hoje</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-semibold text-purple-600 uppercase">Vendas</span>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            R$ {overnight.salesValue.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-muted-foreground">fechadas</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl p-4 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-semibold text-orange-600 uppercase">Follow-ups</span>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            {overnight.followupsSent}
          </div>
          <p className="text-xs text-muted-foreground">enviados</p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          💡 A IA não dorme. Você pode.
        </p>
      </div>
    </div>
  );
}
