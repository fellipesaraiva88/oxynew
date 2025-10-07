import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { AIHeroCard } from '@/components/ai/AIHeroCard';
import { AIMetricCard } from '@/components/ai/AIMetricCard';
import { AIActivityFeed } from '@/components/ai/AIActivityFeed';
import { AIConfigTabs } from '@/components/ai/AIConfigTabs';
import { WhatsAppSyncCard } from '@/components/ai/WhatsAppSyncCard';
import { BipeNotifications } from '@/components/ai/BipeNotifications';
import { AIPlayground } from '@/components/ai/AIPlayground';
import { useAIMetrics } from '@/hooks/useAIMetrics';
import { useAIActivity } from '@/hooks/useAIActivity';
import { useAIConfig } from '@/hooks/useAIConfig';
import { useWhatsAppInstances } from '@/hooks/useWhatsApp';
import { MessageCircle, Calendar, Users, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { settingsService } from '@/services/settings.service';
import { useQuery } from '@tanstack/react-query';

export default function IA() {
  const navigate = useNavigate();
  const { metrics, isLoading: loadingMetrics } = useAIMetrics();
  const { activities, isLoading: loadingActivities } = useAIActivity();
  const { config, updateConfig } = useAIConfig();
  const { data: instancesData, refetch: refetchInstances } = useWhatsAppInstances();

  // Check if AI onboarding is needed
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.get(),
  });

  const instances = instancesData?.instances || [];
  const primaryInstance = instances[0];

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!loadingSettings && settings && !settings.ai_onboarding_completed) {
      navigate('/ia/onboarding');
    }
  }, [settings, loadingSettings, navigate]);

  if (loadingMetrics || loadingSettings) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-ocean-blue animate-spin" />
        </div>
      </div>
    );
  }

  // Get AI personality config from settings
  const patientAI = settings?.ai_personality_config?.client_ai || {
    name: 'Luna',
    personality: 'friendly',
  };
  const oxy_assistant = settings?.ai_personality_config?.oxy_assistant || {
    name: 'OxyAssistant',
    personality: 'parceira-proxima',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header with AI Name */}
      <div className="flex items-center justify-between">
        <div>
          <PageHeader
            title={`${patientAI.name} - Sua Assistente Virtual`}
            subtitle="Trabalhando 24/7 para você crescer"
          />
          <div className="flex items-center gap-2 mt-2">
            <div className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
              IA de Atendimento: {patientAI.name}
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
              Parceira de Negócios: {oxy_assistant.name}
            </div>
          </div>
        </div>

        <Button
          onClick={() => navigate('/ia/onboarding')}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Reconfigurar IA
        </Button>
      </div>

      {/* BIPE Notifications - Prioridade Máxima */}
      <BipeNotifications />

      {/* AI Playground */}
      <AIPlayground />

      {/* Hero Card - Impacto */}
      <AIHeroCard
        conversations={metrics?.conversationsToday || 0}
        timeSaved={metrics?.timeSaved || '0h 0min'}
        revenue={metrics?.revenue || 0}
        activityData={metrics?.activityByHour || []}
      />

      {/* Métricas Visuais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AIMetricCard
          icon={MessageCircle}
          value={metrics?.conversationsToday || 0}
          label="Clientes Atendidos Hoje"
          iconColor="text-ocean-blue"
          iconBg="bg-ocean-blue/10"
        />
        <AIMetricCard
          icon={Calendar}
          value={metrics?.bookingsCreated || 0}
          label="Agendamentos Criados"
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <AIMetricCard
          icon={Users}
          value={(metrics?.contactsRegistered || 0) + (metrics?.petsRegistered || 0)}
          label="Cadastros Realizados"
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Grid 2 Colunas - Removida redundância */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feed de Atividade */}
        <div className="lg:col-span-2">
          <AIActivityFeed activities={activities} isLoading={loadingActivities} />
        </div>

        {/* Status e Sincronização - UNIFICADO */}
        <div className="space-y-4">
          {/* WhatsApp Connection Card - Unificado e Premium */}
          <Card className="card-premium border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                WhatsApp
              </CardTitle>
              <CardDescription>
                Conexão e sincronização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WhatsAppSyncCard
                instance={primaryInstance}
                onUpdate={refetchInstances}
              />

              {/* Status Details */}
              {primaryInstance && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium">
                      {primaryInstance.status === 'connected' ? (
                        <span className="text-green-600">✓ Conectado</span>
                      ) : (
                        <span className="text-amber-600">⚠ Desconectado</span>
                      )}
                    </span>
                  </div>
                  {primaryInstance.phone_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Número:</span>
                      <span className="font-medium font-mono">
                        {primaryInstance.phone_number}
                      </span>
                    </div>
                  )}
                  {primaryInstance.last_connected_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Última conexão:</span>
                      <span className="font-medium">
                        {new Date(primaryInstance.last_connected_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="text-lg">Stats Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taxa de Resposta</span>
                <span className="font-bold text-green-600">
                  {metrics?.responseRate || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tempo Médio</span>
                <span className="font-bold text-ocean-blue">
                  {metrics?.avgResponseTime || '0s'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Satisfação</span>
                <span className="font-bold text-purple-600">
                  {metrics?.satisfactionRate || 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Configurações */}
      <AIConfigTabs config={config} onSave={updateConfig} />
    </div>
  );
}
