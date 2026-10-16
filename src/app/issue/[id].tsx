import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { distanceBetween } from 'geofire-common';
import { ArrowLeft, Calendar, Camera, Check, ChevronRight, ImageOff, MapPin, Navigation, ThumbsUp } from 'lucide-react-native';
import { PhotoCarousel } from '@/components/reports/PhotoCarousel';
import { MediaThumb } from '@/components/reports/MediaThumb';
import { Button, EmptyState, ErrorState, IconButton, Skeleton, StatusBadge, Txt } from '@/components/ui';
import { groupIcon } from '@/constants/categoryGroups';
import { colors, shadows } from '@/constants/theme';
import { useCatalog } from '@/features/catalog/store';
import { useReport } from '@/features/reports/hooks';
import { useSupport } from '@/features/reports/useSupport';
import { useLastKnownLocation } from '@/hooks/useLocation';
import { errorMessage } from '@/services/errors';
import { subscribeAdditions } from '@/services/reports';
import type { Addition } from '@/types';
import { categoryName, formatDistance, timeAgo } from '@/utils/format';

/** Someone else's issue (from the map): details, support, extra info from citizens. */
export default function IssueDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { report, loading, error, retry } = useReport(id);
  const category = useCatalog((s) => s.category(report?.categoryId));
  const { supported, count, toggle, busy, isOwn } = useSupport(report);
  const me = useLastKnownLocation();
  const [additions, setAdditions] = useState<Addition[]>([]);

  useEffect(() => (id ? subscribeAdditions(id, setAdditions) : undefined), [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Skeleton className="h-[280px] w-full rounded-none" />
        <View className="gap-3 p-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </View>
      </SafeAreaView>
    );
  }
  if (error || !report) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <IconButton icon={ArrowLeft} accessibilityLabel={t('common.goBack')} onPress={() => router.back()} className="m-2" />
        {error ? <ErrorState body={errorMessage(error)} onRetry={retry} /> : <EmptyState icon={ImageOff} title={t('issue.notFound')} body={t('issue.notFoundBody')} />}
      </SafeAreaView>
    );
  }

  const Icon = groupIcon(report.group);
  const title = categoryName(category);
  const distance = me ? distanceBetween([me.lat, me.lng], [report.location.lat, report.location.lng]) * 1000 : null;

  return (
    <View className="flex-1 bg-white">
      <StatusBar style={report.media.length ? 'light' : 'dark'} />
      <ScrollView contentContainerClassName="pb-6">
        {report.media.length ? (
          <PhotoCarousel media={report.media} height={300} label={title} />
        ) : (
          <View className="h-40 items-center justify-center bg-primary-light">
            <Icon size={48} color={colors.primary} />
          </View>
        )}
        <SafeAreaView edges={['top']} className="absolute left-3 top-2">
          <IconButton icon={ArrowLeft} accessibilityLabel={t('common.goBack')} onPress={() => router.back()} className="bg-white" style={shadows.card} />
        </SafeAreaView>

        <View className="-mt-5 rounded-t-[20px] bg-white px-4 pt-5">
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-1 flex-row items-center gap-1.5">
              <Icon size={16} color={colors.primary} />
              <Txt variant="bodySm" weight="medium" className="text-primary">
                {t(`categoryGroup.${report.group}.title`)}
              </Txt>
            </View>
            <StatusBadge status={report.status} />
          </View>
          <Txt variant="h1" accessibilityRole="header" className="mt-2">
            {title}
          </Txt>
          <Txt variant="bodySm" className="mt-1 text-muted">
            {t(`status.${report.status}.plain`)}
          </Txt>

          <View className="mt-4 flex-row gap-3">
            <View className="flex-1 rounded-btn bg-canvas p-3">
              <View className="flex-row items-center gap-1.5">
                <Navigation size={14} color={colors.muted} />
                <Txt variant="caption" className="text-muted">
                  {t('issue.distance')}
                </Txt>
              </View>
              <Txt weight="semibold" className="mt-0.5">
                {distance != null ? formatDistance(distance) : '—'}
              </Txt>
            </View>
            <View className="flex-1 rounded-btn bg-canvas p-3">
              <View className="flex-row items-center gap-1.5">
                <Calendar size={14} color={colors.muted} />
                <Txt variant="caption" className="text-muted">
                  {t('issue.reported')}
                </Txt>
              </View>
              <Txt weight="semibold" className="mt-0.5">
                {timeAgo(report.createdAt)}
              </Txt>
            </View>
          </View>

          <View className="mt-4 flex-row items-center gap-2">
            <MapPin size={16} color={colors.muted} />
            <Txt variant="bodySm" className="flex-1">
              {report.location.address}
            </Txt>
          </View>
          {!!report.description && <Txt className="mt-3">{report.description}</Txt>}

          <View className="mt-5 flex-row items-center gap-3 rounded-card border border-line p-4" accessibilityLiveRegion="polite">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-light">
              <ThumbsUp size={20} color={colors.primary} />
            </View>
            <Txt className="flex-1">{t('issue.supportCount', { count })}</Txt>
          </View>
          <Txt variant="caption" className="mt-2 text-muted">
            {t('issue.supportHint')}
          </Txt>

          {isOwn && (
            <Pressable accessibilityRole="link" onPress={() => router.push(`/report-status/${report.id}`)} className="mt-3 min-h-12 flex-row items-center gap-2 rounded-btn bg-primary-light px-4">
              <Txt variant="bodySm" weight="semibold" className="flex-1 text-primary-dark">
                {t('issue.yourReport')}
              </Txt>
              <ChevronRight size={18} color={colors.primaryDark} />
            </Pressable>
          )}

          {additions.length > 0 && (
            <View className="mt-6">
              <Txt variant="h2" accessibilityRole="header">
                {t('issue.additions', { count: additions.length })}
              </Txt>
              {additions.map((a) => (
                <View key={a.id} className="mt-3 rounded-btn bg-canvas p-3">
                  {!!a.text && <Txt variant="bodySm">{a.text}</Txt>}
                  {a.media.length > 0 && (
                    <View className="mt-2 flex-row gap-2">
                      {a.media.map((m, i) => (
                        <MediaThumb key={m.url + i} url={m.url} type={m.type} width={160} className="h-16 w-16" />
                      ))}
                    </View>
                  )}
                  <Txt variant="caption" className="mt-1 text-muted">
                    {timeAgo(a.createdAt)}
                  </Txt>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} className="flex-row gap-3 border-t border-line bg-white px-4 pb-2 pt-3">
        {!isOwn && (
          <Button
            className="flex-1 px-2"
            variant={supported ? 'secondary' : 'primary'}
            icon={supported ? Check : ThumbsUp}
            label={supported ? t('issue.supported') : t('issue.support')}
            accessibilityState={{ selected: supported }}
            disabled={busy}
            onPress={toggle}
          />
        )}
        <Button className="flex-1 px-2" variant="secondary" icon={Camera} label={t('issue.addInfo')} onPress={() => router.push(`/add-info/${report.id}`)} />
      </SafeAreaView>
    </View>
  );
}
