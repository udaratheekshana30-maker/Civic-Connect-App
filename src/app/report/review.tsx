import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronRight, EyeOff, Info, WifiOff } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { OSMMap } from '@/components/map/OSMMap';
import { MediaThumb } from '@/components/reports/MediaThumb';
import { Button, Card, Stepper, Toggle, Txt } from '@/components/ui';
import { groupIcon } from '@/constants/categoryGroups';
import { colors, shadows } from '@/constants/theme';
import { useAuth, useDisplayName } from '@/features/auth/store';
import { useCatalog } from '@/features/catalog/store';
import { useNetwork, useOfflineQueue } from '@/features/offline/store';
import { useDraft } from '@/features/report-draft/store';
import { uploadAll } from '@/services/cloudinary';
import { errorDetail, errorMessage } from '@/services/errors';
import { findSimilar, submitReport, type NearbyReport } from '@/services/reports';
import { categoryName, formatDateTime, formatDistance } from '@/utils/format';

type Step = '/report/category' | '/report/details' | '/report/location';

function Section({ label, edit, children, last }: { label: string; edit: Step; children: ReactNode; last?: boolean }) {
  const { t } = useTranslation();
  return (
    <View className={`py-4 ${last ? '' : 'border-b border-line'}`}>
      <View className="flex-row items-center justify-between">
        <Txt variant="caption" weight="semibold" className="text-muted">
          {label}
        </Txt>
        <Pressable accessibilityRole="button" accessibilityLabel={t('review.editA11y', { label })} onPress={() => router.dismissTo(edit)} className="-mr-2 h-10 justify-center rounded-lg px-2 active:bg-primary-light">
          <Txt variant="bodySm" weight="semibold" className="text-primary">
            {t('review.edit')}
          </Txt>
        </Pressable>
      </View>
      <View className="mt-1">{children}</View>
    </View>
  );
}

