import { Check, Clock, AlertCircle } from "lucide-react";

interface AIActionBadgeProps {
  actions: {
    type: "cadastro" | "agendamento" | "venda" | "followup";
    count: number;
  }[];
}

export function AIActionBadge({ actions }: AIActionBadgeProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "cadastro":
        return "👤";
      case "agendamento":
        return "📅";
      case "venda":
        return "💰";
      case "followup":
        return "🔔";
      default:
        return "✓";
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case "cadastro":
        return "cadastros";
      case "agendamento":
        return "agendamento";
      case "venda":
        return "venda";
      case "followup":
        return "follow-up";
      default:
        return "ação";
    }
  };

  return (
    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl p-3">
      <div className="bg-primary/20 rounded-lg p-1.5">
        <Check className="w-4 h-4 text-primary" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-primary">🤖 IA executou ações</span>
        <div className="flex items-center gap-2 mt-1">
          {actions.map((action, index) => (
            <span key={index} className="text-xs text-muted-foreground">
              {getIcon(action.type)} {action.count} {getLabel(action.type)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AIStatusBadge({ 
  status, 
  label 
}: { 
  status: "success" | "pending" | "escalated"; 
  label: string;
}) {
  const config = {
    success: {
      icon: Check,
      color: "text-ai-success",
      bgColor: "bg-ai-success/10",
      borderColor: "border-ai-success/20",
      emoji: "✅",
    },
    pending: {
      icon: Clock,
      color: "text-ai-pending",
      bgColor: "bg-ai-pending/10",
      borderColor: "border-ai-pending/20",
      emoji: "⏰",
    },
    escalated: {
      icon: AlertCircle,
      color: "text-ai-escalated",
      bgColor: "bg-ai-escalated/10",
      borderColor: "border-ai-escalated/20",
      emoji: "⚠️",
    },
  };

  const { icon: Icon, color, bgColor, borderColor, emoji } = config[status];

  return (
    <div className={`inline-flex items-center gap-2 ${bgColor} border ${borderColor} rounded-lg px-3 py-1.5`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-xs font-medium ${color}`}>
        {emoji} {label}
      </span>
    </div>
  );
}
