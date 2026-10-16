import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MailCheck } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { Button, Txt, toast } from '@/components/ui';
import { colors } from '@/constants/theme';
import { resetPassword } from '@/services/auth';
import { errorMessage } from '@/services/errors';

export default function ForgotSent() {
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [busy, setBusy] = useState(false);

  const resend = async () => {
    setBusy(true);
    try {
      await resetPassword(email ?? '');
      toast(t('auth.resent'));
    } catch (e) {
      toast(errorMessage(e), { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      className="bg-white"
      contentContainerClassName="items-center px-6 pt-16"
      footer={
        <View className="gap-2">
          <Button full label={t('auth.backToLogin')} onPress={() => router.replace('/(auth)/login')} />
          <Button full variant="text" label={t('auth.resend')} loading={busy} onPress={resend} />
        </View>
      }
    >
      <View className="h-24 w-24 items-center justify-center rounded-full bg-primary-light">
        <MailCheck size={44} color={colors.primary} />
      </View>
      <Txt variant="h1" accessibilityRole="header" className="mt-6 text-center">
        {t('auth.sentTitle')}
      </Txt>
      <Txt className="mt-2 text-center text-muted">{t('auth.sentBody', { email })}</Txt>
      <Txt variant="caption" className="mt-4 text-center text-muted">
        {t('auth.sentSpam')}
      </Txt>
    </Screen>
  );
}
