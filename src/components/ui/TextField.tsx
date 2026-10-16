import { forwardRef, useState, type ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CircleAlert, type LucideIcon } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { fontFamily } from '@/constants/fonts';
import type { Language } from '@/types';
import { Txt, useTextScale } from './Txt';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
  right?: ReactNode;
  prefix?: string;
  className?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, icon: Icon, error, hint, right, prefix, multiline, className = '', style, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const { i18n } = useTranslation();
  const scale = useTextScale();
  const border = error ? 'border-danger' : focused ? 'border-primary' : 'border-line';
  return (
    <View className={className}>
      {label && (
        <Txt variant="bodySm" weight="semibold" className="mb-1.5 text-ink">
          {label}
        </Txt>
      )}
      <View
        className={`flex-row gap-3 rounded-btn border bg-white px-3.5 ${border} ${multiline ? 'min-h-[120px] items-start py-3' : 'min-h-[52px] items-center'}`}
      >
        {Icon && <Icon size={20} color={error ? colors.danger : colors.muted} />}
        {prefix && (
          <View className="border-r border-line pr-3">
            <Txt weight="medium">{prefix}</Txt>
          </View>
        )}
        <TextInput
          ref={ref}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          placeholderTextColor={colors.placeholder}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            {
              flex: 1,
              fontSize: 16 * scale,
              color: colors.ink,
              fontFamily: fontFamily((i18n.language as Language) || 'en', 'regular'),
              paddingVertical: multiline ? 0 : 12,
            },
            style,
          ]}
          {...rest}
        />
        {right}
      </View>
      {error ? (
        <View className="mt-1.5 flex-row items-center gap-1.5" accessibilityLiveRegion="polite">
          <CircleAlert size={16} color={colors.dangerDark} />
          <Txt variant="caption" weight="medium" className="flex-1 text-danger-dark">
            {error}
          </Txt>
        </View>
      ) : hint ? (
        <Txt variant="caption" className="mt-1.5 text-muted">
          {hint}
        </Txt>
      ) : null}
    </View>
  );
});
