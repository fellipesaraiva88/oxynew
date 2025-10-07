import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MagicButton } from '../components/MagicButton';
import { ConversationalCard } from '../components/ConversationalCard';
import { ArrowRight, Smile, Briefcase, Zap, MessageSquare } from 'lucide-react';
import { OnboardingData } from '../OnboardingV2';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';

interface AIPersonalityProps {
  data: OnboardingData;
  onComplete: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  loading: boolean;
}

const PERSONALITY_OPTIONS = [
  {
    id: 'amigavel',
    title: 'Amigável e Calorosa',
    icon: Smile,
    tone: 'casual',
    emoji_frequency: 'medium',
    preview: 'Oi! 😊 Como posso te ajudar hoje? Estou aqui pra qualquer coisa que você precisar!',
    description: 'Tom amigável, acolhedor e próximo'
  },
  {
    id: 'profissional-caloroso',
    title: 'Profissional Acolhedora',
    icon: Briefcase,
    tone: 'semi-formal',
    emoji_frequency: 'low',
    preview: 'Olá! Como posso ajudar você hoje? Fico feliz em atendê-lo.',
    description: 'Tom profissional mas acessível'
  },
  {
    id: 'energetico',
    title: 'Energia e Descontração',
    icon: Zap,
    tone: 'informal',
    emoji_frequency: 'high',
    preview: 'E aí! 🚀 Bora marcar algo pro seu doguinho? Conta pra mim! 🏥',
    description: 'Tom jovem, energético e descontraído'
  }
];

export function AIPersonality({ data, onComplete, onBack, loading }: AIPersonalityProps) {
  const [selected, setSelected] = useState(data.personality || '');
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [testingPreview, setTestingPreview] = useState(false);

  const selectedOption = PERSONALITY_OPTIONS.find(opt => opt.id === selected);

  const handleTest = async () => {
    if (!testMessage || !selected) return;

    setTestingPreview(true);

    try {
      // Simular resposta da IA
      await new Promise(resolve => setTimeout(resolve, 1500));

      const responses: Record<string, string> = {
        'amigavel': `Oi! 😊 ${testMessage.includes('agendar') ? 'Vou te ajudar a agendar sim! Qual serviço você precisa?' : 'Claro que posso te ajudar com isso! Me conta mais detalhes?'}`,
        'profissional-caloroso': `Olá! ${testMessage.includes('agendar') ? 'Com certeza posso agendar para você. Qual serviço deseja?' : 'Ficou claro. Como posso auxiliá-lo(a)?'}`,
        'energetico': `Opa! 🎉 ${testMessage.includes('agendar') ? 'Bora marcar esse atendimento! Que serviço tu quer? 🏥' : 'Massa! Conta mais! 🚀'}`
      };

      setTestResponse(responses[selected] || 'Como posso ajudar?');
    } finally {
      setTestingPreview(false);
    }
  };

  const handleSubmit = () => {
    if (!selected) return;

    const selectedOpt = PERSONALITY_OPTIONS.find(opt => opt.id === selected);

    onComplete({
      personality: selected,
      tone: selectedOpt?.tone,
      emoji_frequency: selectedOpt?.emoji_frequency,
      empathy_level: 7,
      brazilian_slang: selected === 'energetico'
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
          {/* OxyAssistant's Question */}
          <ConversationalCard from="oxy_assistant">
            <div className="space-y-3">
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Como você quer que a IA converse com seus clientes? 🎙️
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Escolha o tom de voz que mais combina com o seu negócio:
              </p>
            </div>
          </ConversationalCard>

          {/* Personality Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PERSONALITY_OPTIONS.map((option) => (
              <motion.div
                key={option.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`cursor-pointer transition-all ${
                    selected === option.id
                      ? 'border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-lg'
                      : 'border border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  }`}
                  onClick={() => setSelected(option.id)}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selected === option.id
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      <option.icon className="w-6 h-6" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        {option.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {option.description}
                      </p>
                    </div>

                    {/* Preview */}
                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-purple-500 mt-1 flex-shrink-0" />
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                          "{option.preview}"
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Interactive Preview */}
          {selected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-300 dark:border-purple-700 shadow-xl space-y-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Teste ao vivo!</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Digite uma mensagem e veja como a IA responderia
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: Quero agendar um banho"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTest()}
                    className="flex-1"
                  />
                  <MagicButton
                    variant="primary"
                    onClick={handleTest}
                    disabled={!testMessage}
                    loading={testingPreview}
                  >
                    Testar
                  </MagicButton>
                </div>

                {/* Test Response */}
                {testResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-blue-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800"
                  >
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Resposta da IA:
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {testResponse}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* OxyAssistant's Encouragement */}
          {selected && (
            <ConversationalCard from="oxy_assistant" delay={0.3}>
              <p className="text-gray-900 dark:text-white">
                Ótima escolha! <strong>{selectedOption?.title}</strong> vai funcionar muito bem para o seu negócio! ✨
              </p>
            </ConversationalCard>
          )}

          {/* Navigation */}
          <div className="flex gap-3 justify-end pt-4">
            <MagicButton
              variant="outline"
              onClick={onBack}
              disabled={loading}
            >
              Voltar
            </MagicButton>

            <MagicButton
              variant="primary"
              onClick={handleSubmit}
              disabled={!selected}
              loading={loading}
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Próximo
            </MagicButton>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
