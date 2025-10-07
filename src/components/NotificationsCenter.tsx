import { Bell, Check, MessageSquare, Calendar, AlertCircle, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: "message" | "appointment" | "alert" | "ai";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

// Mock notifications - replace with real data from backend
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "message",
    title: "Nova mensagem de João Silva",
    description: "Olá, gostaria de agendar banho para...",
    time: "Há 5 minutos",
    read: false,
  },
  {
    id: "2",
    type: "ai",
    title: "IA agendou serviço",
    description: "Banho agendado para Rex - 14/10 às 14h",
    time: "Há 10 minutos",
    read: false,
  },
  {
    id: "3",
    type: "appointment",
    title: "Agendamento amanhã",
    description: "Lembre-se: Consulta com Mia às 14h",
    time: "Há 1 hora",
    read: true,
  },
];

const iconMap = {
  message: MessageSquare,
  appointment: Calendar,
  alert: AlertCircle,
  ai: Bot,
};

export function NotificationsCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Badge
                  variant="destructive"
                  className="h-5 min-w-[20px] px-1 text-[10px] font-bold flex items-center justify-center rounded-full"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
          <span className="sr-only">Notificações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 text-xs"
            >
              <Check className="w-3 h-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-1">
              {notifications.map((notification, index) => {
                const Icon = iconMap[notification.type];
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <DropdownMenuItem
                      className={`flex items-start gap-3 p-3 cursor-pointer ${
                        !notification.read ? "bg-muted/50" : ""
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          notification.type === "message"
                            ? "bg-blue-500/10 text-blue-600"
                            : notification.type === "ai"
                            ? "bg-purple-500/10 text-purple-600"
                            : notification.type === "appointment"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-red-500/10 text-red-600"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.time}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </DropdownMenuItem>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <div className="p-2">
          <Button variant="ghost" className="w-full justify-center text-xs">
            Ver todas as notificações
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
