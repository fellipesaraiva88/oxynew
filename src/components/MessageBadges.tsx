import { Bot, User, AlertTriangle, Calendar, DollarSign, Dog, UserPlus } from "lucide-react";

export type MessageBadgeType = 
  | "ai_responded" 
  | "human_responded" 
  | "ai_escalated" 
  | "booking_created" 
  | "sale_registered" 
  | "pet_registered" 
  | "customer_updated";

interface MessageBadgeProps {
  type: MessageBadgeType;
  className?: string;
}

export function MessageBadge({ type, className = "" }: MessageBadgeProps) {
  const badges = {
    ai_responded: {
      icon: Bot,
      label: "IA respondeu",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    human_responded: {
      icon: User,
      label: "Humano respondeu",
      color: "text-accent",
      bgColor: "bg-accent/10",
      borderColor: "border-accent/20",
    },
    ai_escalated: {
      icon: AlertTriangle,
      label: "IA escalou",
      color: "text-ai-escalated",
      bgColor: "bg-ai-escalated/10",
      borderColor: "border-ai-escalated/20",
    },
    booking_created: {
      icon: Calendar,
      label: "Agendamento criado",
      color: "text-ai-success",
      bgColor: "bg-ai-success/10",
      borderColor: "border-ai-success/20",
    },
    sale_registered: {
      icon: DollarSign,
      label: "Venda registrada",
      color: "text-ai-pending",
      bgColor: "bg-ai-pending/10",
      borderColor: "border-ai-pending/20",
    },
    pet_registered: {
      icon: Dog,
      label: "Patient cadastrado",
      color: "text-accent",
      bgColor: "bg-accent/10",
      borderColor: "border-accent/20",
    },
    customer_updated: {
      icon: UserPlus,
      label: "Cliente atualizado",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
  };

  const badge = badges[type];
  const Icon = badge.icon;

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${badge.bgColor} ${badge.borderColor} ${className}`}
    >
      <Icon className={`w-3 h-3 ${badge.color}`} />
      <span className={`text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    </div>
  );
}

export function MessageBadgeList({ badges }: { badges: MessageBadgeType[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge, index) => (
        <MessageBadge key={index} type={badge} />
      ))}
    </div>
  );
}
