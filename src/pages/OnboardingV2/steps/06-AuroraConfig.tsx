import { useState } from 'react';
import { motion } from 'framer-motion';
import { MagicButton } from '../components/MagicButton';
import { ConversationalCard } from '../components/ConversationalCard';
import { ArrowRight, Handshake, Brain, TrendingUp, BarChart3, PartyPopper } from 'lucide-react';
import { OnboardingData } from '../OnboardingV2';
import { Card, CardContent } from '@/components/ui/card';

interface AuroraConfigProps {
  data: OnboardingData;
  onComplete: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  loading: boolean;
}

const AURORA_PERSONALITIES = [
  {
    id: 'parceira-proxima',
    title: 'Parceira Próxima',
    icon: Handshake,
    description: 'Direta e próxima, como sua sócia',
    example: 'E aí! Vi que tivemos 10 agendamentos hoje. Bora comemorar? 🎉'
  },
  {
    id: 'consultora-estrategica',
    title: 'Consultora Estratégica',
    icon: Brain,
    description: 'Analítica e focada em dados',
    example: 'Análise do dia: 10 agendamentos (+25% vs ontem). Taxa de conversão: 82%.'
  }
];

const DATA_STYLES = [
  {
    id: 'celebratorio',
    title: 'Celebratório',
    icon: PartyPopper,
    description: 'Parabeniza conquistas'
  },
  {
    id: 'analitico',
    title: 'Analítico',
    icon: BarChart3,
    description: 'Foco em métricas'
  },
  {
    id: 'proativo',
    title: 'Proativo',
    icon: TrendingUp,
    description: 'Sugere ações'
  }
];

export function AuroraConfig({ data, onComplete, onBack, loading }: AuroraConfigProps) {
  const [personality, setPersonality] = useState(data.aurora_personality || '');
  const [dataStyle, setDataStyle] = useState(data.data_driven_style || '');

  const handleSubmit = () => {
    onComplete({
      aurora_personality: personality || 'parceira-proxima',
      aurora_tone: personality === 'parceira-proxima' ? 'coleguinha' : 'mentora',
      data_driven_style: dataStyle || 'celebratorio'
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pb-32">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <ConversationalCard from="oxy_assistant">
            <div className="space-y-3">
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Agora vamos falar de NÓS! 👥
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Como você quer que EU (OxyAssistant) converse com VOCÊ?
              </p>
            </div>
          </ConversationalCard>

          <div className="space-y-4">
            <Label className="text-lg font-semibold">Personalidade da OxyAssistant</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AURORA_PERSONALITIES.map((opt) => (
                <motion.div key={opt.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card
                    className={`cursor-pointer transition-all ${
                      personality === opt.id
                        ? 'border-2 border-purple-500 shadow-lg'
                        : 'border border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => setPersonality(opt.id)}
                  >
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          personality === opt.id ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <opt.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{opt.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{opt.description}</p>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-sm italic">
                        "{opt.example}"
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-semibold">Estilo de Dados</Label>
            <div className="grid grid-cols-3 gap-4">
              {DATA_STYLES.map((style) => (
                <Card
                  key={style.id}
                  className={`cursor-pointer transition-all text-center p-4 ${
                    dataStyle === style.id
                      ? 'border-2 border-purple-500'
                      : 'border border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => setDataStyle(style.id)}
                >
                  <style.icon className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-medium text-sm">{style.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{style.description}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <MagicButton variant="outline" onClick={onBack} disabled={loading}>
              Voltar
            </MagicButton>
            <MagicButton
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Finalizar
            </MagicButton>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`block text-sm font-medium ${className}`}>{children}</label>;
}
