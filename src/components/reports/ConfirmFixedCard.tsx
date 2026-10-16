import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { CircleCheck, PartyPopper, RotateCcw, ThumbsUp } from 'lucide-react-native';
import { Button, Txt, toast } from '@/components/ui';
import { colors } from '@/constants/theme';
import { errorMessage } from '@/services/errors';
import { confirmResolved } from '@/services/reports';
import type { Report } from '@/types';
import { formatDate } from '@/utils/format';

/** Shown to the reporter when status = Resolved: "Is this issue fixed?" */
export function ConfirmFixedCard({ report, departmentName }: { report: Report; departmentName: string }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<'yes' | 'no' | null>(null);

  const answer = async (fixed: boolean) => {
    setBusy(fixed ? 'yes' : 'no');
    try {
      await confirmResolved(report.id, fixed);
    } catch (e) {
      toast(errorMessage(e), { tone: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const state = report.resolvedConfirmed;

  return (
    <View className="rounded-card border-2 border-success bg-primary-light p-4" accessibilityLiveRegion="polite">
      {state === null || state === undefined ? (
        <Animated.View entering={FadeIn.duration(150)} key="ask">
          <View className="flex-row items-start gap-3">
            <CircleCheck size={24} color={colors.success} />
            <View className="flex-1">
              <Txt variant="h2">{t('statusScreen.fixedQuestion')}</Txt>
              <Txt variant="bodySm" className="mt-0.5 text-ink/80">
                {t('statusScreen.fixedBody', { dept: departmentName, date: formatDate(report.updatedAt) })}
              </Txt>
            </View>
          </View>
          <View className="mt-4 flex-row gap-2">
            <Button size="sm" icon={ThumbsUp} label={t('statusScreen.yesFixed')} loading={busy === 'yes'} disabled={!!busy} onPress={() => answer(true)} className="flex-1 px-2" />
            <Button size="sm" variant="dangerOutline" icon={RotateCcw} label={t('statusScreen.notFixed')} loading={busy === 'no'} disabled={!!busy} onPress={() => answer(false)} className="flex-1 px-2" />
          </View>
        </Animated.View>
      ) : state ? (
        <Animated.View entering={FadeIn.duration(200)} key="ok">
          <View className="flex-row items-start gap-3">
          <PartyPopper size={24} color={colors.primary} />
          <View className="flex-1">
            <Txt variant="h2">{t('statusScreen.thanksTitle')}</Txt>
            <Txt variant="bodySm" className="mt-0.5 text-ink/80">
              {t('statusScreen.thanksBody')}
            </Txt>
          </View>
          </View>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(200)} key="re">
          <View className="flex-row items-start gap-3">
          <RotateCcw size={24} color={colors.danger} />
          <View className="flex-1">
            <Txt variant="h2">{t('statusScreen.reopenedTitle')}</Txt>
            <Txt variant="bodySm" className="mt-0.5 text-ink/80">
              {t('statusScreen.reopenedBody', { dept: departmentName })}
            </Txt>
            <Pressable accessibilityRole="button" onPress={() => answer(true)} className="mt-1 h-11 justify-center self-start">
              <Txt variant="bodySm" weight="semibold" className="text-primary">
                {t('statusScreen.actuallyFixed')}
              </Txt>
            </Pressable>
          </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
