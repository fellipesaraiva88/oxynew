import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/admin/StatCard';
import { DateRangePicker } from '@/components/admin/DateRangePicker';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, TrendingUp, DollarSign, UserMinus, Loader2 } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Analytics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState<Record<string, unknown> | null>(null);
  const [funnel, setFunnel] = useState<Record<string, unknown>[]>([]);
  const [revenue, setRevenue] = useState<Record<string, unknown>>({});
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams();

      if (dateRange.from) params.append('from_date', dateRange.from.toISOString());
      if (dateRange.to) params.append('to_date', dateRange.to.toISOString());

      const [kpisRes, funnelRes, revenueRes] = await Promise.all([
        axios.get(`${API_URL}/api/internal/analytics/kpis?${params}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/internal/analytics/conversion-funnel?${params}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/internal/analytics/revenue?${params}&group_by=day`, { withCredentials: true })
      ]);

      setKpis(kpisRes.data);
      setFunnel(funnelRes.data.funnel);
      setRevenue(revenueRes.data.revenue_by_period);
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        if (axiosError.response?.status === 401) {
          navigate('/admin/login');
          return;
        }

        toast({
          variant: 'destructive',
          title: 'Erro ao carregar analytics',
          description: axiosError.response?.data?.error || 'Tente novamente'
        });
      }
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

  const revenueData = Object.entries(revenue).map(([date, cents]) => ({
    date,
    revenue: (cents as number) / 100
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Métricas e relatórios de negócio</p>
      </div>

      <DateRangePicker
        from={dateRange.from}
        to={dateRange.to}
        onSelect={setDateRange}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Mensagens Enviadas"
          value={kpis?.total_messages || 0}
          icon={MessageSquare}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Taxa de Conversão"
          value={`${kpis?.conversion_rate || 0}%`}
          icon={TrendingUp}
          iconColor="text-green-600"
        />
        <StatCard
          title="Receita Total"
          value={`R$ ${((kpis?.total_revenue_cents || 0) / 100).toFixed(2)}`}
          icon={DollarSign}
          iconColor="text-purple-600"
        />
        <StatCard
          title="Churn Rate"
          value={`${kpis?.churn_rate || 0}%`}
          icon={UserMinus}
          iconColor="text-red-600"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Funil de Conversão</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnel}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Receita ao Longo do Tempo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#00C49F" name="Receita (R$)" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
