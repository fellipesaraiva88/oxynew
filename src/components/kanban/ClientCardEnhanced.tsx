import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Phone,
  MessageSquare,
  Mail,
  Dog,
  Calendar,
  Star,
  Clock,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Zap,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatients } from '@/hooks/usePatients';
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientCardEnhancedProps {
  client: any;
  isDragging?: boolean;
  columnId?: string;
}

export function ClientCardEnhanced({ client, isDragging = false, columnId }: ClientCardEnhancedProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { patients } = usePatients(client.id);
  const [isHovered, setIsHovered] = useState(false);

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

  const daysSinceLastMessage = client.last_message_at
    ? Math.floor(
        (Date.now() - new Date(client.last_message_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const isNew = daysSinceCreation <= 7;
  const isActive = client.is_active !== false;
  const petsCount = patients?.length || 0;

  // Determinar urgência baseada no tempo sem mensagem
  const getUrgencyLevel = () => {
    if (!daysSinceLastMessage) return "none";
    if (daysSinceLastMessage === 0) return "active";
    if (daysSinceLastMessage <= 3) return "low";
    if (daysSinceLastMessage <= 7) return "medium";
    return "high";
  };

  const urgencyLevel = getUrgencyLevel();

  const urgencyConfig = {
    active: { color: "bg-gradient-to-r from-green-400 to-emerald-500", pulse: true, text: "Ativo agora" },
    low: { color: "bg-gradient-to-r from-blue-400 to-cyan-500", pulse: false, text: `Há ${daysSinceLastMessage}d` },
    medium: { color: "bg-gradient-to-r from-yellow-400 to-orange-500", pulse: false, text: `Há ${daysSinceLastMessage}d` },
    high: { color: "bg-gradient-to-r from-red-400 to-rose-500", pulse: true, text: `Há ${daysSinceLastMessage}d` },
    none: { color: "bg-gradient-to-r from-gray-300 to-gray-400", pulse: false, text: "Sem contato" },
  };

  // Handlers
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "🔍 Visualizar Detalhes",
      description: "Abrindo perfil completo do cliente...",
    });
  };

  const handleSchedule = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/agenda?client=${client.id}`);
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ scale: 1.02, y: -2 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={cn(
          "relative group",
          (isDragging || isSortableDragging) && "opacity-40 scale-95"
        )}
      >
        <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-grab active:cursor-grabbing border-2 hover:border-primary/30">
          {/* Barra de urgência no topo */}
          <div className="relative h-2 overflow-hidden">
            <div className={cn("h-full", urgencyConfig[urgencyLevel].color)}>
              {urgencyConfig[urgencyLevel].pulse && (
                <motion.div
                  className="absolute inset-0 bg-white/30"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}
            </div>
          </div>

          <CardContent className="p-4 space-y-3" {...listeners}>
            {/* Header com Avatar e Info */}
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-lg">
                  <AvatarImage src={client.avatar_url || client.photo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white font-semibold">
                    {getInitials(client.full_name || client.name || "?")}
                  </AvatarFallback>
                </Avatar>
              </motion.div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                    {client.full_name || client.name}
                  </h4>
                  {isNew && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                    >
                      <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 text-xs px-2 py-0 shadow-lg">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Novo
                      </Badge>
                    </motion.div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {client.phone_number || client.phone}
                </p>

                {/* Tempo desde última interação */}
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className={cn(
                    "text-xs font-medium",
                    urgencyLevel === "high" && "text-red-600",
                    urgencyLevel === "medium" && "text-yellow-600",
                    urgencyLevel === "low" && "text-blue-600",
                    urgencyLevel === "active" && "text-green-600"
                  )}>
                    {urgencyConfig[urgencyLevel].text}
                  </span>
                </div>
              </div>
            </div>

            {/* Última mensagem preview */}
            {client.last_message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-muted/50 rounded-lg p-2 border border-muted"
              >
                <p className="text-xs text-muted-foreground line-clamp-2 italic">
                  "{client.last_message}"
                </p>
              </motion.div>
            )}

            {/* Badges de Status */}
            <div className="flex flex-wrap gap-1.5">
              {isActive ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Ativo
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                  Inativo
                </Badge>
              )}
              {petsCount > 0 && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                  <Dog className="w-3 h-3 mr-1" />
                  {petsCount} {petsCount === 1 ? "patient" : "patients"}
                </Badge>
              )}
              {client.is_vip && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
                  <Star className="w-3 h-3 mr-1 fill-yellow-500" />
                  VIP
                </Badge>
              )}
            </div>

            {/* Quick Actions - Aparecem no hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex gap-1.5 pt-2 border-t"
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors"
                    onClick={handleWhatsApp}
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                    onClick={handleSchedule}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Agendar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                    onClick={handleViewDetails}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Indicador de patients (preview visual) */}
            {petsCount > 0 && patients && (
              <div className="flex items-center gap-1 pt-2 border-t">
                <div className="flex -space-x-2">
                  {patients.slice(0, 3).map((patient: any, idx: number) => (
                    <motion.div
                      key={patient.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="relative"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold border-2 border-background shadow-sm">
                        {patient.name?.charAt(0).toUpperCase()}
                      </div>
                    </motion.div>
                  ))}
                  {petsCount > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-bold border-2 border-background shadow-sm">
                      +{petsCount - 3}
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground ml-1">
                  {patients.slice(0, 2).map((p: any) => p.name).join(", ")}
                  {petsCount > 2 && "..."}
                </span>
              </div>
            )}
          </CardContent>

          {/* Indicador de drag (pontinhos) */}
          <div className="absolute top-1/2 left-1 -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity">
            <div className="flex flex-col gap-0.5">
              <div className="w-1 h-1 rounded-full bg-muted-foreground" />
              <div className="w-1 h-1 rounded-full bg-muted-foreground" />
              <div className="w-1 h-1 rounded-full bg-muted-foreground" />
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
