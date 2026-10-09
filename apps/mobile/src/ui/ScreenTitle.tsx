import { Pressable, StyleSheet, View } from 'react-native';

import { metrics, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './text';

export interface ScreenTitleProps {
  overline?: string;
  title: string;
  action?: { icon: IconName; label: string; onPress?: () => void };
}

/** The overline, the big title, and an optional round button on the right. */
export function ScreenTitle({ overline, title, action }: ScreenTitleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titles}>
        {overline ? (
          <Text variant="overline" tone="muted">
            {overline}
          </Text>
        ) : null}
        <Text variant="screenTitle">{title}</Text>
      </View>
      {action ? (
        <RoundIconButton icon={action.icon} label={action.label} onPress={action.onPress} />
      ) : null}
    </View>
  );
}

export interface RoundIconButtonProps {
  icon: IconName;
  label: string;
  onPress?: () => void;
}

export function RoundIconButton({ icon, label, onPress }: RoundIconButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        { backgroundColor: colors.surface, borderColor: colors.controlBorder },
        pressed && styles.pressed,
      ]}
    >
      <Icon name={icon} size={metrics.roundIconButton.glyph} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: metrics.header.inset,
  },
  titles: { gap: metrics.header.titleGap, flexShrink: 1 },
  round: {
    width: metrics.roundIconButton.size,
    height: metrics.roundIconButton.size,
    borderRadius: metrics.roundIconButton.radius,
    borderWidth: metrics.roundIconButton.borderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
