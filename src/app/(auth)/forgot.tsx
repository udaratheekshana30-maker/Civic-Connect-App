import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { KeyRound, Mail } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { Button, TextField, Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { resetPassword } from '@/services/auth';
import { errorMessage } from '@/services/errors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Firebase sends a reset LINK by email (SMS codes need the paid plan). */
export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!EMAIL_RE.test(email.trim())) return setError(t('errors.invalidEmail'));
    setBusy(true);
    try {
      await resetPassword(email);
      router.replace({ pathname: '/(auth)/forgot-sent', params: { email: email.trim() } });
    } catch (e) {
      // Don't reveal whether an account exists: treat "user not found" as sent.
      if ((e as { code?: string }).code === 'auth/user-not-found') {
        router.replace({ pathname: '/(auth)/forgot-sent', params: { email: email.trim() } });
      } else setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="" className="bg-white" contentContainerClassName="px-4 pt-4">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-light">
        <KeyRound size={32} color={colors.primary} />
      </View>
      <Txt variant="h1" accessibilityRole="header" className="mt-6">
        {t('auth.forgotTitle')}
      </Txt>
      <Txt className="mt-2 text-muted">{t('auth.forgotBody')}</Txt>
      <View className="mt-8 gap-6">
        <TextField
          label={t('auth.email')}
          icon={Mail}
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setError(undefined);
          }}
          error={error}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          returnKeyType="send"
          onSubmitEditing={submit}
        />
        <Button full label={t('auth.sendLink')} loading={busy} onPress={submit} />
      </View>
      <Pressable accessibilityRole="link" onPress={() => router.back()} className="mt-4 h-12 items-center justify-center">
        <Txt weight="semibold" className="text-primary">
          {t('auth.backToLogin')}
        </Txt>
      </Pressable>
    </Screen>
  );
}
