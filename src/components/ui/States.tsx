import { useEffect, type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { CircleAlert, type LucideIcon } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { Button } from './Button';
import { Txt } from './Txt';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, body, action, compact }: EmptyStateProps) {
  return (
    <View className={`items-center px-8 ${compact ? 'py-6' : 'py-12'}`}>
      <View className={`mb-5 items-center justify-center rounded-full bg-primary-light ${compact ? 'h-14 w-14' : 'h-20 w-20'}`}>
        <Icon size={compact ? 26 : 36} color={colors.primary} />
      </View>
      <Txt variant="h2" className="text-center text-ink">
        {title}
      </Txt>
      <Txt className="mt-2 max-w-[280px] text-center text-muted">{body}</Txt>
      {action && <View className="mt-6 w-full">{action}</View>}
    </View>
  );
}

interface ErrorStateProps {
  title?: string;
  body?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, body, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <View className="items-center px-8 py-12" accessibilityRole="alert">
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-danger-light">
        <CircleAlert size={36} color={colors.danger} />
      </View>
      <Txt variant="h2" className="text-center text-ink">
        {title ?? t('common.somethingWrong')}
      </Txt>
      <Txt className="mt-2 max-w-[280px] text-center text-muted">{body ?? t('common.somethingWrongBody')}</Txt>
      {onRetry && <Button label={t('common.retry')} variant="secondary" onPress={onRetry} className="mt-6" />}
    </View>
  );
}

/** Pulsing grey block for loading placeholders. */
export function Skeleton({ className = '', style, ...rest }: ViewProps & { className?: string }) {
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  // className (size/shape) goes on a plain View; the pulse is a Reanimated child.
  return (
    <View className={`overflow-hidden rounded-btn ${className}`} style={style} {...rest}>
      <Animated.View style={[{ flex: 1, backgroundColor: colors.line }, animated]} />
    </View>
  );
}

/** Skeleton shaped like a ReportCard. */
export function SkeletonCard() {
  return (
    <View className="flex-row gap-3 rounded-card bg-white p-4" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Skeleton className="h-12 w-12" />
      <View className="flex-1 gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="mt-2 h-6 w-28 rounded-full" />
      </View>
    </View>
  );
}
