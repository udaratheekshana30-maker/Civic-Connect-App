import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppBar } from '@/components/layout/AppBar';
import { Card, ErrorState, Skeleton, Txt } from '@/components/ui';
import { statuses } from '@/constants/statuses';
import { colors } from '@/constants/theme';
import { useCatalog } from '@/features/catalog/store';
import { errorMessage } from '@/services/errors';
import { countBy, totalReports } from '@/services/reports';
import type { StatusKey } from '@/types';
import { categoryName } from '@/utils/format';

const statusKeys = Object.keys(statuses) as StatusKey[];

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <View className="gap-1" accessible accessibilityLabel={`${label}: ${value}`}>
      <View className="flex-row justify-between">
        <Txt variant="bodySm" numberOfLines={1} className="flex-1">
          {label}
        </Txt>
        <Txt variant="bodySm" weight="semibold" lang="en">
          {String(value)}
        </Txt>
      </View>
      <View className="h-2.5 overflow-hidden rounded-full bg-canvas">
        <View className="h-full rounded-full" style={{ width: `${max ? (value / max) * 100 : 0}%`, backgroundColor: color }} />
      </View>
    </View>
  );
}

/** Simple counts using Firestore aggregation queries (cheap: 1 read per 1000 docs). */
export default function Analytics() {
  const { t } = useTranslation();
  const categories = useCatalog((s) => s.categories);
  const [data, setData] = useState<{ total: number; byStatus: Record<string, number>; byCategory: Record<string, number> } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [total, byStatus, byCategory] = await Promise.all([totalReports(), countBy('status', statusKeys), countBy('categoryId', categories.map((c) => c.id))]);
      setData({ total, byStatus, byCategory });
    } catch (e) {
      setError(e);
    }
  }, [categories]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const maxStatus = data ? Math.max(1, ...Object.values(data.byStatus)) : 1;
  const catRows = data ? categories.map((c) => ({ c, n: data.byCategory[c.id] ?? 0 })).filter((r) => r.n > 0).sort((a, b) => b.n - a.n) : [];
  const maxCat = Math.max(1, ...catRows.map((r) => r.n));
  const resolved = data?.byStatus.resolved ?? 0;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <AppBar title={t('authority.analytics')} onBack={false} />
      <ScrollView
        contentContainerClassName="gap-4 px-4 pb-8"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => (setRefreshing(true), await load(), setRefreshing(false))} colors={[colors.primary]} />}
      >
        {error ? (
          <ErrorState body={errorMessage(error)} onRetry={load} />
        ) : !data ? (
          <>
            <Skeleton className="h-24 rounded-card" />
            <Skeleton className="h-56 rounded-card" />
          </>
        ) : (
          <>
            <View className="flex-row gap-3">
              <Card className="flex-1">
                <Txt variant="caption" className="text-muted">
                  {t('analytics.total')}
                </Txt>
                <Txt variant="number" lang="en">
                  {String(data.total)}
                </Txt>
              </Card>
              <Card className="flex-1">
                <Txt variant="caption" className="text-muted">
                  {t('analytics.resolvedRate')}
                </Txt>
                <Txt variant="number" lang="en" className="text-primary">
                  {data.total ? `${Math.round((resolved / data.total) * 100)}%` : '—'}
                </Txt>
              </Card>
            </View>
            <Card className="gap-3">
              <Txt variant="h2">{t('analytics.byStatus')}</Txt>
              {statusKeys.map((s) => (
                <Bar key={s} label={t(`status.${s}.label`)} value={data.byStatus[s] ?? 0} max={maxStatus} color={statuses[s].color} />
              ))}
            </Card>
            <Card className="gap-3">
              <Txt variant="h2">{t('analytics.byCategory')}</Txt>
              {catRows.length ? catRows.map(({ c, n }) => <Bar key={c.id} label={categoryName(c)} value={n} max={maxCat} color={colors.primary} />) : <Txt className="text-muted">{t('analytics.none')}</Txt>}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
