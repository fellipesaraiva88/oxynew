import { MessageSquare, Calendar, UserPlus, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: MessageSquare,
      label: "Nova Conversa",
      color: "text-primary",
      bgColor: "bg-primary/10",
      onClick: () => navigate("/conversas"),
    },
    {
      icon: Calendar,
      label: "Agendar",
      color: "text-accent",
      bgColor: "bg-accent/10",
      onClick: () => navigate("/agenda"),
    },
    {
      icon: UserPlus,
      label: "Cadastrar Patient",
      color: "text-ai-success",
      bgColor: "bg-ai-success/10",
      onClick: () => navigate("/clientes"),
    },
    {
      icon: Bot,
      label: "Configurar IA",
      color: "text-ai-pending",
      bgColor: "bg-ai-pending/10",
      onClick: () => navigate("/ia"),
    },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className={`flex items-center gap-2 px-4 py-2 ${action.bgColor} rounded-xl hover:scale-105 smooth-transition group`}
        >
          <action.icon className={`w-4 h-4 ${action.color} group-hover:scale-110 smooth-transition`} />
          <span className={`text-sm font-medium ${action.color}`}>
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}
