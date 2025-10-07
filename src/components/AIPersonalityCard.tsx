import { Bot, Settings as SettingsIcon, Clock, Sparkles } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { DashboardCardSkeleton, ErrorState, EmptyState } from "./LoadingStates";
import { useState } from "react";

export function AIPersonalityCard() {
  const { data: settings, isLoading, error, refetch } = useSettings();
  const updateSettings = useUpdateSettings();
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <DashboardCardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <ErrorState
          message="Erro ao carregar configurações da IA"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <EmptyState
          icon={<Bot className="w-8 h-8 text-muted-foreground" />}
          title="Configurações não encontradas"
          message="As configurações da IA aparecerão aqui"
        />
      </div>
    );
  }

  const personalityLabels = {
    professional: 'Profissional',
    friendly: 'Amigável',
    casual: 'Casual',
    formal: 'Formal'
  };

  const toneLabels = {
    friendly: 'Amigável',
    neutral: 'Neutro',
    enthusiastic: 'Entusiasmado'
  };

  return (
    <div className="glass-card rounded-2xl p-6 hover-scale">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-2">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {settings.ai_name}
            </h3>
            <p className="text-xs text-muted-foreground">Assistente IA</p>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 hover:bg-muted rounded-lg smooth-transition"
          title="Configurações"
        >
          <SettingsIcon className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">Personalidade</span>
          </div>
          <span className="text-sm font-semibold text-foreground">
            {personalityLabels[settings.ai_personality]}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Tom</span>
          </div>
          <span className="text-sm font-semibold text-foreground">
            {toneLabels[settings.ai_tone]}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-ai-success" />
            <span className="text-sm text-muted-foreground">Horário</span>
          </div>
          <span className="text-sm font-semibold text-foreground">
            {settings.business_hours_start} - {settings.business_hours_end}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-ai-pending" />
            <span className="text-sm text-muted-foreground">Resposta Auto</span>
          </div>
          <span className={`text-sm font-semibold ${
            settings.auto_respond ? 'text-ai-success' : 'text-gray-500'
          }`}>
            {settings.auto_respond ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      {settings.escalation_keywords && settings.escalation_keywords.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Palavras de Escalação:</p>
          <div className="flex flex-wrap gap-2">
            {settings.escalation_keywords.map((keyword, i) => (
              <span
                key={i}
                className="text-xs bg-ai-escalated/10 text-ai-escalated px-2 py-1 rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-ai-success animate-pulse"></div>
        <span className="text-xs font-medium text-ai-success">
          IA trabalhando 24/7
        </span>
      </div>
    </div>
  );
}
