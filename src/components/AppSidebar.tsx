import {
  Home,
  MessageSquare,
  Calendar,
  Users,
  ShoppingCart,
  Bot,
  Settings,
  Stethoscope,
  GraduationCap,
  Hotel,
  Sparkles,
  MessageCircle
} from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Início", url: "/", icon: Home, dataTour: "sidebar" },
  { title: "Conversas", url: "/conversas", icon: MessageSquare, dataTour: "sidebar-conversas" },
  { title: "Agenda", url: "/agenda", icon: Calendar, dataTour: "sidebar-agenda" },
  { title: "Pacientes", url: "/clientes", icon: Users, dataTour: "sidebar-clientes" },
  { title: "Faturamento", url: "/vendas", icon: ShoppingCart, dataTour: "sidebar-vendas" },
  { title: "Tratamentos", url: "/training-plans", icon: GraduationCap, dataTour: "sidebar-training" },
  { title: "Internações", url: "/daycare", icon: Hotel, dataTour: "sidebar-daycare" },
  { title: "Protocolos", url: "/bipe", icon: Stethoscope, dataTour: "sidebar-bipe" },
  { title: "WhatsApp", url: "/whatsapp", icon: MessageCircle, dataTour: "sidebar-whatsapp" },
  { title: "Oxy Assistant", url: "/oxy_assistant/meet", icon: Sparkles, dataTour: "sidebar-oxy_assistant" },
  { title: "IA", url: "/ia", icon: Bot, dataTour: "sidebar-ia" },
  { title: "Ajustes", url: "/ajustes", icon: Settings, dataTour: "sidebar-ajustes" },
];

export function AppSidebar() {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-4 md:pt-6">
        <div className="px-3 md:px-4 mb-6 md:mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ocean-blue to-sky-blue flex items-center justify-center text-white font-bold">
              O
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-xl md:text-2xl">🏥</span>
            </div>
            {(!isCollapsed || isMobile) && (
              <span className="font-bold text-lg md:text-xl text-sidebar-foreground">Oxy</span>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      data-tour={item.dataTour}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg smooth-transition min-h-[44px] ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {(!isCollapsed || isMobile) && <span className="text-sm md:text-base">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
