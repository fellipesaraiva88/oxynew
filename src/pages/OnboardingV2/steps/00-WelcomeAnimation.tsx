import { motion } from 'framer-motion';
import { AuroraAvatar } from '../components/AuroraAvatar';
import { MagicButton } from '../components/MagicButton';
import { Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeAnimationProps {
  onStart: () => void;
}

export function WelcomeAnimation({ onStart }: WelcomeAnimationProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex justify-center"
        >
          <AuroraAvatar size="lg" animate />
        </motion.div>

        {/* Welcome Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-4"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Olá! Sou a OxyAssistant
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300">
            Sua assistente de IA para automatizar o atendimento do seu negócio
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto"
        >
          {[
            {
              icon: '🤖',
              title: 'IA Inteligente',
              desc: 'Atendimento 24/7'
            },
            {
              icon: '💬',
              title: 'WhatsApp Nativo',
              desc: 'Integração completa'
            },
            {
              icon: '📊',
              title: 'Insights Poderosos',
              desc: 'Dados em tempo real'
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1, duration: 0.4 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="space-y-4"
        >
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Vamos nos conhecer em <strong>apenas 5 minutos</strong>? ✨
          </p>

          <MagicButton
            variant="primary"
            size="lg"
            onClick={onStart}
            icon={<Sparkles className="w-5 h-5" />}
          >
            Vamos lá!
            <ArrowRight className="w-5 h-5 ml-2" />
          </MagicButton>
        </motion.div>

        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-purple-400 rounded-full opacity-30"
              initial={{
                x: Math.random() * window.innerWidth,
                y: -20,
              }}
              animate={{
                y: window.innerHeight + 20,
                x: Math.random() * window.innerWidth,
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                delay: i * 0.5,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
