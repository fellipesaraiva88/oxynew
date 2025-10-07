import { Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface Activity {
  id: string;
  type: "success" | "pending" | "error";
  title: string;
  description: string;
  timestamp: string;
  meta?: {
    customerName?: string;
    petName?: string;
    value?: number;
  };
}

interface ActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
}

export function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  const getIcon = (type: Activity["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-ai-success" />;
      case "pending":
        return <Loader2 className="w-4 h-4 text-ai-pending animate-spin" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-ai-escalated" />;
    }
  };

  const getBgColor = (type: Activity["type"]) => {
    switch (type) {
      case "success":
        return "bg-ai-success/5 border-ai-success/20";
      case "pending":
        return "bg-ai-pending/5 border-ai-pending/20";
      case "error":
        return "bg-ai-escalated/5 border-ai-escalated/20";
    }
  };

  return (
    <div className="space-y-3">
      {displayActivities.map((activity) => (
        <div
          key={activity.id}
          className={`flex gap-3 p-4 rounded-xl border ${getBgColor(activity.type)} hover:shadow-md smooth-transition`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="text-sm font-semibold text-foreground">
                {activity.title}
              </h4>
              <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {activity.timestamp}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {activity.description}
            </p>
            {activity.meta && (
              <div className="flex flex-wrap gap-2">
                {activity.meta.customerName && (
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    👤 {activity.meta.customerName}
                  </span>
                )}
                {activity.meta.petName && (
                  <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full">
                    🏥 {activity.meta.petName}
                  </span>
                )}
                {activity.meta.value && (
                  <span className="text-xs px-2 py-0.5 bg-ai-success/10 text-ai-success rounded-full font-semibold">
                    💰 R$ {activity.meta.value}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function RealtimeActivityFeed() {
  const mockActivities: Activity[] = [
    {
      id: "1",
      type: "success",
      title: "Cliente cadastrado pela IA",
      description: "Ana Silva foi adicionada ao sistema automaticamente",
      timestamp: "há 2 min",
      meta: {
        customerName: "Ana Silva",
      },
    },
    {
      id: "2",
      type: "success",
      title: "Patient cadastrado",
      description: "Rex (cachorro) foi registrado no sistema",
      timestamp: "há 3 min",
      meta: {
        customerName: "Ana Silva",
        petName: "Rex",
      },
    },
    {
      id: "3",
      type: "pending",
      title: "Processando agendamento",
      description: "IA está verificando disponibilidade para banho",
      timestamp: "há 3 min",
    },
    {
      id: "4",
      type: "success",
      title: "Venda registrada",
      description: "Ração Premium vendida automaticamente",
      timestamp: "há 15 min",
      meta: {
        customerName: "João Costa",
        value: 180,
      },
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">
            Feed de Atividades em Tempo Real
          </h3>
          <p className="text-xs text-muted-foreground">
            Acompanhe cada ação da IA ao vivo
          </p>
        </div>
        <div className="status-dot-success"></div>
      </div>
      <ActivityFeed activities={mockActivities} />
    </div>
  );
}
