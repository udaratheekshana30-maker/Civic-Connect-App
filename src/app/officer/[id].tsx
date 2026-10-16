import { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Check, Eye, FileQuestion, MapPin, RotateCcw, User, Users } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { OSMMap } from '@/components/map/OSMMap';
import { MediaThumb } from '@/components/reports/MediaThumb';
import { PhotoCarousel } from '@/components/reports/PhotoCarousel';
import { PriorityTag } from '@/components/reports/PriorityTag';
import { StatusTimeline } from '@/components/reports/StatusTimeline';
import { Button, Card, EmptyState, ErrorState, Skeleton, StatusBadge, TextField, Txt, toast } from '@/components/ui';
import { statuses } from '@/constants/statuses';
import { colors, shadows } from '@/constants/theme';
import { isReopened } from '@/features/authority/priority';
import { isAuthority, useAuth, useDisplayName } from '@/features/auth/store';
import { useCatalog } from '@/features/catalog/store';
import { useReport } from '@/features/reports/hooks';
import { errorMessage } from '@/services/errors';
import { officerUpdate, subscribeAdditions } from '@/services/reports';
import type { Addition, StatusKey } from '@/types';
import { categoryName, formatDateTime, timeAgo } from '@/utils/format';

const allStatuses = Object.keys(statuses) as StatusKey[];

