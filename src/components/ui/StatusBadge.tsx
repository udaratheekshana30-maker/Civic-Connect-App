import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { statuses } from '@/constants/statuses';
import type { StatusKey } from '@/types';
import { Txt } from './Txt';

/** Icon + text, never colour alone. */
export function StatusBadge({ status, size = 'md' }: { status: StatusKey; size?: 'sm' | 'md' }) {
  const { t } = useTranslation();
  const s = statuses[status];
  const Icon = s.icon;
  return (
    <View
      className={`flex-row items-center self-start rounded-full ${size === 'md' ? 'gap-1.5 px-2.5 py-1' : 'gap-1 px-2 py-0.5'}`}
      style={{ backgroundColor: s.tint }}
    >
      <Icon size={size === 'md' ? 14 : 12} color={s.color} strokeWidth={2.5} />
      <Txt variant={size === 'md' ? 'caption' : 'tiny'} weight="semibold" style={{ color: s.text }}>
        {t(`status.${status}.label`)}
      </Txt>
    </View>
  );
}
