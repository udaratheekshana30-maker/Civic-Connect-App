import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  NotoSansSinhala_400Regular,
  NotoSansSinhala_500Medium,
  NotoSansSinhala_600SemiBold,
  NotoSansSinhala_700Bold,
} from '@expo-google-fonts/noto-sans-sinhala';
import {
  NotoSansTamil_400Regular,
  NotoSansTamil_500Medium,
  NotoSansTamil_600SemiBold,
  NotoSansTamil_700Bold,
} from '@expo-google-fonts/noto-sans-tamil';
import type { Language } from '@/types';

export const fontAssets = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  NotoSansSinhala_400Regular,
  NotoSansSinhala_500Medium,
  NotoSansSinhala_600SemiBold,
  NotoSansSinhala_700Bold,
  NotoSansTamil_400Regular,
  NotoSansTamil_500Medium,
  NotoSansTamil_600SemiBold,
  NotoSansTamil_700Bold,
};

export type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

// Android can't pick a weight from `fontWeight` for custom fonts, so each
// weight is its own family. Script-specific families keep Sinhala/Tamil crisp.
const families: Record<Language, Record<Weight, string>> = {
  en: { regular: 'Inter_400Regular', medium: 'Inter_500Medium', semibold: 'Inter_600SemiBold', bold: 'Inter_700Bold' },
  si: {
    regular: 'NotoSansSinhala_400Regular',
    medium: 'NotoSansSinhala_500Medium',
    semibold: 'NotoSansSinhala_600SemiBold',
    bold: 'NotoSansSinhala_700Bold',
  },
  ta: {
    regular: 'NotoSansTamil_400Regular',
    medium: 'NotoSansTamil_500Medium',
    semibold: 'NotoSansTamil_600SemiBold',
    bold: 'NotoSansTamil_700Bold',
  },
};

export const fontFamily = (lang: Language, weight: Weight) => families[lang][weight];
