import type { ReactNode } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react-native';
import { IconButton, Txt } from '@/components/ui';

interface AppBarProps {
  title: string;
  /** default: router.back(); pass false to hide the back button */
  onBack?: (() => void) | false;
  actions?: ReactNode;
}

export function AppBar({ title, onBack, actions }: AppBarProps) {
  const { t } = useTranslation();
  return (
    <View className="h-14 flex-row items-center gap-1 px-1">
      {onBack === false ? (
        <View className="w-3" />
      ) : (
        <IconButton icon={ArrowLeft} accessibilityLabel={t('common.goBack')} onPress={onBack || (() => router.back())} />
      )}
      <Txt variant="h2" numberOfLines={1} accessibilityRole="header" className="flex-1 text-ink">
        {title}
      </Txt>
      {actions && <View className="flex-row items-center pr-2">{actions}</View>}
    </View>
  );
}
