import { Pressable, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, shadows } from '@/constants/theme';
import type { Language } from '@/types';
import { Txt } from './Txt';

interface Option<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  lang?: Language;
}

interface SegmentedProps<T extends string> {
  options: Option<T>[];
  value: T | null;
  onChange: (v: T) => void;
  accessibilityLabel: string;
}

/** Pill-style single choice (language, text size, severity). */
export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedProps<T>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} className="flex-row gap-1 rounded-btn bg-gray-100 p-1">
      {options.map((o) => {
        const active = value === o.id;
        const Icon = o.icon;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            onPress={() => onChange(o.id)}
            style={active ? shadows.card : undefined}
            className={`min-h-12 flex-1 flex-row items-center justify-center gap-1.5 rounded-[10px] px-1 ${active ? 'bg-white' : ''}`}
          >
            {Icon && <Icon size={16} color={active ? colors.primaryDark : colors.muted} />}
            <Txt variant="bodySm" weight="semibold" lang={o.lang} numberOfLines={1} className={active ? 'text-primary-dark' : 'text-muted'}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
