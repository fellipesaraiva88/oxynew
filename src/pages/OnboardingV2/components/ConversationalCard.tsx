import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AuroraAvatar } from './AuroraAvatar';

interface ConversationalCardProps {
  from: 'oxy_assistant' | 'user';
  children: ReactNode;
  delay?: number;
  showAvatar?: boolean;
}

export function ConversationalCard({
  from,
  children,
  delay = 0,
  showAvatar = true
}: ConversationalCardProps) {
  const isAurora = from === 'oxy_assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay,
        ease: 'easeOut',
      }}
      className={`flex gap-3 ${isAurora ? 'flex-row' : 'flex-row-reverse'} mb-4`}
    >
      {/* Avatar */}
      {showAvatar && isAurora && (
        <div className="flex-shrink-0">
          <AuroraAvatar size="sm" animate={false} />
        </div>
      )}

      {/* Message Card */}
      <Card
        className={`max-w-[80%] ${
          isAurora
            ? 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800'
            : 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800'
        }`}
      >
        <CardContent className="p-4">
          {children}
        </CardContent>
      </Card>

      {/* User avatar placeholder */}
      {showAvatar && !isAurora && (
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
          <span className="text-sm">Você</span>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Typing Indicator Component
 */
export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 mb-4"
    >
      <div className="flex-shrink-0">
        <AuroraAvatar size="sm" animate />
      </div>

      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl px-5 py-3 flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-purple-400 rounded-full"
            animate={{
              y: [0, -8, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
