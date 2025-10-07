import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  MessageSquare,
  Calendar,
  Users,
  ShoppingCart,
  Bot,
  Settings,
  GraduationCap,
  Hotel,
  Stethoscope,
  MessageCircle,
  Sparkles,
  Search,
} from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";

const pages = [
  { title: "Dashboard", icon: Home, url: "/" },
  { title: "Conversas", icon: MessageSquare, url: "/conversas" },
  { title: "Agenda", icon: Calendar, url: "/agenda" },
  { title: "Clientes & Patients", icon: Users, url: "/clientes" },
  { title: "Vendas", icon: ShoppingCart, url: "/vendas" },
  { title: "Adestramento", icon: GraduationCap, url: "/training-plans" },
  { title: "Hospedagem", icon: Hotel, url: "/daycare" },
  { title: "BIPE Protocol", icon: Stethoscope, url: "/bipe" },
  { title: "WhatsApp", icon: MessageCircle, url: "/whatsapp" },
  { title: "OxyAssistant Meet", icon: Sparkles, url: "/oxy_assistant/meet" },
  { title: "IA", icon: Bot, url: "/ia" },
  { title: "Ajustes", icon: Settings, url: "/ajustes" },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Cmd+K or Ctrl+K
  useHotkeys("mod+k", (e) => {
    e.preventDefault();
    setOpen((prevOpen) => !prevOpen);
  });

  const handleSelect = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background/50 backdrop-blur-sm hover:bg-muted/50 transition-colors group w-full max-w-sm"
      >
        <Search className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        <span className="text-sm text-muted-foreground flex-1 text-left">
          Buscar...
        </span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar páginas, clientes, conversas..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

          <CommandGroup heading="Navegação">
            {pages.map((page) => {
              const Icon = page.icon;
              return (
                <CommandItem
                  key={page.url}
                  value={page.title}
                  onSelect={() => handleSelect(page.url)}
                  className="cursor-pointer"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{page.title}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Ações Rápidas">
            <CommandItem className="cursor-pointer">
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Nova Conversa</span>
            </CommandItem>
            <CommandItem className="cursor-pointer">
              <Calendar className="mr-2 h-4 w-4" />
              <span>Novo Agendamento</span>
            </CommandItem>
            <CommandItem className="cursor-pointer">
              <Users className="mr-2 h-4 w-4" />
              <span>Novo Cliente</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
