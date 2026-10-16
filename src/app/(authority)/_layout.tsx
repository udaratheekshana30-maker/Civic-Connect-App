import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { useTranslation } from 'react-i18next';
import { ChartColumn, ClipboardList, Settings2, User } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { isAuthority, useAuth } from '@/features/auth/store';
import { fontFamily } from '@/constants/fonts';

/** Officer/admin area. Citizens are redirected away; admin-only tab hidden for officers. */
export default function AuthorityLayout() {
  const { t, i18n } = useTranslation();
  const { user, profile, initializing } = useAuth();
  if (!initializing && !user) return <Redirect href="/(auth)/login" />;
  if (profile && !isAuthority(profile.role)) return <Redirect href="/(tabs)" />;
  const isAdmin = profile?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 13, fontFamily: fontFamily((i18n.language as 'en') || 'en', 'medium') },
      }}
    >
      <Tabs.Screen name="queue" options={{ title: t('authority.queue'), tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} /> }} />
      <Tabs.Screen name="analytics" options={{ title: t('authority.analytics'), tabBarIcon: ({ color }) => <ChartColumn size={24} color={color} /> }} />
      <Tabs.Screen name="manage" options={{ title: t('authority.manage'), href: isAdmin ? undefined : null, tabBarIcon: ({ color }) => <Settings2 size={24} color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: t('authority.account'), tabBarIcon: ({ color }) => <User size={24} color={color} /> }} />
    </Tabs>
  );
}
