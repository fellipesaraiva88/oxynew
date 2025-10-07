import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { SearchInput } from "@/components/SearchInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MessageSquare, Bot, User, AlertCircle, Phone, Dog, Cat, Send, Sparkles, Clock, CheckCircle2, Loader2, Filter, ArrowLeft, Menu } from "lucide-react";
import { useConversations, useConversation, useConversationMessages, useConversationAIActions } from "@/hooks/useConversations";
import { useWhatsAppInstances, useSendWhatsAppMessage } from "@/hooks/useWhatsApp";
import { useConversationsSocketUpdates } from "@/hooks/useSocket";
import { format } from "date-fns";
import { ConversationFilters } from "@/components/ConversationFilters";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { useToast } from "@/hooks/use-toast";

// Componente para o conteúdo do contexto da IA (reutilizado no Sheet mobile e no sidebar desktop)
const AIContextContent = ({ selectedConversation, aiActions, loadingAIActions }: any) => {
  if (!selectedConversation) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Selecione uma conversa</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50 hover-lift">
        <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-ocean-blue animate-pulse" />
          STATUS
        </p>
        <Badge className={`${
          selectedConversation.status === "active"
            ? "bg-gradient-to-r from-ocean-blue to-sky-blue text-white shadow-lg"
            : selectedConversation.status === "pending"
            ? "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
            : "bg-green-500/20 text-green-600 border-green-500/30"
        }`}>
          {selectedConversation.status === "active"
            ? "IA Respondendo"
            : selectedConversation.status === "pending"
            ? "Aguardando"
            : "Resolvida"}
        </Badge>
      </div>

      <div className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50 hover-lift">
        <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1">
          <User className="w-3 h-3" />
          CLIENTE
        </p>
        <p className="font-semibold mb-2">{selectedConversation.contacts?.full_name || "Desconhecido"}</p>
        <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30">
          {selectedConversation.contacts?.email ? "Cliente Cadastrado" : "Novo Cliente"}
        </Badge>
        {selectedConversation.contacts?.patients && selectedConversation.contacts.patients.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs text-muted-foreground">Patients:</p>
            {selectedConversation.contacts.patients.map((patient: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1 text-xs">
                {patient.gender_identity === 'male'|'female'|'other'|'prefer_not_to_say' ? <Dog className="w-3 h-3" /> : <Cat className="w-3 h-3" />}
                <span>{patient.name} ({patient.age_group})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedConversation.intent && (
        <div className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50 hover-lift">
          <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1">
            🎯 INTENÇÃO DETECTADA
          </p>
          <Badge variant="outline" className="border-ocean-blue/30 text-ocean-blue bg-ocean-blue/5">
            {selectedConversation.intent}
          </Badge>
        </div>
      )}

      <div className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 hover-lift">
        <p className="text-xs font-semibold text-green-600 mb-3 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          AÇÕES DA IA
        </p>
        {loadingAIActions ? (
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
        ) : aiActions.length > 0 ? (
          <div className="space-y-2">
            {aiActions.slice(0, 5).map((action: any, idx: number) => (
              <div
                key={action.id || idx}
                className="flex items-center gap-2 text-xs text-green-600 p-2 rounded-lg bg-green-500/10 slide-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                <div>
                  <span className="font-medium">{action.action_type}</span>
                  {action.result_data && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{JSON.stringify(action.result_data).slice(0, 50)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma ação ainda</p>
        )}
      </div>
    </div>
  );
};

export default function Conversas() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [messageInput, setMessageInput] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<{
    startDate?: Date;
    endDate?: Date;
    serviceType?: string;
  }>({});

  // Compose-to flow from Clientes/ClientesKanban
  const composeTo = useMemo(() => searchParams.get('composeTo') || undefined, [searchParams]);
  const composeName = useMemo(() => searchParams.get('name') || undefined, [searchParams]);
  const [isComposing, setIsComposing] = useState<boolean>(!!composeTo);

  // Enable real-time Socket.io updates
  useConversationsSocketUpdates();

  const { conversations, isLoading: loadingConversations, assumeConversation } = useConversations({
    status: statusFilter,
  });

  const { conversation: selectedConversation, isLoading: loadingConversation } = useConversation(
    selectedConversationId
  );

  const { messages, sendMessage, isSending } = useConversationMessages(selectedConversationId);

  const { aiActions, isLoading: loadingAIActions } = useConversationAIActions(selectedConversationId);

  // WhatsApp instances and direct send for first message
  const { data: instancesData } = useWhatsAppInstances();
  const sendWhatsApp = useSendWhatsAppMessage();

  const filteredConversations = conversations.filter((conv) =>
    conv.contact?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.contact?.phone_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Selecionar automaticamente a primeira conversa
  if (!selectedConversationId && conversations.length > 0 && !loadingConversations) {
    setSelectedConversationId(conversations[0].id);
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Bot className="w-4 h-4 text-ocean-blue animate-pulse" />;
      case "pending":
        return <AlertCircle className="w-4 h-4 text-yellow-500 animate-bounce" />;
      case "resolved":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    // If composing a new conversation (came from Clientes) and no selected conversation yet
    if (!selectedConversationId && isComposing && composeTo) {
      const instanceId = instancesData?.instances?.[0]?.instanceId;
      if (!instanceId) {
        toast({
          variant: 'destructive',
          title: 'WhatsApp não conectado',
          description: 'Conecte seu WhatsApp em Ajustes > WhatsApp',
        });
        return;
      }

      try {
        const result: any = await sendWhatsApp.mutateAsync({
          instanceId,
          to: composeTo,
          text: messageInput,
        });
        const newConvId = result?.conversationId;
        if (newConvId) {
          setSelectedConversationId(newConvId);
          setIsComposing(false);
          setMessageInput("");
          toast({ title: 'Mensagem enviada no WhatsApp' });
        } else {
          toast({ variant: 'destructive', title: 'Não foi possível abrir a conversa' });
        }
      } catch (e: any) {
        toast({
          variant: 'destructive',
          title: 'Erro ao enviar no WhatsApp',
          description: e?.response?.data?.error || 'Tente novamente',
        });
      }
      return;
    }

    if (!selectedConversationId) return;

    // Normal flow: send inside existing conversation
    sendMessage({
      conversationId: selectedConversationId,
      content: messageInput,
    });
    setMessageInput("");
  };

  const toggleConversationSelection = (id: string) => {
    const newSelected = new Set(selectedConversations);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedConversations(newSelected);
  };

  const handleBulkAction = (action: "resolved" | "pending" | "archive") => {
    toast({
      title: `✅ ${selectedConversations.size} conversas atualizadas`,
      description: `Marcadas como ${action === "resolved" ? "resolvidas" : action === "pending" ? "pendentes" : "arquivadas"}`,
    });
    setSelectedConversations(new Set());
  };

  const filteredMessages = messages.filter((m) =>
    messageSearchQuery ? m.content.toLowerCase().includes(messageSearchQuery.toLowerCase()) : true
  );

  // If composeTo provided, try auto-select an existing conversation for this contact
  useEffect(() => {
    if (composeTo && !selectedConversationId && conversations.length > 0) {
      const match = conversations.find((c) => c.contact?.phone_number?.replace(/\D/g, '') === composeTo);
      if (match) {
        setSelectedConversationId(match.id);
        setIsComposing(false);
      }
    }
  }, [composeTo, conversations, selectedConversationId]);

  return (
    <div className="p-3 md:p-4 lg:p-6 max-w-[1800px] mx-auto paw-pattern">
      <PageHeader
        title="Central de Conversas"
        subtitle={
          isComposing && composeTo
            ? `Conversar com ${decodeURIComponent(composeName || '')} (${composeTo})`
            : "Gerencie todas as conversas com clientes em tempo real"
        }
        actions={
          <div className="flex gap-1.5 md:gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="text-xs md:text-sm">
              <Filter className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
              <span className="hidden md:inline">{showFilters ? "Ocultar" : "Filtros"}</span>
            </Button>
            <Button
              className="btn-gradient text-white shadow-lg hover:shadow-xl text-xs md:text-sm"
              size="sm"
              onClick={() => {
                toast({
                  title: "📱 Nova Conversa",
                  description: "Para iniciar uma nova conversa, envie uma mensagem via WhatsApp para seu número de negócio. A conversa aparecerá automaticamente aqui.",
                  duration: 5000,
                });
              }}
            >
              <MessageSquare className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
              <span className="hidden md:inline">Nova Conversa</span>
            </Button>
          </div>
        }
      />

      {/* Filtros Avançados */}
      {showFilters && (
        <div className="mb-6">
          <Card className="card-premium">
            <CardContent className="p-4">
              <ConversationFilters onFilterChange={setAdvancedFilters} />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 lg:gap-6 h-[calc(100vh-180px)] md:h-[calc(100vh-200px)]">
        {/* Filtros e Lista de Conversas */}
        <div className={`lg:col-span-3 space-y-3 md:space-y-4 ${selectedConversationId ? 'hidden lg:block' : 'block'}`}>
          <Card className="card-premium fade-in">
            <CardContent className="p-4">
              <SearchInput
                placeholder="Buscar conversas..."
                value={searchQuery}
                onChange={setSearchQuery}
              />

              <div className="mt-6 space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start hover:bg-ocean-blue/10 hover:text-ocean-blue ${
                    !statusFilter ? "font-medium bg-ocean-blue/5" : ""
                  }`}
                  onClick={() => setStatusFilter(undefined)}
                >
                  <div className="w-2 h-2 rounded-full bg-ocean-blue mr-2 animate-pulse" />
                  Todas
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start hover:bg-ocean-blue/10 ${
                    statusFilter === "active" ? "bg-ocean-blue/5" : ""
                  }`}
                  onClick={() => setStatusFilter("active")}
                >
                  <Bot className="w-4 h-4 mr-2 text-ocean-blue" />
                  IA Respondendo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start hover:bg-yellow-500/10 ${
                    statusFilter === "pending" ? "bg-yellow-500/5" : ""
                  }`}
                  onClick={() => setStatusFilter("pending")}
                >
                  <AlertCircle className="w-4 h-4 mr-2 text-yellow-500" />
                  Aguardando
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start hover:bg-green-500/10 ${
                    statusFilter === "resolved" ? "bg-green-500/5" : ""
                  }`}
                  onClick={() => setStatusFilter("resolved")}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                  Resolvidas
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium flex-1 slide-in">
            <CardContent className="p-3">
              <ScrollArea className="h-[calc(100vh-450px)]">
                {loadingConversations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-ocean-blue animate-spin" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredConversations.map((conv, idx) => (
                      <div
                        key={conv.id}
                        style={{ animationDelay: `${idx * 0.1}s` }}
                        className={`p-4 rounded-xl smooth-transition hover-lift group ${
                          selectedConversationId === conv.id
                            ? "bg-gradient-to-br from-ocean-blue/20 to-sky-blue/10 border-2 border-ocean-blue/40 shadow-lg"
                            : "hover:bg-muted/50 border-2 border-transparent"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={selectedConversations.has(conv.id)}
                            onCheckedChange={() => toggleConversationSelection(conv.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => setSelectedConversationId(conv.id)}
                          >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean-blue to-sky-blue flex items-center justify-center text-white font-semibold shadow-lg">
                              {(conv.contacts?.full_name || "?").charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-sm group-hover:text-ocean-blue transition-colors">
                                {conv.contacts?.full_name || "Desconhecido"}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {format(new Date(conv.last_message_at), "HH:mm")}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {getStatusIcon(conv.status)}
                            {conv.unreadCount > 0 && (
                              <Badge className="bg-gradient-to-r from-ocean-blue to-sky-blue text-white shadow-lg animate-pulse">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {conv.last_message || "Sem mensagens"}
                        </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Ativo */}
        <Card className={`lg:col-span-6 card-premium fade-in ${selectedConversationId ? 'block' : 'hidden lg:block'}`}>
          <CardContent className="p-0 flex flex-col h-full">
            {/* Header do Chat */}
            <div className="p-3 md:p-4 lg:p-6 border-b border-border bg-gradient-to-r from-background to-muted/20">
              {loadingConversation || !selectedConversation ? (
                <div className="flex items-center gap-3 md:gap-4">
                  <Loader2 className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-ocean-blue animate-spin" />
                  <p className="text-sm md:text-base text-muted-foreground">Carregando conversa...</p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3 lg:gap-4 flex-1 min-w-0">
                    {/* Botão Voltar - apenas mobile */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden flex-shrink-0 h-9 w-9"
                      onClick={() => setSelectedConversationId(undefined)}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="w-9 h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-ocean-blue to-sky-blue flex items-center justify-center text-white font-bold text-sm md:text-base lg:text-lg shadow-xl flex-shrink-0">
                      {(selectedConversation.contacts?.full_name || "?").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm md:text-lg lg:text-xl font-display truncate">
                        {selectedConversation.contacts?.full_name || "Desconhecido"}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-1">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{selectedConversation.contacts?.phone_number || "Sem telefone"}</span>
                        {selectedConversation.status === 'active' && (
                          <Badge variant="secondary" className="ml-1 md:ml-2 gap-1 bg-ocean-blue/10 text-ocean-blue border-ocean-blue/20 text-[10px] md:text-xs flex-shrink-0 hidden md:flex">
                            <Sparkles className="w-3 h-3" />
                            <span className="hidden lg:inline">IA Ativa</span>
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Botão Contexto IA - apenas mobile */}
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="lg:hidden flex-shrink-0 h-9 w-9"
                        >
                          <Sparkles className="w-4 h-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-[85%] sm:w-[400px] p-0">
                        <SheetHeader className="p-4 border-b">
                          <SheetTitle className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ocean-blue to-sky-blue flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            Contexto IA
                          </SheetTitle>
                        </SheetHeader>
                        <ScrollArea className="h-[calc(100vh-80px)] p-4">
                          <AIContextContent
                            selectedConversation={selectedConversation}
                            aiActions={aiActions}
                            loadingAIActions={loadingAIActions}
                          />
                        </ScrollArea>
                      </SheetContent>
                    </Sheet>

                    <Button
                      className="btn-gradient text-white shadow-lg text-xs md:text-sm flex-shrink-0 hidden md:flex"
                      size="sm"
                      onClick={() => assumeConversation(selectedConversation.id)}
                    >
                      Assumir
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-3 md:p-4 lg:p-6 bg-gradient-to-b from-background to-muted/10">
              {!selectedConversation ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  {isComposing && composeTo ? (
                    <div className="w-full max-w-xl">
                      <Alert className="text-left">
                        <AlertTitle>Compor mensagem</AlertTitle>
                        <AlertDescription>
                          Você está iniciando um atendimento com {decodeURIComponent(composeName || '')} ({composeTo}).
                          Escreva abaixo e enviarei pelo WhatsApp já dentro da ferramenta.
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <>
                      <MessageSquare className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground" />
                      <p className="text-sm md:text-base text-muted-foreground">Selecione uma conversa para visualizar</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Pesquisa em Mensagens */}
                  <div className="mb-3 md:mb-4">
                    <SearchInput
                      placeholder="Buscar nas mensagens..."
                      value={messageSearchQuery}
                      onChange={setMessageSearchQuery}
                    />
                  </div>
                  <div className="space-y-3 md:space-y-4 lg:space-y-6">
                    {filteredMessages.map((message, idx) => {
                    const isAI = message.sender === "ai";
                    const isAgent = message.sender === "agent";
                    const isUser = message.sender === "user";

                    return isUser ? (
                      <div key={message.id} className="flex gap-2 md:gap-3 lg:gap-4 slide-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                        <div className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <User className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                        </div>
                        <div className="bg-gradient-to-br from-muted/80 to-muted/40 rounded-2xl rounded-tl-none p-3 md:p-3.5 lg:p-4 max-w-[80%] md:max-w-[75%] lg:max-w-[70%] shadow-lg hover:shadow-xl transition-shadow">
                          <p className="text-xs md:text-sm leading-relaxed">{message.content}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground mt-1.5 md:mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(message.timestamp), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div key={message.id} className="flex gap-2 md:gap-3 lg:gap-4 justify-end slide-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                        <div className="bg-gradient-to-br from-ocean-blue to-sky-blue rounded-2xl rounded-tr-none p-3 md:p-3.5 lg:p-4 max-w-[80%] md:max-w-[75%] lg:max-w-[70%] shadow-xl hover:shadow-2xl transition-shadow">
                          <p className="text-xs md:text-sm text-white leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          <p className="text-[10px] md:text-xs text-white/80 mt-1.5 md:mt-2 flex items-center gap-1 justify-end">
                            {format(new Date(message.timestamp), "HH:mm")}
                            <CheckCircle2 className="w-3 h-3" />
                          </p>
                        </div>
                        <div className={`w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-xl ${
                          isAI ? "bg-gradient-to-br from-ocean-blue to-sky-blue pulse-glow" : "bg-gradient-to-br from-purple-600 to-pink-600"
                        }`}>
                          {isAI ? <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" /> : <User className="w-4 h-4 md:w-5 md:h-5 text-white" />}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </>
              )}
            </ScrollArea>

            {/* Input de Mensagem */}
            <div className="p-3 md:p-4 lg:p-6 border-t border-border bg-gradient-to-r from-background to-muted/20">
              <div className="flex gap-2 md:gap-3">
                <Input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={isSending || !selectedConversationId}
                  className="flex-1 px-3 py-2.5 md:px-4 md:py-3 lg:px-5 lg:py-3 text-sm md:text-base rounded-xl border-2 border-border bg-background/50 backdrop-blur-sm focus:border-ocean-blue focus:ring-2 focus:ring-ocean-blue/20 transition-all"
                />
                <Button
                  className="btn-gradient text-white shadow-lg px-3 md:px-4 lg:px-6 min-h-[44px]"
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={isSending || !messageInput.trim() || !selectedConversationId}
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contexto da IA - Desktop apenas */}
        <Card className="hidden lg:block lg:col-span-3 card-premium slide-in" style={{ animationDelay: "0.2s" }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ocean-blue to-sky-blue flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-lg font-display">Contexto IA</h3>
            </div>

            <ScrollArea className="h-[calc(100vh-350px)]">
              <AIContextContent
                selectedConversation={selectedConversation}
                aiActions={aiActions}
                loadingAIActions={loadingAIActions}
              />
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedConversations.size}
        onMarkResolved={() => handleBulkAction("resolved")}
        onMarkPending={() => handleBulkAction("pending")}
        onArchive={() => handleBulkAction("archive")}
        onClear={() => setSelectedConversations(new Set())}
      />
    </div>
  );
}
