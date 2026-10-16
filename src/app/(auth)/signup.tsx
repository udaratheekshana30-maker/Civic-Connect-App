import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Check, Lock, Mail, User } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { Button, TextField, Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { signUp } from '@/services/auth';
import { errorMessage } from '@/services/errors';
import { isValidLkPhone, normalisePhone } from '@/utils/format';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function strength(pw: string) {
  if (pw.length < 8) return 0;
  let s = 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const levels = [
  { key: 'tooShort', bar: 'bg-danger', color: '#B91C1C' },
  { key: 'weak', bar: 'bg-danger', color: '#B91C1C' },
  { key: 'fair', bar: 'bg-warning', color: '#92400E' },
  { key: 'good', bar: 'bg-primary', color: colors.primary },
  { key: 'strong', bar: 'bg-primary', color: colors.primary },
] as const;

type Field = 'name' | 'email' | 'phone' | 'password' | 'confirm' | 'agree';

export default function SignUp() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field | 'form', string>>>({});
  const [busy, setBusy] = useState(false);
  const s = strength(form.password);
  const level = levels[s]!;

  const set = (k: keyof typeof form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined, form: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (form.name.trim().length < 2) e.name = t('auth.nameRequired');
    if (!EMAIL_RE.test(form.email.trim())) e.email = t('errors.invalidEmail');
    if (form.phone && !isValidLkPhone(form.phone)) e.phone = t('auth.phoneInvalid');
    if (form.password.length < 8) e.password = t('auth.passwordMin');
    if (form.confirm !== form.password) e.confirm = t('auth.passwordMismatch');
    if (!agree) e.agree = t('auth.agreeRequired');
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      await signUp(form.name, form.email, form.phone ? `+94${normalisePhone(form.phone)}` : '', form.password);
      router.replace('/');
    } catch (e) {
      const msg = errorMessage(e);
      if ((e as { code?: string }).code === 'auth/email-already-in-use') setErrors({ email: msg });
      else setErrors({ form: msg });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      title={t('auth.createAccount')}
      className="bg-white"
      contentContainerClassName="gap-4 px-4 pb-6 pt-2"
      footer={<Button full label={t('auth.createAccount')} loading={busy} onPress={submit} />}
    >
      <Txt className="text-muted">{t('auth.signUpSubtitle')}</Txt>
      <TextField label={t('auth.fullName')} icon={User} value={form.name} onChangeText={set('name')} error={errors.name} autoComplete="name" textContentType="name" />
      <TextField
        label={t('auth.email')}
        icon={Mail}
        value={form.email}
        onChangeText={set('email')}
        error={errors.email}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextField
        label={t('auth.phoneOptional')}
        prefix="+94"
        value={form.phone}
        onChangeText={set('phone')}
        error={errors.phone}
        hint={t('auth.phoneHint')}
        keyboardType="phone-pad"
        autoComplete="tel"
        placeholder="77 123 4567"
        maxLength={12}
      />
      <View>
        <TextField label={t('auth.password')} icon={Lock} value={form.password} onChangeText={set('password')} error={errors.password} secureTextEntry autoComplete="new-password" />
        {form.password.length > 0 && (
          <View accessible accessibilityLabel={`${t('auth.strength')}: ${t(`auth.levels.${level.key}`)}`}>
            <View className="mt-2 flex-row items-center gap-3">
              <View className="flex-1 flex-row gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} className={`h-1.5 flex-1 rounded-full ${i < s ? level.bar : 'bg-line'}`} />
                ))}
              </View>
              <Txt variant="caption" weight="semibold" style={{ color: level.color }}>
                {t(`auth.levels.${level.key}`)}
              </Txt>
            </View>
            {s < 4 && (
              <Txt variant="caption" className="mt-1 text-muted">
                {t('auth.strengthTip')}
              </Txt>
            )}
          </View>
        )}
      </View>
      <TextField label={t('auth.confirmPassword')} icon={Lock} value={form.confirm} onChangeText={set('confirm')} error={errors.confirm} secureTextEntry autoComplete="new-password" />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agree }}
        onPress={() => {
          setAgree(!agree);
          setErrors((e) => ({ ...e, agree: undefined }));
        }}
        className="flex-row items-start gap-3 py-2"
      >
        <View className={`mt-0.5 h-6 w-6 items-center justify-center rounded-md border-2 ${agree ? 'border-primary bg-primary' : errors.agree ? 'border-danger bg-white' : 'border-gray-400 bg-white'}`}>
          {agree && <Check size={16} color={colors.white} strokeWidth={3} />}
        </View>
        <Txt variant="bodySm" className="flex-1">
          {t('auth.agree')}
        </Txt>
      </Pressable>
      {errors.agree && (
        <Txt variant="caption" weight="medium" className="-mt-3 text-danger-dark">
          {errors.agree}
        </Txt>
      )}
      {errors.form && (
        <Txt variant="bodySm" weight="medium" className="text-center text-danger-dark" accessibilityLiveRegion="polite">
          {errors.form}
        </Txt>
      )}

      <View className="flex-row flex-wrap items-center justify-center">
        <Txt className="text-muted">{t('auth.haveAccount')} </Txt>
        <Pressable accessibilityRole="link" onPress={() => router.back()} className="h-11 justify-center">
          <Txt weight="semibold" className="text-primary">
            {t('auth.login')}
          </Txt>
        </Pressable>
      </View>
    </Screen>
  );
}
