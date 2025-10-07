import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/admin/StatCard';
import { DateRangePicker } from '@/components/admin/DateRangePicker';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare,
  DollarSign,
  TrendingUp,
  Zap,
  Loader2
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { tokenAnalyticsService } from '@/services/token-analytics.service';
import type {
  TokenUsageStats,
  ModelComparison,
  TimelineDataPoint,
  OrganizationUsage,
  SavingsData
} from '@/services/token-analytics.service';

const COLORS = {
  primary: '#0ea5e9',    // ocean-blue
  secondary: '#f59e0b',  // amber
  success: '#10b981',    // green
  danger: '#ef4444'      // red
};

const PIE_COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

export default function TokenUsage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState<TokenUsageStats | null>(null);
  const [modelComparison, setModelComparison] = useState<ModelComparison[]>([]);
  const [timeline, setTimeline] = useState<TimelineDataPoint[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationUsage[]>([]);
  const [savings, setSavings] = useState<SavingsData | null>(null);

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });

  useEffect(() => {
    fetchTokenAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const fetchTokenAnalytics = async () => {
    try {
      setIsLoading(true);

      const [statsRes, modelsRes, timelineRes, orgsRes, savingsRes] = await Promise.all([
        tokenAnalyticsService.getTokenStats(dateRange),
        tokenAnalyticsService.getModelComparison(dateRange),
        tokenAnalyticsService.getTokenTimeline(dateRange, 'day'),
        tokenAnalyticsService.getOrganizationBreakdown(dateRange, 10),
        tokenAnalyticsService.getSavings(dateRange)
      ]);

      setStats(statsRes);
      setModelComparison(modelsRes);
      setTimeline(timelineRes);
      setOrganizations(orgsRes);
      setSavings(savingsRes);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        navigate('/admin/login');
        return;
      }

      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados de tokens',
        description: error?.response?.data?.error || 'Tente novamente'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-ocean-blue animate-spin" />
      </div>
    );
  }

  // Preparar dados para gráfico de pizza (model comparison)
  const pieData = modelComparison.map((model) => ({
    name: model.model === 'gpt-4o-mini' ? 'GPT-4o-mini' : model.model,
    value: model.total_tokens,
    cost: model.total_cost_cents
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Uso de Tokens IA</h1>
        <p className="text-muted-foreground">
          Monitoramento de uso e custos das IAs (Patient AI + OxyAssistant)
        </p>
      </div>

      {/* Date Range Picker */}
      <DateRangePicker
        from={dateRange.from}
        to={dateRange.to}
        onSelect={setDateRange}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total de Tokens"
          value={stats?.total_tokens.toLocaleString() || '0'}
          icon={MessageSquare}
          iconColor="text-blue-600"
          subtitle={`${stats?.total_interactions || 0} interações`}
        />
        <StatCard
          title="Custo Total"
          value={`R$ ${((stats?.total_cost_cents || 0) / 100).toFixed(2)}`}
          icon={DollarSign}
          iconColor="text-amber-600"
          subtitle={`Média: R$ ${((stats?.average_cost_per_interaction_cents || 0) / 100).toFixed(4)}/interação`}
        />
        <StatCard
          title="Tokens por Conversa"
          value={stats?.average_tokens_per_interaction.toLocaleString() || '0'}
          icon={TrendingUp}
          iconColor="text-green-600"
          subtitle="Média de tokens"
        />
        <StatCard
          title="Economia vs GPT-4"
          value={`${savings?.savings_percentage || 0}%`}
          icon={Zap}
          iconColor="text-purple-600"
          subtitle={`R$ ${((savings?.savings_cents || 0) / 100).toFixed(2)} economizados`}
        />
      </div>

      {/* Gráfico de Linha - Evolução Temporal */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Evolução de Uso de Tokens</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
              formatter={(value: number) => [value.toLocaleString(), '']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="prompt_tokens"
              stroke={COLORS.primary}
              strokeWidth={2}
              name="Prompt Tokens"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="completion_tokens"
              stroke={COLORS.secondary}
              strokeWidth={2}
              name="Completion Tokens"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Gráficos de Comparação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Pizza - Distribuição por Modelo */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Distribuição por Modelo</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value.toLocaleString() + ' tokens', '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Gráfico de Barras - Custo por Modelo */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Custo por Modelo</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={modelComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="model"
                tickFormatter={(value) => value === 'gpt-4o-mini' ? 'GPT-4o-mini' : value}
              />
              <YAxis tickFormatter={(value) => `R$ ${(value / 100).toFixed(2)}`} />
              <Tooltip
                formatter={(value: number) => [`R$ ${(value / 100).toFixed(2)}`, 'Custo']}
              />
              <Legend />
              <Bar dataKey="total_cost_cents" fill={COLORS.primary} name="Custo (R$)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tabela de Organizações */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Top Organizações por Uso</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Organização</th>
                <th className="text-right p-3 font-semibold">Total Tokens</th>
                <th className="text-right p-3 font-semibold">Custo Total</th>
                <th className="text-right p-3 font-semibold">Interações</th>
                <th className="text-right p-3 font-semibold">Última Interação</th>
              </tr>
            </thead>
            <tbody>
              {organizations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-6 text-muted-foreground">
                    Nenhum dado disponível para o período selecionado
                  </td>
                </tr>
              ) : (
                organizations.map((org) => (
                  <tr key={org.organization_id} className="border-b hover:bg-muted/50">
                    <td className="p-3">{org.organization_name}</td>
                    <td className="p-3 text-right">
                      {org.total_tokens.toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      R$ {(org.total_cost_cents / 100).toFixed(2)}
                    </td>
                    <td className="p-3 text-right">{org.interactions_count}</td>
                    <td className="p-3 text-right">
                      {new Date(org.last_interaction_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
