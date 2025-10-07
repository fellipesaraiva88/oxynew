import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullscreen?: boolean;
}

export function LoadingSpinner({
  size = 'large',
  color = '#8B5CF6',
  text,
  fullscreen = false,
}: LoadingSpinnerProps) {
  const Container = fullscreen ? View : (props: any) => <View {...props} />;

  return (
    <Container style={[styles.container, fullscreen && styles.fullscreen]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
});
