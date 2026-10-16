import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Lock, Mail, UserX } from 'lucide-react-native';
import { Logo } from '@/components/brand/Logo';
import { Screen } from '@/components/layout/Screen';
import { Button, IconButton, TextField, Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { continueAnonymously, signIn } from '@/services/auth';
import { errorMessage } from '@/services/errors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState<'login' | 'anon' | null>(null);
  const pwRef = useRef<TextInput>(null);

  const submit = async () => {
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = t('errors.invalidEmail');
    if (!password) next.password = t('auth.passwordRequired');
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy('login');
    try {
      await signIn(email, password);
      router.replace('/'); // index decides citizen tabs vs authority
    } catch (e) {
      setErrors({ password: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const anonymous = async () => {
    setBusy('anon');
    try {
      await continueAnonymously();
      router.replace('/');
    } catch (e) {
      setErrors({ form: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen className="bg-white" contentContainerClassName="px-4 pb-6 pt-6">
      <Logo size={52} tone="onLight" />
      <Txt variant="h1" accessibilityRole="header" className="mt-6">
        {t('auth.loginTitle')}
      </Txt>
      <Txt className="mt-1 text-muted">{t('auth.loginSubtitle')}</Txt>

      <View className="mt-7 gap-4">
        <TextField
          label={t('auth.email')}
          icon={Mail}
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setErrors((e) => ({ ...e, email: undefined }));
          }}
          error={errors.email}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => pwRef.current?.focus()}
        />
        <View>
          <TextField
            ref={pwRef}
            label={t('auth.password')}
            icon={Lock}
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setErrors((e) => ({ ...e, password: undefined }));
            }}
            error={errors.password}
            secureTextEntry={!show}
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
            right={
              <IconButton
                icon={show ? EyeOff : Eye}
                color={colors.muted}
                size={20}
                accessibilityLabel={show ? t('auth.hidePassword') : t('auth.showPassword')}
                onPress={() => setShow(!show)}
                className="-mr-2"
              />
            }
          />
          <View className="mt-1 flex-row justify-end">
            <Pressable accessibilityRole="link" onPress={() => router.push('/(auth)/forgot')} className="h-11 justify-center px-1">
              <Txt variant="bodySm" weight="semibold" className="text-primary">
                {t('auth.forgot')}
              </Txt>
            </Pressable>
          </View>
        </View>
        <Button full label={t('auth.login')} loading={busy === 'login'} disabled={!!busy} onPress={submit} />
      </View>

      <View className="my-6 flex-row items-center gap-3" importantForAccessibility="no-hide-descendants">
        <View className="h-px flex-1 bg-line" />
        <Txt variant="caption" className="text-muted">
          {t('auth.or')}
        </Txt>
        <View className="h-px flex-1 bg-line" />
      </View>

      <Button full variant="neutral" icon={UserX} label={t('auth.anonymous')} loading={busy === 'anon'} disabled={!!busy} onPress={anonymous} />
      <Txt variant="caption" className="mt-2 text-center text-muted">
        {t('auth.anonymousHint')}
      </Txt>
      {errors.form && (
        <Txt variant="caption" weight="medium" className="mt-2 text-center text-danger-dark" accessibilityLiveRegion="polite">
          {errors.form}
        </Txt>
      )}

      <View className="mt-10 flex-row flex-wrap items-center justify-center">
        <Txt className="text-muted">{t('auth.noAccount')} </Txt>
        <Pressable accessibilityRole="link" onPress={() => router.push('/(auth)/signup')} className="h-11 justify-center">
          <Txt weight="semibold" className="text-primary">
            {t('auth.signUp')}
          </Txt>
        </Pressable>
      </View>
    </Screen>
  );
}
