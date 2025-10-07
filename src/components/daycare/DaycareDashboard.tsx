import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Home, Hotel, TrendingUp, Calendar } from "lucide-react";

interface DaycareDashboardProps {
  stats: {
    totalStays: number;
    activeStays: number;
    pendingApproval: number;
    todayCheckIns: number;
    todayCheckOuts: number;
    occupancyRate: number;
    daycareCapacity: number;
    hotelCapacity: number;
    daycareOccupied: number;
    hotelOccupied: number;
  };
}

export function DaycareDashboard({ stats }: DaycareDashboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Ocupação Geral */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Home className="w-4 h-4 text-blue-500" />
            Ocupação Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.activeStays}/{stats.daycareCapacity + stats.hotelCapacity}
          </div>
          <Progress value={stats.occupancyRate} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {stats.occupancyRate.toFixed(0)}% ocupado
          </p>
        </CardContent>
      </Card>

      {/* Creche */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Home className="w-4 h-4 text-green-500" />
            Creche (Diária)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.daycareOccupied}/{stats.daycareCapacity}
          </div>
          <Progress
            value={(stats.daycareOccupied / stats.daycareCapacity) * 100}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {((stats.daycareOccupied / stats.daycareCapacity) * 100).toFixed(0)}% ocupado
          </p>
        </CardContent>
      </Card>

      {/* Hotel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Hotel className="w-4 h-4 text-purple-500" />
            Hotel (Pernoite)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {stats.hotelOccupied}/{stats.hotelCapacity}
          </div>
          <Progress
            value={(stats.hotelOccupied / stats.hotelCapacity) * 100}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {((stats.hotelOccupied / stats.hotelCapacity) * 100).toFixed(0)}% ocupado
          </p>
        </CardContent>
      </Card>

      {/* Movimentação Hoje */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-500" />
            Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Check-ins:</span>
              <span className="font-semibold text-green-600">{stats.todayCheckIns}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Check-outs:</span>
              <span className="font-semibold text-blue-600">{stats.todayCheckOuts}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Aguardando:</span>
              <span className="font-semibold text-orange-600">{stats.pendingApproval}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
