import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Bell, CheckCircle, MessageSquare, BookOpen, Zap, Loader2, Settings, History, Plus } from "lucide-react";
import { usePendingBipes, useKnowledgeStats, useRespondBipe, useReactivateAI } from "@/hooks/useBipe";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { KnowledgeBaseModal } from "@/components/bipe/KnowledgeBaseModal";
import { BipeFilters, type BipeFilterOptions } from "@/components/bipe/BipeFilters";

export default function BipePanel() {
  const { data: bipes, isLoading: bipesLoading, refetch } = usePendingBipes();
  const { data: kbStats, refetch: refetchKbStats } = useKnowledgeStats();
  const respondMutation = useRespondBipe();
  const reactivateMutation = useReactivateAI();
  const { toast } = useToast();

  const [selectedBipe, setSelectedBipe] = useState<any>(null);
  const [responseText, setResponseText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isKbModalOpen, setIsKbModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "resolved">("pending");
  const [filters, setFilters] = useState<BipeFilterOptions>({
    type: "all",
    status: "all",
    dateRange: "all",
    searchText: "",
  });

  const handleRespondBipe = async () => {
    if (!selectedBipe || !responseText.trim()) {
      toast({
        variant: "destructive",
        title: "Resposta obrigatória",
        description: "Digite a resposta para o cliente",
      });
      return;
    }

    try {
      await respondMutation.mutateAsync({
        bipeId: selectedBipe.id,
        response: responseText,
      });

      toast({
        title: "✅ Resposta enviada!",
        description: "Cliente receberá a resposta e ela foi salva no banco de conhecimento.",
      });

      setIsDialogOpen(false);
      setSelectedBipe(null);
      setResponseText("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao responder",
        description: "Tente novamente",
      });
    }
  };

  const handleReactivateAI = async (conversationId: string) => {
    try {
      await reactivateMutation.mutateAsync(conversationId);
      toast({
        title: "✅ IA Reativada",
        description: "O atendimento voltou ao modo automático",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao reativar IA",
      });
    }
  };

  const openResponseDialog = (bipe: any) => {
    setSelectedBipe(bipe);
    setResponseText("");
    setIsDialogOpen(true);
  };

  // Filter bipes based on filters
  const filteredBipes = (bipes || []).filter((b: any) => {
    // Filter by type
    if (filters.type !== "all" && b.trigger_type !== filters.type) {
      return false;
    }

    // Filter by status
    if (filters.status !== "all" && b.status !== filters.status) {
      return false;
    }

    // Filter by search text
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const matchesClient = b.conversation?.contact?.full_name
        ?.toLowerCase()
        .includes(searchLower);
      const matchesQuestion = b.client_question
        ?.toLowerCase()
        .includes(searchLower);
      if (!matchesClient && !matchesQuestion) {
        return false;
      }
    }

    // Filter by date range
    if (filters.dateRange !== "all") {
      const bipeDate = new Date(b.created_at);
      const now = new Date();

      if (filters.dateRange === "today") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (bipeDate < today) return false;
      } else if (filters.dateRange === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (bipeDate < weekAgo) return false;
      } else if (filters.dateRange === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (bipeDate < monthAgo) return false;
      } else if (filters.dateRange === "custom") {
        if (filters.startDate && bipeDate < filters.startDate) return false;
        if (filters.endDate && bipeDate > filters.endDate) return false;
      }
    }

    return true;
  });

  const pendingBipes = filteredBipes.filter((b: any) => b.status === 'pending');
  const resolvedBipes = filteredBipes.filter((b: any) => b.status === 'resolved');
  const aiUnknownBipes = pendingBipes.filter((b: any) => b.trigger_type === 'ai_unknown');
  const handoffBipes = pendingBipes.filter((b: any) => b.trigger_type === 'limit_reached');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="BIPE Protocol"
          subtitle="Protocolo de Escalação Inteligente - Central de Apoio à IA"
        />
        <Button onClick={() => setIsKbModalOpen(true)} className="gap-2">
          <Settings className="w-4 h-4" />
          Gerenciar Knowledge Base
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="BIPEs Pendentes"
          value={pendingBipes.length}
          icon={Bell}
          trend={{ value: 0, isPositive: true }}
          color="red"
        />
        <StatCard
          title="IA Não Sabe"
          value={aiUnknownBipes.length}
          icon={MessageSquare}
          color="orange"
        />
        <StatCard
          title="Handoffs Ativos"
          value={handoffBipes.length}
          icon={Zap}
          color="yellow"
        />
        <StatCard
          title="Base de Conhecimento"
          value={kbStats?.totalEntries || 0}
          icon={BookOpen}
          trend={{ value: kbStats?.recentlyAdded || 0, isPositive: true }}
          color="green"
        />
      </div>

      {/* Filters */}
      <BipeFilters filters={filters} onChange={setFilters} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            <Bell className="w-4 h-4 mr-2" />
            Pendentes ({pendingBipes.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            <History className="w-4 h-4 mr-2" />
            Resolvidos ({resolvedBipes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {/* BIPEs - IA Não Sabe (Cenário 1) */}
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange-500" />
            BIPEs - IA Precisa de Ajuda ({aiUnknownBipes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bipesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-ocean-blue" />
            </div>
          ) : aiUnknownBipes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum BIPE pendente - IA está respondendo tudo! 🎉
            </p>
          ) : (
            <div className="space-y-4">
              {aiUnknownBipes.map((bipe: any) => (
                <div
                  key={bipe.id}
                  className="p-4 border border-orange-200 rounded-lg bg-orange-50 dark:bg-orange-950/20"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-sm">
                        {bipe.conversation?.contact?.full_name || 'Cliente'}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(bipe.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-orange-100">
                      IA Não Sabe
                    </Badge>
                  </div>

                  <div className="mb-3 p-3 bg-white dark:bg-gray-900 rounded border">
                    <p className="text-xs text-muted-foreground mb-1">❓ Pergunta do Cliente:</p>
                    <p className="text-sm">{bipe.client_question}</p>
                  </div>

                  <Button
                    onClick={() => openResponseDialog(bipe)}
                    size="sm"
                    className="w-full"
                  >
                    📝 Responder Cliente
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Handoffs Ativos (Cenário 2) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Handoffs Ativos - Atendimento Manual ({handoffBipes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {handoffBipes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum handoff ativo no momento
            </p>
          ) : (
            <div className="space-y-4">
              {handoffBipes.map((bipe: any) => (
                <div
                  key={bipe.id}
                  className="p-4 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-950/20"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-sm">
                        {bipe.conversation?.contact?.full_name || 'Cliente'}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Telefone: {bipe.conversation?.contact?.phone_number}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-red-100">
                      IA Desativada
                    </Badge>
                  </div>

                  <div className="mb-3 p-3 bg-white dark:bg-gray-900 rounded border">
                    <p className="text-xs text-muted-foreground mb-1">⚠️ Motivo:</p>
                    <p className="text-sm">{bipe.handoff_reason}</p>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">
                    💬 Todas as mensagens deste cliente estão sendo encaminhadas para você via WhatsApp
                  </p>

                  <Button
                    onClick={() => handleReactivateAI(bipe.conversation_id)}
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={reactivateMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Reativar IA
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Knowledge Base Stats */}
      {kbStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-500" />
              Base de Conhecimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{kbStats.totalEntries}</p>
                <p className="text-xs text-muted-foreground">Total de Entradas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {kbStats.entriesBySource?.bipe || 0}
                </p>
                <p className="text-xs text-muted-foreground">Aprendidas via BIPE</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {kbStats.entriesBySource?.manual || 0}
                </p>
                <p className="text-xs text-muted-foreground">Adicionadas Manualmente</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{kbStats.recentlyAdded}</p>
                <p className="text-xs text-muted-foreground">Últimas 24h</p>
              </div>
            </div>

            {kbStats.mostUsedEntries && kbStats.mostUsedEntries.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3">📊 Mais Utilizadas:</h4>
                <div className="space-y-2">
                  {kbStats.mostUsedEntries.map((entry: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 bg-muted rounded text-xs"
                    >
                      <span className="truncate flex-1">{entry.question}</span>
                      <Badge variant="secondary" className="ml-2">
                        {entry.usageCount}x
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
        </TabsContent>

        {/* Resolved Tab */}
        <TabsContent value="resolved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-green-500" />
                BIPEs Resolvidos ({resolvedBipes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bipesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-ocean-blue" />
                </div>
              ) : resolvedBipes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum BIPE resolvido ainda
                </p>
              ) : (
                <div className="space-y-4">
                  {resolvedBipes.map((bipe: any) => (
                    <div
                      key={bipe.id}
                      className="p-4 border border-green-200 rounded-lg bg-green-50 dark:bg-green-950/20"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-sm">
                            {bipe.conversation?.contact?.full_name || 'Cliente'}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Resolvido {formatDistanceToNow(new Date(bipe.resolved_at || bipe.updated_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-green-100">
                          Resolvido
                        </Badge>
                      </div>

                      <div className="mb-3 p-3 bg-white dark:bg-gray-900 rounded border">
                        <p className="text-xs text-muted-foreground mb-1">❓ Pergunta:</p>
                        <p className="text-sm mb-2">{bipe.client_question}</p>
                        {bipe.owner_response && (
                          <>
                            <p className="text-xs text-muted-foreground mb-1 mt-3">✅ Resposta:</p>
                            <p className="text-sm text-green-700">{bipe.owner_response}</p>
                          </>
                        )}
                      </div>

                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>
                          Tipo: {bipe.trigger_type === 'ai_unknown' ? 'IA Não Sabe' : 'Handoff'}
                        </span>
                        {bipe.added_to_kb && (
                          <Badge variant="outline" className="text-xs">
                            Adicionado à KB
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Knowledge Base Modal */}
      <KnowledgeBaseModal
        isOpen={isKbModalOpen}
        onClose={() => setIsKbModalOpen(false)}
        onSuccess={() => {
          refetchKbStats();
          setIsKbModalOpen(false);
        }}
      />

      {/* Dialog - Responder BIPE */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder ao Cliente</DialogTitle>
            <DialogDescription>
              Sua resposta será enviada ao cliente e salva no banco de conhecimento para uso futuro
              da IA.
            </DialogDescription>
          </DialogHeader>

          {selectedBipe && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded">
                <p className="text-sm font-semibold mb-1">Cliente:</p>
                <p className="text-sm">{selectedBipe.conversation?.contact?.full_name}</p>
              </div>

              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded border border-orange-200">
                <p className="text-sm font-semibold mb-1">❓ Pergunta:</p>
                <p className="text-sm">{selectedBipe.client_question}</p>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">✍️ Sua Resposta:</label>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Digite a resposta correta para o cliente..."
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleRespondBipe}
                  disabled={respondMutation.isPending || !responseText.trim()}
                  className="flex-1"
                >
                  {respondMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Enviar Resposta
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setIsDialogOpen(false)}
                  variant="outline"
                  disabled={respondMutation.isPending}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
