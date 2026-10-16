import { useEffect } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { create } from 'zustand';
import { subscribeNotifications } from '@/services/notifications';
import { useAuth } from '@/features/auth/store';
import i18n from '@/i18n';
import type { AppNotification } from '@/types';

interface NotificationsState {
  items: AppNotification[];
  loading: boolean;
  error: unknown;
}

export const useNotifications = create<NotificationsState>(() => ({ items: [], loading: true, error: null }));
export const useUnreadCount = () => useNotifications((s) => s.items.filter((n) => !n.read).length);

// Show phone notifications even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

const CHANNEL = 'updates';

async function preparePhoneNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: i18n.t('notifications.title'),
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#2E7D32',
    });
  }
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted && perm.canAskAgain) await Notifications.requestPermissionsAsync();
}

/** Same title/body the Notifications screen shows. */
function showOnPhone(n: AppNotification) {
  const title = n.status ? i18n.t(n.type === 'status' ? `notifications.statusTitle.${n.status}` : 'notifications.remarkTitle') : n.title;
  const body = n.body || (n.status ? i18n.t(`status.${n.status}.plain`) : '');
  return Notifications.scheduleNotificationAsync({
    content: { title, body: `#${n.reportId} · ${body}`, data: { reportId: n.reportId } },
    trigger: Platform.OS === 'android' ? { channelId: CHANNEL } : null,
  });
}

/** One realtime subscription for the whole app (Home bell + Notifications screen + phone alerts). */
export function NotificationsListener() {
  const uid = useAuth((s) => s.user?.uid);
  const pushOn = useAuth((s) => s.profile?.notifyPush !== false);

  useEffect(() => {
    if (uid && pushOn) preparePhoneNotifications().catch(() => {});
  }, [uid, pushOn]);

  // Tapping a phone notification opens that report.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const reportId = r.notification.request.content.data?.reportId;
      if (typeof reportId === 'string') router.push(`/report-status/${reportId}`);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!uid) {
      useNotifications.setState({ items: [], loading: false, error: null });
      return;
    }
    useNotifications.setState({ loading: true, error: null });
    // The first snapshot is history (already in the list); only alert for ones that arrive after it.
    let seen: Set<string> | null = null;
    return subscribeNotifications(
      uid,
      (items) => {
        if (seen && useAuth.getState().profile?.notifyPush !== false) {
          items.filter((n) => !n.read && !seen!.has(n.id)).forEach((n) => showOnPhone(n).catch(() => {}));
        }
        seen = new Set(items.map((n) => n.id));
        useNotifications.setState({ items, loading: false, error: null });
      },
      (error) => useNotifications.setState({ loading: false, error }),
    );
  }, [uid]);
  return null;
}
