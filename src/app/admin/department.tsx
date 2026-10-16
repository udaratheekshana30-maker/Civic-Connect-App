import { useState } from 'react';
import { Alert } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Mail, MapPin, Phone, Trash2 } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { Button, IconButton, TextField, toast } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/store';
import { useCatalog } from '@/features/catalog/store';
import { deleteDepartment, saveDepartment } from '@/services/catalog';
import { errorMessage } from '@/services/errors';
import type { Department } from '@/types';

export default function EditDepartment() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const role = useAuth((s) => s.profile?.role);
  const { departments, categories, load } = useCatalog();
  const existing = departments.find((d) => d.id === id);
  const [d, setD] = useState<Department>(existing ?? { id: '', name: '', phone: '', email: '', area: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  if (role && role !== 'admin') return <Redirect href="/" />;
  const set = (patch: Partial<Department>) => setD((x) => ({ ...x, ...patch }));

  const save = async () => {
    if (!d.name.trim()) return setError(t('admin.nameRequired'));
    setSaving(true);
    try {
      const newId = d.id || d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      await saveDepartment({ ...d, id: newId, name: d.name.trim() });
      await load();
      toast(t('admin.saved'));
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const inUse = categories.filter((c) => c.departmentId === d.id).length;
  const remove = () => {
    if (inUse) return toast(t('admin.deptInUse', { count: inUse }), { tone: 'error' });
    Alert.alert(t('admin.deleteTitle'), t('admin.deleteBody', { name: d.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDepartment(d.id);
            await load();
            router.back();
          } catch (e) {
            toast(errorMessage(e), { tone: 'error' });
          }
        },
      },
    ]);
  };

  return (
    <Screen
      title={existing ? t('admin.editDepartment') : t('admin.newDepartment')}
      actions={existing ? <IconButton icon={Trash2} color={colors.danger} accessibilityLabel={t('admin.delete')} onPress={remove} /> : undefined}
      contentContainerClassName="gap-4 px-4 pb-6"
      footer={<Button full label={t('common.save')} loading={saving} onPress={save} />}
    >
      <TextField label={t('admin.deptName')} value={d.name} onChangeText={(v) => set({ name: v })} error={error} />
      <TextField label={t('admin.phone')} icon={Phone} value={d.phone} onChangeText={(v) => set({ phone: v })} keyboardType="phone-pad" />
      <TextField label={t('auth.email')} icon={Mail} value={d.email} onChangeText={(v) => set({ email: v })} keyboardType="email-address" autoCapitalize="none" />
      <TextField label={t('admin.area')} icon={MapPin} value={d.area} onChangeText={(v) => set({ area: v })} hint={t('admin.areaHint')} />
    </Screen>
  );
}
