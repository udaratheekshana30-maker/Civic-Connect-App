import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { Button, Chip, IconButton, TextField, Toggle, Txt, toast } from '@/components/ui';
import { categoryGroups } from '@/constants/categoryGroups';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/store';
import { useCatalog } from '@/features/catalog/store';
import { deleteCategory, saveCategory } from '@/services/catalog';
import { errorMessage } from '@/services/errors';
import type { Category } from '@/types';

const slug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export default function EditCategory() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const role = useAuth((s) => s.profile?.role);
  const { categories, departments, load } = useCatalog();
  const existing = categories.find((c) => c.id === id);
  const [c, setC] = useState<Category>(
    existing ?? {
      id: '',
      group: 'other',
      name_en: '',
      name_si: '',
      name_ta: '',
      subtitle_en: '',
      departmentId: departments[0]?.id ?? '',
      isEmergency: false,
      suggested: false,
      order: categories.length,
    },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  if (role && role !== 'admin') return <Redirect href="/" />;
  const set = (patch: Partial<Category>) => setC((x) => ({ ...x, ...patch }));

  const save = async () => {
    if (!c.name_en.trim()) return setError(t('admin.nameRequired'));
    setSaving(true);
    try {
      await saveCategory({ ...c, id: c.id || slug(c.name_en), name_si: c.name_si || c.name_en, name_ta: c.name_ta || c.name_en });
      await load();
      toast(t('admin.saved'));
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = () =>
    Alert.alert(t('admin.deleteTitle'), t('admin.deleteBody', { name: c.name_en }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory(c.id);
            await load();
            router.back();
          } catch (e) {
            toast(errorMessage(e), { tone: 'error' });
          }
        },
      },
    ]);

  return (
    <Screen
      title={existing ? t('admin.editCategory') : t('admin.newCategory')}
      actions={existing ? <IconButton icon={Trash2} color={colors.danger} accessibilityLabel={t('admin.delete')} onPress={remove} /> : undefined}
      contentContainerClassName="gap-4 px-4 pb-6"
      footer={<Button full label={t('common.save')} loading={saving} onPress={save} />}
    >
      <TextField label="Name (English)" value={c.name_en} onChangeText={(v) => set({ name_en: v })} error={error} />
      <TextField label="නම (සිංහල)" value={c.name_si} onChangeText={(v) => set({ name_si: v })} />
      <TextField label="பெயர் (தமிழ்)" value={c.name_ta} onChangeText={(v) => set({ name_ta: v })} />
      <TextField label={t('admin.subtitle')} value={c.subtitle_en} onChangeText={(v) => set({ subtitle_en: v })} hint={t('admin.subtitleHint')} />
      <View>
        <Txt variant="bodySm" weight="semibold" className="mb-2">
          {t('admin.group')}
        </Txt>
        <View className="flex-row flex-wrap gap-2">
          {categoryGroups.map((g) => (
            <Chip key={g.id} label={t(`categoryGroup.${g.id}.short`)} selected={c.group === g.id} onPress={() => set({ group: g.id })} />
          ))}
        </View>
      </View>
      <View>
        <Txt variant="bodySm" weight="semibold" className="mb-2">
          {t('officer.department')}
        </Txt>
        <View className="flex-row flex-wrap gap-2">
          {departments.map((d) => (
            <Chip key={d.id} label={d.name} selected={c.departmentId === d.id} onPress={() => set({ departmentId: d.id })} />
          ))}
        </View>
      </View>
      <Pressable onPress={() => set({ isEmergency: !c.isEmergency })} className="flex-row items-center gap-3">
        <View className="flex-1">
          <Txt weight="medium">{t('admin.emergency')}</Txt>
          <Txt variant="caption" className="text-muted">
            {t('admin.emergencyHint')}
          </Txt>
        </View>
        <Toggle value={c.isEmergency} onValueChange={(v) => set({ isEmergency: v })} accessibilityLabel={t('admin.emergency')} />
      </Pressable>
      <Pressable onPress={() => set({ suggested: !c.suggested })} className="flex-row items-center gap-3">
        <Txt weight="medium" className="flex-1">
          {t('admin.suggested')}
        </Txt>
        <Toggle value={!!c.suggested} onValueChange={(v) => set({ suggested: v })} accessibilityLabel={t('admin.suggested')} />
      </Pressable>
    </Screen>
  );
}