export default function OfficerReport() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useAuth((s) => s.profile);
  const officerName = useDisplayName();
  const { report, timeline, loading, error, retry } = useReport(id);
  const category = useCatalog((s) => s.category(report?.categoryId));
  const departments = useCatalog((s) => s.departments);
  const [status, setStatus] = useState<StatusKey>('submitted');
  const [dept, setDept] = useState('');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [additions, setAdditions] = useState<Addition[]>([]);

  // Initialise the form from the report (and after each realtime update if untouched).
  useEffect(() => {
    if (!report) return;
    setStatus(report.status);
    setDept(report.departmentId);
  }, [report?.status, report?.departmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => (id ? subscribeAdditions(id, setAdditions) : undefined), [id]);

  if (profile && !isAuthority(profile.role)) return <Redirect href="/(tabs)" />;

  if (loading)
    return (
      <Screen title={t('officer.title')} contentContainerClassName="gap-4 px-4">
        <Skeleton className="h-40 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </Screen>
    );
  if (error)
    return (
      <Screen title={t('officer.title')}>
        <ErrorState body={errorMessage(error)} onRetry={retry} />
      </Screen>
    );
  if (!report)
    return (
      <Screen title={t('officer.title')}>
        <EmptyState icon={FileQuestion} title={t('issue.notFound')} body={t('issue.notFoundBody')} />
      </Screen>
    );

  const changed = status !== report.status || dept !== report.departmentId || remark.trim().length > 0;
  const needsRemark = status === 'rejected' && !remark.trim();

  const save = async () => {
    if (needsRemark) return toast(t('officer.rejectNeedsReason'), { tone: 'error' });
    setSaving(true);
    try {
      await officerUpdate({ report, status, departmentId: dept, remark, byRole: profile?.role ?? 'officer', byName: officerName || t(`roles.${profile?.role ?? 'officer'}`) });
      setRemark('');
      setSavedAt(Date.now());
      toast(t('officer.saved'));
    } catch (e) {
      toast(errorMessage(e), { tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      title={`#${report.id} · ${categoryName(category)}`}
      contentContainerClassName="gap-4 px-4 pb-8"
      footer={
        <View className="gap-1">
          <Button full label={savedAt && !changed ? t('officer.savedBtn') : t('officer.save')} icon={savedAt && !changed ? Check : undefined} loading={saving} disabled={!changed} onPress={save} />
          <Txt variant="caption" className="text-center text-muted" accessibilityLiveRegion="polite">
            {report.reporterId ? t('officer.notifyNote') : t('officer.noReporter')}
          </Txt>
        </View>
      }
    >
      <Card className="gap-3">
        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2">
          <StatusBadge status={report.status} />
          <PriorityTag level={report.severity} />
          <View className="flex-row items-center gap-1.5">
            <Users size={16} color={colors.muted} />
            <Txt variant="bodySm" weight="semibold">
              {t('officer.supporters', { count: report.supportCount })}
            </Txt>
          </View>
        </View>
        <View className="flex-row items-center gap-1.5">
          <User size={16} color={colors.muted} />
          <Txt variant="bodySm" className="text-muted">
            {report.isAnonymous || !report.reporterName ? t('officer.anonymous') : report.reporterName} · {formatDateTime(report.createdAt)}
          </Txt>
        </View>
        {isReopened(report) && (
          <View className="flex-row items-center gap-2 rounded-btn bg-danger-light px-3 py-2">
            <RotateCcw size={16} color={colors.danger} />
            <Txt variant="bodySm" weight="semibold" className="flex-1 text-danger-dark">
              {t('officer.reopened')}
            </Txt>
          </View>
        )}
        {report.resolvedConfirmed === true && (
          <Txt variant="bodySm" weight="semibold" className="text-primary">
            {t('officer.confirmed')}
          </Txt>
        )}
      </Card>

      {report.media.length > 0 && (
        <View style={shadows.card} className="overflow-hidden rounded-card bg-white">
          <PhotoCarousel media={report.media} height={200} inset={16} label={categoryName(category)} />
        </View>
      )}

      <Card>
        <Txt variant="caption" weight="semibold" className="text-muted">
          {t('officer.description')}
        </Txt>
        <Txt className="mt-1">{report.description || t('review.noDescription')}</Txt>
      </Card>

      <View style={shadows.card} className="overflow-hidden rounded-card bg-white">
        <OSMMap initialCenter={report.location} initialZoom={17} markers={[{ id: report.id, lat: report.location.lat, lng: report.location.lng, status: report.status, label: '' }]} style={{ height: 200 }} />
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(`https://www.openstreetmap.org/?mlat=${report.location.lat}&mlon=${report.location.lng}#map=18/${report.location.lat}/${report.location.lng}`)}
          className="flex-row items-center gap-2 px-4 py-3"
        >
          <MapPin size={16} color={colors.muted} />
          <View className="flex-1">
            <Txt variant="bodySm" weight="semibold">
              {report.location.address}
            </Txt>
            <Txt variant="caption" lang="en" className="text-muted">
              {report.location.lat.toFixed(5)}, {report.location.lng.toFixed(5)}
            </Txt>
          </View>
        </Pressable>
      </View>

      {additions.length > 0 && (
        <Card>
          <Txt variant="h2">{t('issue.additions', { count: additions.length })}</Txt>
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
        </Card>
      )}

      <Card>
        <Txt variant="h2" className="mb-4">
          {t('officer.timeline')}
        </Txt>
        <StatusTimeline report={report} entries={timeline} />
      </Card>

      <Card className="gap-4">
        <Txt variant="h2" accessibilityRole="header">
          {t('officer.update')}
        </Txt>
        <View>
          <Txt variant="bodySm" weight="semibold" className="mb-2">
            {t('officer.status')}
          </Txt>
          <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
            {allStatuses.map((s) => {
              const cfg = statuses[s];
              const Icon = cfg.icon;
              const active = status === s;
              return (
                <Pressable
                  key={s}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  onPress={() => setStatus(s)}
                  className={`min-h-11 flex-row items-center gap-1.5 rounded-full border-2 px-3 ${active ? '' : 'border-line bg-white'}`}
                  style={active ? { borderColor: cfg.color, backgroundColor: cfg.tint } : undefined}
                >
                  <Icon size={16} color={cfg.color} />
                  <Txt variant="bodySm" weight="semibold" style={{ color: active ? cfg.text : colors.ink }}>
                    {t(`status.${s}.label`)}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
          <Txt variant="caption" className="mt-1.5 text-muted">
            {t('officer.citizenSees', { text: t(`status.${status}.plain`) })}
          </Txt>
        </View>

        <View>
          <Txt variant="bodySm" weight="semibold" className="mb-2">
            {t('officer.department')}
          </Txt>
          <View className="gap-2">
            {departments.map((d) => {
              const active = dept === d.id;
              return (
                <Pressable
                  key={d.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  onPress={() => setDept(d.id)}
                  className={`min-h-12 flex-row items-center gap-3 rounded-btn border-2 px-3 ${active ? 'border-primary bg-primary-light/40' : 'border-line bg-white'}`}
                >
                  <View className={`h-5 w-5 items-center justify-center rounded-full border-2 ${active ? 'border-primary bg-primary' : 'border-line'}`}>
                    {active && <Check size={12} color={colors.white} strokeWidth={3} />}
                  </View>
                  <View className="flex-1 py-2">
                    <Txt variant="bodySm" weight="semibold">
                      {d.name}
                    </Txt>
                    <Txt variant="caption" className="text-muted">
                      {d.area}
                    </Txt>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <View className="mb-1.5 flex-row items-center justify-between">
            <Txt variant="bodySm" weight="semibold">
              {t('officer.remark')}
            </Txt>
            <View className="flex-row items-center gap-1">
              <Eye size={14} color={colors.primary} />
              <Txt variant="caption" weight="medium" className="text-primary">
                {t('officer.visible')}
              </Txt>
            </View>
          </View>
          <TextField
            accessibilityLabel={t('officer.remark')}
            value={remark}
            onChangeText={setRemark}
            multiline
            maxLength={500}
            placeholder={t('officer.remarkPlaceholder')}
            error={needsRemark ? t('officer.rejectNeedsReason') : undefined}
            hint={t('officer.remarkHint')}
          />
        </View>
      </Card>
    </Screen>
  );
}
