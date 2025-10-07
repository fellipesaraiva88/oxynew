import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Repeat, Rocket } from 'lucide-react';

interface CompletionModalProps {
  open: boolean;
  onClose: () => void;
  onRestart: () => void;
}

export function CompletionModal({ open, onClose, onRestart }: CompletionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <DialogTitle className="text-3xl text-center">
            Parabéns! Tour Completo! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Você conheceu todas as principais funcionalidades do Oxy
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-lg mb-4 text-center">
              Próximos Passos Recomendados
            </h3>
            <div className="space-y-3">
              {[
                { icon: '📱', text: 'Conectar seu WhatsApp' },
                { icon: '👤', text: 'Adicionar seus primeiros clientes' },
                { icon: '📅', text: 'Criar um agendamento teste' },
                { icon: '⚙️', text: 'Configurar os serviços que você oferece' },
              ].map((step, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <span className="text-2xl">{step.icon}</span>
                  <span>{step.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            💡 <strong>Dica:</strong> Você pode rever este tutorial a qualquer momento clicando no botão "?"
            que aparece em cada página.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onRestart}
            className="flex-1"
          >
            <Repeat className="w-4 h-4 mr-2" />
            Rever Tutorial
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Começar a Usar!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
