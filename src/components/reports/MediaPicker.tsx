import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Camera, ImagePlus, X, type LucideIcon } from 'lucide-react-native';
import { Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { pickMedia, type PickSource } from '@/features/media/pickMedia';
import type { LocalMedia } from '@/services/cloudinary';
import { MediaThumb } from './MediaThumb';

interface MediaPickerProps {
  value: LocalMedia[];
  onChange: (m: LocalMedia[]) => void;
  max: number;
}

/** 3-column grid: photo thumbnails with remove buttons + Camera / Gallery tiles. */
export function MediaPicker({ value, onChange, max }: MediaPickerProps) {
  const { t } = useTranslation();
  const remaining = max - value.length;

  const add = async (source: PickSource) => {
    const picked = await pickMedia(source, remaining);
    if (picked.length) onChange([...value, ...picked].slice(0, max));
  };

  const tiles: { source: PickSource; icon: LucideIcon; label: string }[] = [
    { source: 'camera', icon: Camera, label: t('details.takePhoto') },
    { source: 'gallery', icon: ImagePlus, label: t('details.gallery') },
  ];

  return (
    <View className="-mx-1 flex-row flex-wrap">
      {value.map((m, i) => (
        <View key={m.uri + i} className="aspect-square w-1/3 p-1">
          <MediaThumb uri={m.uri} type={m.type} className="h-full w-full" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('details.remove', { n: i + 1 })}
            onPress={() => onChange(value.filter((_, j) => j !== i))}
            hitSlop={8}
            className="absolute right-0 top-0 h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-ink"
          >
            <X size={16} color={colors.white} />
          </Pressable>
        </View>
      ))}
      {remaining > 0 &&
        tiles.map(({ source, icon: Icon, label }, i) => (
          <View key={source} className="aspect-square w-1/3 p-1">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={label}
              onPress={() => add(source)}
              className={`flex-1 items-center justify-center gap-1.5 rounded-btn border-2 border-dashed ${i === 0 ? 'border-primary/40 bg-primary-light/40' : 'border-line bg-white'} active:opacity-70`}
            >
              <Icon size={24} color={i === 0 ? colors.primary : colors.muted} />
              <Txt variant="caption" weight="semibold" className={`text-center ${i === 0 ? 'text-primary' : 'text-muted'}`}>
                {label}
              </Txt>
            </Pressable>
          </View>
        ))}
    </View>
  );
}
