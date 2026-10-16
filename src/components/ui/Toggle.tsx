import { Switch, View } from 'react-native';
import { colors } from '@/constants/theme';

interface ToggleProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  /** what the switch controls, for screen readers */
  accessibilityLabel: string;
  disabled?: boolean;
}

export function Toggle({ value, onValueChange, accessibilityLabel, disabled }: ToggleProps) {
  return (
    <View className="h-12 min-w-14 items-center justify-center">
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        trackColor={{ false: '#D1D5DB', true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );
}
