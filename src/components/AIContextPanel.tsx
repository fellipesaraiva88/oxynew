import { User, Dog, Target, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { AIStatusBadge } from "./AIActionBadge";

interface AIContextPanelProps {
  customer: {
    name: string;
    status: "new" | "returning";
    totalVisits?: number;
  };
  patients?: {
    name: string;
    gender_identity: string;
  }[];
  intent: {
    type: string;
    confidence: number;
  };
  actions: {
    type: string;
    status: "completed" | "pending" | "failed";
    timestamp: string;
  }[];
  nextFollowup?: string;
}

export function AIContextPanel({ 
  customer, 
  patients = [], 
  intent, 
  actions,
  nextFollowup 
}: AIContextPanelProps) {
  return (
    <div className="w-80 border-l border-border/50 bg-muted/20 p-6 space-y-6 overflow-y-auto scrollbar-custom">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">Contexto IA</h3>
        <p className="text-xs text-muted-foreground">Real-time insights</p>
      </div>

      {/* Customer Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <User className="w-4 h-4 text-primary" />
          Cliente
        </div>
        <div className="bg-card/50 rounded-lg p-3 space-y-2">
          <div className="font-medium text-foreground">{customer.name}</div>
          {customer.status === "new" ? (
            <AIStatusBadge status="pending" label="Novo cliente" />
          ) : (
            <div className="text-xs text-muted-foreground">
              {customer.totalVisits} visitas anteriores
            </div>
          )}
        </div>
      </div>

      {/* Patients Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Dog className="w-4 h-4 text-accent" />
          Patients
        </div>
        {patients.length === 0 ? (
          <div className="bg-card/50 rounded-lg p-3 text-xs text-muted-foreground">
            Nenhum patient cadastrado ainda
          </div>
        ) : (
          <div className="space-y-2">
            {patients.map((patient, index) => (
              <div key={index} className="bg-card/50 rounded-lg p-3">
                <div className="font-medium text-foreground text-sm">{patient.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{patient.gender_identity}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Intent Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Target className="w-4 h-4 text-ai-pending" />
          Intenção Detectada
        </div>
        <div className="bg-card/50 rounded-lg p-3 space-y-2">
          <div className="font-medium text-foreground text-sm">{intent.type}</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary smooth-transition"
                style={{ width: `${intent.confidence}%` }}
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {intent.confidence}%
            </span>
          </div>
        </div>
      </div>

      {/* Actions Timeline */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CheckCircle className="w-4 h-4 text-ai-success" />
          Ações Executadas
        </div>
        <div className="space-y-2">
          {actions.length === 0 ? (
            <div className="bg-card/50 rounded-lg p-3 text-xs text-muted-foreground">
              Nenhuma ação ainda
            </div>
          ) : (
            actions.map((action, index) => (
              <div key={index} className="bg-card/50 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{action.type}</span>
                  {action.status === "completed" && (
                    <CheckCircle className="w-3 h-3 text-ai-success" />
                  )}
                  {action.status === "pending" && (
                    <Clock className="w-3 h-3 text-ai-pending animate-pulse" />
                  )}
                  {action.status === "failed" && (
                    <AlertCircle className="w-3 h-3 text-ai-escalated" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {action.timestamp}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Next Follow-up */}
      {nextFollowup && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="w-4 h-4 text-primary" />
            Próximo Follow-up
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="text-xs text-foreground font-medium">{nextFollowup}</div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="space-y-3 pt-3 border-t border-border/50">
        <div className="text-xs font-semibold text-muted-foreground">
          Sugestões de Resposta
        </div>
        <div className="space-y-2">
          {[
            "Oferecer desconto na primeira visita",
            "Perguntar sobre vacinas em dia",
            "Sugerir pacote mensal"
          ].map((suggestion, index) => (
            <button
              key={index}
              className="w-full text-left text-xs p-2 bg-card/50 hover:bg-card rounded-lg text-foreground hover:text-primary smooth-transition"
            >
              💡 {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
