import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react-native';
import { Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useNetwork, useOfflineQueue } from '@/features/offline/store';

/** Global "No internet" strip at the top; mentions queued reports. Mounted in the root layout. */
export function OfflineBanner() {
  const { t } = useTranslation();
  const online = useNetwork((s) => s.online);
  const pending = useOfflineQueue((s) => s.pending.length);
  const insets = useSafeAreaInsets();
  if (online) return null;
  return (
    <Animated.View
      entering={FadeInUp.duration(200)}
      exiting={FadeOutUp.duration(150)}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      // Reanimated view: plain style (NativeWind className isn't applied to it).
      style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 50, backgroundColor: colors.ink, paddingTop: insets.top }}
    >
      <View className="flex-row items-start gap-3 px-4 py-2.5">
        <WifiOff size={20} color="#fff" />
        <Txt variant="bodySm" className="flex-1 text-white">
          <Txt variant="bodySm" weight="semibold" className="text-white">
            {t('offline.title')}
          </Txt>
          {' — '}
          {pending ? t('offline.queued', { count: pending }) : t('offline.body')}
        </Txt>
      </View>
    </Animated.View>
  );
}
