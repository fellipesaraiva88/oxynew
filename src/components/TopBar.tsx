import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationsCenter } from "@/components/NotificationsCenter";
// import { ThemeToggle } from "@/components/ThemeToggle"; // Disabled to keep light theme
import { UserMenu } from "@/components/UserMenu";
import { StatusBadge } from "@/components/StatusBadge";
import { MessageCircle, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export function TopBar() {
  const { user } = useAuth();
  const whatsappInstanceId = (user as any)?.organization?.whatsapp_instance_id;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="flex h-14 md:h-16 items-center gap-3 px-3 md:px-6">
        {/* Left: Menu + Breadcrumbs */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <SidebarTrigger className="h-9 w-9 md:h-10 md:w-10" />
          <div className="hidden lg:block">
            <Breadcrumbs />
          </div>
        </div>

        {/* Center: Search (Desktop) */}
        <div className="hidden md:flex items-center justify-center flex-1 max-w-lg">
          <GlobalSearch />
        </div>

        {/* Right: Status + Actions + User */}
        <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end">
          {/* Status Badges (Hidden on mobile) */}
          <div className="hidden xl:flex items-center gap-2">
            {whatsappInstanceId && (
              <StatusBadge
                status="connected"
                icon={MessageCircle}
                label="WhatsApp"
                pulse
                showDot
              />
            )}
            <StatusBadge
              status="active"
              icon={Bot}
              label="IA Ativa"
              pulse
              showDot
            />
          </div>

          {/* Notifications */}
          <NotificationsCenter />

          {/* Theme Toggle - Disabled to keep light theme */}
          {/* <ThemeToggle /> */}

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>

      {/* Mobile Search (Bottom bar on mobile) */}
      <div className="md:hidden border-t border-border/40 p-2">
        <GlobalSearch />
      </div>
    </motion.header>
  );
}
