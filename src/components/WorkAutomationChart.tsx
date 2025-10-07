import { Bot, User } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WorkAutomationChartProps {
  automationRate: number;
}

export function WorkAutomationChart({ automationRate }: WorkAutomationChartProps) {
  const humanRate = 100 - automationRate;

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 hover-scale">
      <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
        <Bot className="w-5 h-5 text-primary" />
        📈 Quanto do Trabalho Você NÃO Precisou Fazer
      </h3>

      <div className="space-y-4">
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">IA resolveu sozinha</span>
            </div>
            <span className="text-2xl font-bold text-primary">{automationRate}%</span>
          </div>
          <Progress value={automationRate} className="h-3 bg-muted" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Você entrou em ação</span>
            </div>
            <span className="text-2xl font-bold text-muted-foreground">{humanRate}%</span>
          </div>
          <Progress value={humanRate} className="h-3 bg-muted [&>div]:bg-muted-foreground" />
        </div>
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-accent/5 rounded-xl border border-primary/20">
        <p className="text-sm text-muted-foreground">
          💡 A cada 10 clientes, você só precisou aparecer em {Math.round(humanRate / 10)}.
          Os outros {Math.round(automationRate / 10)}? IA resolveu enquanto você tocava o negócio.
        </p>
      </div>
    </div>
  );
}
