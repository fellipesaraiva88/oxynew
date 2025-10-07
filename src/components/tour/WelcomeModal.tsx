import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, PlayCircle, X } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onStartTour: () => void;
  onSkip: () => void;
}

export function WelcomeModal({ open, onStartTour, onSkip }: WelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onSkip()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <DialogTitle className="text-3xl text-center">
            Bem-vindo ao Oxy! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Você completou a configuração inicial do sistema!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center">
            <p className="text-muted-foreground">
              Que tal fazer um tour rápido para conhecer todas as funcionalidades?
            </p>
            <p className="text-muted-foreground mt-2">
              Levará apenas <strong>2-3 minutos</strong> e você aprenderá a aproveitar 100% do sistema.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { icon: '💬', label: 'Conversas' },
              { icon: '📅', label: 'Agenda' },
              { icon: '👥', label: 'Clientes' },
              { icon: '🤖', label: 'Oxy Assistant' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2 p-3 bg-muted/30 rounded-lg"
              >
                <span className="text-3xl">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onSkip}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Pular e Explorar Sozinho
          </Button>
          <Button
            onClick={onStartTour}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Começar Tour Guiado
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
