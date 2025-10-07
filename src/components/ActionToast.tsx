import { X, Sparkles } from "lucide-react";
import { useState } from "react";

interface ActionToastProps {
  title: string;
  customerName?: string;
  petName?: string;
  actionDetails?: string;
  onClose?: () => void;
}

export function ActionToast({ 
  title, 
  customerName, 
  petName, 
  actionDetails,
  onClose 
}: ActionToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="glass-card rounded-2xl p-4 min-w-[320px] max-w-md shadow-2xl border-2 border-primary/20">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 rounded-lg p-2">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm">{title}</h4>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-2 text-sm">
          {customerName && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">👤</span>
              <span className="text-foreground font-medium">{customerName}</span>
            </div>
          )}
          {petName && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">🏥</span>
              <span className="text-foreground">{petName}</span>
            </div>
          )}
          {actionDetails && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">📅</span>
              <span className="text-foreground">{actionDetails}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
          <button className="flex-1 text-xs font-medium text-primary hover:underline">
            Ver detalhes
          </button>
          <button 
            onClick={handleClose}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
