import { Pressable, type PressableProps } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '@/constants/theme';

interface IconButtonProps extends Omit<PressableProps, 'children'> {
  icon: LucideIcon;
  /** required: icon-only buttons must be labelled for screen readers */
  accessibilityLabel: string;
  color?: string;
  size?: number;
  className?: string;
}

export function IconButton({ icon: Icon, color = colors.ink, size = 24, className = '', ...rest }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={4}
      className={`h-12 w-12 items-center justify-center rounded-full active:bg-black/5 ${className}`}
      {...rest}
    >
      <Icon size={size} color={color} />
    </Pressable>
  );
}
