import { Linking, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Building2, CircleX, FileQuestion, Mail, MapPin, Phone, Share2 } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { OSMMap } from '@/components/map/OSMMap';
import { ConfirmFixedCard } from '@/components/reports/ConfirmFixedCard';
import { PhotoCarousel } from '@/components/reports/PhotoCarousel';
import { StatusTimeline } from '@/components/reports/StatusTimeline';
import { Button, Card, EmptyState, ErrorState, IconButton, Skeleton, StatusBadge, Txt } from '@/components/ui';
import { groupIcon } from '@/constants/categoryGroups';
import { colors, shadows } from '@/constants/theme';
import { useAuth } from '@/features/auth/store';
import { useCatalog } from '@/features/catalog/store';
import { useReport } from '@/features/reports/hooks';
import { errorMessage } from '@/services/errors';
import { categoryName, formatDate } from '@/utils/format';

export default function ReportStatus() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { report, timeline, loading, error, retry } = useReport(id);
  const uid = useAuth((s) => s.user?.uid);
  const category = useCatalog((s) => s.category(report?.categoryId));
  const department = useCatalog((s) => s.department(report?.departmentId));

  if (loading) {
    return (
      <Screen title={t('statusScreen.title')} contentContainerClassName="gap-4 px-4">
        <Skeleton className="h-28 w-full rounded-card" />
        <Skeleton className="h-48 w-full rounded-card" />
        <Skeleton className="h-64 w-full rounded-card" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen title={t('statusScreen.title')}>
        <ErrorState body={errorMessage(error)} onRetry={retry} />
      </Screen>
    );
  }
  if (!report) {
    return (
      <Screen title={t('statusScreen.title')}>
        <EmptyState icon={FileQuestion} title={t('issue.notFound')} body={t('issue.notFoundBody')} />
      </Screen>
    );
  }

  const Icon = groupIcon(report.group);
  const title = categoryName(category);
  const isMine = report.reporterId === uid;
  const rejection = report.status === 'rejected' ? [...timeline].reverse().find((e) => e.status === 'rejected')?.remark : undefined;

  return (
    <Screen
      title={t('statusScreen.title')}
      contentContainerClassName="gap-4 px-4 pb-8"
      actions={
        <IconButton
          icon={Share2}
          size={20}
          accessibilityLabel={t('statusScreen.share')}
          onPress={() => Share.share({ message: t('statusScreen.shareText', { id: report.id, title, address: report.location.address }) })}
        />
      }
    >
      <Card>
        <View className="flex-row items-start gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-btn bg-primary-light">
            <Icon size={24} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Txt variant="h2">{title}</Txt>
            <Txt variant="caption" className="text-muted">
              {t(`categoryGroup.${report.group}.short`)} · #{report.id} · {formatDate(report.createdAt)}
            </Txt>
          </View>
        </View>
        <View className="mt-3 flex-row flex-wrap items-center gap-2">
          <StatusBadge status={report.status} />
          <Txt variant="bodySm" className="flex-1">
            {t(`status.${report.status}.plain`)}
          </Txt>
        </View>
      </Card>

      {report.status === 'resolved' && isMine && <ConfirmFixedCard report={report} departmentName={department?.name ?? ''} />}

      {report.status === 'rejected' && (
        <View className="flex-row items-start gap-3 rounded-card border border-danger/30 bg-danger-light p-4">
          <CircleX size={24} color={colors.danger} />
          <View className="flex-1">
            <Txt weight="semibold" className="text-danger-dark">
              {t('statusScreen.rejectedTitle')}
            </Txt>
            <Txt variant="bodySm" className="mt-1">
              {rejection || t('statusScreen.rejectedNoReason')}
            </Txt>
          </View>
        </View>
      )}

      {report.media.length > 0 && (
        <View style={shadows.card} className="overflow-hidden rounded-card bg-white">
          <PhotoCarousel media={report.media} height={192} inset={16} label={title} />
          <Txt variant="caption" className="px-4 py-2.5 text-muted">
            {t('statusScreen.photos', { count: report.media.length })}
          </Txt>
        </View>
      )}

      {!!report.description && (
        <Card>
          <Txt variant="caption" weight="semibold" className="text-muted">
            {t('details.description')}
          </Txt>
          <Txt className="mt-1">{report.description}</Txt>
        </Card>
      )}

      <View style={shadows.card} className="overflow-hidden rounded-card bg-white">
        <View pointerEvents="none">
          <OSMMap
            initialCenter={report.location}
            initialZoom={16}
            interactive={false}
            markers={[{ id: report.id, lat: report.location.lat, lng: report.location.lng, status: report.status, label: title }]}
            style={{ height: 128 }}
          />
        </View>
        <View className="flex-row items-center gap-2 px-4 py-3">
          <MapPin size={16} color={colors.muted} />
          <Txt variant="bodySm" weight="medium" className="flex-1">
            {report.location.address}
          </Txt>
        </View>
      </View>

      <Card>
        <Txt variant="h2" accessibilityRole="header" className="mb-4">
          {t('statusScreen.progress')}
        </Txt>
        <StatusTimeline report={report} entries={timeline} />
      </Card>

      {department && (
        <Card>
          <Txt variant="caption" weight="semibold" className="text-muted">
            {t('statusScreen.authority')}
          </Txt>
          <View className="mt-2 flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-light">
              <Building2 size={20} color={colors.primary} />
            </View>
            <Txt weight="semibold" className="flex-1">
              {department.name}
            </Txt>
          </View>
          <View className="mt-3 flex-row gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={Phone}
              label={t('common.call')}
              accessibilityLabel={t('common.callNumber', { name: department.name, number: department.phone })}
              onPress={() => Linking.openURL(`tel:${department.phone}`)}
              className="flex-1"
            />
            <Button
              size="sm"
              variant="secondary"
              icon={Mail}
              label={t('statusScreen.email')}
              onPress={() => Linking.openURL(`mailto:${department.email}?subject=${encodeURIComponent(`CivicConnect #${report.id}`)}`)}
              className="flex-1"
            />
          </View>
          <Txt variant="caption" lang="en" className="mt-2 text-center text-muted">
            {department.phone} · {department.email}
          </Txt>
        </Card>
      )}

      {!isMine && <Button variant="text" label={t('issue.viewDetails')} onPress={() => router.replace(`/issue/${report.id}`)} />}
    </Screen>
  );
}
