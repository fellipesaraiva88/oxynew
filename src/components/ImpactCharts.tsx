import { TrendingUp, DollarSign, Hotel } from "lucide-react";
import { useDashboardStats, useRevenueTimeline } from "@/hooks/useDashboard";
import { DashboardCardSkeleton } from "./LoadingStates";

export function ImpactCharts() {
  const { data: stats } = useDashboardStats();
  const { data: revenueTimeline, isLoading: revenueLoading } = useRevenueTimeline();

  // Calculate automation percentage
  const automationRate = stats?.automationRate || 0;
  const manualRate = 100 - automationRate;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
      {/* Chart 1: Work Distribution */}
      <div className="glass-card rounded-2xl p-4 md:p-6 hover-scale">
        <h3 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
          <span className="text-sm md:text-base">Quanto do Trabalho Você NÃO Precisou Fazer</span>
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs md:text-sm text-muted-foreground">IA resolveu sozinha</span>
              <span className="text-xl md:text-2xl font-bold text-ai-success">{automationRate}%</span>
            </div>
            <div className="h-6 md:h-8 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-ai-success to-primary smooth-transition"
                style={{ width: `${automationRate}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs md:text-sm text-muted-foreground">Você entrou em ação</span>
              <span className="text-xl md:text-2xl font-bold text-muted-foreground">{manualRate}%</span>
            </div>
            <div className="h-6 md:h-8 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-muted-foreground/30 smooth-transition"
                style={{ width: `${manualRate}%` }}
              />
            </div>
          </div>
        </div>
        <div className="mt-3 md:mt-4 p-3 md:p-4 bg-primary/5 rounded-xl border border-primary/10">
          <p className="text-xs md:text-sm text-foreground flex items-start gap-2">
            <span className="text-lg md:text-xl flex-shrink-0">💡</span>
            <span>
              A cada 10 clientes, você só precisou aparecer em {Math.round(manualRate / 10)}. Os outros {Math.round(automationRate / 10)}? IA resolveu
              enquanto você tocava o negócio.
            </span>
          </p>
        </div>
      </div>

      {/* Chart 2: Money Working */}
      <div className="glass-card rounded-2xl p-4 md:p-6 hover-scale">
        <h3 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-ai-success flex-shrink-0" />
          <span className="text-sm md:text-base">Dinheiro Trabalhando Por Você (24h)</span>
        </h3>
        {revenueLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <DashboardCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-2 md:space-y-3">
              {(revenueTimeline || []).map((item, index) => {
                const maxValue = Math.max(...(revenueTimeline || []).map(i => i.value));
                const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

                return (
                  <div key={index} className="flex items-center gap-2 md:gap-3">
                    <span className="text-xs text-muted-foreground font-mono w-7 md:w-8 flex-shrink-0">{item.time}</span>
                    <div className="flex-1 h-6 md:h-8 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-ai-success to-primary flex items-center justify-end pr-1.5 md:pr-2 smooth-transition"
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-[10px] md:text-xs font-bold text-white whitespace-nowrap">R$ {item.value}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 md:mt-4 p-3 md:p-4 bg-midnight-blue/5 rounded-xl border border-primary/10">
              <p className="text-xs md:text-sm text-foreground flex items-start gap-2">
                <span className="text-lg md:text-xl flex-shrink-0">🌙</span>
                <span>
                  IA trabalhando 24/7 - gerando receita mesmo fora do horário comercial
                  <br />
                  <span className="text-primary font-medium">
                    Seus clientes são atendidos a qualquer hora
                  </span>
                </span>
              </p>
            </div>
          </>
        )}
      </div>

      {/* Chart 3: Capacity Usage */}
      <div className="glass-card rounded-2xl p-4 md:p-6 hover-scale lg:col-span-2">
        <h3 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4 flex items-center gap-2">
          <Hotel className="w-4 h-4 md:w-5 md:h-5 text-accent flex-shrink-0" />
          <span className="text-sm md:text-base">Seu Potencial Sendo Usado</span>
        </h3>
        <div className="space-y-3 md:space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-xs md:text-sm text-foreground font-medium">Hotel</span>
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap justify-end">
                <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">8/10 vagas</span>
                <span className="text-lg md:text-2xl font-bold text-accent">80%</span>
                <span className="text-xs md:text-sm text-ai-success font-medium whitespace-nowrap">💰 R$ 1.600/dia</span>
              </div>
            </div>
            <div className="h-8 md:h-10 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-primary smooth-transition"
                style={{ width: "80%" }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-xs md:text-sm text-foreground font-medium">Creche</span>
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap justify-end">
                <span className="text-xs md:text-sm text-muted-foreground">cheio!</span>
                <span className="text-lg md:text-2xl font-bold text-ai-success">100%</span>
                <span className="text-xs md:text-sm text-primary font-medium whitespace-nowrap">🎉 Fila de espera</span>
              </div>
            </div>
            <div className="h-8 md:h-10 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-ai-success to-primary smooth-transition"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>
        <div className="mt-3 md:mt-4 p-3 md:p-4 bg-ai-pending/5 rounded-xl border border-ai-pending/20">
          <p className="text-xs md:text-sm text-foreground flex items-start gap-2">
            <span className="text-lg md:text-xl flex-shrink-0">💡</span>
            <span>
              Você está deixando 20% na mesa no hotel.
              <br />
              <button
                onClick={() => window.alert('Funcionalidade em desenvolvimento - em breve você poderá criar campanhas automáticas!')}
                className="text-primary font-medium hover:underline min-h-[44px] md:min-h-0 inline-flex items-center"
              >
                Quer que a IA faça campanha de ocupação?
              </button>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
