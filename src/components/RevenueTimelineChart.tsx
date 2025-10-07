import { DollarSign } from "lucide-react";
import { useRevenueTimeline } from "@/hooks/useDashboard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartSkeleton, ErrorState, EmptyState } from "./LoadingStates";

export function RevenueTimelineChart() {
  const { data: timeline, isLoading, error, refetch } = useRevenueTimeline();

  if (error) {
    return <ErrorState message="Erro ao carregar timeline de receita" onRetry={refetch} />;
  }

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!timeline || timeline.length === 0) {
    return <EmptyState
      icon={<DollarSign className="w-8 h-8 text-muted-foreground" />}
      title="Sem dados de receita"
      message="Assim que houver vendas, o gráfico aparecerá aqui"
    />;
  }

  // Find overnight revenue (22h-8h)
  const overnightRevenue = timeline
    .filter(slot => {
      const hour = parseInt(slot.time.replace('h', ''));
      return hour >= 22 || hour <= 8;
    })
    .reduce((sum, slot) => sum + slot.value, 0);

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 hover-scale">
      <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-ai-success" />
        💰 Dinheiro Trabalhando Por Você (24h)
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={timeline}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="time"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => `R$ ${value}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="glass-card rounded-lg p-3 shadow-xl border border-border">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      {payload[0].payload.time}
                    </p>
                    <p className="text-lg font-bold text-ai-success">
                      R$ {payload[0].value}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="value"
            fill="hsl(var(--ai-success))"
            radius={[8, 8, 0, 0]}
            className="hover:opacity-80 transition-opacity"
          />
        </BarChart>
      </ResponsiveContainer>

      {overnightRevenue > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20">
          <p className="text-sm font-medium text-foreground">
            🌙 Até de madrugada: <span className="text-ai-success font-bold">R$ {overnightRevenue.toLocaleString('pt-BR')}</span> (02h-06h)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            IA fechando vendas enquanto você dormia
          </p>
        </div>
      )}
    </div>
  );
}
