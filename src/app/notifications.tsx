import { useState } from 'react';
import { Pressable, SectionList, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BellOff, Clock, Info } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { EmptyState, ErrorState, SkeletonCard, Txt, toast } from '@/components/ui';
import { statuses } from '@/constants/statuses';
import { colors, shadows } from '@/constants/theme';
import { useNotifications } from '@/features/notifications/store';
import { errorMessage } from '@/services/errors';
import { markAllRead, markRead } from '@/services/notifications';
import type { AppNotification } from '@/types';
import { formatDateTime, isToday, timeAgo } from '@/utils/format';

export default function Notifications() {
  const { t } = useTranslation();
  const { items, loading, error } = useNotifications();
  const [busy, setBusy] = useState(false);
  const unread = items.filter((n) => !n.read).length;

  const sections = [
    { key: 'today', title: t('notifications.today'), data: items.filter((n) => isToday(n.createdAt)) },
    { key: 'earlier', title: t('notifications.earlier'), data: items.filter((n) => !isToday(n.createdAt)) },
  ].filter((s) => s.data.length);

  const open = (n: AppNotification) => {
    if (!n.read) markRead(n.id).catch(() => {});
    router.push(`/report-status/${n.reportId}`);
  };

  const readAll = async () => {
    setBusy(true);
    try {
      await markAllRead(items);
    } catch (e) {
      toast(errorMessage(e), { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      title={t('notifications.title')}
      scroll={false}
      actions={
        <Pressable accessibilityRole="button" disabled={!unread || busy} onPress={readAll} className="h-11 justify-center rounded-lg px-2">
          <Txt variant="bodySm" weight="semibold" className={unread ? 'text-primary' : 'text-placeholder'}>
            {t('notifications.markAll')}
          </Txt>
        </Pressable>
      }
    >
      {loading ? (
        <View className="gap-2 px-4">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : error ? (
        <ErrorState body={errorMessage(error)} />
      ) : items.length === 0 ? (
        <EmptyState icon={BellOff} title={t('notifications.emptyTitle')} body={t('notifications.emptyBody')} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Txt variant="bodySm" weight="semibold" accessibilityRole="header" className="mb-2 mt-3 text-muted">
              {section.title}
            </Txt>
          )}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={({ item: n }) => {
            const s = n.status ? statuses[n.status] : null;
            const Icon = s?.icon ?? Info;
            const title = n.status ? t(n.type === 'status' ? `notifications.statusTitle.${n.status}` : 'notifications.remarkTitle') : n.title;
            const body = n.body || (n.status ? t(`status.${n.status}.plain`) : '');
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${n.read ? '' : `${t('notifications.unread')}. `}${title}. ${body}. ${timeAgo(n.createdAt)}`}
                onPress={() => open(n)}
                style={shadows.card}
                className={`flex-row items-start gap-3 rounded-card p-4 active:opacity-90 ${n.read ? 'bg-white' : 'bg-[#EDF7EE]'}`}
              >
                <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: s?.tint ?? colors.primaryLight }}>
                  <Icon size={20} color={s?.color ?? colors.primary} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-start justify-between gap-2">
                    <Txt weight="bold" className="flex-1">
                      {title}
                    </Txt>
                    {!n.read && <View className="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />}
                  </View>
                  <Txt variant="caption" weight="medium" className="mt-0.5 text-muted">
                    #{n.reportId}
                  </Txt>
                  {!!body && (
                    <Txt variant="bodySm" className="mt-1">
                      {body}
                    </Txt>
                  )}
                  <View className="mt-2 flex-row items-center gap-1.5">
                    <Clock size={14} color={colors.primary} />
                    <Txt variant="caption" weight="semibold">
                      {timeAgo(n.createdAt)} · {formatDateTime(n.createdAt)}
                    </Txt>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}
