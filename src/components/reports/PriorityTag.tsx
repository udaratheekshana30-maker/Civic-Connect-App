import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Signal, SignalHigh, SignalLow, SignalMedium, type LucideIcon } from 'lucide-react-native';
import { Txt } from '@/components/ui';
import type { Severity } from '@/types';

const map: Record<Severity | 'none', { icon: LucideIcon; color: string }> = {
  high: { icon: SignalHigh, color: '#B91C1C' },
  medium: { icon: SignalMedium, color: '#92400E' },
  low: { icon: SignalLow, color: '#6B7280' },
  none: { icon: Signal, color: '#9CA3AF' },
};

export function PriorityTag({ level }: { level: Severity | null }) {
  const { t } = useTranslation();
  const p = map[level ?? 'none'];
  const Icon = p.icon;
  return (
    <View className="flex-row items-center gap-1.5">
      <Icon size={16} color={p.color} />
      <Txt variant="caption" weight="semibold" style={{ color: p.color }}>
        {t(`severity.${level ?? 'none'}`)}
      </Txt>
    </View>
  );
}
