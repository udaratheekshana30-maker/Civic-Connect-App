import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell, ChevronRight, ClipboardList, PhoneCall, Plus, Search } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { OSMMap } from '@/components/map/OSMMap';
import { EmptyState, Skeleton, StatusBadge, Txt } from '@/components/ui';
import { categoryGroups, groupIcon } from '@/constants/categoryGroups';
import { colors, shadows } from '@/constants/theme';
import { useDisplayName } from '@/features/auth/store';
import { useCatalog } from '@/features/catalog/store';
import { useUnreadCount } from '@/features/notifications/store';
import { useDraft } from '@/features/report-draft/store';
import { useMyReports, useNearby } from '@/features/reports/hooks';
import { DEFAULT_CENTER, useLastKnownLocation } from '@/hooks/useLocation';
import { categoryName } from '@/utils/format';

function greetingKey() {
  const h = new Date().getHours();
  return h < 12 ? 'home.morning' : h < 17 ? 'home.afternoon' : 'home.evening';
}

export default function Home() {
  const { t } = useTranslation();
  const name = useDisplayName();
  const unread = useUnreadCount();
  const { items: mine, loading: mineLoading } = useMyReports();
  const active = mine.filter((r) => r.status !== 'resolved' && r.status !== 'rejected');
  const category = useCatalog((s) => s.category);
  const categories = useCatalog((s) => s.categories);
  const updateDraft = useDraft((s) => s.update);
  const center = useLastKnownLocation() ?? DEFAULT_CENTER;
  const nearby = useNearby(center, 1500);

  const startWithGroup = (group: string) => {
    // Pre-select the group's first category, then go to step 1 to confirm.
    const first = categories.find((c) => c.group === group);
    updateDraft({ categoryId: first?.id ?? null });
    router.push({ pathname: '/report/category', params: { group } });
  };

  return (
    <Screen inTabs contentContainerClassName="px-4 pb-8">
      <View className="flex-row items-center justify-between pt-2">
        <View className="flex-1">
          <Txt variant="bodySm" className="text-muted">
            {t(greetingKey())}
          </Txt>
          <Txt variant="h1" accessibilityRole="header" numberOfLines={1}>
            {name.split(' ')[0] || t('home.guest')}
          </Txt>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={unread ? t('home.notificationsUnreadA11y', { count: unread }) : t('home.notificationsA11y')}
          onPress={() => router.push('/notifications')}
          style={shadows.card}
          className="h-12 w-12 items-center justify-center rounded-full bg-white active:bg-primary-light"
        >
          <Bell size={24} color={colors.ink} />
          {unread > 0 && (
            <View className="absolute right-1.5 top-1.5 h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-danger px-1">
              <Txt variant="tiny" weight="bold" lang="en" className="text-white">
                {unread > 9 ? '9+' : String(unread)}
              </Txt>
            </View>
          )}
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="search"
        onPress={() => router.push({ pathname: '/(tabs)/map', params: { focusSearch: '1' } })}
        className="mt-4 min-h-[52px] flex-row items-center gap-3 rounded-btn border border-line bg-white px-4"
      >
        <Search size={20} color={colors.muted} />
        <Txt className="text-placeholder">{t('home.search')}</Txt>
      </Pressable>

      <View className="mt-4 rounded-card bg-primary p-5">
        <Txt variant="title" className="text-white">
          {t('home.heroTitle')}
        </Txt>
        <Txt className="mt-1.5 text-white/90">{t('home.heroBody')}</Txt>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/report/category')}
          className="mt-4 min-h-[52px] flex-row items-center gap-2 self-start rounded-btn bg-white px-5 active:bg-primary-light"
        >
          <Plus size={20} color={colors.primaryDark} strokeWidth={2.5} />
          <Txt weight="semibold" className="text-primary-dark">
            {t('home.heroCta')}
          </Txt>
        </Pressable>
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push('/emergency')} className="mt-3 min-h-12 flex-row items-center gap-3 rounded-btn bg-danger-light px-4 py-3">
        <PhoneCall size={20} color={colors.danger} />
        <Txt variant="bodySm" weight="semibold" className="flex-1 text-danger-dark">
          {t('home.emergencyStrip')}
        </Txt>
        <ChevronRight size={20} color={colors.danger} />
      </Pressable>

      <Txt variant="h2" accessibilityRole="header" className="mt-7">
        {t('home.quickCategories')}
      </Txt>
      <View className="mt-3 flex-row flex-wrap justify-between gap-y-3">
        {categoryGroups.map(({ id, icon: Icon }) => (
          <Pressable
            key={id}
            accessibilityRole="button"
            onPress={() => startWithGroup(id)}
            style={[shadows.card, { width: '31.5%' }]}
            className="items-center gap-2 rounded-card bg-white px-1 py-4 active:opacity-80"
          >
            <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-light">
              <Icon size={24} color={colors.primary} />
            </View>
            <Txt variant="bodySm" weight="medium" numberOfLines={1} className="text-center">
              {t(`categoryGroup.${id}.short`)}
            </Txt>
          </Pressable>
        ))}
      </View>

      <View className="mt-7 flex-row items-center justify-between">
        <Txt variant="h2" accessibilityRole="header">
          {t('home.myActive')}
        </Txt>
        <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/my-reports')} className="h-11 justify-center px-1">
          <Txt variant="bodySm" weight="semibold" className="text-primary">
            {t('common.seeAll')}
          </Txt>
        </Pressable>
      </View>
      {mineLoading ? (
        <View className="mt-2 flex-row gap-3">
          <Skeleton className="h-36 w-[250px] rounded-card" />
          <Skeleton className="h-36 w-16 rounded-card" />
        </View>
      ) : active.length === 0 ? (
        <EmptyState compact icon={ClipboardList} title={t('home.noActiveTitle')} body={t('home.noActiveBody')} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 mt-2" contentContainerClassName="gap-3 px-4 pb-2">
          {active.map((r) => {
            const Icon = groupIcon(r.group);
            return (
              <Pressable
                key={r.id}
                accessibilityRole="button"
                onPress={() => router.push(`/report-status/${r.id}`)}
                style={shadows.card}
                className="w-[250px] rounded-card bg-white p-4 active:opacity-90"
              >
                <View className="flex-row items-center gap-2">
                  <Icon size={20} color={colors.primary} />
                  <Txt weight="semibold" numberOfLines={1} className="flex-1">
                    {categoryName(category(r.categoryId))}
                  </Txt>
                </View>
                <Txt variant="caption" numberOfLines={1} className="mt-1 text-muted">
                  #{r.id} · {r.location.address}
                </Txt>
                <Txt variant="bodySm" numberOfLines={2} className="mt-2">
                  {t(`status.${r.status}.plain`)}
                </Txt>
                <View className="mt-3">
                  <StatusBadge status={r.status} />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View className="mt-5 flex-row items-center justify-between">
        <Txt variant="h2" accessibilityRole="header">
          {t('home.nearby')}
        </Txt>
        <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/map')} className="h-11 justify-center px-1">
          <Txt variant="bodySm" weight="semibold" className="text-primary">
            {t('common.viewAll')}
          </Txt>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('home.nearbyA11y', { count: nearby.items.length })}
        onPress={() => router.push('/(tabs)/map')}
        style={shadows.card}
        className="mt-2 overflow-hidden rounded-card bg-white"
      >
        <View pointerEvents="none">
          <OSMMap
            initialCenter={center}
            initialZoom={14}
            interactive={false}
            markers={nearby.items.map((r) => ({ id: r.id, lat: r.location.lat, lng: r.location.lng, status: r.status, label: r.id }))}
            style={{ height: 176 }}
          />
        </View>
        <View className="flex-row items-center justify-between px-4 py-3">
          <Txt variant="bodySm">{nearby.loading ? t('common.loading') : t('home.nearbyCount', { count: nearby.items.length })}</Txt>
          <ChevronRight size={20} color={colors.muted} />
        </View>
      </Pressable>
    </Screen>
  );
}
