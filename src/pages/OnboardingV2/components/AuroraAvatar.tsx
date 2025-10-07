import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface AuroraAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export function AuroraAvatar({ size = 'md', animate = true }: AuroraAvatarProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className="relative inline-block">
      {/* Glow effect */}
      {animate && (
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 blur-xl opacity-60 ${sizeClasses[size]}`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Avatar container */}
      <motion.div
        className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 p-1 shadow-2xl`}
        animate={animate ? {
          rotate: [0, 5, -5, 0],
        } : undefined}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Inner circle */}
        <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
          <motion.div
            animate={animate ? {
              scale: [1, 1.1, 1],
            } : undefined}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Sparkles className={`${iconSizes[size]} text-purple-500`} />
          </motion.div>
        </div>
      </motion.div>

      {/* Floating sparkles */}
      {animate && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                x: 0,
                y: 0,
                opacity: 0,
              }}
              animate={{
                x: [0, 20 * (i - 1), 0],
                y: [0, -30, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: 'easeOut',
              }}
              style={{
                left: '50%',
                top: '50%',
              }}
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
            </motion.div>
          ))}
        </>
      )}
    </div>
  );
}
