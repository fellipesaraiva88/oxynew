import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusType = "connected" | "disconnected" | "connecting" | "active" | "idle" | "processing" | "synced" | "syncing" | "error";

interface StatusBadgeProps {
  status: StatusType;
  icon?: LucideIcon;
  label?: string;
  pulse?: boolean;
  spin?: boolean;
  className?: string;
  showDot?: boolean;
}

const statusConfig: Record<StatusType, { color: string; bg: string; text: string }> = {
  connected: {
    color: "bg-green-500",
    bg: "bg-green-500/10",
    text: "text-green-700 dark:text-green-400"
  },
  disconnected: {
    color: "bg-gray-400",
    bg: "bg-gray-400/10",
    text: "text-gray-700 dark:text-gray-400"
  },
  connecting: {
    color: "bg-yellow-500",
    bg: "bg-yellow-500/10",
    text: "text-yellow-700 dark:text-yellow-400"
  },
  active: {
    color: "bg-blue-500",
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400"
  },
  idle: {
    color: "bg-gray-400",
    bg: "bg-gray-400/10",
    text: "text-gray-700 dark:text-gray-400"
  },
  processing: {
    color: "bg-purple-500",
    bg: "bg-purple-500/10",
    text: "text-purple-700 dark:text-purple-400"
  },
  synced: {
    color: "bg-green-500",
    bg: "bg-green-500/10",
    text: "text-green-700 dark:text-green-400"
  },
  syncing: {
    color: "bg-blue-500",
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400"
  },
  error: {
    color: "bg-red-500",
    bg: "bg-red-500/10",
    text: "text-red-700 dark:text-red-400"
  }
};

export function StatusBadge({
  status,
  icon: Icon,
  label,
  pulse = false,
  spin = false,
  className,
  showDot = true
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
        config.bg,
        config.text,
        className
      )}
    >
      {Icon && (
        <motion.div
          animate={spin ? { rotate: 360 } : {}}
          transition={spin ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
        >
          <Icon className="w-3.5 h-3.5" />
        </motion.div>
      )}

      {showDot && (
        <motion.span
          className={cn("w-2 h-2 rounded-full", config.color)}
          animate={pulse ? { scale: [1, 1.3, 1], opacity: [1, 0.8, 1] } : {}}
          transition={pulse ? { duration: 2, repeat: Infinity } : {}}
        />
      )}

      {label && <span>{label}</span>}
    </motion.div>
  );
}
