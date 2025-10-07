import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  User,
  Phone,
  Mail,
  Dog,
  Calendar,
  MessageSquare,
  MoreVertical,
  Edit,
  Trash2,
  Star,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Patient {}

interface Appointment {}

interface Client {
  patients?: Patient[];
  appointments?: Appointment[];
  last_message_at?: string;
  full_name?: string;
  name?: string;
  tags?: string[];
  phone_number?: string;
  phone?: string;
  email?: string;
  messages_count?: number;
}

interface ClientCardProps {
  client: Client;
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
  onViewDetails?: (client: Client) => void;
  onWhatsApp?: (client: Client) => void;
  onSchedule?: (client: Client) => void;
}

export function ClientCard({
  client,
  onEdit,
  onDelete,
  onViewDetails,
  onWhatsApp,
  onSchedule,
}: ClientCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate client metrics
  const totalPets = client.patients?.length || 0;
  const totalBookings = client.appointments?.length || 0;
  const lastInteraction = client.last_message_at
    ? new Date(client.last_message_at)
    : null;

  // Determine client status
  const getClientStatus = () => {
    if (!lastInteraction) return { label: "Novo", color: "bg-blue-500", icon: Clock };
    
    const daysSinceLastInteraction = Math.floor(
      (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastInteraction <= 7) {
      return { label: "Ativo", color: "bg-green-500", icon: CheckCircle2 };
    } else if (daysSinceLastInteraction <= 30) {
      return { label: "Regular", color: "bg-yellow-500", icon: TrendingUp };
    } else {
      return { label: "Inativo", color: "bg-gray-500", icon: AlertCircle };
    }
  };

  const status = getClientStatus();
  const StatusIcon = status.icon;

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="h-full"
    >
      <Card
        className={cn(
          "h-full transition-all duration-300 cursor-pointer overflow-hidden",
          isHovered && "shadow-lg ring-2 ring-primary/20"
        )}
        onClick={() => onViewDetails?.(client)}
      >
        {/* Status Bar */}
        <div className={cn("h-1", status.color)} />

        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="w-12 h-12 ring-2 ring-primary/10">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                  {getInitials(client.full_name || client.name || "?")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">
                  {client.full_name || client.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="gap-1">
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </Badge>
                  {client.tags?.includes("vip") && (
                    <Badge className="gap-1 bg-yellow-500">
                      <Star className="w-3 h-3" />
                      VIP
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(client);
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(client);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span className="truncate">{client.phone_number || client.phone}</span>
            </div>
            {client.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="truncate">{client.email}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center justify-center gap-1 text-primary mb-1">
                      <Dog className="w-4 h-4" />
                      <span className="font-bold text-lg">{totalPets}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Patients</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{totalPets} patient(s) cadastrado(s)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center justify-center gap-1 text-primary mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="font-bold text-lg">{totalBookings}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Agend.</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{totalBookings} agendamento(s)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center justify-center gap-1 text-primary mb-1">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-bold text-lg">
                        {client.messages_count || 0}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">Msgs</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{client.messages_count || 0} mensagem(ns)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Last Interaction */}
          {lastInteraction && (
            <div className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Última interação:{" "}
              {formatDistanceToNow(lastInteraction, {
                addSuffix: true,
                locale: ptBR,
              })}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onWhatsApp?.(client);
              }}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              WhatsApp
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex-1 btn-gradient text-white"
              onClick={(e) => {
                e.stopPropagation();
                onSchedule?.(client);
              }}
            >
              <Calendar className="w-4 h-4 mr-1" />
              Agendar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

