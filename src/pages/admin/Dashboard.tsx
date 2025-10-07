import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/admin/StatCard';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  Activity,
  MessageSquare,
  TrendingUp,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [charts, setCharts] = useState<Record<string, unknown> | null>(null);
  const [activities, setActivities] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, chartsRes, activitiesRes] = await Promise.all([
        axios.get(`${API_URL}/api/internal/dashboard/metrics`, { withCredentials: true }),
        axios.get(`${API_URL}/api/internal/dashboard/charts`, { withCredentials: true }),
        axios.get(`${API_URL}/api/internal/dashboard/recent-activity`, { withCredentials: true })
      ]);

      setMetrics(metricsRes.data);
      setCharts(chartsRes.data);
      setActivities(activitiesRes.data.activities);
    } catch (error) {
      console.error('Error fetching dashboard:', error);

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        if (axiosError.response?.status === 401) {
          navigate('/admin/login');
          return;
        }

        toast({
          variant: 'destructive',
          title: 'Erro ao carregar dashboard',
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
        <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-ocean-blue animate-spin" />
      </div>
    );
  }

  // Converter dados dos gráficos
  const messagesByDayData = Object.entries(charts?.messages_by_day || {}).map(([day, count]) => ({
    day,
    messages: count
  }));

  const planDistributionData = Object.entries(charts?.plan_distribution || {}).map(([plan, count]) => ({
    name: plan,
    value: count
  }));

  return (
    <div className="p-3 md:p-4 lg:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">Visão geral do sistema</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Organizações"
          value={metrics?.organizations?.total || 0}
          icon={Building2}
          subtitle={`${metrics?.organizations?.active || 0} ativas`}
          iconColor="text-ocean-blue"
        />
        <StatCard
          title="Instâncias Conectadas"
          value={metrics?.instances?.connected || 0}
          icon={Activity}
          subtitle={`${metrics?.instances?.total || 0} total`}
          iconColor="text-green-600"
        />
        <StatCard
          title="Mensagens Hoje"
          value={metrics?.messages?.today || 0}
          icon={MessageSquare}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Uso de Quota"
          value={`${metrics?.messages?.quota_usage_pct || 0}%`}
          icon={TrendingUp}
          iconColor="text-purple-600"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Card className="p-3 md:p-4">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Mensagens (últimos 7 dias)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={messagesByDayData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="messages" stroke="#0088FE" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-3 md:p-4">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Distribuição de Planos</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={planDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {planDistributionData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-3 md:p-4">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Top 5 Clientes (Mensagens Hoje)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.top_clients || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="count" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-3 md:p-4">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Atividades Recentes</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {activities.map((activity) => (
              <div key={(activity as { id: string }).id} className="text-xs md:text-sm border-b pb-2">
                <p className="font-medium truncate">{(activity as { user_email: string }).user_email}</p>
                <p className="text-muted-foreground truncate">
                  {(activity as { action: string }).action} - {(activity as { resource_type: string }).resource_type}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date((activity as { created_at: string }).created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
