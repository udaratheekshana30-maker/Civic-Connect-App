import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Phone, TriangleAlert } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { Card, Txt, toast } from '@/components/ui';
import { emergencyContacts } from '@/constants/emergency';
import { colors } from '@/constants/theme';

export default function EmergencyContacts() {
  const { t } = useTranslation();

  const call = (number: string) =>
    Linking.openURL(`tel:${number}`).catch(() => toast(t('common.somethingWrong'), { tone: 'error' }));

  return (
    <Screen title={t('emergency.title')} contentContainerClassName="px-4 pb-8">
      <View className="flex-row items-start gap-3 rounded-card bg-danger-light p-4">
        <TriangleAlert size={20} color={colors.danger} />
        <Txt variant="bodySm" className="flex-1 text-danger-dark">
          {t('emergency.warning')}
        </Txt>
      </View>
      <View className="mt-4 gap-3">
        {emergencyContacts.map(({ id, number, icon: Icon }) => {
          const name = t(`emergency.contacts.${id}.name`);
          return (
            <Card key={id} className="flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-danger-light">
                <Icon size={24} color={colors.danger} />
              </View>
              <View className="flex-1">
                <Txt weight="semibold">{name}</Txt>
                <Txt variant="number" lang="en" style={{ letterSpacing: 1 }}>
                  {number}
                </Txt>
                <Txt variant="caption" className="text-muted">
                  {t(`emergency.contacts.${id}.note`)}
                </Txt>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.callNumber', { name, number })}
                onPress={() => call(number)}
                className="h-14 w-14 items-center justify-center rounded-full bg-primary active:bg-primary-dark"
              >
                <Phone size={24} color={colors.white} />
              </Pressable>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
