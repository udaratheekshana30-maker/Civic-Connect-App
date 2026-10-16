import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ClipboardList, CloudUpload, MapPin, Plus, Trash2 } from 'lucide-react-native';
import { AppBar } from '@/components/layout/AppBar';
import { ReportCard } from '@/components/reports/ReportCard';
import { Button, Chip, EmptyState, ErrorState, IconButton, SkeletonCard, Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useCatalog } from '@/features/catalog/store';
import { useOfflineQueue } from '@/features/offline/store';
import { useMyReports } from '@/features/reports/hooks';
import { errorMessage } from '@/services/errors';
import type { StatusKey } from '@/types';
import { categoryName, formatTime } from '@/utils/format';
import { SafeAreaView } from 'react-native-safe-area-context';

type Filter = 'all' | 'pending' | 'progress' | 'resolved';
const groups: Record<Filter, StatusKey[]> = {
  all: ['submitted', 'review', 'assigned', 'progress', 'resolved', 'rejected'],
  pending: ['submitted', 'review', 'assigned'],
  progress: ['progress'],
  resolved: ['resolved'],
};
const filters: Filter[] = ['all', 'pending', 'progress', 'resolved'];

export default function MyReports() {
  const { t } = useTranslation();
  const { items, loading, error, retry } = useMyReports();
  const pending = useOfflineQueue((s) => s.pending);
  const flush = useOfflineQueue((s) => s.flush);
  const removeQueued = useOfflineQueue((s) => s.remove);
  const category = useCatalog((s) => s.category);
  const [filter, setFilter] = useState<Filter>('all');
  const list = items.filter((r) => groups[filter].includes(r.status));
  const counts = Object.fromEntries(filters.map((f) => [f, items.filter((r) => groups[f].includes(r.status)).length])) as Record<Filter, number>;

  const header = (
    <>
      <AppBar title={t('tabs.myReports')} onBack={false} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-4 pb-3" className="flex-grow-0">
        {filters.map((f) => (
          <Chip key={f} label={t(`myReports.filters.${f}`)} count={loading ? undefined : counts[f]} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>
    </>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      {header}
      {loading ? (
        <View className="gap-3 px-4" accessibilityLabel={t('common.loading')}>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : error ? (
        <ErrorState body={errorMessage(error)} onRetry={retry} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(r) => r.id}
          contentContainerClassName="gap-3 px-4 pb-6"
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => (retry(), flush())} colors={[colors.primary]} />}
          ListHeaderComponent={
            pending.length ? (
              <View className="gap-3">
                {pending.map((p) => (
                  <View key={p.localId} className="rounded-card border-2 border-dashed border-primary/40 bg-white p-4">
                    <View className="flex-row items-start gap-3">
                      <View className="flex-1">
                        <Txt weight="semibold">{categoryName(category(p.categoryId))}</Txt>
                        <View className="mt-0.5 flex-row items-center gap-1">
                          <MapPin size={14} color={colors.muted} />
                          <Txt variant="caption" numberOfLines={1} className="flex-1 text-muted">
                            {p.location.address} · {t('myReports.draft')}
                          </Txt>
                        </View>
                      </View>
                      <IconButton icon={Trash2} size={20} color={colors.muted} accessibilityLabel={t('myReports.discard')} onPress={() => removeQueued(p.localId)} className="-mr-2 -mt-2" />
                    </View>
                    <View className="mt-3 flex-row items-center gap-2 rounded-btn bg-canvas px-3 py-2.5">
                      <CloudUpload size={16} color={colors.primary} />
                      <Txt variant="bodySm" weight="medium" className="flex-1">
                        {p.lastError ? t('myReports.sendFailed') : t('myReports.waiting')}
                      </Txt>
                      <Txt variant="caption" className="text-muted">
                        {t('myReports.saved', { time: formatTime(new Date(p.queuedAt)) })}
                      </Txt>
                    </View>
                  </View>
                ))}
              </View>
            ) : null
          }
          renderItem={({ item }) => <ReportCard report={item} onPress={() => router.push(`/report-status/${item.id}`)} />}
          ListEmptyComponent={
            items.length === 0 && !pending.length ? (
              <EmptyState
                icon={ClipboardList}
                title={t('myReports.emptyTitle')}
                body={t('myReports.emptyBody')}
                action={<Button full icon={Plus} label={t('tabs.reportA11y')} onPress={() => router.push('/report/category')} />}
              />
            ) : items.length > 0 ? (
              <EmptyState icon={ClipboardList} title={t('myReports.noMatchTitle')} body={t('myReports.noMatchBody')} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
