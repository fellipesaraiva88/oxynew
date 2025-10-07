import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  DollarSign,
  Dog,
  Clock,
  MapPin,
  Star,
  AlertTriangle,
  Target,
  Award,
  ShoppingBag,
  MessageSquare,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  is_active?: boolean;
  created_at?: string;
  createdAt?: string;
}

interface ClientAnalyticsProps {
  clients: Client[];
  dateRange?: { start: Date; end: Date };
}

export function ClientAnalytics({ clients, dateRange }: ClientAnalyticsProps) {
  const [selectedMetric, setSelectedMetric] = useState<"overview" | "engagement" | "revenue" | "health">("overview");

  // Calcular métricas
  const metrics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Clientes ativos
    const activeClients = clients.filter(c => c.is_active !== false);
    const inactiveClients = clients.filter(c => c.is_active === false);

    // Novos clientes
    const newClientsThisMonth = clients.filter(c => {
      const createdDate = new Date(c.created_at || c.createdAt);
      return createdDate > thirtyDaysAgo;
    });

    const newClientsThisWeek = clients.filter(c => {
      const createdDate = new Date(c.created_at || c.createdAt);
      return createdDate > sevenDaysAgo;
    });

    // Taxa de crescimento
    const previousMonthCount = clients.filter(c => {
      const createdDate = new Date(c.created_at || c.createdAt);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      return createdDate <= thirtyDaysAgo && createdDate > sixtyDaysAgo;
    }).length;

    const growthRate = previousMonthCount > 0
      ? ((newClientsThisMonth.length - previousMonthCount) / previousMonthCount * 100)
      : 100;

    // Distribuição por período do dia (mock)
    const timeDistribution = [
      { time: "Manhã", count: Math.floor(activeClients.length * 0.4) },
      { time: "Tarde", count: Math.floor(activeClients.length * 0.35) },
      { time: "Noite", count: Math.floor(activeClients.length * 0.25) },
    ];

    // Distribuição por valor (mock)
    const valueDistribution = [
      { category: "Bronze", count: Math.floor(clients.length * 0.5), color: "#CD7F32" },
      { category: "Silver", count: Math.floor(clients.length * 0.3), color: "#C0C0C0" },
      { category: "Gold", count: Math.floor(clients.length * 0.15), color: "#FFD700" },
      { category: "Platinum", count: Math.floor(clients.length * 0.05), color: "#E5E4E2" },
    ];

    // Engajamento semanal (mock)
    const weeklyEngagement = [
      { day: "Seg", messages: 45, appointments: 12 },
      { day: "Ter", messages: 52, appointments: 15 },
      { day: "Qua", messages: 38, appointments: 10 },
      { day: "Qui", messages: 65, appointments: 18 },
      { day: "Sex", messages: 58, appointments: 20 },
      { day: "Sáb", messages: 72, appointments: 25 },
      { day: "Dom", messages: 30, appointments: 8 },
    ];

    // Top serviços (mock)
    const topServices = [
      { service: "Banho & Tosa", count: 145, revenue: 7250 },
      { service: "Consulta", count: 89, revenue: 8900 },
      { service: "Vacina", count: 67, revenue: 3350 },
      { service: "Hotel", count: 34, revenue: 5100 },
      { service: "Creche", count: 28, revenue: 2800 },
    ];

    return {
      total: clients.length,
      active: activeClients.length,
      inactive: inactiveClients.length,
      newThisMonth: newClientsThisMonth.length,
      newThisWeek: newClientsThisWeek.length,
      growthRate,
      activeRate: (activeClients.length / clients.length * 100).toFixed(1),
      churnRate: (inactiveClients.length / clients.length * 100).toFixed(1),
      timeDistribution,
      valueDistribution,
      weeklyEngagement,
      topServices,
    };
  }, [clients]);

  // Calcular pontuação de saúde
  const healthScore = useMemo(() => {
    const activeRate = metrics.active / metrics.total;
    const growthFactor = metrics.growthRate > 0 ? 1.2 : 0.8;
    const score = Math.min(100, Math.round(activeRate * 100 * growthFactor));

    return {
      score,
      label: score >= 80 ? "Excelente" : score >= 60 ? "Bom" : score >= 40 ? "Regular" : "Atenção",
      color: score >= 80 ? "text-green-600" : score >= 60 ? "text-blue-600" : score >= 40 ? "text-yellow-600" : "text-red-600",
    };
  }, [metrics]);

  return (
    <div className="space-y-6">
      {/* Header com KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-1"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold">{metrics.total}</p>
                <Users className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Taxa de Atividade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold">{metrics.activeRate}%</p>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.active} ativos de {metrics.total}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Crescimento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold">
                  {metrics.growthRate > 0 ? "+" : ""}{metrics.growthRate.toFixed(1)}%
                </p>
                {metrics.growthRate > 0 ? (
                  <TrendingUp className="w-8 h-8 text-green-600" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-600" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +{metrics.newThisMonth} este mês
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Health Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn("text-3xl font-bold", healthScore.color)}>
                    {healthScore.score}
                  </p>
                  <Badge className="mt-1" variant={healthScore.score >= 60 ? "default" : "destructive"}>
                    {healthScore.label}
                  </Badge>
                </div>
                <Heart className={cn("w-8 h-8", healthScore.color)} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Taxa de Churn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold">{metrics.churnRate}%</p>
                <AlertTriangle
                  className={cn(
                    "w-8 h-8",
                    parseFloat(metrics.churnRate) > 10 ? "text-red-600" : "text-yellow-600"
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.inactive} inativos
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs de análises detalhadas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Análises Detalhadas</CardTitle>
            <Tabs value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as "overview" | "engagement" | "revenue" | "health")}>
              <TabsList>
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="engagement">Engajamento</TabsTrigger>
                <TabsTrigger value="revenue">Receita</TabsTrigger>
                <TabsTrigger value="health">Saúde</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Distribuição por valor */}
              <div>
                <h4 className="text-sm font-medium mb-4">Distribuição por Categoria</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={metrics.valueDistribution}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ category, count }) => `${category}: ${count}`}
                    >
                      {metrics.valueDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Distribuição por horário */}
              <div>
                <h4 className="text-sm font-medium mb-4">Preferência de Horário</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metrics.timeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-4">Engajamento Semanal</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.weeklyEngagement}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="messages"
                    stroke="#3b82f6"
                    name="Mensagens"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="appointments"
                    stroke="#10b981"
                    name="Agendamentos"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-4">Top Serviços por Receita</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.topServices}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="service" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "revenue") return `R$ ${value}`;
                      return value;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="Quantidade" />
                  <Bar dataKey="revenue" fill="#10b981" name="Receita" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Indicadores de saúde */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Pontos Fortes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    {metrics.growthRate > 0 && (
                      <li className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-600" />
                        Crescimento positivo
                      </li>
                    )}
                    {parseFloat(metrics.activeRate) > 70 && (
                      <li className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-green-600" />
                        Alta taxa de atividade
                      </li>
                    )}
                    {metrics.newThisWeek > 5 && (
                      <li className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-green-600" />
                        Boa aquisição semanal
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Pontos de Atenção
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    {parseFloat(metrics.churnRate) > 10 && (
                      <li className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-yellow-600" />
                        Taxa de churn elevada
                      </li>
                    )}
                    {metrics.inactive > metrics.active * 0.3 && (
                      <li className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-yellow-600" />
                        Muitos clientes inativos
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Recomendações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-blue-600" />
                      Campanha de reativação
                    </li>
                    <li className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-blue-600" />
                      Programa de fidelidade
                    </li>
                    <li className="flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-blue-600" />
                      Promoções segmentadas
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </div>
  );
}