import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Camera, Utensils, Activity, Pill } from "lucide-react";

interface TimelineEvent {
  id: string;
  time: string;
  type: 'feeding' | 'recreation' | 'walk' | 'medication' | 'photo';
  description: string;
  pet_name: string;
  completed: boolean;
}

interface DaycareTimelineProps {
  events: TimelineEvent[];
  date?: Date;
}

export function DaycareTimeline({ events, date = new Date() }: DaycareTimelineProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'feeding':
        return <Utensils className="w-4 h-4 text-orange-500" />;
      case 'recreation':
        return <Activity className="w-4 h-4 text-green-500" />;
      case 'walk':
        return <Activity className="w-4 h-4 text-blue-500" />;
      case 'medication':
        return <Pill className="w-4 h-4 text-red-500" />;
      case 'photo':
        return <Camera className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'feeding':
        return 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/10';
      case 'recreation':
        return 'border-green-200 bg-green-50/50 dark:bg-green-950/10';
      case 'walk':
        return 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/10';
      case 'medication':
        return 'border-red-200 bg-red-50/50 dark:bg-red-950/10';
      case 'photo':
        return 'border-purple-200 bg-purple-50/50 dark:bg-purple-950/10';
      default:
        return 'border-gray-200 bg-gray-50/50 dark:bg-gray-950/10';
    }
  };

  const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Rotina do Dia
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {date.toLocaleDateString('pt-BR')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma atividade agendada para hoje
          </p>
        ) : (
          <div className="space-y-3">
            {sortedEvents.map((event, index) => (
              <div
                key={event.id}
                className={`
                  relative pl-8 pb-3 border-l-2
                  ${event.completed ? 'border-green-300' : 'border-gray-200'}
                  ${index === sortedEvents.length - 1 ? 'border-l-0' : ''}
                `}
              >
                {/* Timeline dot */}
                <div
                  className={`
                    absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2
                    ${
                      event.completed
                        ? 'bg-green-500 border-green-300'
                        : 'bg-white dark:bg-gray-900 border-gray-300'
                    }
                  `}
                />

                <div className={`border rounded-lg p-3 ${getEventColor(event.type)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.type)}
                      <span className="font-semibold text-sm">{event.time}</span>
                    </div>
                    {event.completed && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                        ✓ Concluído
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm font-medium mb-1">{event.description}</p>
                  <p className="text-xs text-muted-foreground">Patient: {event.pet_name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {sortedEvents.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Total de atividades:</span>
                <span className="ml-2 font-semibold">{sortedEvents.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Concluídas:</span>
                <span className="ml-2 font-semibold text-green-600">
                  {sortedEvents.filter((e) => e.completed).length}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
