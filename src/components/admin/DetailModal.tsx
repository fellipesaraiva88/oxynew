import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  data: Record<string, unknown> | null;
}

export function DetailModal({
  isOpen,
  onClose,
  title,
  description,
  data
}: DetailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
          <pre className="text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
