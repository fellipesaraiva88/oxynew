import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MagicButton } from '../components/MagicButton';
import { AuroraAvatar } from '../components/AuroraAvatar';
import { CheckCircle, Sparkles, Rocket } from 'lucide-react';
import { OnboardingData } from '../OnboardingV2';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface CompletionMagicProps {
  data: OnboardingData;
  onComplete: () => void;
  onBack: () => void;
  loading: boolean;
}

export function CompletionMagic({ data, onComplete, onBack, loading }: CompletionMagicProps) {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    // Trigger confetti after component mounts
    setTimeout(() => setShowConfetti(true), 500);
  }, []);

  const handleActivate = () => {
    setActivating(true);
    setShowConfetti(true);

    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

      <div className="max-w-3xl w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8"
        >
          {/* OxyAssistant Avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="flex justify-center"
          >
            <AuroraAvatar size="lg" animate />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Tudo pronto, {data.owner_name}! 🎉
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300">
              Sua IA está configurada e pronta para encantar seus clientes!
            </p>
          </motion.div>

          {/* Recap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-2xl space-y-4"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              Resumo da Configuração
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <RecapItem icon={CheckCircle} label="Seu Nome" value={data.owner_name || 'N/A'} />
              <RecapItem
                icon={CheckCircle}
                label="Seus Patients"
                value={data.patients?.length ? `${data.patients.length} patient${data.patients.length > 1 ? 's' : ''}` : 'Nenhum'}
              />
              <RecapItem
                icon={CheckCircle}
                label="Tom da IA"
                value={data.personality === 'amigavel' ? 'Amigável' : data.personality === 'profissional-caloroso' ? 'Profissional' : 'Energético'}
              />
              <RecapItem
                icon={CheckCircle}
                label="Serviços"
                value={data.services?.length ? `${data.services.length} serviços` : 'Nenhum'}
              />
            </div>

            {data.business_mission && (
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Sua Missão:
                </p>
                <p className="text-gray-800 dark:text-gray-200 italic">
                  "{data.business_mission}"
                </p>
              </div>
            )}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-4"
          >
            {!activating ? (
              <>
                <MagicButton
                  variant="primary"
                  size="lg"
                  onClick={handleActivate}
                  icon={<Rocket className="w-6 h-6" />}
                  fullWidth
                >
                  Ativar IA Cliente
                </MagicButton>

                <button
                  onClick={onBack}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  Voltar e ajustar
                </button>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="relative w-32 h-32 mx-auto">
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-800"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500"
                      style={{ borderTopColor: '#a855f7' }}
                    />
                  </motion.div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-purple-500" />
                  </div>
                </div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Ativando sua IA...
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function RecapItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
      <Icon className="w-5 h-5 text-green-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-medium text-gray-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
}
