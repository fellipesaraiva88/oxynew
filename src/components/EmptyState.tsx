import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ 
  icon: Icon, 
  emoji, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <div className="glass-card rounded-2xl p-12 text-center">
      <div className="flex justify-center mb-4">
        {emoji ? (
          <div className="text-6xl animate-bounce">{emoji}</div>
        ) : Icon ? (
          <div className="bg-primary/10 rounded-full p-6">
            <Icon className="w-12 h-12 text-primary" />
          </div>
        ) : null}
      </div>
      
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      )}
      
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}

export function NoConversationsYet() {
  return (
    <EmptyState
      emoji="💬"
      title="Nenhuma conversa ainda"
      description="Assim que alguém mandar mensagem no WhatsApp, a IA já começa a trabalhar e você vê tudo aqui!"
      action={
        <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 smooth-transition font-medium">
          Configurar WhatsApp
        </button>
      }
    />
  );
}

export function NoPetsYet() {
  return (
    <EmptyState
      emoji="🏥"
      title="Nenhum patient cadastrado"
      description="A IA vai cadastrar automaticamente quando os tutores mencionarem seus patients nas conversas!"
    />
  );
}

export function NoBookingsYet() {
  return (
    <EmptyState
      emoji="📅"
      title="Nenhum agendamento"
      description="Quando clientes agendarem serviços, todos os compromissos aparecerão aqui organizados."
      action={
        <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 smooth-transition font-medium">
          Criar Agendamento Manual
        </button>
      }
    />
  );
}
