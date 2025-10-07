import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientCardEnhanced } from "./ClientCardEnhanced";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KanbanColumnEnhancedProps {
  column: {
    id: string;
    title: string;
    icon: any;
    color: string;
  };
  items: any[];
  currentView: string;
  totalItems: number;
}

export function KanbanColumnEnhanced({ column, items, currentView, totalItems }: KanbanColumnEnhancedProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      columnId: column.id,
    },
  });

  const Icon = column.icon;
  const percentage = totalItems > 0 ? Math.round((items.length / totalItems) * 100) : 0;

  // Simular crescimento (em produção, viria do backend)
  const growthRate = Math.random() > 0.5 ? Math.round(Math.random() * 20) : -Math.round(Math.random() * 10);

  const getGrowthIcon = () => {
    if (growthRate > 0) return TrendingUp;
    if (growthRate < 0) return TrendingDown;
    return Minus;
  };

  const GrowthIcon = getGrowthIcon();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, type: "spring" }}
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full transition-all duration-300",
        isOver && "ring-4 ring-primary/30 ring-offset-2 rounded-xl scale-[1.02]"
      )}
    >
      <Card className={cn(
        "flex flex-col h-[calc(100vh-300px)] transition-all duration-300 border-2",
        isOver && "border-primary shadow-2xl"
      )}>
        <CardHeader className="pb-3 space-y-3">
          {/* Header Principal */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
                className={cn(
                  "p-2.5 rounded-xl text-white shadow-lg",
                  column.color
                )}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              <div>
                <h3 className="text-sm font-semibold">{column.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {items.length} {items.length === 1 ? "cliente" : "clientes"}
                </p>
              </div>
            </div>

            {/* Badge de contagem com animação */}
            <motion.div
              key={items.length}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
            >
              <Badge
                variant="secondary"
                className="text-base font-bold px-3 py-1 shadow-sm"
              >
                {items.length}
              </Badge>
            </motion.div>
          </div>

          {/* Barra de porcentagem */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">
                {percentage}% do total
              </span>
              <div className={cn(
                "flex items-center gap-1 font-semibold",
                growthRate > 0 && "text-green-600",
                growthRate < 0 && "text-red-600",
                growthRate === 0 && "text-gray-600"
              )}>
                <GrowthIcon className="w-3 h-3" />
                <span>{Math.abs(growthRate)}%</span>
              </div>
            </div>
            <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  column.color
                )}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </motion.div>
            </div>
          </div>

          {/* Drop zone indicator */}
          <AnimatePresence>
            {isOver && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-primary/10 text-primary rounded-lg text-sm font-medium border-2 border-dashed border-primary/50"
              >
                <span>↓ Solte aqui para mover</span>
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 pt-2">
          <ScrollArea className="h-full px-3 pb-3">
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <motion.div
                layout
                className="space-y-3"
              >
                <AnimatePresence mode="popLayout">
                  {items.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-12 text-center"
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                          opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <Icon className="w-16 h-16 text-muted-foreground/20 mb-3" />
                      </motion.div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Nenhum cliente aqui
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        Arraste clientes para esta coluna
                      </p>
                    </motion.div>
                  ) : (
                    items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{
                          delay: index * 0.05,
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                        }}
                        layout
                      >
                        <ClientCardEnhanced
                          client={item}
                          columnId={column.id}
                        />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </motion.div>
            </SortableContext>
          </ScrollArea>
        </CardContent>

        {/* Footer com resumo rápido (opcional) */}
        {items.length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {items.filter((i: any) => i.is_active !== false).length} ativos
              </span>
              <span>
                {items.filter((i: any) => {
                  const days = Math.floor(
                    (Date.now() - new Date(i.created_at || i.createdAt).getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  return days <= 7;
                }).length} novos
              </span>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
