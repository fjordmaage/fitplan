import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { text, useTheme } from '@/theme';

type Role = keyof typeof text;

export interface TextProps extends RNTextProps {
  variant: Role;
  /** A palette key, or any colour the caller has already resolved. */
  tone?: 'ink' | 'muted' | 'onInk' | 'mutedOnInk' | 'accent' | 'onAccent' | 'busy';
  color?: string;
}

/**
 * Every piece of text in the app goes through here, so that no screen can
 * choose a font size, a weight or a colour of its own.
 */
export function Text({ variant, tone = 'ink', color, style, ...rest }: TextProps) {
  const { colors } = useTheme();
  const tones: Record<NonNullable<TextProps['tone']>, string> = {
    ink: colors.ink,
    muted: colors.mutedText,
    onInk: colors.textOnInk,
    mutedOnInk: colors.mutedTextOnInk,
    accent: colors.accent,
    onAccent: colors.textOnAccent,
    busy: colors.busyText,
  };
  return (
    <RNText
      style={[text[variant] as TextStyle, { color: color ?? tones[tone] }, style]}
      {...rest}
    />
  );
}
