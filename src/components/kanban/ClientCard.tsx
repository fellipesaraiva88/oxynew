import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Phone,
  MessageSquare,
  Mail,
  Dog,
  Calendar,
  Star,
  Edit2,
  MoreVertical,
  Clock,
  TrendingUp,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { usePatients } from '@/hooks/usePatients';
import { useToast } from "@/hooks/use-toast";
import { contactsService } from "@/services/contacts.service";
import { ClientTagSelector } from "./ClientTagSelector";
import { ClientInteractionHistory } from "./ClientInteractionHistory";

interface ClientCardProps {
  client: any;
  isDragging?: boolean;
  columnId?: string;
}

export function ClientCard({ client, isDragging = false, columnId }: ClientCardProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { patients } = usePatients(client.id);
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editData, setEditData] = useState({
    full_name: client.full_name || client.name || "",
    email: client.email || "",
  });

  // Configuração do drag and drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: client.id,
    data: {
      type: "client",
      client,
      columnId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Calcular métricas do cliente
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(client.created_at || client.createdAt).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const isNew = daysSinceCreation <= 7;
  const isActive = client.is_active !== false;
  const petsCount = patients?.length || 0;

  // Score de engajamento (mock por enquanto)
  const engagementScore = Math.floor(Math.random() * 100);
  const riskLevel = engagementScore < 30 ? "high" : engagementScore < 60 ? "medium" : "low";

  // Handlers
  const handleSaveEdit = async () => {
    try {
      await contactsService.update(client.id, editData);
      setIsEditing(false);
      toast({
        title: "✅ Cliente atualizado!",
        description: "Alterações salvas com sucesso",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Tente novamente",
      });
    }
  };

  const handleWhatsApp = () => {
    const phone = (client.phone_number || client.phone || "").toString();
    const normalized = phone.replace(/\D/g, "");
    if (!normalized) {
      toast({
        variant: "destructive",
        title: "Telefone inválido",
        description: "Este cliente não possui número de WhatsApp cadastrado",
      });
      return;
    }
    const name = encodeURIComponent(client.full_name || client.name || "Cliente");
    navigate(`/conversas?composeTo=${normalized}&name=${name}`);
  };

  const handleEmail = () => {
    if (client.email) {
      window.location.href = `mailto:${client.email}`;
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative",
          (isDragging || isSortableDragging) && "opacity-50"
        )}
      >
        <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
          {/* Header com gradiente baseado no risco */}
          <div
            className={cn(
              "h-1",
              riskLevel === "high"
                ? "bg-gradient-to-r from-red-500 to-orange-500"
                : riskLevel === "medium"
                ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                : "bg-gradient-to-r from-green-500 to-blue-500"
            )}
          />

          <CardContent className="p-4" {...listeners}>
            {/* Header do Card */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editData.full_name}
                      onChange={(e) =>
                        setEditData({ ...editData, full_name: e.target.value })
                      }
                      className="h-8 font-semibold"
                      autoFocus
                    />
                    <Input
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="h-8 text-sm"
                      placeholder="Email"
                    />
                    <div className="flex gap-1">
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4
                      className="font-semibold text-sm mb-1 line-clamp-1"
                      onDoubleClick={() => setIsEditing(true)}
                    >
                      {client.full_name || client.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {client.phone_number || client.phone}
                    </p>
                  </>
                )}
              </div>

              {!isEditing && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowHistory(true)}>
                      <Clock className="w-4 h-4 mr-2" />
                      Histórico
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleWhatsApp}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      WhatsApp
                    </DropdownMenuItem>
                    {client.email && (
                      <DropdownMenuItem onClick={handleEmail}>
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      Arquivar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Badges de Status */}
            <div className="flex flex-wrap gap-1 mb-3">
              {isNew && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">Novo</Badge>
              )}
              {isActive ? (
                <Badge className="bg-green-100 text-green-800 text-xs">Ativo</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-800 text-xs">Inativo</Badge>
              )}
              {petsCount > 0 && (
                <Badge className="bg-purple-100 text-purple-800 text-xs">
                  <Dog className="w-3 h-3 mr-1" />
                  {petsCount}
                </Badge>
              )}
            </div>

            {/* Tags do Cliente */}
            <div className="mb-3">
              <ClientTagSelector contactId={client.id} compact />
            </div>

            {/* Métricas do Cliente */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {daysSinceCreation === 0
                    ? "Hoje"
                    : daysSinceCreation === 1
                    ? "Ontem"
                    : `${daysSinceCreation}d atrás`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp
                  className={cn(
                    "w-3 h-3",
                    engagementScore > 70
                      ? "text-green-600"
                      : engagementScore > 40
                      ? "text-yellow-600"
                      : "text-red-600"
                  )}
                />
                <span className="font-medium">{engagementScore}%</span>
              </div>
            </div>

            {/* Preview dos Patients */}
            {petsCount > 0 && (
              <div className="mb-3 p-2 bg-muted/50 rounded-md">
                <div className="flex items-center gap-1 text-xs">
                  {patients?.slice(0, 3).map((patient: any, idx: number) => (
                    <Badge
                      key={patient.id}
                      variant="secondary"
                      className="text-xs px-1 py-0"
                    >
                      {patient.name}
                    </Badge>
                  ))}
                  {petsCount > 3 && (
                    <span className="text-muted-foreground">+{petsCount - 3}</span>
                  )}
                </div>
              </div>
            )}

            {/* Ações Rápidas */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleWhatsApp();
                }}
              >
                <Phone className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleWhatsApp();
                }}
              >
                <MessageSquare className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  // Implementar agendamento rápido
                }}
              >
                <Calendar className="w-3 h-3" />
              </Button>
            </div>

            {/* Indicador de Risco */}
            {riskLevel === "high" && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-1 text-xs text-red-700">
                  <AlertCircle className="w-3 h-3" />
                  <span>Cliente em risco</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal de Histórico de Interações */}
      <ClientInteractionHistory
        open={showHistory}
        onOpenChange={setShowHistory}
        clientName={client.full_name || client.name}
        clientId={client.id}
      />
    </div>
  );
}
