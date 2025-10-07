import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MagicButton } from '../components/MagicButton';
import { ConversationalCard, TypingIndicator } from '../components/ConversationalCard';
import { ArrowRight, User, Briefcase, Heart } from 'lucide-react';
import { OnboardingData } from '../OnboardingV2';

interface OwnerProfileProps {
  data: OnboardingData;
  onComplete: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  loading: boolean;
}

export function OwnerProfile({ data, onComplete, onBack, loading }: OwnerProfileProps) {
  const [formData, setFormData] = useState({
    owner_name: data.owner_name || '',
    business_name: '', // Será pego do organization
    business_mission: data.business_mission || ''
  });

  const [showTyping, setShowTyping] = useState(false);
  const [auroraResponse, setAuroraResponse] = useState('');

  // OxyAssistant responde quando o usuário digita o nome
  useEffect(() => {
    if (formData.owner_name && formData.owner_name.length > 2) {
      setShowTyping(true);

      const timer = setTimeout(() => {
        setShowTyping(false);
        setAuroraResponse(`Prazer em te conhecer, ${formData.owner_name}! 👋✨`);
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setAuroraResponse('');
    }
  }, [formData.owner_name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.owner_name) {
      return;
    }

    onComplete(formData);
  };

  const isValid = formData.owner_name.trim().length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pb-32">
      <div className="max-w-3xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* OxyAssistant's Question */}
          <ConversationalCard from="oxy_assistant">
            <div className="space-y-3">
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Antes de tudo, quero te conhecer melhor! 😊
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Vamos começar com o básico...
              </p>
            </div>
          </ConversationalCard>

          {/* Form Card */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl space-y-6"
          >
            {/* Nome do Dono */}
            <div className="space-y-2">
              <Label htmlFor="owner_name" className="flex items-center gap-2 text-base">
                <User className="w-5 h-5 text-purple-500" />
                Como você gosta de ser chamado? *
              </Label>
              <Input
                id="owner_name"
                placeholder="Ex: João, Maria..."
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                className="h-12 text-lg"
                required
                autoFocus
              />
            </div>

            {/* Missão do Negócio */}
            <div className="space-y-2">
              <Label htmlFor="business_mission" className="flex items-center gap-2 text-base">
                <Heart className="w-5 h-5 text-pink-500" />
                Qual é o propósito do seu negócio?
              </Label>
              <Textarea
                id="business_mission"
                placeholder="Ex: Cuidar dos patients como se fossem da nossa família..."
                value={formData.business_mission}
                onChange={(e) => setFormData({ ...formData, business_mission: e.target.value })}
                className="min-h-[100px] text-base resize-none"
                rows={4}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                💡 Isso ajuda a OxyAssistant a entender os valores do seu negócio
              </p>
            </div>
          </motion.form>

          {/* OxyAssistant's Response */}
          {showTyping && <TypingIndicator />}

          {auroraResponse && !showTyping && (
            <ConversationalCard from="oxy_assistant" delay={0.3}>
              <p className="text-lg text-gray-900 dark:text-white">
                {auroraResponse}
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
              disabled={!isValid}
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
