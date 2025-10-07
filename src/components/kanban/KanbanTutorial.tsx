import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MousePointer2,
  Move,
  Filter,
  Search,
  Eye,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface KanbanTutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const TUTORIAL_STEPS = [
  {
    title: "Bem-vindo ao Kanban de Clientes! 🎉",
    description: "Gerencie seus clientes de forma visual e intuitiva",
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          O Kanban permite organizar seus clientes em colunas baseadas em diferentes critérios:
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="font-semibold text-blue-700 mb-1">Status</div>
              <div className="text-sm text-blue-600">Novos, Ativos, Inativos, VIP</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="font-semibold text-green-700 mb-1">Interação</div>
              <div className="text-sm text-green-600">Hoje, Semana, Mês, Antigos</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="font-semibold text-purple-700 mb-1">Valor</div>
              <div className="text-sm text-purple-600">Alto, Médio, Baixo, Potencial</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="font-semibold text-orange-700 mb-1">Risco</div>
              <div className="text-sm text-orange-600">Crítico, Atenção, Estável, Fidelizado</div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    title: "Arrastar e Soltar",
    description: "Mova clientes entre colunas facilmente",
    icon: Move,
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border-2 border-dashed border-primary/30">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center">
                <MousePointer2 className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <div className="font-semibold mb-2">Como usar:</div>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">1.</span>
                  Clique e segure no card do cliente
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">2.</span>
                  Arraste até a coluna desejada
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">3.</span>
                  Solte para mover o cliente
                </li>
              </ol>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-blue-600">💡</div>
          <div className="text-sm text-blue-700">
            <strong>Dica:</strong> O sistema atualiza automaticamente as tags e status do cliente!
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Filtros Inteligentes",
    description: "Encontre clientes rapidamente",
    icon: Filter,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Use os filtros para refinar sua visualização:
        </p>
        <div className="space-y-3">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-semibold">Busca Rápida</div>
                  <div className="text-sm text-muted-foreground">
                    Digite nome, telefone ou email
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-green-500" />
                <div>
                  <div className="font-semibold">Filtros Avançados</div>
                  <div className="text-sm text-muted-foreground">
                    Status, tags, patients, agendamentos e mais
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-purple-500">Quick</Badge>
                <div>
                  <div className="font-semibold">Filtros Rápidos</div>
                  <div className="text-sm text-muted-foreground">
                    Novos, Ativos, Com Patients, Alto Valor
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    title: "Ações Rápidas",
    description: "Interaja com clientes diretamente do card",
    icon: MousePointer2,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Cada card de cliente oferece ações rápidas:
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="text-2xl mb-2">💬</div>
            <div className="font-semibold text-green-700">WhatsApp</div>
            <div className="text-xs text-green-600">Envie mensagem direta</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="text-2xl mb-2">📅</div>
            <div className="font-semibold text-blue-700">Agendar</div>
            <div className="text-xs text-blue-600">Criar agendamento</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="text-2xl mb-2">✏️</div>
            <div className="font-semibold text-purple-700">Editar</div>
            <div className="text-xs text-purple-600">Atualizar dados</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold text-orange-700">Histórico</div>
            <div className="text-xs text-orange-600">Ver interações</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Indicadores Visuais",
    description: "Entenda o status dos clientes rapidamente",
    icon: Eye,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Os cards usam cores e ícones para comunicar informações importantes:
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 border-l-4 border-l-green-500 rounded">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <div className="flex-1">
              <div className="font-semibold text-green-700">Barra Verde</div>
              <div className="text-sm text-green-600">Cliente ativo e engajado</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-yellow-50 border-l-4 border-l-yellow-500 rounded">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <div className="flex-1">
              <div className="font-semibold text-yellow-700">Barra Amarela</div>
              <div className="text-sm text-yellow-600">Atenção necessária</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-red-50 border-l-4 border-l-red-500 rounded">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <div className="flex-1">
              <div className="font-semibold text-red-700">Barra Vermelha</div>
              <div className="text-sm text-red-600">Cliente em risco de perda</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-blue-600">⭐</div>
          <div className="text-sm text-blue-700">
            <strong>Badge VIP:</strong> Clientes especiais com atendimento prioritário
          </div>
        </div>
      </div>
    ),
  },
];

export function KanbanTutorial({
  open,
  onOpenChange,
  onComplete,
}: KanbanTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
      onOpenChange(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete?.();
    onOpenChange(false);
  };

  const step = TUTORIAL_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <StepIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{step.title}</DialogTitle>
              <DialogDescription>{step.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-2 mb-4">
          {TUTORIAL_STEPS.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition-all",
                index <= currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step.content}
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleSkip}>
            Pular Tutorial
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                Anterior
              </Button>
            )}
            <Button onClick={handleNext} className="btn-gradient text-white">
              {currentStep < TUTORIAL_STEPS.length - 1 ? (
                <>
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Começar
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

