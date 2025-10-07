import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface MagicButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
}

export function MagicButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  type = 'button'
}: MagicButtonProps) {
  const sizeClasses = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-6 text-base',
    lg: 'h-14 px-8 text-lg'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white hover:shadow-lg hover:shadow-purple-500/50 border-0',
    secondary: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/50 border-0',
    outline: 'border-2 border-purple-300 dark:border-purple-700 bg-transparent hover:bg-purple-50 dark:hover:bg-purple-950/30'
  };

  return (
    <motion.div
      className={fullWidth ? 'w-full' : 'inline-block'}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
    >
      <Button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`
          relative overflow-hidden
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${fullWidth ? 'w-full' : ''}
          font-semibold
          transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {/* Shine effect */}
        {!disabled && !loading && variant === 'primary' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: 'linear',
            }}
          />
        )}

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2 justify-center">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando...
            </>
          ) : (
            <>
              {icon && <span className="flex-shrink-0">{icon}</span>}
              {children}
            </>
          )}
        </span>

        {/* Glow effect on hover */}
        {!disabled && !loading && variant === 'primary' && (
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-md"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </Button>
    </motion.div>
  );
}
