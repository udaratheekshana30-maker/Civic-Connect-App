import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { Txt } from './Txt';

function Segment({ filled }: { filled: boolean }) {
  const style = useAnimatedStyle(() => ({ width: withTiming(filled ? '100%' : '0%', { duration: 300 }) }));
  return (
    <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
      <Animated.View style={[{ height: '100%', borderRadius: 999, backgroundColor: colors.primary }, style]} />
    </View>
  );
}

/** "Step X of 4" header + progress bar for the report flow. */
export function Stepper({ step }: { step: 1 | 2 | 3 | 4 }) {
  const { t } = useTranslation();
  const labels = t('report.steps', { returnObjects: true }) as string[];
  const total = labels.length;
  return (
    <View
      className="px-4 pb-3"
      accessible
      accessibilityLabel={t('report.stepA11y', { step, total, label: labels[step - 1] })}
    >
      <View className="mb-2 flex-row items-baseline justify-between">
        <Txt variant="bodySm" weight="semibold">
          {labels[step - 1]}
        </Txt>
        <Txt variant="caption" weight="medium" className="text-muted">
          {t('report.stepOf', { step, total })}
        </Txt>
      </View>
      <View className="flex-row gap-1.5">
        {labels.map((l, i) => (
          <Segment key={l} filled={i < step} />
        ))}
      </View>
    </View>
  );
}
