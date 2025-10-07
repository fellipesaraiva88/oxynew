import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, Calendar, ShoppingBag, User, PawPrint, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AIActivity {
  id: string;
  type: 'appointment' | 'sale' | 'contact' | 'patient' | 'message';
  description: string;
  timestamp: string;
  metadata?: {
    clientName?: string;
    petName?: string;
    amount?: number;
  };
}

interface AIActivityFeedProps {
  activities: AIActivity[];
  isLoading?: boolean;
}

const getActivityIcon = (type: AIActivity['type']) => {
  switch (type) {
    case 'appointment':
      return Calendar;
    case 'sale':
      return ShoppingBag;
    case 'contact':
      return User;
    case 'patient':
      return PawPrint;
    case 'message':
      return MessageCircle;
  }
};

const getActivityColor = (type: AIActivity['type']) => {
  switch (type) {
    case 'appointment':
      return 'text-blue-600 bg-blue-50';
    case 'sale':
      return 'text-green-600 bg-green-50';
    case 'contact':
      return 'text-purple-600 bg-purple-50';
    case 'patient':
      return 'text-sunset-orange bg-orange-50';
    case 'message':
      return 'text-ocean-blue bg-blue-50';
  }
};

export function AIActivityFeed({ activities, isLoading }: AIActivityFeedProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-sunset-orange" />
          O Que Ela Fez Agora Mesmo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhuma atividade ainda hoje</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {activities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const colorClass = getActivityColor(activity.type);
                
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <Button variant="outline" className="w-full mt-4">
              Ver todas as ações
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
