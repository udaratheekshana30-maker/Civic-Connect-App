import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Inbox, RotateCcw, Users } from 'lucide-react-native';
import { AppBar } from '@/components/layout/AppBar';
import { PriorityTag } from '@/components/reports/PriorityTag';
import { Chip, EmptyState, ErrorState, SkeletonCard, StatusBadge, Txt } from '@/components/ui';
import { categoryGroups, groupIcon } from '@/constants/categoryGroups';
import { colors, shadows } from '@/constants/theme';
import { isOverdue, isReopened, priorityScore } from '@/features/authority/priority';
import { useDisplayName } from '@/features/auth/store';
import { useCatalog } from '@/features/catalog/store';
import { thumb } from '@/services/cloudinary';
import { errorMessage } from '@/services/errors';
import { subscribeQueue } from '@/services/reports';
import type { CategoryGroupId, Report, StatusKey } from '@/types';
import { categoryName, timeAgo } from '@/utils/format';

type StatusFilter = 'open' | StatusKey | 'reopened' | 'all';
const statusFilters: StatusFilter[] = ['open', 'submitted', 'review', 'assigned', 'progress', 'reopened', 'resolved', 'rejected', 'all'];

export default function Queue() {
  const { t } = useTranslation();
  const name = useDisplayName();
  const category = useCatalog((s) => s.category);
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<StatusFilter>('open');
  const [group, setGroup] = useState<CategoryGroupId | 'all'>('all');
  const [area, setArea] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    return subscribeQueue(
      (r) => {
        setItems(r);
        setLoading(false);
        setError(null);
      },
      (e) => {
        setError(e);
        setLoading(false);
      },
    );
  }, [attempt]);

  const areas = useMemo(() => Array.from(new Set(items.map((r) => r.area).filter(Boolean))).sort(), [items]);

  const rows = useMemo(
    () =>
      items
        .filter((r) => {
          if (status === 'open' && (r.status === 'resolved' || r.status === 'rejected') && !isReopened(r)) return false;
          if (status === 'reopened' && !isReopened(r)) return false;
          if (!['open', 'reopened', 'all'].includes(status) && r.status !== status) return false;
          if (group !== 'all' && r.group !== group) return false;
          if (area !== 'all' && r.area !== area) return false;
          return true;
        })
        .sort((a, b) => priorityScore(b) - priorityScore(a)),
    [items, status, group, area],
  );

  const kpis = [
    { key: 'new', value: items.filter((r) => r.status === 'submitted').length, tone: 'primary' as const },
    { key: 'inProgress', value: items.filter((r) => r.status === 'progress').length },
    { key: 'overdue', value: items.filter(isOverdue).length, danger: true },
    { key: 'reopened', value: items.filter(isReopened).length, danger: true },
  ];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <AppBar title={t('authority.hello', { name: name.split(' ')[0] || '' })} onBack={false} />
      <FlatList
        data={loading || error ? [] : rows}
        keyExtractor={(r) => r.id}
        contentContainerClassName="gap-3 px-4 pb-6"
        ListHeaderComponent={
          <View className="gap-3">
            <View className="flex-row flex-wrap gap-2">
              {kpis.map((k) => (
                <View
                  key={k.key}
                  style={k.tone ? undefined : shadows.card}
                  className={`min-w-[47%] flex-1 rounded-card p-4 ${k.tone ? 'bg-primary' : 'bg-white'}`}
                >
                  <Txt variant="caption" weight="medium" className={k.tone ? 'text-white/90' : 'text-muted'}>
                    {t(`authority.kpi.${k.key}`)}
                  </Txt>
                  <Txt variant="number" lang="en" className={k.tone ? 'text-white' : k.danger && k.value ? 'text-danger-dark' : 'text-ink'}>
                    {loading ? '—' : String(k.value)}
                  </Txt>
                </View>
              ))}
            </View>
            <Txt variant="caption" className="text-muted">
              {t('authority.sorted')}
            </Txt>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4" contentContainerClassName="gap-2 px-4">
              {statusFilters.map((s) => (
                <Chip key={s} label={t(`authority.filters.${s}`)} selected={status === s} onPress={() => setStatus(s)} />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4" contentContainerClassName="gap-2 px-4">
              <Chip label={t('authority.allCategories')} selected={group === 'all'} onPress={() => setGroup('all')} />
              {categoryGroups.map((g) => (
                <Chip key={g.id} label={t(`categoryGroup.${g.id}.short`)} selected={group === g.id} onPress={() => setGroup(g.id)} />
              ))}
            </ScrollView>
            {areas.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4" contentContainerClassName="gap-2 px-4">
                <Chip label={t('authority.allAreas')} selected={area === 'all'} onPress={() => setArea('all')} />
                {areas.map((a) => (
                  <Chip key={a} label={a} selected={area === a} onPress={() => setArea(a)} />
                ))}
              </ScrollView>
            )}
            {loading && [0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            {!!error && <ErrorState body={errorMessage(error)} onRetry={() => setAttempt((a) => a + 1)} />}
          </View>
        }
        ListEmptyComponent={!loading && !error ? <EmptyState icon={Inbox} title={t('authority.emptyTitle')} body={t('authority.emptyBody')} /> : null}
        renderItem={({ item: r }) => {
          const Icon = groupIcon(r.group);
          const photo = r.media.find((m) => m.type === 'image');
          const reopened = isReopened(r);
          return (
            <Pressable accessibilityRole="button" onPress={() => router.push(`/officer/${r.id}`)} style={shadows.card} className="rounded-card bg-white p-4 active:opacity-90">
              <View className="flex-row gap-3">
                {photo ? (
                  <Image source={{ uri: thumb(photo.url, 160) }} className="h-14 w-14 rounded-btn bg-line" accessibilityIgnoresInvertColors />
                ) : (
                  <View className="h-14 w-14 items-center justify-center rounded-btn bg-primary-light">
                    <Icon size={24} color={colors.primary} />
                  </View>
                )}
                <View className="flex-1">
                  <View className="flex-row items-center justify-between gap-2">
                    <Txt weight="semibold" numberOfLines={1} className="flex-1">
                      {categoryName(category(r.categoryId))}
                    </Txt>
                    <Txt variant="caption" weight="semibold" lang="en">
                      #{r.id}
                    </Txt>
                  </View>
                  <Txt variant="caption" numberOfLines={1} className="text-muted">
                    {r.location.address} · {timeAgo(r.createdAt)}
                  </Txt>
                  <View className="mt-2 flex-row flex-wrap items-center gap-x-3 gap-y-1.5">
                    <StatusBadge status={r.status} size="sm" />
                    <PriorityTag level={r.severity} />
                    <View className="flex-row items-center gap-1">
                      <Users size={14} color={colors.muted} />
                      <Txt variant="caption" weight="semibold">
                        {String(r.supportCount)}
                      </Txt>
                    </View>
                    {reopened && (
                      <View className="flex-row items-center gap-1">
                        <RotateCcw size={14} color={colors.danger} />
                        <Txt variant="caption" weight="semibold" className="text-danger-dark">
                          {t('authority.reopenedTag')}
                        </Txt>
                      </View>
                    )}
                    {isOverdue(r) && (
                      <Txt variant="caption" weight="semibold" className="text-danger-dark">
                        {t('authority.overdueTag')}
                      </Txt>
                    )}
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
