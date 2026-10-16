import { Text, type TextProps } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fontFamily, type Weight } from '@/constants/fonts';
import { textScale, useSettings } from '@/features/settings/store';
import type { Language } from '@/types';

// Type scale from the design (px, line-height). Body text is never below 16.
export const typeScale = {
  display: [32, 40],
  h1: [24, 32],
  title: [22, 28],
  h2: [18, 24],
  body: [16, 24],
  bodySm: [15, 20],
  caption: [13, 18],
  tiny: [11, 14],
  number: [24, 30],
} as const;

export type TxtVariant = keyof typeof typeScale;

const defaultWeight: Partial<Record<TxtVariant, Weight>> = {
  display: 'bold',
  h1: 'bold',
  title: 'bold',
  h2: 'semibold',
  number: 'bold',
};

export interface TxtProps extends TextProps {
  variant?: TxtVariant;
  weight?: Weight;
  /** force a script font (e.g. language names on the picker) */
  lang?: Language;
  className?: string;
}

/** Multiplier from the user's Text Size setting (1 / 1.15 / 1.3). */
export function useTextScale() {
  const size = useSettings((s) => s.textSize);
  return textScale[size];
}

/**
 * All app text goes through Txt. Colour and margins come from `className`;
 * size and font come from `variant`/`weight` so the Text Size setting and the
 * Sinhala/Tamil fonts apply everywhere.
 */
export function Txt({ variant = 'body', weight, lang, className = 'text-ink', style, ...rest }: TxtProps) {
  const { i18n } = useTranslation();
  const scale = useTextScale();
  const [size, line] = typeScale[variant];
  const language = lang ?? ((i18n.language as Language) || 'en');
  return (
    <Text
      maxFontSizeMultiplier={1.4}
      className={className}
      style={[
        {
          fontSize: Math.round(size * scale),
          // Sinhala/Tamil glyphs are taller; give them a little more room.
          lineHeight: Math.round(line * scale * (language === 'en' ? 1 : 1.15)),
          fontFamily: fontFamily(language, weight ?? defaultWeight[variant] ?? 'regular'),
        },
        style,
      ]}
      {...rest}
    />
  );
}
