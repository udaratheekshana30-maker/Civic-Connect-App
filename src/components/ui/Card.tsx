import { Pressable, View, type PressableProps, type ViewProps } from 'react-native';
import { shadows } from '@/constants/theme';

type CardProps = ViewProps & { className?: string };

export function Card({ className = '', style, ...rest }: CardProps) {
  return <View className={`rounded-card bg-white p-4 ${className}`} style={[shadows.card, style as object]} {...rest} />;
}

type PressableCardProps = PressableProps & { className?: string };

export function PressableCard({ className = '', style, ...rest }: PressableCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={`rounded-card bg-white p-4 active:opacity-90 ${className}`}
      style={[shadows.card, style as object]}
      {...rest}
    />
  );
}
