import '../../global.css';
import '@/i18n';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import i18n from '@/i18n';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { ToastHost } from '@/components/ui';
import { fontAssets } from '@/constants/fonts';
import { colors } from '@/constants/theme';
import { AuthListener, useAuth } from '@/features/auth/store';
import { useCatalog } from '@/features/catalog/store';
import { NotificationsListener } from '@/features/notifications/store';
import { NetworkListener } from '@/features/offline/store';
import { MyReportsListener } from '@/features/reports/hooks';
import { useSettings } from '@/features/settings/store';
import { UpdateChecker } from '@/features/updates/UpdateChecker';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const hydrated = useSettings((s) => s.hydrated);
  const language = useSettings((s) => s.language);
  const uid = useAuth((s) => s.user?.uid);

  // Keep i18next in sync with the saved language.
  useEffect(() => {
    if (language && i18n.language !== language) i18n.changeLanguage(language);
  }, [language]);

  // Categories/departments: load once a session exists (rules need sign-in).
  useEffect(() => {
    if (uid) useCatalog.getState().load();
  }, [uid]);

  const ready = (fontsLoaded || !!fontError) && hydrated;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthListener />
        <NotificationsListener />
        <MyReportsListener />
        <NetworkListener />
        <UpdateChecker />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.canvas } }}>
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(authority)" options={{ animation: 'fade' }} />
          <Stack.Screen name="report" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="add-info/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
        <OfflineBanner />
        <ToastHost bottom={88} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
