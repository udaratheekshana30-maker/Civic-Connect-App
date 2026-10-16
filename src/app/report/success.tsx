import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Check, Clock, CloudUpload, Copy } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { Button, IconButton, Txt, toast } from '@/components/ui';
import { statuses } from '@/constants/statuses';
import { colors } from '@/constants/theme';
import { useDisplayName } from '@/features/auth/store';
import type { StatusKey } from '@/types';

const next: StatusKey[] = ['review', 'assigned', 'progress', 'resolved'];

export default function ReportSubmitted() {
  const { t } = useTranslation();
  const { id, queued } = useLocalSearchParams<{ id?: string; queued?: string }>();
  const name = useDisplayName().split(' ')[0];
  const [copied, setCopied] = useState(false);
  const isQueued = queued === '1';

  const copy = async () => {
    await Clipboard.setStringAsync(`#${id}`);
    setCopied(true);
    toast(t('success.copied'));
  };

  return (
    <Screen
      className="bg-white"
      onBack={false}
      footer={
        <View className="gap-2">
          {id ? <Button full label={t('success.track')} onPress={() => router.replace(`/report-status/${id}`)} /> : null}
          <Button full variant={id ? 'text' : 'primary'} label={t('success.home')} onPress={() => router.replace('/(tabs)')} />
        </View>
      }
    >
      <View className="items-center px-5 pt-8">
        <Animated.View entering={ZoomIn.duration(300)}>
          <View className="h-24 w-24 items-center justify-center rounded-full bg-primary-light">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary">
            {isQueued ? <CloudUpload size={32} color={colors.white} /> : <Check size={36} color={colors.white} strokeWidth={3} />}
          </View>
          </View>
        </Animated.View>
        <Txt variant="h1" accessibilityRole="header" className="mt-6 text-center">
          {isQueued ? t('success.queuedTitle') : t('success.title')}
        </Txt>
        <Txt className="mt-1.5 text-center text-muted">{isQueued ? t('success.queuedBody') : name ? t('success.body', { name }) : t('success.bodyNoName')}</Txt>

        {id && (
          <View className="mt-5 flex-row items-center gap-2 rounded-btn border border-line bg-canvas py-1 pl-4 pr-1">
            <Txt variant="bodySm" className="text-muted">
              {t('success.reportId')}
            </Txt>
            <Txt variant="h2" weight="bold" lang="en" style={{ letterSpacing: 1 }}>
              #{id}
            </Txt>
            <IconButton icon={copied ? Check : Copy} color={colors.primary} size={20} accessibilityLabel={t('success.copyA11y')} onPress={copy} />
          </View>
        )}
      </View>

      <View className="mx-4 mt-7 rounded-card bg-canvas p-4">
        <Txt variant="h2" accessibilityRole="header">
          {t('success.next')}
        </Txt>
        <View className="mt-3">
          {next.map((k, i) => {
            const s = statuses[k];
            const Icon = s.icon;
            return (
              <View key={k} className={`flex-row gap-3 ${i < next.length - 1 ? 'pb-4' : ''}`}>
                {i < next.length - 1 && <View className="absolute bottom-0 left-[17px] top-9 w-0.5 bg-line" />}
                <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
                  <Icon size={18} color={s.color} />
                </View>
                <View className="flex-1 pt-1">
                  <Txt weight="semibold">{t(`timeline.title.${k}`)}</Txt>
                  <Txt variant="bodySm" className="text-muted">
                    {t(`success.steps.${k}`)}
                  </Txt>
                </View>
              </View>
            );
          })}
        </View>
        <View className="mt-4 flex-row items-center gap-2 rounded-btn bg-white px-3 py-2.5">
          <Clock size={16} color={colors.primary} />
          <Txt variant="bodySm" weight="medium">
            {t('success.reviewTime')}
          </Txt>
        </View>
      </View>
    </Screen>
  );
}