export default function ReportReview() {
  const { t } = useTranslation();
  const draft = useDraft();
  const user = useAuth((s) => s.user);
  const name = useDisplayName();
  const online = useNetwork((s) => s.online);
  const enqueue = useOfflineQueue((s) => s.enqueue);
  const category = useCatalog((s) => s.category(draft.categoryId));
  const department = useCatalog((s) => s.department(category?.departmentId));
  const [similar, setSimilar] = useState<NearbyReport[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const isAnonUser = !!user?.isAnonymous;
  const anonymous = isAnonUser || draft.anonymous;

  // Duplicate check: same category, within ~100 m, still open.
  useEffect(() => {
    if (!draft.location || !draft.categoryId || !online) return;
    findSimilar(draft.location, draft.categoryId)
      .then(setSimilar)
      .catch(() => setSimilar([]));
  }, [draft.location, draft.categoryId, online]);

  if (!category || !draft.location || !user) {
    // Opened without a complete draft (e.g. app restored here) → back to start.
    return (
      <Screen title={t('report.title')} header={<Stepper step={4} />}>
        <View className="p-4">
          <Button full label={t('review.incomplete')} onPress={() => router.replace('/report/category')} />
        </View>
      </Screen>
    );
  }

  const payload = () => ({
    uid: user.uid,
    reporterName: anonymous ? null : name || null,
    isAnonymous: anonymous,
    categoryId: category.id,
    group: category.group,
    departmentId: category.departmentId,
    description: draft.description,
    severity: draft.severity,
    location: draft.location!,
  });

  const saveForLater = () => {
    enqueue({ ...payload(), media: draft.media, seenAt: draft.seenAt });
    draft.reset();
    router.replace({ pathname: '/report/success', params: { queued: '1' } });
  };

  const submit = async () => {
    if (!online) return saveForLater();
    setError(null);
    setErrorInfo(null);
    let stage = 'upload';
    try {
      const total = draft.media.length;
      setProgress(total ? t('review.uploading', { done: 0, total }) : t('review.submitting'));
      const media = await uploadAll(draft.media, (done) => {
        setProgress(t('review.uploading', { done, total }));
      });
      // Remember the uploaded URLs so a retry doesn't upload again.
      draft.update({ media: draft.media.map((m, i) => ({ ...m, url: media[i]?.url })) });
      stage = 'save';
      setProgress(t('review.submitting'));
      const id = await submitReport({ ...payload(), media, seenAt: draft.seenAt ? new Date(draft.seenAt) : null });
      draft.reset();
      router.replace({ pathname: '/report/success', params: { id } });
    } catch (e) {
      setError(errorMessage(e));
      setErrorInfo(errorDetail(e, stage));
    } finally {
      setProgress(null);
    }
  };

  const Icon = groupIcon(category.group);

  return (
    <Screen
      title={t('report.title')}
      header={<Stepper step={4} />}
      contentContainerClassName="gap-3 px-4 pb-6"
      footer={
        <View className="gap-2">
          {error && (
            <View className="gap-2" accessibilityLiveRegion="polite">
              <Txt variant="bodySm" weight="medium" className="text-center text-danger-dark">
                {error}
              </Txt>
              {errorInfo && (
                <Txt variant="tiny" lang="en" selectable className="text-center text-muted">
                  {errorInfo}
                </Txt>
              )}
              <Button full size="sm" variant="neutral" label={t('review.saveLater')} onPress={saveForLater} />
            </View>
          )}
          <Button full label={progress ?? (online ? t('review.submit') : t('review.submitOffline'))} loading={!!progress} onPress={submit} />
        </View>
      }
    >
      {!online && (
        <View className="flex-row items-start gap-3 rounded-card bg-ink p-4">
          <WifiOff size={20} color={colors.white} />
          <Txt variant="bodySm" className="flex-1 text-white">
            {t('review.offlineNote')}
          </Txt>
        </View>
      )}

      {similar.length > 0 && (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/issue/${similar[0]!.id}`)}
          className="flex-row items-start gap-3 rounded-card border border-warning/40 bg-warning-light p-4"
        >
          <Info size={20} color="#92400E" />
          <View className="flex-1">
            <Txt weight="semibold" className="text-warning-dark">
              {t('review.similarTitle', { count: similar.length })}
            </Txt>
            <Txt variant="bodySm" className="mt-0.5 text-warning-dark">
              {t('review.similarBody', { id: similar[0]!.id, distance: formatDistance(similar[0]!.distance) })}
            </Txt>
          </View>
          <ChevronRight size={20} color="#92400E" />
        </Pressable>
      )}

      <View style={shadows.card} className="rounded-card bg-white px-4" accessibilityLabel={t('review.summary')}>
        <Section label={t('review.category')} edit="/report/category">
          <View className="flex-row items-center gap-2">
            <Icon size={20} color={colors.primary} />
            <Txt weight="semibold">{categoryName(category)}</Txt>
          </View>
        </Section>
        <Section label={t('details.description')} edit="/report/details">
          {draft.description ? <Txt>{draft.description}</Txt> : <Txt className="text-muted">{t('review.noDescription')}</Txt>}
        </Section>
        <Section label={t('review.evidence', { count: draft.media.length })} edit="/report/details">
          {draft.media.length ? (
            <View className="flex-row flex-wrap gap-2">
              {draft.media.map((m, i) => (
                <MediaThumb key={m.uri + i} uri={m.uri} type={m.type} className="h-16 w-16" />
              ))}
            </View>
          ) : (
            <Txt className="text-muted">{t('review.noMedia')}</Txt>
          )}
        </Section>
        <Section label={t('review.location')} edit="/report/location">
          <View className="flex-row items-center gap-3">
            <View pointerEvents="none" className="overflow-hidden rounded-btn">
              {/* status only picks the pin colour: red marks "your" pin, as in the design */}
              <OSMMap initialCenter={draft.location} initialZoom={16} interactive={false} markers={[{ id: 'me', ...draft.location, status: 'rejected', label: '' }]} style={{ width: 80, height: 64 }} />
            </View>
            <Txt weight="semibold" className="flex-1">
              {draft.location.address || `${draft.location.lat.toFixed(5)}, ${draft.location.lng.toFixed(5)}`}
            </Txt>
          </View>
        </Section>
        <Section label={t('details.severity')} edit="/report/details" last={!draft.seenAt}>
          <Txt weight="semibold">{t(`severity.${draft.severity ?? 'none'}`)}</Txt>
        </Section>
        {draft.seenAt && (
          <Section label={t('details.when')} edit="/report/details" last>
            <Txt weight="semibold">{formatDateTime(new Date(draft.seenAt))}</Txt>
          </Section>
        )}
      </View>

      <Card className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-light">
          <EyeOff size={20} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Txt weight="semibold">{t('review.anonymous')}</Txt>
          <Txt variant="bodySm" className="mt-0.5 text-muted">
            {isAnonUser ? t('review.anonymousGuest') : t('review.anonymousBody')}
          </Txt>
        </View>
        <Toggle value={anonymous} disabled={isAnonUser} onValueChange={(v) => draft.update({ anonymous: v })} accessibilityLabel={t('review.anonymous')} />
      </Card>
      {department && (
        <Txt variant="caption" className="text-center text-muted">
          {t('review.sentTo')} <Txt variant="caption" weight="semibold">{department.name}</Txt>
        </Txt>
      )}
    </Screen>
  );
}
