import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Calendar,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Dog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Interaction {
  id: string;
  type: "message" | "appointment" | "call" | "email" | "note" | "payment" | "pet_update";
  title: string;
  description: string;
  timestamp: Date;
  status?: "success" | "pending" | "failed";
  metadata?: Record<string, any>;
}

interface ClientInteractionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  clientId: string;
}

// Mock data - Em produção, virá do backend
const generateMockInteractions = (clientId: string): Interaction[] => {
  return [
    {
      id: "1",
      type: "message",
      title: "Mensagem WhatsApp",
      description: "Cliente perguntou sobre horários disponíveis para banho",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: "success",
    },
    {
      id: "2",
      type: "appointment",
      title: "Agendamento Criado",
      description: "Banho para Rex - 15/03/2025 às 14:00",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      status: "success",
      metadata: { petName: "Rex", service: "Banho" },
    },
    {
      id: "3",
      type: "call",
      title: "Ligação Telefônica",
      description: "Confirmação de agendamento - Duração: 3 min",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      status: "success",
    },
    {
      id: "4",
      type: "payment",
      title: "Pagamento Recebido",
      description: "R$ 80,00 - Banho e tosa",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: "success",
      metadata: { amount: 80 },
    },
    {
      id: "5",
      type: "pet_update",
      title: "Patient Cadastrado",
      description: "Novo patient adicionado: Mel (Gato)",
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      status: "success",
      metadata: { petName: "Mel", gender_identity: "Gato" },
    },
    {
      id: "6",
      type: "note",
      title: "Observação Adicionada",
      description: "Cliente prefere horários da tarde",
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    },
    {
      id: "7",
      type: "email",
      title: "Email Enviado",
      description: "Newsletter semanal com promoções",
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      status: "success",
    },
  ];
};

const getInteractionIcon = (type: Interaction["type"]) => {
  const icons = {
    message: MessageSquare,
    appointment: Calendar,
    call: Phone,
    email: Mail,
    note: FileText,
    payment: DollarSign,
    pet_update: Dog,
  };
  return icons[type] || AlertCircle;
};

const getInteractionColor = (type: Interaction["type"]) => {
  const colors = {
    message: "text-blue-500 bg-blue-50",
    appointment: "text-green-500 bg-green-50",
    call: "text-purple-500 bg-purple-50",
    email: "text-orange-500 bg-orange-50",
    note: "text-gray-500 bg-gray-50",
    payment: "text-emerald-500 bg-emerald-50",
    pet_update: "text-pink-500 bg-pink-50",
  };
  return colors[type] || "text-gray-500 bg-gray-50";
};

const getStatusIcon = (status?: Interaction["status"]) => {
  if (!status) return null;
  const icons = {
    success: CheckCircle,
    pending: Clock,
    failed: XCircle,
  };
  const colors = {
    success: "text-green-500",
    pending: "text-yellow-500",
    failed: "text-red-500",
  };
  const Icon = icons[status];
  return <Icon className={cn("w-4 h-4", colors[status])} />;
};

export function ClientInteractionHistory({
  open,
  onOpenChange,
  clientName,
  clientId,
}: ClientInteractionHistoryProps) {
  const [selectedTab, setSelectedTab] = useState("all");
  const interactions = generateMockInteractions(clientId);

  const filteredInteractions =
    selectedTab === "all"
      ? interactions
      : interactions.filter((i) => i.type === selectedTab);

  const groupedByDate = filteredInteractions.reduce((acc, interaction) => {
    const dateKey = format(interaction.timestamp, "dd/MM/yyyy", { locale: ptBR });
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(interaction);
    return acc;
  }, {} as Record<string, Interaction[]>);

  const getTypeLabel = (type: Interaction["type"]) => {
    const labels = {
      message: "Mensagens",
      appointment: "Agendamentos",
      call: "Ligações",
      email: "Emails",
      note: "Observações",
      payment: "Pagamentos",
      pet_update: "Patients",
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Histórico de Interações</DialogTitle>
          <DialogDescription>
            Todas as interações com {clientName}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-8 w-full">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="message">
              <MessageSquare className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="appointment">
              <Calendar className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="call">
              <Phone className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="payment">
              <DollarSign className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="pet_update">
              <Dog className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="note">
              <FileText className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="flex-1 mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {Object.entries(groupedByDate).map(([date, dateInteractions]) => (
                <div key={date} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {date}
                    </Badge>
                    <Separator className="flex-1" />
                  </div>

                  <div className="space-y-3">
                    {dateInteractions.map((interaction) => {
                      const Icon = getInteractionIcon(interaction.type);
                      const colorClass = getInteractionColor(interaction.type);

                      return (
                        <div
                          key={interaction.id}
                          className="flex gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className={cn("p-2 rounded-full h-fit", colorClass)}>
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-medium text-sm">{interaction.title}</h4>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(interaction.status)}
                                <span className="text-xs text-muted-foreground">
                                  {format(interaction.timestamp, "HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground">
                              {interaction.description}
                            </p>

                            {interaction.metadata && (
                              <div className="flex gap-2 mt-2">
                                {Object.entries(interaction.metadata).map(([key, value]) => (
                                  <Badge key={key} variant="secondary" className="text-xs">
                                    {key === "amount" && "R$ "}
                                    {value}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {filteredInteractions.length}{" "}
            {selectedTab === "all" ? "interações" : getTypeLabel(selectedTab as any).toLowerCase()}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
