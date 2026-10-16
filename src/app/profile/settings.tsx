import { Linking, PermissionsAndroid, Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bell, Mail, MessageSquare, type LucideIcon } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { Card, Segmented, Toggle, Txt, toast } from '@/components/ui';
import { colors, shadows } from '@/constants/theme';
import { useAuth } from '@/features/auth/store';
import { useSettings } from '@/features/settings/store';
import i18n from '@/i18n';
import { errorMessage } from '@/services/errors';
import { updateProfile } from '@/services/users';
import type { Language, TextSize, UserProfile } from '@/types';

type Channel = 'notifyPush' | 'notifySms' | 'notifyEmail';

export default function Settings() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const profile = useAuth((s) => s.profile);
  const { language, textSize, setLanguage, setTextSize } = useSettings();

  // Device setting changes instantly; the account copy is saved in the background.
  const sync = (data: Partial<Pick<UserProfile, Channel | 'language' | 'textSize'>>) => {
    if (user) updateProfile(user.uid, data).catch((e) => toast(errorMessage(e), { tone: 'error' }));
  };

  // Android 13+ needs the runtime POST_NOTIFICATIONS permission before push can be turned on.
  const changeChannel = async (key: Channel, v: boolean) => {
    if (key === 'notifyPush' && v && Platform.OS === 'android' && Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) Linking.openSettings();
      if (result !== PermissionsAndroid.RESULTS.GRANTED) return;
    }
    sync({ [key]: v });
  };

  const changeLanguage = (l: Language) => {
    setLanguage(l);
    i18n.changeLanguage(l);
    sync({ language: l });
  };
  const changeSize = (s: TextSize) => {
    setTextSize(s);
    sync({ textSize: s });
  };

  const channels: { key: Channel; label: string; desc: string; icon: LucideIcon }[] = [
    { key: 'notifyPush', label: t('settings.push'), desc: t('settings.pushDesc'), icon: Bell },
    { key: 'notifySms', label: t('settings.sms'), desc: profile?.phone ? t('settings.smsDesc', { phone: profile.phone }) : t('settings.smsNoPhone'), icon: MessageSquare },
    { key: 'notifyEmail', label: t('settings.email'), desc: profile?.email || t('settings.emailNone'), icon: Mail },
  ];

  return (
    <Screen title={t('settings.title')} contentContainerClassName="gap-6 px-4 pb-8">
      <View>
        <Txt variant="h2" accessibilityRole="header" className="mb-2">
          {t('settings.language')}
        </Txt>
        <Segmented
          accessibilityLabel={t('settings.language')}
          value={language ?? 'en'}
          onChange={changeLanguage}
          options={[
            { id: 'si', label: 'සිංහල', lang: 'si' },
            { id: 'ta', label: 'தமிழ்', lang: 'ta' },
            { id: 'en', label: 'English', lang: 'en' },
          ]}
        />
      </View>

      <View>
        <Txt variant="h2" accessibilityRole="header" className="mb-2">
          {t('settings.textSize')}
        </Txt>
        <Segmented
          accessibilityLabel={t('settings.textSize')}
          value={textSize}
          onChange={changeSize}
          options={(['default', 'large', 'xl'] as const).map((id) => ({ id, label: t(`settings.sizes.${id}`) }))}
        />
        <Card className="mt-3">
          <Txt variant="caption" className="text-muted">
            {t('settings.preview')}
          </Txt>
          <Txt weight="medium" className="mt-1">
            {t('settings.previewText')}
          </Txt>
        </Card>
      </View>

      <View>
        <Txt variant="h2" accessibilityRole="header" className="mb-2">
          {t('settings.notifyBy')}
        </Txt>
        <View style={shadows.card} className="rounded-card bg-white">
          {channels.map((c, i) => {
            const Icon = c.icon;
            return (
              <View key={c.key} className={`flex-row items-center gap-3 py-1.5 pl-4 pr-1 ${i ? 'border-t border-line' : ''}`}>
                <Icon size={20} color={colors.primary} />
                <View className="flex-1 py-1">
                  <Txt weight="medium">{c.label}</Txt>
                  <Txt variant="caption" className="text-muted">
                    {c.desc}
                  </Txt>
                </View>
                <Toggle value={!!profile?.[c.key]} disabled={!profile} onValueChange={(v) => changeChannel(c.key, v)} accessibilityLabel={c.label} />
              </View>
            );
          })}
        </View>
        <Txt variant="caption" className="mt-2 text-muted">
          {t('settings.channelsNote')}
        </Txt>
      </View>
    </Screen>
  );
}
