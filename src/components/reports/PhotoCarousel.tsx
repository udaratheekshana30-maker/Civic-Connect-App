import { useState } from 'react';
import { FlatList, Linking, Pressable, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MediaItem } from '@/types';
import { Txt } from '@/components/ui';
import { MediaThumb } from './MediaThumb';

/** Swipeable photos/videos. Tapping a video opens it in the browser/player. */
export function PhotoCarousel({ media, height = 240, inset = 0, label }: { media: MediaItem[]; height?: number; inset?: number; label: string }) {
  const { t } = useTranslation();
  const { width: screen } = useWindowDimensions();
  const width = screen - inset * 2;
  const [index, setIndex] = useState(0);
  if (!media.length) return null;
  return (
    <View>
      <FlatList
        data={media}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(m, i) => m.url + i}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item, index: i }) => (
          <Pressable
            accessibilityRole={item.type === 'video' ? 'button' : 'image'}
            accessibilityLabel={t('issue.photoA11y', { label, n: i + 1, total: media.length })}
            onPress={() => item.type === 'video' && Linking.openURL(item.url)}
            style={{ width, height }}
          >
            <MediaThumb url={item.url} type={item.type} width={Math.round(width * 2)} className="h-full w-full rounded-none" />
          </Pressable>
        )}
      />
      {media.length > 1 && (
        <View className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1">
          <Txt variant="caption" weight="medium" lang="en" className="text-white">
            {index + 1} / {media.length}
          </Txt>
        </View>
      )}
    </View>
  );
}
