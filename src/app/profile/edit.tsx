import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Mail, User } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { Button, TextField, Txt, toast } from '@/components/ui';
import { useAuth } from '@/features/auth/store';
import { errorMessage } from '@/services/errors';
import { updateProfile } from '@/services/users';
import { initials, isValidLkPhone, normalisePhone } from '@/utils/format';

export default function EditProfile() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const profile = useAuth((s) => s.profile);
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ? normalisePhone(profile.phone) : '');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const e: typeof errors = {};
    if (name.trim().length < 2) e.name = t('auth.nameRequired');
    if (phone && !isValidLkPhone(phone)) e.phone = t('auth.phoneInvalid');
    setErrors(e);
    if (Object.keys(e).length || !user) return;
    setSaving(true);
    try {
      await updateProfile(user.uid, { name: name.trim(), phone: phone ? `+94${normalisePhone(phone)}` : '' });
      toast(t('profile.saved'));
      router.back();
    } catch (err) {
      toast(errorMessage(err), { tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title={t('profile.edit')} contentContainerClassName="px-4 pb-6" footer={<Button full label={t('profile.saveChanges')} loading={saving} onPress={save} />}>
      <View className="items-center py-4">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-primary" importantForAccessibility="no">
          <Txt variant="display" lang="en" className="text-white">
            {initials(name)}
          </Txt>
        </View>
      </View>
      <View className="gap-4">
        <TextField label={t('auth.fullName')} icon={User} value={name} onChangeText={(v) => (setName(v), setErrors((x) => ({ ...x, name: undefined })))} error={errors.name} autoComplete="name" />
        <TextField label={t('auth.email')} icon={Mail} value={profile?.email || user?.email || ''} editable={false} hint={t('profile.emailHint')} />
        <TextField
          label={t('auth.phoneOptional')}
          prefix="+94"
          value={phone}
          onChangeText={(v) => (setPhone(v), setErrors((x) => ({ ...x, phone: undefined })))}
          error={errors.phone}
          hint={t('auth.phoneHint')}
          keyboardType="phone-pad"
          placeholder="77 123 4567"
          maxLength={12}
        />
      </View>
    </Screen>
  );
}
