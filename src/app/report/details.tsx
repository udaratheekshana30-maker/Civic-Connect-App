import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { CalendarClock, ChevronDown, SignalHigh, SignalLow, SignalMedium, X } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { MediaPicker } from '@/components/reports/MediaPicker';
import { Button, IconButton, Segmented, Stepper, TextField, Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { MAX_DESCRIPTION, MAX_MEDIA, useDraft } from '@/features/report-draft/store';
import type { Severity } from '@/types';
import { formatDateTime } from '@/utils/format';

export default function ReportDetails() {
  const { t } = useTranslation();
  const { description, media, severity, seenAt, update } = useDraft();
  const canNext = description.trim().length > 0 || media.length > 0;

  const pickWhen = () => {
    const base = seenAt ? new Date(seenAt) : new Date();
    DateTimePickerAndroid.open({
      value: base,
      mode: 'date',
      maximumDate: new Date(),
      onChange: (e, date) => {
        if (e.type !== 'set' || !date) return;
        DateTimePickerAndroid.open({
          value: date,
          mode: 'time',
          onChange: (e2, time) => {
            if (e2.type !== 'set' || !time) return;
            const d = new Date(date);
            d.setHours(time.getHours(), time.getMinutes(), 0, 0);
            update({ seenAt: (d > new Date() ? new Date() : d).toISOString() });
          },
        });
      },
    });
  };

  const severities: { id: Severity; label: string; icon: typeof SignalLow }[] = [
    { id: 'low', label: t('severity.low'), icon: SignalLow },
    { id: 'medium', label: t('severity.medium'), icon: SignalMedium },
    { id: 'high', label: t('severity.high'), icon: SignalHigh },
  ];

  return (
    <Screen
      title={t('report.title')}
      header={<Stepper step={2} />}
      contentContainerClassName="gap-6 px-4 pb-6"
      footer={<Button full label={t('common.next')} disabled={!canNext} onPress={() => router.push('/report/location')} />}
    >
      <View className="rounded-btn bg-primary-light px-3 py-2">
        <Txt variant="bodySm" className="text-primary-dark">
          {t('details.hint')}
        </Txt>
      </View>

      <View>
        <View className="flex-row items-baseline justify-between">
          <Txt variant="bodySm" weight="semibold">
            {t('details.description')}
          </Txt>
          <Txt variant="caption" lang="en" className={description.length >= MAX_DESCRIPTION ? 'text-danger-dark' : 'text-muted'}>
            {description.length}/{MAX_DESCRIPTION}
          </Txt>
        </View>
        <TextField
          className="mt-1.5"
          accessibilityLabel={t('details.description')}
          value={description}
          onChangeText={(v) => update({ description: v.slice(0, MAX_DESCRIPTION) })}
          maxLength={MAX_DESCRIPTION}
          multiline
          placeholder={t('details.placeholder')}
        />
      </View>

      <View>
        <View className="mb-2 flex-row items-baseline justify-between">
          <Txt variant="bodySm" weight="semibold">
            {t('details.evidence')}
          </Txt>
          <Txt variant="caption" className="text-muted">
            {t('details.added', { count: media.length, max: MAX_MEDIA })}
          </Txt>
        </View>
        <MediaPicker value={media} onChange={(m) => update({ media: m })} max={MAX_MEDIA} />
        <Txt variant="caption" className="mt-1 text-muted">
          {t('details.mediaHint')}
        </Txt>
      </View>

      <View>
        <Txt variant="bodySm" weight="semibold" className="mb-2">
          {t('details.severity')} <Txt variant="bodySm" className="text-muted">{t('common.optional')}</Txt>
        </Txt>
        <Segmented options={severities} value={severity} onChange={(v) => update({ severity: v === severity ? null : v })} accessibilityLabel={t('details.severity')} />
        <Txt variant="caption" className="mt-1.5 text-muted">
          {t('details.severityHint')}
        </Txt>
      </View>

      <View>
        <Txt variant="bodySm" weight="semibold" className="mb-1.5">
          {t('details.when')} <Txt variant="bodySm" className="text-muted">{t('common.optional')}</Txt>
        </Txt>
        <View className="min-h-[52px] flex-row items-center rounded-btn border border-line bg-white">
          <Pressable accessibilityRole="button" accessibilityLabel={t('details.when')} onPress={pickWhen} className="min-h-[52px] flex-1 flex-row items-center gap-3 px-3.5">
            <CalendarClock size={20} color={colors.muted} />
            <Txt className={`flex-1 ${seenAt ? 'text-ink' : 'text-placeholder'}`}>{seenAt ? formatDateTime(new Date(seenAt)) : t('details.whenPlaceholder')}</Txt>
            {!seenAt && <ChevronDown size={20} color={colors.muted} />}
          </Pressable>
          {seenAt && <IconButton icon={X} size={20} color={colors.muted} accessibilityLabel={t('common.clear')} onPress={() => update({ seenAt: null })} />}
        </View>
      </View>
    </Screen>
  );
}
