import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Check, Phone, Search, SearchX, TriangleAlert, X } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { Button, IconButton, Stepper, Txt, useTextScale } from '@/components/ui';
import { categoryGroups, groupIcon } from '@/constants/categoryGroups';
import { colors, shadows } from '@/constants/theme';
import { useCatalog } from '@/features/catalog/store';
import { useDraft } from '@/features/report-draft/store';
import type { Category } from '@/types';
import { categoryName, categorySubtitle } from '@/utils/format';

export default function ReportCategory() {
  const { t } = useTranslation();
  const scale = useTextScale();
  const { group } = useLocalSearchParams<{ group?: string }>();
  const categories = useCatalog((s) => s.categories);
  const department = useCatalog((s) => s.department);
  const { categoryId, update, hasContent, reset } = useDraft();
  const [query, setQuery] = useState('');
  const [showResume, setShowResume] = useState(() => hasContent() && !group);
  const q = query.trim().toLowerCase();
  const selected = categories.find((c) => c.id === categoryId);

  const list = useMemo(
    () => categories.filter((c) => !q || [c.name_en, c.name_si, c.name_ta, c.subtitle_en].some((s) => s?.toLowerCase().includes(q))),
    [categories, q],
  );
  // The group chosen on Home goes first.
  const groups = useMemo(() => {
    const order = [...categoryGroups].sort((a, b) => (a.id === group ? -1 : b.id === group ? 1 : 0));
    return order.map((g) => ({ ...g, items: list.filter((c) => c.group === g.id) })).filter((g) => g.items.length);
  }, [list, group]);
  const suggested = categories.filter((c) => c.suggested);

  const choose = (c: Category) => update({ categoryId: c.id });

  return (
    <Screen
      title={t('report.title')}
      header={<Stepper step={1} />}
      contentContainerClassName="px-4 pb-6"
      footer={<Button full label={t('common.continue')} disabled={!selected} onPress={() => router.push('/report/details')} />}
    >
      {showResume && (
        <View className="mb-3 flex-row items-center gap-3 rounded-btn bg-primary-light p-3">
          <Txt variant="bodySm" className="flex-1 text-primary-dark">
            {t('category.draftRestored')}
          </Txt>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              reset();
              setShowResume(false);
            }}
            className="h-11 justify-center px-2"
          >
            <Txt variant="bodySm" weight="semibold" className="text-primary">
              {t('category.startOver')}
            </Txt>
          </Pressable>
        </View>
      )}

      <Txt variant="h2" accessibilityRole="header">
        {t('category.question')}
      </Txt>
      <View className="mt-3 min-h-[52px] flex-row items-center gap-3 rounded-btn border border-line bg-white pl-4">
        <Search size={20} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('category.search')}
          placeholderTextColor={colors.placeholder}
          accessibilityLabel={t('category.search')}
          style={{ flex: 1, fontSize: 16 * scale, color: colors.ink, paddingVertical: 12 }}
        />
        {query ? <IconButton icon={X} size={20} color={colors.muted} accessibilityLabel={t('common.clear')} onPress={() => setQuery('')} /> : <View className="w-3" />}
      </View>

      <View className="mt-3 flex-row items-center gap-3 rounded-btn border border-danger/20 bg-danger-light p-3" accessibilityRole="summary">
        <TriangleAlert size={20} color={colors.danger} />
        <Txt variant="bodySm" className="flex-1 text-danger-dark">
          <Txt variant="bodySm" weight="semibold" className="text-danger-dark">
            {t('category.dangerTitle')}
          </Txt>{' '}
          {t('category.dangerBody')}
        </Txt>
        <Pressable accessibilityRole="button" accessibilityLabel={t('emergency.title')} onPress={() => router.push('/emergency')} className="h-11 flex-row items-center gap-1.5 rounded-btn bg-danger px-3">
          <Phone size={16} color={colors.white} />
          <Txt variant="bodySm" weight="semibold" className="text-white">
            {t('common.call')}
          </Txt>
        </Pressable>
      </View>

      {!q && suggested.length > 0 && (
        <View className="mt-5">
          <Txt variant="bodySm" weight="semibold" className="text-muted">
            {t('category.suggested')}
          </Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 mt-2" contentContainerClassName="gap-2 px-4">
            {suggested.map((c) => {
              const active = c.id === categoryId;
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => choose(c)}
                  className={`h-11 justify-center rounded-full border px-4 ${active ? 'border-primary bg-primary-light' : 'border-line bg-white'}`}
                >
                  <Txt variant="bodySm" weight="medium" className={active ? 'text-primary-dark' : 'text-ink'}>
                    {categoryName(c)}
                  </Txt>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {selected?.isEmergency && (
        <View className="mt-4 rounded-card border-2 border-danger bg-danger-light p-4" accessibilityLiveRegion="assertive">
          <Txt weight="semibold" className="text-danger-dark">
            {t('category.emergencySelected')}
          </Txt>
          <Button
            className="mt-3"
            variant="danger"
            icon={Phone}
            label={t('category.callNow', { number: department(selected.departmentId)?.phone ?? '119' })}
            onPress={() => Linking.openURL(`tel:${department(selected.departmentId)?.phone ?? '119'}`)}
          />
        </View>
      )}

      <Txt variant="bodySm" weight="semibold" className="mt-5 text-muted">
        {q ? t('category.results', { query }) : t('category.all')}
      </Txt>
      <View accessibilityRole="radiogroup" className="mt-2 gap-4">
        {groups.map(({ id, items }) => {
          const GIcon = groupIcon(id);
          return (
            <View key={id}>
              <View className="mb-2 flex-row items-center gap-2">
                <GIcon size={16} color={colors.muted} />
                <Txt variant="caption" weight="semibold" className="uppercase text-muted">
                  {t(`categoryGroup.${id}.title`)}
                </Txt>
              </View>
              <View className="gap-2">
                {items.map((c) => {
                  const active = c.id === categoryId;
                  return (
                    <Pressable
                      key={c.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      onPress={() => choose(c)}
                      style={active ? undefined : shadows.card}
                      className={`flex-row items-center gap-3 rounded-card border-2 p-3.5 ${active ? 'border-primary bg-primary-light/40' : 'border-transparent bg-white'}`}
                    >
                      <View className={`h-12 w-12 items-center justify-center rounded-btn ${active ? 'bg-primary' : c.isEmergency ? 'bg-danger-light' : 'bg-primary-light'}`}>
                        <GIcon size={24} color={active ? colors.white : c.isEmergency ? colors.danger : colors.primary} />
                      </View>
                      <View className="flex-1">
                        <Txt weight="semibold">{categoryName(c)}</Txt>
                        <Txt variant="caption" className={`mt-0.5 ${c.isEmergency ? 'text-danger-dark' : 'text-muted'}`}>
                          {categorySubtitle(c)}
                        </Txt>
                      </View>
                      <View className={`h-6 w-6 items-center justify-center rounded-full border-2 ${active ? 'border-primary bg-primary' : 'border-line'}`}>
                        {active && <Check size={14} color={colors.white} strokeWidth={3} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
        {groups.length === 0 && (
          <View style={shadows.card} className="items-center rounded-card bg-white px-6 py-8">
            <SearchX size={32} color={colors.placeholder} />
            <Txt weight="semibold" className="mt-2">
              {t('category.noMatch')}
            </Txt>
            <Txt variant="bodySm" className="mt-1 text-center text-muted">
              {t('category.noMatchBody')}
            </Txt>
            <Button
              size="sm"
              variant="secondary"
              className="mt-4"
              label={t('category.chooseOther')}
              onPress={() => {
                update({ categoryId: 'other' });
                setQuery('');
              }}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}
