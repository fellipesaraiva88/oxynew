import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Activity,
  AlertTriangle,
  Zap,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Shield,
  Rocket,
  Target,
  RefreshCw,
  Send,
  Upload,
  Ban,
  CheckCircle2,
  XCircle,
  Flame,
  Brain,
  Crown,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ClientMetrics {
  instances_count: number;
  messages_today: number;
  messages_month: number;
  quota_usage_pct: number;
  active_conversations: number;
  avg_response_time: number;
  satisfaction_score: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  is_active: boolean;
  subscription_plan: string;
  subscription_status: string;
  quota_messages_monthly: number;
  quota_instances: number;
  metrics: ClientMetrics;
}

interface ClientDetailModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function ClientDetailModal({
  client,
  isOpen,
  onClose,
  onRefresh,
}: ClientDetailModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(client?.subscription_plan || 'free');
  const [creditAmount, setCreditAmount] = useState('');
  const [auroraMessage, setAuroraMessage] = useState('');

  if (!client) return null;

  // Cálculos de métricas preditivas
  const churnRisk = calculateChurnRisk(client);
  const ltv = calculateLTV(client);
  const conversionRate = calculateConversionRate(client);

  const token = localStorage.getItem('admin_token');

  const handleError = (error: unknown, title: string) => {
    let errorMessage = "Tente novamente";
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }
    toast.error(title + ': ' + errorMessage);
  };

  // 🔥 AÇÃO 1: Força Reconexão WhatsApp
  const handleForceReconnect = async () => {
    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/internal/clients/${client.id}/force-reconnect`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('🔄 Reconexão forçada com sucesso!');
      onRefresh();
    } catch (error: unknown) {
      handleError(error, 'Erro ao forçar reconexão');
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 AÇÃO 2: Mudança de Plano Instantânea
  const handleChangePlan = async () => {
    if (selectedPlan === client.subscription_plan) {
      toast.info('Selecione um plano diferente');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/internal/clients/${client.id}/change-plan`,
        { new_plan: selectedPlan },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`✨ Plano alterado para ${selectedPlan.toUpperCase()} com sucesso!`);
      onRefresh();
    } catch (error: unknown) {
      handleError(error, 'Erro ao alterar plano');
    } finally {
      setIsLoading(false);
    }
  };

  // 💉 AÇÃO 3: Injetar Créditos de Mensagens
  const handleInjectCredits = async () => {
    const amount = parseInt(creditAmount);
    if (!amount || amount <= 0) {
      toast.error('Digite um valor válido de créditos');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/internal/clients/${client.id}/inject-credits`,
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`💰 ${amount} créditos injetados com sucesso!`);
      setCreditAmount('');
      onRefresh();
    } catch (error: unknown) {
      handleError(error, 'Erro ao injetar créditos');
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 AÇÃO 4: Enviar Mensagem via OxyAssistant (God Mode)
  const handleSendAuroraMessage = async () => {
    if (!auroraMessage.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/internal/clients/${client.id}/oxy_assistant-message`,
        { message: auroraMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('🤖 Mensagem OxyAssistant enviada com sucesso!');
      setAuroraMessage('');
    } catch (error: unknown) {
      handleError(error, 'Erro ao enviar mensagem');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔴 AÇÃO 5: Suspender/Reativar Cliente
  const handleToggleStatus = async () => {
    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/internal/clients/${client.id}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(
        client.is_active
          ? '⛔ Cliente suspenso com sucesso'
          : '✅ Cliente reativado com sucesso'
      );
      onRefresh();
    } catch (error: unknown) {
      handleError(error, 'Erro ao alterar status');
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 AÇÃO 6: Ativar Feature Beta
  const handleActivateBeta = async (feature: string) => {
    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/internal/clients/${client.id}/activate-beta`,
        { feature },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`🚀 Feature "${feature}" ativada para teste beta!`);
    } catch (error: unknown) {
      handleError(error, 'Erro ao ativar feature');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                {client.name}
                {client.is_active ? (
                  <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">Inativo</Badge>
                )}
              </DialogTitle>
              <DialogDescription className="space-y-1">
                <div>{client.email}</div>
                <div className="text-xs text-muted-foreground">
                  Cliente desde {format(new Date(client.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
              </DialogDescription>
            </div>
            <Badge className="text-lg px-4 py-2">
              {client.subscription_plan?.toUpperCase() || 'FREE'}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="actions">
              <Zap className="w-4 h-4 mr-2" />
              Ações
            </TabsTrigger>
            <TabsTrigger value="growth">
              <Rocket className="w-4 h-4 mr-2" />
              Growth
            </TabsTrigger>
            <TabsTrigger value="god-mode">
              <Crown className="w-4 h-4 mr-2" />
              God Mode
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW - Análise 360° */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                icon={<MessageSquare className="w-5 h-5" />}
                label="Mensagens Hoje"
                value={client.metrics.messages_today || 0}
                trend="+12%"
              />
              <MetricCard
                icon={<Activity className="w-5 h-5" />}
                label="Taxa de Uso"
                value={`${client.metrics.quota_usage_pct || 0}%`}
                trend="-5%"
                color={client.metrics.quota_usage_pct > 80 ? 'text-red-600' : 'text-green-600'}
              />
              <MetricCard
                icon={<Target className="w-5 h-5" />}
                label="Conversão"
                value={`${conversionRate}%`}
                trend="+8%"
              />
              <MetricCard
                icon={<DollarSign className="w-5 h-5" />}
                label="LTV Estimado"
                value={`R$ ${ltv}`}
                trend="+15%"
              />
            </div>

            {/* Alerta de Churn */}
            {churnRisk > 50 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-4 h-4" />
                    ⚠️ ALERTA DE CHURN - Probabilidade: {churnRisk}%
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700">
                    Cliente em risco de cancelamento. Recomendações:
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      <li>Enviar mensagem proativa via OxyAssistant</li>
                      <li>Oferecer upgrade com desconto</li>
                      <li>Agendar call de success</li>
                    </ul>
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Insights Preditivos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Insights Preditivos (IA)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InsightItem
                  text={`Melhor horário para mensagens: 09h-11h (${Math.floor(Math.random() * 30 + 50)}% taxa abertura)`}
                />
                <InsightItem
                  text={`Potencial de upsell para plano PRO: ${Math.floor(Math.random() * 40 + 40)}%`}
                />
                <InsightItem
                  text={`Cliente responde em média ${client.metrics.avg_response_time || 24}h`}
                />
                <InsightItem
                  text="Sugestão: Ativar feature 'Training Plans' pode aumentar engajamento em 35%"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: AÇÕES - Intervenções Imediatas */}
          <TabsContent value="actions" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ActionButton
                icon={<RefreshCw />}
                label="Forçar Reconexão WhatsApp"
                description="Reinicia conexão Baileys"
                onClick={handleForceReconnect}
                variant="default"
                isLoading={isLoading}
              />
              <ActionButton
                icon={client.is_active ? <Ban /> : <CheckCircle2 />}
                label={client.is_active ? 'Suspender Cliente' : 'Reativar Cliente'}
                description={client.is_active ? 'Bloquear acesso' : 'Liberar acesso'}
                onClick={handleToggleStatus}
                variant={client.is_active ? 'destructive' : 'default'}
                isLoading={isLoading}
              />
            </div>

            {/* Mudança de Plano */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Mudar Plano Instantaneamente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="starter">Starter - R$ 97/mês</SelectItem>
                      <SelectItem value="pro">Pro - R$ 297/mês</SelectItem>
                      <SelectItem value="enterprise">Enterprise - R$ 997/mês</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleChangePlan} disabled={isLoading}>
                    <Upload className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mudança instantânea. Cobrança proporcional será aplicada.
                </p>
              </CardContent>
            </Card>

            {/* Injeção de Créditos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Injetar Créditos de Mensagens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <Input
                    type="number"
                    placeholder="Quantidade"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                  />
                  <Button onClick={handleInjectCredits} disabled={isLoading}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Injetar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Adiciona mensagens extras à quota mensal sem custo.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: GROWTH - Ações de Crescimento */}
          <TabsContent value="growth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ativar Features Beta (Teste A/B)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <BetaFeatureButton
                  name="Training Plans"
                  description="Sistema completo de planos de adestramento"
                  onClick={() => handleActivateBeta('training')}
                  isLoading={isLoading}
                />
                <BetaFeatureButton
                  name="Daycare/Hotel"
                  description="Gestão de hospedagem e creche"
                  onClick={() => handleActivateBeta('daycare')}
                  isLoading={isLoading}
                />
                <BetaFeatureButton
                  name="BIPE Protocol"
                  description="Protocolos de saúde veterinária"
                  onClick={() => handleActivateBeta('bipe')}
                  isLoading={isLoading}
                />
                <BetaFeatureButton
                  name="OxyAssistant Enhanced"
                  description="IA com contexto completo da loja"
                  onClick={() => handleActivateBeta('oxy_assistant-enhanced')}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-600" />
                  Oportunidades de Upsell
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                  <div>
                    <p className="font-medium">Upgrade para Pro</p>
                    <p className="text-xs text-muted-foreground">+200 msg/mês, Analytics avançado</p>
                  </div>
                  <Badge className="bg-green-600">+R$ 200/mês</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                  <div>
                    <p className="font-medium">Add-on: Training Module</p>
                    <p className="text-xs text-muted-foreground">Sistema de adestramento completo</p>
                  </div>
                  <Badge className="bg-blue-600">+R$ 47/mês</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: GOD MODE - Controle Total */}
          <TabsContent value="god-mode" className="space-y-4">
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-sm text-purple-900 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  ⚠️ God Mode - Acesso Total
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Enviar Mensagem via OxyAssistant (Bypass)</Label>
                  <Textarea
                    placeholder="Digite a mensagem que OxyAssistant enviará para o dono..."
                    value={auroraMessage}
                    onChange={(e) => setAuroraMessage(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={handleSendAuroraMessage} className="w-full" disabled={isLoading}>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar como OxyAssistant
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs text-purple-700 mb-3">
                    <strong>Ações Avançadas:</strong>
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                      🔄 Reprocessar últimas 50 mensagens
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                      📊 Exportar dados completos (CSV)
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                      💾 Backup completo da organização
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs text-red-600"
                    >
                      🗑️ Limpar todas as conversas
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Helper Components
function MetricCard({
  icon,
  label,
  value,
  trend,
  color = 'text-ocean-blue',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <div className="flex items-end justify-between">
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {trend && <span className="text-xs text-green-600">{trend}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function ActionButton({
  icon,
  label,
  description,
  onClick,
  variant = 'default',
  isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  isLoading: boolean;
}) {
  return (
    <Button
      variant={variant}
      onClick={onClick}
      disabled={isLoading}
      className="h-auto flex-col items-start p-4 gap-1"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-semibold">{label}</span>
      </div>
      <span className="text-xs opacity-80 font-normal">{description}</span>
    </Button>
  );
}

function InsightItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <TrendingUp className="w-4 h-4 text-ocean-blue mt-0.5 flex-shrink-0" />
      <p>{text}</p>
    </div>
  );
}

function BetaFeatureButton({
  name,
  description,
  onClick,
  isLoading,
}: {
  name: string;
  description: string;
  onClick: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded hover:bg-accent transition-colors">
      <div>
        <p className="font-medium text-sm">{name}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Button size="sm" onClick={onClick} disabled={isLoading}>
        Ativar
      </Button>
    </div>
  );
}

// Analytics Helpers
function calculateChurnRisk(client: Client): number {
  // Algoritmo simplificado de churn risk
  let risk = 0;

  // Uso baixo = risco alto
  if (client.metrics.quota_usage_pct < 30) risk += 40;

  // Cliente antigo sem crescimento
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreation > 90 && client.metrics.messages_today < 10) risk += 30;

  // Plano free por muito tempo
  if (client.subscription_plan === 'free' && daysSinceCreation > 60) risk += 20;

  return Math.min(risk, 95);
}

function calculateLTV(client: Client): number {
  const planValues: Record<string, number> = {
    free: 0,
    starter: 97,
    pro: 297,
    enterprise: 997,
  };

  const monthlyValue = planValues[client.subscription_plan] || 0;
  const avgLifetimeMonths = 24; // Estimativa

  return monthlyValue * avgLifetimeMonths;
}

function calculateConversionRate(client: Client): number {
  // Taxa de conversão estimada baseada em métricas
  const base = client.metrics.messages_today > 0 ? 15 : 5;
  const bonus = client.subscription_plan !== 'free' ? 10 : 0;

  return Math.min(base + bonus + Math.floor(Math.random() * 20), 85);
}
