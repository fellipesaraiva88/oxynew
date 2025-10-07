import { Button } from "@/components/ui/button";
import { CheckCircle2, X, Archive } from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  onMarkResolved: () => void;
  onMarkPending: () => void;
  onArchive: () => void;
  onClear: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onMarkResolved,
  onMarkPending,
  onArchive,
  onClear,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom">
      <div className="bg-gradient-to-r from-ocean-blue to-sky-blue text-white rounded-full shadow-2xl px-6 py-3 flex items-center gap-4">
        <span className="font-semibold">{selectedCount} selecionada(s)</span>
        <div className="h-6 w-px bg-white/30" />
        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:bg-white/20"
          onClick={onMarkResolved}
        >
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Resolver
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:bg-white/20"
          onClick={onMarkPending}
        >
          Marcar Pendente
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:bg-white/20"
          onClick={onArchive}
        >
          <Archive className="w-4 h-4 mr-1" />
          Arquivar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:bg-white/20"
          onClick={onClear}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
