import { Pressable, View } from 'react-native';
import { shadows } from '@/constants/theme';
import { Txt } from './Txt';

interface ChipProps {
  label: string;
  selected?: boolean;
  count?: number;
  onPress?: () => void;
  tone?: 'default' | 'floating';
}

export function Chip({ label, selected, count, onPress, tone = 'default' }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={!selected && tone === 'floating' ? shadows.card : undefined}
      className={`h-12 flex-row items-center gap-1.5 rounded-full border px-4 ${selected ? 'border-primary bg-primary' : 'border-line bg-white active:border-primary/40'}`}
    >
      <Txt variant="bodySm" weight="medium" className={selected ? 'text-white' : 'text-ink'}>
        {label}
      </Txt>
      {count !== undefined && (
        <View className={`rounded-full px-1.5 ${selected ? 'bg-white/20' : 'bg-canvas'}`}>
          <Txt variant="caption" weight="semibold" className={selected ? 'text-white' : 'text-muted'}>
            {String(count)}
          </Txt>
        </View>
      )}
    </Pressable>
  );
}
