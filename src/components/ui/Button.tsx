import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { Txt } from './Txt';

type Variant = 'primary' | 'secondary' | 'text' | 'danger' | 'dangerOutline' | 'white' | 'neutral';

const box: Record<Variant, string> = {
  primary: 'bg-primary active:bg-primary-dark',
  secondary: 'border-2 border-primary bg-white active:bg-primary-light',
  text: 'active:bg-primary-light',
  danger: 'bg-danger active:bg-danger-dark',
  dangerOutline: 'border-2 border-danger/30 bg-white active:bg-danger-light',
  white: 'bg-white active:bg-primary-light',
  neutral: 'border border-line bg-white active:bg-canvas',
};

const fg: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.primary,
  text: colors.primary,
  danger: colors.white,
  dangerOutline: colors.dangerDark,
  white: colors.primaryDark,
  neutral: colors.ink,
};

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  icon?: LucideIcon;
  size?: 'md' | 'sm';
  full?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({ label, variant = 'primary', icon: Icon, size = 'md', full, loading, disabled, className = '', ...rest }: ButtonProps) {
  const off = !!disabled || !!loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy: !!loading }}
      disabled={off}
      className={`flex-row items-center justify-center gap-2 rounded-btn px-5 ${size === 'md' ? 'min-h-[52px]' : 'min-h-12'} ${box[variant]} ${full ? 'w-full' : ''} ${off ? 'opacity-50' : ''} ${className}`}
      {...rest}
    >
      {loading ? <ActivityIndicator color={fg[variant]} /> : Icon ? <Icon size={20} color={fg[variant]} strokeWidth={2.25} /> : null}
      <Txt variant={size === 'md' ? 'body' : 'bodySm'} weight="semibold" className="text-center" style={{ color: fg[variant] }}>
        {label}
      </Txt>
    </Pressable>
  );
}
