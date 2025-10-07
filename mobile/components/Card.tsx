import { View, StyleSheet, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ variant = 'default', style, children, ...props }: CardProps) {
  const variantStyles = {
    default: styles.default,
    elevated: styles.elevated,
    outlined: styles.outlined,
  };

  return (
    <View style={[styles.card, variantStyles[variant], style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  default: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  outlined: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
});
