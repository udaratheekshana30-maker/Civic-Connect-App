import { useCallback, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell, ChevronRight, CircleHelp, ClipboardList, Languages, LogOut, PhoneCall, ShieldCheck, Type, UserPen, type LucideIcon } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { Button, Card, Txt, toast } from '@/components/ui';
import { colors, shadows } from '@/constants/theme';
import { useAuth, useDisplayName } from '@/features/auth/store';
import { useOfflineQueue } from '@/features/offline/store';
import { useSettings } from '@/features/settings/store';
import { signOut } from '@/services/auth';
import { errorMessage } from '@/services/errors';
import { profileStats } from '@/services/reports';
import { formatDate, initials } from '@/utils/format';

const langLabel = { en: 'English', si: 'සිංහල', ta: 'தமிழ்' } as const;

interface Item {
  label: string;
  icon: LucideIcon;
  href: Href;
  value?: string;
}

/** Shared by the citizen Profile tab and the authority Account tab. */
export function ProfileScreen({ authority = false }: { authority?: boolean }) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const profile = useAuth((s) => s.profile);
  const name = useDisplayName();
  const language = useSettings((s) => s.language) ?? 'en';
  const textSize = useSettings((s) => s.textSize);
  const pendingCount = useOfflineQueue((s) => s.pending.length);
  const [stats, setStats] = useState<{ reported: number; resolved: number; supported: number } | null>(null);
  const isGuest = !!user?.isAnonymous;

  useFocusEffect(
    useCallback(() => {
      if (!user || authority) return;
      profileStats(user.uid)
        .then(setStats)
        .catch(() => setStats(null));
    }, [user, authority]),
  );

  const logout = () => {
    const doIt = async () => {
      try {
        await signOut();
        router.replace('/(auth)/login');
      } catch (e) {
        toast(errorMessage(e), { tone: 'error' });
      }
    };
    Alert.alert(t('profile.logoutTitle'), isGuest ? t('profile.logoutGuest') : pendingCount ? t('profile.logoutPending', { count: pendingCount }) : t('profile.logoutBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: doIt },
    ]);
  };

  const menu: { group: string; items: Item[] }[] = [
    {
      group: t('profile.account'),
      items: [
        ...(isGuest ? [] : [{ label: t('profile.edit'), icon: UserPen, href: '/profile/edit' as Href }]),
        ...(authority ? [] : [{ label: t('tabs.myReports'), icon: ClipboardList, href: '/(tabs)/my-reports' as Href, value: stats ? String(stats.reported) : undefined }]),
      ],
    },
    {
      group: t('profile.preferences'),
      items: [
        { label: t('settings.language'), icon: Languages, href: '/profile/settings', value: langLabel[language] },
        { label: t('settings.notifications'), icon: Bell, href: '/profile/settings' },
        { label: t('settings.textSize'), icon: Type, href: '/profile/settings', value: t(`settings.sizes.${textSize}`) },
      ],
    },
    {
      group: t('profile.support'),
      items: [
        { label: t('emergency.title'), icon: PhoneCall, href: '/emergency' },
        { label: t('help.title'), icon: CircleHelp, href: '/profile/help' },
        { label: t('profile.privacy'), icon: ShieldCheck, href: '/profile/help' },
      ],
    },
  ].filter((m) => m.items.length);

  return (
    <Screen title={t('tabs.profile')} onBack={false} inTabs contentContainerClassName="px-4 pb-8">
      <Card className="p-5">
        <View className="flex-row items-center gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary" importantForAccessibility="no">
            <Txt variant="h1" lang="en" className="text-white">
              {isGuest ? '?' : initials(name)}
            </Txt>
          </View>
          <View className="flex-1">
            <Txt variant="title" numberOfLines={1}>
              {isGuest ? t('profile.guest') : name || user?.email}
            </Txt>
            <Txt variant="bodySm" className="text-muted">
              {isGuest
                ? t('profile.guestBody')
                : authority
                  ? t(`roles.${profile?.role ?? 'officer'}`)
                  : t('profile.memberSince', { date: formatDate(profile?.createdAt ?? null) })}
            </Txt>
          </View>
        </View>
        {!authority && (
          <View className="mt-5 flex-row rounded-btn bg-canvas py-3">
            {(['reported', 'resolved', 'supported'] as const).map((k, i) => (
              <View key={k} className={`flex-1 items-center ${i ? 'border-l border-line' : ''}`} accessible accessibilityLabel={`${t(`profile.stats.${k}`)}: ${stats?.[k] ?? '—'}`}>
                <Txt variant="number" lang="en">
                  {stats ? String(stats[k]) : '—'}
                </Txt>
                <Txt variant="caption" className="text-muted">
                  {t(`profile.stats.${k}`)}
                </Txt>
              </View>
            ))}
          </View>
        )}
        {isGuest && <Button className="mt-4" variant="secondary" size="sm" label={t('profile.createAccount')} onPress={() => logout()} />}
      </Card>

      {menu.map((m) => (
        <View key={m.group} className="mt-5">
          <Txt variant="bodySm" weight="semibold" accessibilityRole="header" className="mb-2 px-1 text-muted">
            {m.group}
          </Txt>
          <View style={shadows.card} className="overflow-hidden rounded-card bg-white">
            {m.items.map((it, i) => {
              const Icon = it.icon;
              return (
                <Pressable
                  key={it.label}
                  accessibilityRole="button"
                  onPress={() => router.push(it.href)}
                  className={`min-h-14 flex-row items-center gap-3 px-4 py-3 active:bg-canvas ${i ? 'border-t border-line' : ''}`}
                >
                  <Icon size={20} color={colors.primary} />
                  <Txt className="flex-1">{it.label}</Txt>
                  {it.value && (
                    <Txt variant="bodySm" className="text-muted">
                      {it.value}
                    </Txt>
                  )}
                  <ChevronRight size={20} color={colors.placeholder} />
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <Button full variant="dangerOutline" icon={LogOut} label={t('profile.logout')} className="mt-6" onPress={logout} />
      <Txt variant="caption" className="mt-3 text-center text-muted">
        {t('profile.version')}
      </Txt>
    </Screen>
  );
}
