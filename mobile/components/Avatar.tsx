import { View, Text, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';

interface AvatarProps {
  name?: string;
  imageUrl?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle | ImageStyle;
}

export function Avatar({ name, imageUrl, size = 'medium', style }: AvatarProps) {
  const sizeStyles = {
    small: { width: 32, height: 32, fontSize: 14 },
    medium: { width: 48, height: 48, fontSize: 20 },
    large: { width: 64, height: 64, fontSize: 28 },
    xlarge: { width: 96, height: 96, fontSize: 40 },
  };

  const dimensions = sizeStyles[size];
  const initial = name?.charAt(0).toUpperCase() || '?';

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.avatar, { width: dimensions.width, height: dimensions.height }, style as ImageStyle]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        styles.fallback,
        { width: dimensions.width, height: dimensions.height },
        style as ViewStyle,
      ]}
    >
      <Text style={[styles.initial, { fontSize: dimensions.fontSize }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 9999,
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
