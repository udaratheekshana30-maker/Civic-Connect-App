import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Building2, ChevronRight, DatabaseZap, Plus } from 'lucide-react-native';
import { AppBar } from '@/components/layout/AppBar';
import { Button, Segmented, Txt, toast } from '@/components/ui';
import { groupIcon } from '@/constants/categoryGroups';
import { colors, shadows } from '@/constants/theme';
import { useCatalog } from '@/features/catalog/store';
import { loadDefaultCatalog } from '@/services/catalog';
import { errorMessage } from '@/services/errors';

/** Admin only (tab hidden for officers; writes enforced by firestore.rules). */
export default function Manage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'categories' | 'departments'>('categories');
  const { categories, departments, usingFallback, load } = useCatalog();
  const [busy, setBusy] = useState(false);

  const seed = () =>
    Alert.alert(t('admin.seedTitle'), t('admin.seedBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.seedConfirm'),
        onPress: async () => {
          setBusy(true);
          try {
            await loadDefaultCatalog();
            await load();
            toast(t('admin.seeded'));
          } catch (e) {
            toast(errorMessage(e), { tone: 'error' });
          } finally {
            setBusy(false);
          }
        },
      },
    ]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <AppBar
        title={t('authority.manage')}
        onBack={false}
        actions={
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(tab === 'categories' ? '/admin/category' : '/admin/department')}
            className="h-11 flex-row items-center gap-1 rounded-lg px-2"
          >
            <Plus size={18} color={colors.primary} />
            <Txt variant="bodySm" weight="semibold" className="text-primary">
              {t('admin.add')}
            </Txt>
          </Pressable>
        }
      />
      <ScrollView contentContainerClassName="gap-4 px-4 pb-8">
        <Segmented
          accessibilityLabel={t('authority.manage')}
          value={tab}
          onChange={setTab}
          options={[
            { id: 'categories', label: t('admin.categories', { count: categories.length }) },
            { id: 'departments', label: t('admin.departments', { count: departments.length }) },
          ]}
        />
        {usingFallback && (
          <View className="gap-3 rounded-card border border-warning/40 bg-warning-light p-4">
            <Txt variant="bodySm" className="text-warning-dark">
              {t('admin.fallbackNote')}
            </Txt>
            <Button size="sm" icon={DatabaseZap} label={t('admin.seedConfirm')} loading={busy} onPress={seed} />
          </View>
        )}
        <View style={shadows.card} className="overflow-hidden rounded-card bg-white">
          {tab === 'categories'
            ? categories.map((c, i) => {
                const Icon = groupIcon(c.group);
                return (
                  <Pressable
                    key={c.id}
                    accessibilityRole="button"
                    onPress={() => router.push({ pathname: '/admin/category', params: { id: c.id } })}
                    className={`min-h-14 flex-row items-center gap-3 px-4 py-3 active:bg-canvas ${i ? 'border-t border-line' : ''}`}
                  >
                    <Icon size={20} color={c.isEmergency ? colors.danger : colors.primary} />
                    <View className="flex-1">
                      <Txt weight="medium">{c.name_en}</Txt>
                      <Txt variant="caption" className="text-muted">
                        {t(`categoryGroup.${c.group}.short`)} · {departments.find((d) => d.id === c.departmentId)?.name ?? c.departmentId}
                      </Txt>
                    </View>
                    <ChevronRight size={20} color={colors.placeholder} />
                  </Pressable>
                );
              })
            : departments.map((d, i) => (
                <Pressable
                  key={d.id}
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/admin/department', params: { id: d.id } })}
                  className={`min-h-14 flex-row items-center gap-3 px-4 py-3 active:bg-canvas ${i ? 'border-t border-line' : ''}`}
                >
                  <Building2 size={20} color={colors.primary} />
                  <View className="flex-1">
                    <Txt weight="medium">{d.name}</Txt>
                    <Txt variant="caption" lang="en" className="text-muted">
                      {d.area} · {d.phone}
                    </Txt>
                  </View>
                  <ChevronRight size={20} color={colors.placeholder} />
                </Pressable>
              ))}
        </View>
        {!usingFallback && <Button variant="text" icon={DatabaseZap} label={t('admin.reseed')} loading={busy} onPress={seed} />}
      </ScrollView>
    </SafeAreaView>
  );
}
