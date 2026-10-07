import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { metrics, useTheme } from '@/theme';

import { Text } from './text';

export type ButtonVariant = 'primary' | 'secondary' | 'onInkPrimary' | 'onInkSecondary';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
}

/**
 * The mockups' buttons are all 44 high with a radius of 12. The design system
 * doc says 48 for the primary; the mockups say 44 and the mockups win.
 */
export function Button({ label, onPress, variant = 'secondary', style }: ButtonProps) {
  const { colors } = useTheme();

  const look: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: colors.accent },
    secondary: {
      backgroundColor: colors.surface,
      borderWidth: metrics.button.borderWidth,
      borderColor: colors.controlBorder,
    },
    onInkPrimary: { backgroundColor: colors.textOnInk },
    onInkSecondary: {
      backgroundColor: 'transparent',
      borderWidth: metrics.button.borderWidth,
      borderColor: colors.mutedTextOnInk,
    },
  };

  const bold = variant === 'primary' || variant === 'onInkPrimary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.base, look[variant], pressed && styles.pressed, style]}
    >
      <Text
        variant={bold ? 'buttonPrimary' : 'buttonSecondary'}
        color={buttonTextColour(variant, colors)}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function buttonTextColour(
  variant: ButtonVariant,
  colors: ReturnType<typeof useTheme>['colors'],
): string {
  switch (variant) {
    case 'primary':
      return colors.textOnAccent;
    case 'secondary':
      return colors.ink;
    case 'onInkPrimary':
      return colors.ink;
    case 'onInkSecondary':
      return colors.textOnInk;
  }
}

const styles = StyleSheet.create({
  base: {
    height: metrics.button.height,
    borderRadius: metrics.button.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
});
