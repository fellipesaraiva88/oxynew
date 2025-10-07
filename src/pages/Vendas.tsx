import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingCart, TrendingUp, Bot, Package, Loader2 } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { format, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { RevenueChart } from "@/components/RevenueChart";
import { DateRangeFilter } from "@/components/DateRangeFilter";

export default function Vendas() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Usar appointments com status 'completed' como proxy para vendas
  const { appointments, isLoading } = useBookings({ status: 'completed' });

  // Filtrar por data
  const filteredBookings = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return appointments;
    return appointments.filter((b) => {
      const bookingDate = new Date(b.created_at || b.createdAt);
      return isWithinInterval(bookingDate, {
        start: startOfDay(dateRange.from!),
        end: endOfDay(dateRange.to!),
      });
    });
  }, [appointments, dateRange]);

  // Preparar dados para o gráfico
  const chartData = useMemo(() => {
    const groupedByDate: Record<string, { revenue: number; count: number }> = {};

    filteredBookings.forEach((appointment) => {
      const date = format(new Date(appointment.created_at || appointment.createdAt), "dd/MM");
      if (!groupedByDate[date]) {
        groupedByDate[date] = { revenue: 0, count: 0 };
      }
      groupedByDate[date].revenue += appointment.price || 0;
      groupedByDate[date].count += 1;
    });

    return Object.entries(groupedByDate).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      count: data.count,
    }));
  }, [filteredBookings]);

  const totalRevenue = filteredBookings.reduce((sum, appointment) => sum + (appointment.price || 0), 0);
  const aiSales = filteredBookings.filter((b) => b.notes?.includes('IA') || b.created_by_ai).length;
  const avgTicket = filteredBookings.length > 0 ? totalRevenue / filteredBookings.length : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Vendas"
        subtitle="Acompanhe suas vendas e produtos"
        actions={
          <DateRangeFilter onRangeChange={setDateRange} />
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={DollarSign}
          title="Receita Total"
          value={isLoading ? "-" : `R$ ${totalRevenue.toFixed(2)}`}
          subtitle="Serviços concluídos"
        />
        <StatCard
          icon={ShoppingCart}
          title="Total de Vendas"
          value={isLoading ? "-" : filteredBookings.length}
          subtitle={dateRange.from && dateRange.to ? "Período selecionado" : "Serviços finalizados"}
        />
        <StatCard
          icon={Bot}
          title="Vendas pela IA"
          value={isLoading ? "-" : aiSales}
          subtitle="Automáticas"
        />
        <StatCard
          icon={TrendingUp}
          title="Ticket Médio"
          value={isLoading ? "-" : `R$ ${avgTicket.toFixed(2)}`}
          subtitle="Por venda"
        />
      </div>

      {/* Gráfico de Receita */}
      {chartData.length > 0 && (
        <div className="mb-6">
          <RevenueChart data={chartData} type="bar" />
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Vendas Recentes */}
        <Card className="col-span-8 glass-card">
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-ocean-blue animate-spin" />
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhuma venda registrada</h3>
                <p className="text-muted-foreground">
                  Vendas aparecerão aqui quando serviços forem concluídos
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((appointment) => {
                  const createdAt = appointment.created_at ? new Date(appointment.created_at) : new Date();
                  const isAI = appointment.notes?.includes("IA") || appointment.created_by_ai;

                  return (
                    <div
                      key={appointment.id}
                      className="p-4 rounded-lg border border-border hover:border-ocean-blue/50 smooth-transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">
                              {appointment.contact?.full_name || "Cliente"}
                            </h4>
                            {isAI && (
                              <Badge variant="secondary" className="gap-1">
                                <Bot className="w-3 h-3" />
                                IA
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 mb-2">
                            <p className="text-sm text-muted-foreground">
                              {appointment.service_type ? appointment.service_type.replace('_', ' ').toUpperCase() : 'Serviço'} - {appointment.patient?.name || 'Patient'}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(createdAt, "dd/MM/yyyy")} às {format(createdAt, "HH:mm")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            R$ {(appointment.price || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Serviços Mais Vendidos */}
        <Card className="col-span-4 glass-card">
          <CardHeader>
            <CardTitle>Serviços Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-ocean-blue animate-spin" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {['bath', 'grooming', 'hotel'].map((serviceType) => {
                    const serviceBookings = filteredBookings.filter(b => b.service_type === serviceType);
                    const serviceRevenue = serviceBookings.reduce((sum, b) => sum + (b.price || 0), 0);

                    if (serviceBookings.length === 0) return null;

                    return (
                      <div key={serviceType} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-ocean-blue/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-ocean-blue" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {serviceType === 'bath' ? 'Banho' : serviceType === 'grooming' ? 'Banho e Tosa' : 'Hotel'}
                          </p>
                          <p className="text-xs text-muted-foreground">{serviceBookings.length} vendas</p>
                        </div>
                        <p className="font-semibold text-ocean-blue">
                          R$ {serviceRevenue.toFixed(0)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {filteredBookings.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">Nenhum serviço vendido ainda</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
