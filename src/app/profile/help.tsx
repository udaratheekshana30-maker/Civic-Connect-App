import { useState } from 'react';
import { Linking, Pressable, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Headphones, Search } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { Button, Txt, useTextScale } from '@/components/ui';
import { colors, shadows } from '@/constants/theme';

const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL;

export default function HelpFaq() {
  const { t } = useTranslation();
  const scale = useTextScale();
  const faqs = t('help.faqs', { returnObjects: true }) as { q: string; a: string }[];
  const [open, setOpen] = useState<number | null>(0);
  const [q, setQ] = useState('');
  const list = faqs.map((f, i) => ({ ...f, i })).filter((f) => !q || (f.q + f.a).toLowerCase().includes(q.toLowerCase()));

  return (
    <Screen
      title={t('help.title')}
      contentContainerClassName="px-4 pb-6"
      footer={
        SUPPORT_EMAIL ? (
          <Button full variant="secondary" icon={Headphones} label={t('help.contact')} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=CivicConnect%20help`)} />
        ) : undefined
      }
    >
      <View className="min-h-[52px] flex-row items-center gap-3 rounded-btn border border-line bg-white px-4">
        <Search size={20} color={colors.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t('help.search')}
          accessibilityLabel={t('help.search')}
          placeholderTextColor={colors.placeholder}
          style={{ flex: 1, fontSize: 16 * scale, color: colors.ink, paddingVertical: 12 }}
        />
      </View>
      <Txt variant="h2" accessibilityRole="header" className="mb-2 mt-5">
        {t('help.common')}
      </Txt>
      <View style={shadows.card} className="rounded-card bg-white">
        {list.map((f, idx) => {
          const isOpen = open === f.i;
          return (
            <View key={f.q} className={idx ? 'border-t border-line' : ''}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} onPress={() => setOpen(isOpen ? null : f.i)} className="min-h-14 flex-row items-center gap-3 px-4 py-3">
                <Txt weight="medium" className="flex-1">
                  {f.q}
                </Txt>
                {isOpen ? <ChevronUp size={20} color={colors.muted} /> : <ChevronDown size={20} color={colors.muted} />}
              </Pressable>
              {isOpen && (
                <Animated.View entering={FadeIn.duration(200)}>
                  <Txt variant="bodySm" className="px-4 pb-4 text-muted">
                    {f.a}
                  </Txt>
                </Animated.View>
              )}
            </View>
          );
        })}
        {list.length === 0 && <Txt className="px-4 py-6 text-center text-muted">{t('help.none')}</Txt>}
      </View>
    </Screen>
  );
}
