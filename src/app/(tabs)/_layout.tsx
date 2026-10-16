import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { TabBar } from '@/components/layout/TabBar';
import { isAuthority, useAuth } from '@/features/auth/store';

export default function TabsLayout() {
  const { user, profile, initializing } = useAuth();
  if (!initializing && !user) return <Redirect href="/(auth)/login" />;
  if (profile && isAuthority(profile.role)) return <Redirect href="/(authority)/queue" />;

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="my-reports" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
