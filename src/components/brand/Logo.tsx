import { View } from 'react-native';
import { Building2, MapPin } from 'lucide-react-native';
import { colors } from '@/constants/theme';

/** Building + map-pin mark from the design. Decorative: hidden from screen readers. */
export function Logo({ size = 88, tone = 'onGreen' }: { size?: number; tone?: 'onGreen' | 'onLight' }) {
  const onGreen = tone === 'onGreen';
  const badge = size * 0.38;
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: onGreen ? colors.white : colors.primary }}
      className="items-center justify-center"
    >
      <Building2 size={size * 0.5} color={onGreen ? colors.primary : colors.white} strokeWidth={2} />
      <View
        className="absolute items-center justify-center rounded-full"
        style={{
          width: badge,
          height: badge,
          right: -size * 0.08,
          top: -size * 0.08,
          borderWidth: 3,
          borderColor: onGreen ? colors.white : colors.canvas,
          backgroundColor: onGreen ? colors.primaryDark : colors.white,
        }}
      >
        <MapPin size={size * 0.2} color={onGreen ? colors.white : colors.primary} strokeWidth={2.5} />
      </View>
    </View>
  );
}
