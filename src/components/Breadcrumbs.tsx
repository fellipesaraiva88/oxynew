import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const routeLabels: Record<string, string> = {
  "": "Dashboard",
  "conversas": "Conversas",
  "agenda": "Agenda",
  "clientes": "Clientes & Patients",
  "vendas": "Vendas",
  "training-plans": "Adestramento",
  "daycare": "Hospedagem",
  "bipe": "BIPE Protocol",
  "whatsapp": "WhatsApp",
  "oxy_assistant/meet": "OxyAssistant Meet",
  "ia": "IA",
  "ajustes": "Ajustes",
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <nav className="flex items-center gap-2 text-sm">
      <Link to="/" className="flex items-center gap-1.5 hover:text-primary transition-colors">
        <Home className="w-4 h-4" />
        <span className="hidden md:inline font-medium">Oxy</span>
      </Link>

      {pathnames.length > 0 && (
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      )}

      {pathnames.map((pathname, index) => {
        const routePath = pathnames.slice(0, index + 1).join("/");
        const isLast = index === pathnames.length - 1;
        const label = routeLabels[routePath] || pathname;

        return (
          <motion.div
            key={routePath}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-2"
          >
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <>
                <Link
                  to={`/${routePath}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {label}
                </Link>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </>
            )}
          </motion.div>
        );
      })}
    </nav>
  );
}
