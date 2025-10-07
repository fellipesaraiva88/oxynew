import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Bell, MessageSquare, Zap, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { usePendingBipes, useRespondBipe, useReactivateAI } from "@/hooks/useBipe";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

export function BipeNotifications() {
  const { data: bipes, isLoading: bipesLoading } = usePendingBipes();
  const respondMutation = useRespondBipe();
  const reactivateMutation = useReactivateAI();
  const { toast } = useToast();

  const [selectedBipe, setSelectedBipe] = useState<{
    id: string;
    conversation?: { contact?: { full_name?: string; phone_number?: string } };
    client_question: string;
    conversation_id: string;
  } | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const openResponseDialog = (bipe: typeof selectedBipe) => {
    setSelectedBipe(bipe);
    setResponseText("");
    setIsDialogOpen(true);
  };

  type BipeType = { id: string; status: string; trigger_type: string; conversation?: { contact?: { full_name?: string; phone_number?: string } }; client_question: string; conversation_id: string; handoff_reason?: string; created_at: string };
  const pendingBipes = bipes?.filter((b: BipeType) => b.status === 'pending') || [];
  const aiUnknownBipes = pendingBipes.filter((b: BipeType) => b.trigger_type === 'ai_unknown');
  const handoffBipes = pendingBipes.filter((b: BipeType) => b.trigger_type === 'limit_reached');

  if (bipesLoading) {
    return (
      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="p-6">
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-ocean-blue" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingBipes.length === 0) {
    return null; // Não mostrar nada se não houver BIPEs pendentes
  }

  return (
    <>
      <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500 animate-pulse" />
            <span className="text-orange-700 dark:text-orange-400">
              ⚠️ Você Precisa Agir Agora
            </span>
            <Badge variant="destructive" className="ml-auto">
              {pendingBipes.length} {pendingBipes.length === 1 ? 'Pendente' : 'Pendentes'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* IA Não Sabe - Cenário 1 */}
          {aiUnknownBipes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-400">
                <MessageSquare className="w-4 h-4" />
                IA Precisa de Ajuda ({aiUnknownBipes.length})
              </div>
              {aiUnknownBipes.map((bipe: BipeType) => (
                <div
                  key={bipe.id}
                  className="p-4 border border-orange-200 rounded-lg bg-white dark:bg-gray-900 hover:shadow-md transition-shadow"
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
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                      IA Não Sabe
                    </Badge>
                  </div>

                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                    <p className="text-xs text-muted-foreground mb-1">❓ Pergunta do Cliente:</p>
                    <p className="text-sm font-medium">{bipe.client_question}</p>
                  </div>

                  <Button
                    onClick={() => openResponseDialog(bipe)}
                    size="sm"
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    📝 Responder e Ensinar IA
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Handoffs Ativos - Cenário 2 */}
          {handoffBipes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                <Zap className="w-4 h-4" />
                Atendimento Manual Ativo ({handoffBipes.length})
              </div>
              {handoffBipes.map((bipe: BipeType) => (
                <div
                  key={bipe.id}
                  className="p-4 border border-yellow-200 rounded-lg bg-white dark:bg-gray-900 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-sm">
                        {bipe.conversation?.contact?.full_name || 'Cliente'}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {bipe.conversation?.contact?.phone_number}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-red-100 text-red-800">
                      IA Desativada
                    </Badge>
                  </div>

                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                    <p className="text-xs text-muted-foreground mb-1">⚠️ Motivo:</p>
                    <p className="text-sm font-medium">{bipe.handoff_reason}</p>
                  </div>

                  <div className="flex items-start gap-2 mb-3 text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p>
                      Todas as mensagens deste cliente estão sendo encaminhadas diretamente para você via WhatsApp.
                      Quando resolver, reative a IA.
                    </p>
                  </div>

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

      {/* Dialog - Responder BIPE */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder ao Cliente e Ensinar IA</DialogTitle>
            <DialogDescription>
              Sua resposta será enviada ao cliente e automaticamente salva no banco de conhecimento.
              Da próxima vez que a IA encontrar uma pergunta similar, ela usará sua resposta.
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
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Dica: Seja claro e completo. A IA aprenderá com esta resposta.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleRespondBipe}
                  disabled={respondMutation.isPending || !responseText.trim()}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {respondMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Enviar Resposta e Ensinar IA
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
    </>
  );
}
