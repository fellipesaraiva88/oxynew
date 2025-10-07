import { LogOut, Settings, User, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth.service";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export function UserMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    authService.logout();
    toast({
      title: "Logout realizado",
      description: "Até logo! 👋",
    });
    window.location.href = "/login";
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const userName = user?.full_name || "Usuário";
  const userEmail = user?.email || "";
  const initials = getInitials(userName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={undefined} alt={userName} />
            <AvatarFallback className="bg-gradient-to-br from-ocean-blue to-sky-blue text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={undefined} alt={userName} />
                <AvatarFallback className="bg-gradient-to-br from-ocean-blue to-sky-blue text-white font-semibold text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground truncate max-w-[180px]">
                  {userEmail}
                </p>
              </div>
            </div>

            {user?.organization_id && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50"
              >
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  {(user as any)?.organization?.name || "Organização"}
                </span>
              </motion.div>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => navigate("/")}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Meu Perfil</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => navigate("/ajustes")}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Configurações</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
