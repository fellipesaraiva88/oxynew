import { AlertCircle, Clock, TrendingUp, Zap } from "lucide-react";
import { QuickActions } from "@/components/QuickActions";
import { WhatsAppStatusCard } from "@/components/WhatsAppStatus";
import { AutomationBadges } from "@/components/AutomationBadges";
import { ImpactHero } from "@/components/ImpactHero";
import { ImpactCards } from "@/components/ImpactCards";
import { OvernightActivity } from "@/components/OvernightActivity";
import { WorkAutomationChart } from "@/components/WorkAutomationChart";
import { RevenueTimelineChart } from "@/components/RevenueTimelineChart";
import { useDashboardStats } from "@/hooks/useDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardSocketUpdates } from "@/hooks/useSocket";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats();

  // Enable real-time updates via Socket.io
  useDashboardSocketUpdates();

  const userName = user?.full_name?.split(' ')[0] || 'Usuário';

  return (
    <div className="min-h-screen bg-background" data-tour="dashboard">
      <div className="container mx-auto p-3 md:p-4 lg:p-6 max-w-7xl space-y-4 md:space-y-6">

        {/* Header Section */}
        <header className="fade-in">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold gradient-text mb-2">
                Oi {userName}! 👋
              </h1>
              <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
                A IA já atendeu <span className="text-primary font-bold">{stats?.conversationsToday || 0} clientes</span> hoje e está trabalhando agora
              </p>
            </div>
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <WhatsAppStatusCard instanceId={user?.organization?.whatsapp_instance_id || 'default'} />
              <QuickActions />
            </div>
          </div>
        </header>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 fade-in">
          <div className="glass-card rounded-xl p-3 md:p-4 hover-scale">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
              <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary flex-shrink-0" />
              <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">Trabalhando</span>
            </div>
            <div className="text-xl md:text-2xl font-bold gradient-text">{stats?.activeConversations || 0} <span className="text-sm md:text-base">agora</span></div>
          </div>
          <div className="glass-card rounded-xl p-3 md:p-4 hover-scale">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-ai-success flex-shrink-0" />
              <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">Mensagens</span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-ai-success">{stats?.messagesToday || 0}</div>
          </div>
          <div className="glass-card rounded-xl p-3 md:p-4 hover-scale">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
              <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent flex-shrink-0" />
              <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">Taxa IA</span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-accent">{stats?.automationRate || 0}%</div>
          </div>
          <div className="glass-card rounded-xl p-3 md:p-4 hover-scale">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
              <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-ai-escalated flex-shrink-0" />
              <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">Requer você</span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-ai-escalated">{stats?.escalatedConversations || 0} <span className="text-sm md:text-base">casos</span></div>
          </div>
        </div>

        {/* Painel de Impacto Real */}
        <ImpactHero />

        {/* Cards de Impacto (Linguagem: Impacto > Atividade) */}
        <ImpactCards />

        {/* Enquanto Você Dormia */}
        <OvernightActivity />

        {/* Gráficos de Impacto */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <WorkAutomationChart automationRate={stats?.automationRate || 0} />
          <RevenueTimelineChart />
        </div>

        {/* Automation Badges */}
        <AutomationBadges />

        {/* Action Required Section */}
        <div className="glass-card rounded-2xl p-4 md:p-6 fade-in">
          <div className="flex items-start gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="bg-ai-escalated/10 rounded-xl p-2 md:p-2.5 flex-shrink-0">
              <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-ai-escalated" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground mb-1">
                🎯 Aqui Só Você Resolve
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                Onde você é insubstituível
              </p>
            </div>
          </div>

          <div className="space-y-2 md:space-y-3">
            {/* Escalated - Urgent */}
            <div className="p-3 md:p-5 bg-gradient-to-r from-ai-escalated/10 to-ai-escalated/5 rounded-xl border-l-4 border-ai-escalated hover:shadow-lg smooth-transition cursor-pointer group">
              <div className="flex items-start justify-between mb-1.5 md:mb-2 gap-2">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-ai-escalated animate-pulse flex-shrink-0"></div>
                  <span className="text-xs md:text-sm font-bold text-foreground group-hover:text-ai-escalated smooth-transition">
                    🔴 3 pessoas esperando seu toque humano
                  </span>
                </div>
                <span className="text-[10px] md:text-xs text-ai-escalated font-semibold bg-ai-escalated/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full flex-shrink-0">
                  URGENTE
                </span>
              </div>
              <p className="text-[11px] md:text-xs text-muted-foreground ml-5 md:ml-6">
                IA escalou porque detectou que você é necessário
              </p>
              <button
                onClick={() => navigate('/conversas?filter=escalated')}
                className="ml-5 md:ml-6 mt-1.5 md:mt-2 text-xs font-medium text-ai-escalated hover:underline min-h-[44px] md:min-h-0 flex items-center"
              >
                Ver conversas →
              </button>
            </div>

            {/* Pending - Important */}
            <div className="p-3 md:p-5 bg-gradient-to-r from-ai-pending/10 to-ai-pending/5 rounded-xl border-l-4 border-ai-pending hover:shadow-lg smooth-transition cursor-pointer group">
              <div className="flex items-start justify-between mb-1.5 md:mb-2 gap-2">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-ai-pending flex-shrink-0"></div>
                  <span className="text-xs md:text-sm font-bold text-foreground group-hover:text-ai-pending smooth-transition">
                    🟡 2 patients com momento importante chegando
                  </span>
                </div>
                <span className="text-[10px] md:text-xs text-ai-pending font-semibold bg-ai-pending/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full flex-shrink-0">
                  IMPORTANTE
                </span>
              </div>
              <p className="text-[11px] md:text-xs text-muted-foreground ml-5 md:ml-6">
                Vacinas vencem em 7 dias, hora de avisar tutores
              </p>
              <button
                onClick={() => navigate('/clientes?filter=upcoming-vaccines')}
                className="ml-5 md:ml-6 mt-1.5 md:mt-2 text-xs font-medium text-ai-pending hover:underline min-h-[44px] md:min-h-0 flex items-center"
              >
                Ver patients →
              </button>
            </div>

            {/* Success - Ready */}
            <div className="p-3 md:p-5 bg-gradient-to-r from-ai-success/10 to-ai-success/5 rounded-xl border-l-4 border-ai-success hover:shadow-lg smooth-transition cursor-pointer group">
              <div className="flex items-start justify-between mb-1.5 md:mb-2 gap-2">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-ai-success flex-shrink-0"></div>
                  <span className="text-xs md:text-sm font-bold text-foreground group-hover:text-ai-success smooth-transition">
                    🟢 5 patients voltando pra casa hoje
                  </span>
                </div>
                <span className="text-[10px] md:text-xs text-ai-success font-semibold bg-ai-success/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full flex-shrink-0">
                  PRONTO
                </span>
              </div>
              <p className="text-[11px] md:text-xs text-muted-foreground ml-5 md:ml-6">
                Check-outs de hotel programados
              </p>
              <button
                onClick={() => navigate('/agenda?filter=today-checkouts')}
                className="ml-5 md:ml-6 mt-1.5 md:mt-2 text-xs font-medium text-ai-success hover:underline min-h-[44px] md:min-h-0 flex items-center"
              >
                Ver agenda →
              </button>
            </div>

            {/* Info - Awaiting */}
            <div className="p-3 md:p-5 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border-l-4 border-primary hover:shadow-lg smooth-transition cursor-pointer group">
              <div className="flex items-start justify-between mb-1.5 md:mb-2 gap-2">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-xs md:text-sm font-bold text-foreground group-hover:text-primary smooth-transition">
                    🔵 2 pagamentos precisam de atenção
                  </span>
                </div>
                <span className="text-[10px] md:text-xs text-primary font-semibold bg-primary/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full flex-shrink-0">
                  AGUARDANDO
                </span>
              </div>
              <p className="text-[11px] md:text-xs text-muted-foreground ml-5 md:ml-6">
                Aguardando confirmação
              </p>
              <button
                onClick={() => navigate('/vendas?filter=pending-confirmation')}
                className="ml-5 md:ml-6 mt-1.5 md:mt-2 text-xs font-medium text-primary hover:underline min-h-[44px] md:min-h-0 flex items-center"
              >
                Ver vendas →
              </button>
            </div>
          </div>

          {/* Bottom Message */}
          <div className="mt-4 md:mt-6 p-4 md:p-5 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-xl border border-primary/10 text-center">
            <p className="text-xs md:text-sm font-medium text-foreground flex items-center justify-center gap-1.5 md:gap-2">
              <span className="text-xl md:text-2xl">💡</span>
              <span className="font-semibold">Todo o resto? A IA já resolveu.</span>
            </p>
            <p className="text-[11px] md:text-xs text-muted-foreground mt-1.5 md:mt-2">
              Você só aparece onde realmente faz diferença
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;
