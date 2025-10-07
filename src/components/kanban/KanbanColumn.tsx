import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientCard } from "./ClientCard";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface KanbanColumnProps {
  column: {
    id: string;
    title: string;
    icon: any;
    color: string;
  };
  items: any[];
  currentView: string;
}

export function KanbanColumn({ column, items, currentView }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      columnId: column.id,
    },
  });

  const Icon = column.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full",
        isOver && "ring-2 ring-primary ring-offset-2 rounded-lg"
      )}
    >
      <Card className="flex flex-col h-[calc(100vh-300px)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg text-white", column.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm font-medium">{column.title}</CardTitle>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {items.length}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-2">
          <ScrollArea className="h-full px-2">
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Icon className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm">Nenhum cliente</p>
                    <p className="text-xs">Arraste clientes para cá</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <ClientCard
                      key={item.id}
                      client={item}
                      columnId={column.id}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}