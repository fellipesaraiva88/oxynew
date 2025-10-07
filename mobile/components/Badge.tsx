import { View, Text, StyleSheet, ViewProps } from 'react-native';

interface BadgeProps extends ViewProps {
  text: string | number;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'small' | 'medium' | 'large';
}

export function Badge({ text, variant = 'default', size = 'medium', style, ...props }: BadgeProps) {
  const variantStyles = {
    default: { bg: styles.defaultBg, text: styles.defaultText },
    success: { bg: styles.successBg, text: styles.successText },
    warning: { bg: styles.warningBg, text: styles.warningText },
    danger: { bg: styles.dangerBg, text: styles.dangerText },
    info: { bg: styles.infoBg, text: styles.infoText },
  };

  const sizeStyles = {
    small: { container: styles.small, text: styles.smallText },
    medium: { container: styles.medium, text: styles.mediumText },
    large: { container: styles.large, text: styles.largeText },
  };

  return (
    <View
      style={[
        styles.badge,
        variantStyles[variant].bg,
        sizeStyles[size].container,
        style,
      ]}
      {...props}
    >
      <Text style={[styles.text, variantStyles[variant].text, sizeStyles[size].text]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
  // Variants
  defaultBg: { backgroundColor: '#F3F4F6' },
  defaultText: { color: '#374151' },
  successBg: { backgroundColor: '#D1FAE5' },
  successText: { color: '#065F46' },
  warningBg: { backgroundColor: '#FEF3C7' },
  warningText: { color: '#92400E' },
  dangerBg: { backgroundColor: '#FEE2E2' },
  dangerText: { color: '#991B1B' },
  infoBg: { backgroundColor: '#DBEAFE' },
  infoText: { color: '#1E40AF' },
  // Sizes
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  large: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallText: { fontSize: 10 },
  mediumText: { fontSize: 12 },
  largeText: { fontSize: 14 },
});
