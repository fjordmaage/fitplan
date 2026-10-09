/**
 * Choice controls shared across screens: the three selected-state families
 * the mockups use, the custom switch, and the stepper.
 *
 * Selected-state families (docs/design):
 * - ring: 2px ink border, surface fill, bold text (segmented cells, pills,
 *   stacked rows) — most choices.
 * - fill: ink background, onInk text (the effort 1-10 grid only).
 * - action: always-unselected 600-weight chips that fire immediately.
 */

import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { metrics, text as textRoles, useTheme } from '@/theme';

import { Text } from './text';

const c = metrics.choice;

export type ChoiceShape = 'cell' | 'cellTall' | 'cellDense' | 'pill' | 'row';

/** One choice in a single-select set. Ring style when selected. */
export function ChoiceButton({
  label,
  selected,
  onPress,
  shape = 'cell',
  style,
}: {
  label: string;
  selected: boolean;
  onPress?: () => void;
  shape?: ChoiceShape;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const geometry: Record<ChoiceShape, ViewStyle> = {
    cell: { height: c.height, borderRadius: c.radius, alignItems: 'center' },
    cellTall: { height: c.heightTall, borderRadius: c.radius, alignItems: 'center' },
    cellDense: { height: c.heightTall, borderRadius: c.radiusDense, alignItems: 'center' },
    pill: {
      height: c.height,
      borderRadius: c.pillRadius,
      paddingHorizontal: c.pillPaddingHorizontal,
      alignSelf: 'flex-start',
      alignItems: 'center',
    },
    row: {
      minHeight: c.heightTall,
      borderRadius: c.radius,
      paddingHorizontal: c.rowPaddingHorizontal,
      alignItems: 'flex-start',
    },
  };
  const variant: keyof typeof textRoles =
    shape === 'row'
      ? selected
        ? 'choiceRowSelected'
        : 'choiceRow'
      : shape === 'cellDense'
        ? selected
          ? 'choiceDenseSelected'
          : 'choiceDense'
        : selected
          ? 'choiceSelected'
          : 'choice';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        geometry[shape],
        {
          backgroundColor: colors.surface,
          borderWidth: selected ? c.selectedBorder : c.border,
          borderColor: selected ? colors.ink : colors.controlBorder,
        },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text variant={variant} style={shape === 'row' ? undefined : styles.center}>
        {label}
      </Text>
    </Pressable>
  );
}

/** An even grid of choices (3-up, 5-up...). */
export function ChoiceGrid({
  options,
  selectedIndex,
  onSelect,
  shape = 'cell',
  gap = c.gap,
}: {
  options: readonly string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  shape?: ChoiceShape;
  gap?: number;
}) {
  return (
    <View style={[styles.grid, { gap }]}>
      {options.map((label, index) => (
        <ChoiceButton
          key={label}
          label={label}
          selected={index === selectedIndex}
          onPress={() => onSelect(index)}
          shape={shape}
          style={styles.gridCell}
        />
      ))}
    </View>
  );
}

/** An action chip: fires immediately, never shows a selected state. */
export function ActionChip({ label, onPress }: { label: string; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          height: c.height,
          borderRadius: c.pillRadius,
          paddingHorizontal: c.pillPaddingHorizontal,
          backgroundColor: colors.surface,
          borderWidth: c.border,
          borderColor: colors.controlBorder,
        },
        pressed && styles.pressed,
      ]}
    >
      <Text variant="actionLabel">{label}</Text>
    </Pressable>
  );
}

/** The custom switch. Never the platform one (fidelity rule). */
export function SwitchControl({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: (next: boolean) => void;
  label: string;
}) {
  const { colors } = useTheme();
  const s = metrics.switch;
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${label}, ${on ? 'on' : 'off'}`}
      onPress={() => onToggle(!on)}
      style={styles.switchTap}
    >
      <View
        style={{
          width: s.trackWidth,
          height: s.trackHeight,
          borderRadius: s.trackRadius,
          paddingHorizontal: s.trackPadding,
          backgroundColor: on ? colors.ink : colors.busyBarLine,
          justifyContent: 'center',
          alignItems: on ? 'flex-end' : 'flex-start',
        }}
      >
        <View
          style={{
            width: s.knob,
            height: s.knob,
            borderRadius: s.knob / 2,
            backgroundColor: colors.surface,
          }}
        />
      </View>
    </Pressable>
  );
}

/** A label + sub-line + switch row, used in cards. */
export function SwitchRow({
  title,
  subtitle,
  on,
  onToggle,
}: {
  title: string;
  subtitle?: string;
  on: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchText}>
        <Text variant="listTitle">{title}</Text>
        {subtitle != null && (
          <Text variant="secondary" tone="muted">
            {subtitle}
          </Text>
        )}
      </View>
      <SwitchControl on={on} onToggle={onToggle} label={title} />
    </View>
  );
}

/** The round 48 +/- stepper with a big value in the middle. */
export function Stepper({
  value,
  unit,
  onLess,
  onMore,
  lessLabel,
  moreLabel,
}: {
  value: string;
  unit: string;
  onLess?: () => void;
  onMore?: () => void;
  lessLabel: string;
  moreLabel: string;
}) {
  return (
    <View style={styles.stepperRow}>
      <StepperButton glyph={'−'} label={lessLabel} onPress={onLess} />
      <View style={styles.stepperCenter}>
        <Text variant="bigValue">{value}</Text>
        <Text variant="secondary" tone="muted">
          {unit}
        </Text>
      </View>
      <StepperButton glyph="+" label={moreLabel} onPress={onMore} />
    </View>
  );
}

function StepperButton({
  glyph,
  label,
  onPress,
}: {
  glyph: string;
  label: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const s = metrics.stepper;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: s.size,
          height: s.size,
          borderRadius: s.radius,
          borderWidth: metrics.button.borderWidth,
          borderColor: colors.controlBorder,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressed && styles.pressed,
      ]}
    >
      <Text variant="bigValue" style={styles.stepperGlyph}>
        {glyph}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { justifyContent: 'center' },
  center: { textAlign: 'center' },
  pressed: { opacity: 0.7 },
  grid: { flexDirection: 'row' },
  gridCell: { flex: 1 },
  switchTap: {
    width: metrics.switch.tapWidth,
    height: metrics.switch.tapHeight,
    justifyContent: 'center',
    flexShrink: 0,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchText: { flex: 1, gap: 2 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  stepperCenter: { alignItems: 'center', gap: 0 },
  stepperGlyph: { fontSize: 22, lineHeight: 26 },
});
