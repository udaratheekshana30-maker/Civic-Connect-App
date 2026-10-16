import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import { Logo } from '@/components/brand/Logo';
import { Screen } from '@/components/layout/Screen';
import { Button, Txt } from '@/components/ui';
import { colors, shadows } from '@/constants/theme';
import i18n, { deviceLanguage } from '@/i18n';
import { useSettings } from '@/features/settings/store';
import type { Language } from '@/types';

const languages: { id: Language; native: string; english?: string }[] = [
  { id: 'si', native: 'සිංහල', english: 'Sinhala' },
  { id: 'ta', native: 'தமிழ்', english: 'Tamil' },
  { id: 'en', native: 'English' },
];

export default function LanguageSelect() {
  const { t } = useTranslation();
  const { language, onboarded, setLanguage } = useSettings();
  const [selected, setSelected] = useState<Language>(language ?? deviceLanguage());

  const choose = (l: Language) => {
    setSelected(l);
    i18n.changeLanguage(l); // preview the UI in the chosen language immediately
  };

  const onContinue = () => {
    setLanguage(selected);
    if (onboarded) router.back();
    else router.push('/(auth)/onboarding');
  };

  return (
    <Screen footer={<Button full label={t('common.continue')} onPress={onContinue} />}>
      <View className="px-4 pt-8">
        <Logo size={56} tone="onLight" />
        <Txt variant="h1" accessibilityRole="header" className="mt-6">
          {t('language.title')}
        </Txt>
        <Txt className="mt-1 text-muted">{t('language.subtitle')}</Txt>
        <View accessibilityRole="radiogroup" accessibilityLabel={t('language.a11yGroup')} className="mt-8 gap-3">
          {languages.map((l) => {
            const active = selected === l.id;
            return (
              <Pressable
                key={l.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => choose(l.id)}
                style={shadows.card}
                className={`flex-row items-center gap-4 rounded-card border-2 px-5 py-5 ${active ? 'border-primary bg-primary-light/40' : 'border-transparent bg-white'}`}
              >
                <View className="flex-1">
                  <Txt variant="title" weight="semibold" lang={l.id}>
                    {l.native}
                  </Txt>
                  {l.english && (
                    <Txt variant="bodySm" lang="en" className="mt-0.5 text-muted">
                      {l.english}
                    </Txt>
                  )}
                </View>
                <View className={`h-7 w-7 items-center justify-center rounded-full border-2 ${active ? 'border-primary bg-primary' : 'border-line'}`}>
                  {active && <Check size={16} color={colors.white} strokeWidth={3} />}
                </View>
              </Pressable>
            );
          })}
        </View>
        <Txt variant="caption" className="mt-6 text-center text-muted">
          {t('language.note')}
        </Txt>
      </View>
    </Screen>
  );
}
