import { Redirect, Stack } from 'expo-router';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/store';

export default function ReportLayout() {
  const { user, initializing } = useAuth();
  if (!initializing && !user) return <Redirect href="/(auth)/login" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.canvas } }} />;
}
