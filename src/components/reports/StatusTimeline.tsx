import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import { Txt } from '@/components/ui';
import { statusFlow, statuses } from '@/constants/statuses';
import { colors } from '@/constants/theme';
import type { Report, StatusKey, TimelineEntry } from '@/types';
import { formatDate, formatTime } from '@/utils/format';

interface Step {
  key: StatusKey;
  date?: Report['createdAt'];
  remark?: string;
  by?: string;
}

/**
 * Vertical progress: Submitted → Under Review → Assigned → In Progress → Resolved.
 * "Submitted" comes from report.createdAt; later steps from the timeline entries
 * officers write (latest entry per status wins, so remarks stay current).
 */
export function StatusTimeline({ report, entries }: { report: Report; entries: TimelineEntry[] }) {
  const { t } = useTranslation();
  const latest = new Map<StatusKey, TimelineEntry>();
  entries.forEach((e) => latest.set(e.status, e));

  const keys: StatusKey[] =
    report.status === 'rejected' ? [...statusFlow.filter((k) => k === 'submitted' || latest.has(k)), 'rejected'] : statusFlow;
  const currentIdx = keys.indexOf(report.status);

  const steps: Step[] = keys.map((key) => {
    const e = latest.get(key);
    if (key === 'submitted') return { key, date: report.createdAt, remark: e?.remark || t('timeline.submittedRemark') };
    return e ? { key, date: e.createdAt, remark: e.remark, by: e.byName } : { key };
  });

  return (
    <View accessibilityRole="list">
      {steps.map((s, i) => {
        const cfg = statuses[s.key];
        const Icon = cfg.icon;
        const done = i < currentIdx;
        const current = i === currentIdx;
        const pending = i > currentIdx;
        const title = t(`timeline.title.${s.key}`);
        return (
          <View
            key={s.key}
            className={`flex-row gap-3 ${i < steps.length - 1 ? 'pb-5' : ''}`}
            accessible
            accessibilityLabel={[title, current ? t('timeline.current') : '', s.date ? formatDate(s.date) : '', s.remark ?? ''].filter(Boolean).join('. ')}
          >
            {i < steps.length - 1 && <View className={`absolute bottom-0 left-[17px] top-9 w-0.5 ${done ? 'bg-primary' : 'bg-line'}`} />}
            <View
              className={`h-9 w-9 items-center justify-center rounded-full border-2 ${done ? 'border-primary bg-primary' : current ? '' : 'border-line bg-white'}`}
              style={current ? { borderColor: cfg.color, backgroundColor: cfg.tint } : undefined}
            >
              {done ? <Check size={16} color={colors.white} strokeWidth={3} /> : <Icon size={16} color={current ? cfg.color : colors.placeholder} />}
            </View>
            <View className="flex-1 pt-1">
              <View className="flex-row items-baseline justify-between gap-2">
                <Txt weight="semibold" className={`flex-1 ${pending ? 'text-muted' : 'text-ink'}`}>
                  {title}
                </Txt>
                {s.date && (
                  <Txt variant="caption" className="text-muted">
                    {formatDate(s.date)}
                  </Txt>
                )}
              </View>
              {s.date ? (
                <>
                  <Txt variant="caption" className="text-muted">
                    {formatTime(s.date)}
                    {s.by ? ` · ${s.by}` : ''}
                  </Txt>
                  {!!s.remark && (
                    <View className={`mt-1.5 ${current ? 'rounded-btn bg-canvas px-3 py-2' : ''}`}>
                      <Txt variant="bodySm">{s.remark}</Txt>
                    </View>
                  )}
                </>
              ) : (
                <Txt variant="bodySm" className="text-muted">
                  {t(`timeline.pending.${s.key}`)}
                </Txt>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
