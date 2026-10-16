import { useState } from 'react';
import { Image, Pressable, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { Button, Txt } from '@/components/ui';
import { useSettings } from '@/features/settings/store';

const images = [
  require('../../../assets/images/onboard-snap.jpg'),
  require('../../../assets/images/onboard-report.jpg'),
  require('../../../assets/images/onboard-track.jpg'),
];

export default function Onboarding() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const setOnboarded = useSettings((s) => s.setOnboarded);
  const slides = t('onboarding.slides', { returnObjects: true }) as { title: string; body: string }[];
  const [i, setI] = useState(0);
  const last = i === slides.length - 1;

  const finish = () => {
    setOnboarded(true);
    router.replace('/(auth)/login');
  };

  const imgSize = Math.min(width - 48, 320);

  return (
    <Screen
      className="bg-white"
      header={
        <View className="h-14 flex-row items-center justify-end px-2">
          <Pressable accessibilityRole="button" onPress={finish} className="h-12 justify-center rounded-btn px-4 active:bg-primary-light">
            <Txt weight="semibold" className="text-primary">
              {t('common.skip')}
            </Txt>
          </Pressable>
        </View>
      }
      footer={
        <View className="flex-row items-center gap-3">
          {i > 0 && <Button variant="neutral" label={t('common.back')} onPress={() => setI(i - 1)} className="w-28" />}
          <Button full={i === 0} className={i > 0 ? 'flex-1' : ''} label={last ? t('common.getStarted') : t('common.next')} onPress={() => (last ? finish() : setI(i + 1))} />
        </View>
      }
    >
      <View className="px-6">
        <Animated.View key={i} entering={FadeInRight.duration(220)} exiting={FadeOutLeft.duration(150)}>
          <Image
            source={images[i]}
            accessibilityIgnoresInvertColors
            style={{ width: imgSize, height: imgSize, borderRadius: 24, alignSelf: 'center' }}
            resizeMode="cover"
          />
          <Txt variant="h1" accessibilityRole="header" className="mt-8">
            {slides[i]?.title}
          </Txt>
          <Txt className="mt-3 text-muted">{slides[i]?.body}</Txt>
        </Animated.View>
        <View className="flex-row gap-2 py-6" accessibilityRole="tablist">
          {slides.map((s, idx) => (
            <Pressable
              key={s.title}
              accessibilityRole="tab"
              accessibilityState={{ selected: idx === i }}
              accessibilityLabel={t('onboarding.slideA11y', { n: idx + 1, total: slides.length })}
              onPress={() => setI(idx)}
              hitSlop={12}
              className="h-6 justify-center"
            >
              <View className={`h-2 rounded-full ${idx === i ? 'w-7 bg-primary' : 'w-2 bg-line'}`} />
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
