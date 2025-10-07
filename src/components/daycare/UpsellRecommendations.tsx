import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Scissors, GraduationCap, Camera } from "lucide-react";

interface Upsell {
  id: string;
  stay_id: string;
  pet_name: string;
  service: string;
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  price: string;
  estimated_revenue: number;
}

interface UpsellRecommendationsProps {
  suggestions: Upsell[];
  onAddService?: (stayId: string, service: string) => Promise<void>;
}

export function UpsellRecommendations({ suggestions, onAddService }: UpsellRecommendationsProps) {
  const getServiceIcon = (service: string) => {
    if (service.toLowerCase().includes('banho')) return <Sparkles className="w-4 h-4" />;
    if (service.toLowerCase().includes('tosa')) return <Scissors className="w-4 h-4" />;
    if (service.toLowerCase().includes('treino') || service.toLowerCase().includes('adestramento'))
      return <GraduationCap className="w-4 h-4" />;
    if (service.toLowerCase().includes('foto')) return <Camera className="w-4 h-4" />;
    return <TrendingUp className="w-4 h-4" />;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <Badge variant="destructive" className="text-xs">
            Alta Prioridade
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="default" className="text-xs bg-yellow-500">
            Média
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="outline" className="text-xs">
            Baixa
          </Badge>
        );
    }
  };

  const totalRevenue = suggestions.reduce((acc, s) => acc + s.estimated_revenue, 0);

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-500" />
            Oportunidades de Upsell
          </CardTitle>
          {totalRevenue > 0 && (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              +R$ {totalRevenue.toFixed(2)} potencial
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma sugestão disponível no momento
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              OxyAssistant analisará automaticamente oportunidades
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((upsell) => (
              <div
                key={upsell.id}
                className="border rounded-lg p-4 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/10 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {getServiceIcon(upsell.service)}
                    <h4 className="font-semibold text-sm capitalize">{upsell.service}</h4>
                  </div>
                  {getPriorityBadge(upsell.priority)}
                </div>

                {/* Patient */}
                <p className="text-xs text-muted-foreground mb-2">Patient: {upsell.pet_name}</p>

                {/* Description */}
                <p className="text-sm mb-2">{upsell.description}</p>

                {/* Reason */}
                <div className="mb-3 p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    💡 Por que sugerimos:
                  </p>
                  <p className="text-xs font-medium text-green-700 dark:text-green-400">
                    {upsell.reason}
                  </p>
                </div>

                {/* Price and Action */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-green-600">{upsell.price}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      (+R$ {upsell.estimated_revenue.toFixed(2)})
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => onAddService?.(upsell.stay_id, upsell.service)}
                  >
                    Adicionar Serviço
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* OxyAssistant Attribution */}
        {suggestions.length > 0 && (
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground text-center">
            <Sparkles className="w-4 h-4 inline-block mr-1 text-purple-500" />
            Sugestões inteligentes geradas por OxyAssistant
          </div>
        )}
      </CardContent>
    </Card>
  );
}
