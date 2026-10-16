import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/brand/Logo';
import { Txt } from '@/components/ui';
import { isAuthority, useAuth } from '@/features/auth/store';
import { useSettings } from '@/features/settings/store';
import { firebaseConfigured } from '@/services/firebase';

/**
 * Splash + router. Decides where to go:
 *  not configured → setup help · first run → language/onboarding ·
 *  signed out → login · officer/admin → authority section · citizen → tabs.
 */
export default function Splash() {
  const { t } = useTranslation();
  const onboarded = useSettings((s) => s.onboarded);
  const { user, profile, initializing, profileSettled } = useAuth();
  const [minTimePassed, setMinTimePassed] = useState(false);
  const x = useSharedValue(-1);

  useEffect(() => {
    x.value = withRepeat(withTiming(3, { duration: 1400, easing: Easing.linear }), -1);
    const timer = setTimeout(() => setMinTimePassed(true), 1000);
    return () => clearTimeout(timer);
  }, [x]);
  const bar = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * 43 }] }));

  // Wait for the profile too, so officers don't flash the citizen tabs.
  const profilePending = !!user && !profileSettled;

  useEffect(() => {
    if (!minTimePassed) return;
    if (!firebaseConfigured) return void router.replace('/setup');
    if (!onboarded) return void router.replace('/(auth)/language');
    if (initializing || profilePending) return;
    if (!user) return void router.replace('/(auth)/login');
    router.replace(isAuthority(profile?.role ?? 'citizen') ? '/(authority)/queue' : '/(tabs)');
  }, [minTimePassed, onboarded, initializing, profilePending, user, profile]);

  return (
    <View className="flex-1 bg-primary" accessible accessibilityLabel={t('splash.a11y')}>
      <StatusBar style="light" />
      <View className="flex-1 items-center justify-center px-10">
        <Animated.View entering={FadeIn.duration(300)}>
          <Logo size={96} />
        </Animated.View>
        <Txt variant="display" className="mt-7 text-white">
          {t('common.appName')}
        </Txt>
        <Txt variant="h2" weight="regular" className="mt-3 text-center text-white/90">
          {t('splash.tagline')}
        </Txt>
      </View>
      <View className="items-center gap-4 pb-12">
        <View className="h-1 w-32 overflow-hidden rounded-full bg-white/25">
          <Animated.View style={[{ height: '100%', width: '33%', borderRadius: 999, backgroundColor: '#fff' }, bar]} />
        </View>
        <Txt variant="caption" className="text-white/85">
          {t('splash.service')}
        </Txt>
      </View>
    </View>
  );
}
