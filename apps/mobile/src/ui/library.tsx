/**
 * Shared building blocks for the library screens (Exercises, Body, Learn,
 * History, Settings, details): the radius-20 surface card, list rows with
 * hairline dividers, the back header, and the shape markers that encode
 * fixed / flexible / logged everywhere.
 */

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';

import { metrics, useTheme } from '@/theme';

import { Icon } from './Icon';
import { RoundIconButton } from './ScreenTitle';
import { Text } from './text';

const lib = metrics.library;

/** A white (surface) card at radius 20 with no border. */
export function SurfaceCard({
  children,
  list = false,
  tight = false,
  style,
}: {
  children: ReactNode;
  /** List cards use slim vertical padding; rows do the spacing. */
  list?: boolean;
  /** 14 side padding instead of 16 (Exercises lists). */
  tight?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        { backgroundColor: colors.surface, borderRadius: lib.cardRadius },
        list
          ? {
              paddingVertical: lib.listPaddingVertical,
              paddingHorizontal: tight ? lib.listPaddingHorizontalTight : lib.listPaddingHorizontal,
            }
          : { padding: lib.cardPadding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** The 1px in-card hairline between list rows. */
export function CardDivider() {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.hairlineInCard }} />;
}

/** A section: heading at 15/700 with the 4-inset, then its content. */
export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <View style={{ gap: lib.headingGap }}>
      <Text variant="sectionHeading" style={{ paddingHorizontal: metrics.header.inset }}>
        {heading}
      </Text>
      {children}
    </View>
  );
}

/** A label/value list row, tappable when onPress is given. */
export function ListRow({
  label,
  value,
  onPress,
  height = lib.rowTall,
  accessibilityLabel,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  height?: number;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const content = (
    <>
      <Text variant="listTitle">{label}</Text>
      {value != null && (
        <Text variant="listValue" color={colors.mutedText} style={styles.rowValue}>
          {value}
        </Text>
      )}
    </>
  );
  if (!onPress) {
    return <View style={[styles.row, { height }]}>{content}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { height }, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

/** The flat "more" button at the bottom of a list card. */
export function FlatRowButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.flatRow, pressed && styles.pressed]}
    >
      <Text variant="actionLabel">{label}</Text>
    </Pressable>
  );
}

/** Back chevron + 24px title (+ optional subtitle and trailing control). */
export function BackHeader({
  title,
  subtitle,
  backLabel,
  trailing,
}: {
  title: string;
  subtitle?: string;
  backLabel: string;
  trailing?: ReactNode;
}) {
  const router = useRouter();
  return (
    <View style={styles.backHeader}>
      <RoundIconButton icon="chevronLeft" label={backLabel} onPress={() => router.back()} />
      <View style={styles.backTitleBlock}>
        <Text variant="backTitle">{title}</Text>
        {subtitle != null && (
          <Text variant="secondary" tone="muted">
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
    </View>
  );
}

/** The 14x14 (or 12x12) shape marker: logged dot, flexible, fixed. */
export function Marker({
  kind,
  large = false,
}: {
  kind: 'logged' | 'flexible' | 'fixed';
  large?: boolean;
}) {
  const { colors } = useTheme();
  const size = large ? metrics.marker.sizeLarge : metrics.marker.size;
  const base: ViewStyle = { width: size, height: size };
  if (kind === 'logged') {
    return <View style={[base, { borderRadius: size / 2, backgroundColor: colors.mutedText }]} />;
  }
  if (kind === 'fixed') {
    return <View style={[base, { borderRadius: metrics.marker.radius, backgroundColor: colors.ink }]} />;
  }
  return (
    <View
      style={[
        base,
        {
          borderRadius: metrics.marker.radius,
          borderWidth: metrics.marker.border,
          borderColor: colors.accent,
          backgroundColor: colors.accentFill,
        },
      ]}
    />
  );
}

/** The engine's rating as a small chip; the word is always shown. */
export function RatingChipBadge({ level, word }: { level: 'good' | 'ok' | 'avoid'; word: string }) {
  const { colors } = useTheme();
  const pair = colors.rating[level];
  return (
    <View
      style={{
        borderRadius: metrics.ratingChip.radius,
        paddingVertical: metrics.ratingChip.paddingVertical,
        paddingHorizontal: metrics.ratingChip.paddingHorizontal,
        backgroundColor: pair.background,
        alignSelf: 'center',
      }}
    >
      <Text variant="ratingChip" color={pair.text}>
        {word}
      </Text>
    </View>
  );
}

/** Group header row in the Exercises tree. */
export function GroupHeader({
  title,
  detail,
  expanded,
  quiet = false,
  onPress,
}: {
  title: string;
  detail?: string;
  expanded: boolean;
  quiet?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const tint = quiet ? colors.mutedText : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.groupHeader, pressed && styles.pressed]}
    >
      <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={16} color={tint} />
      <Text variant={quiet ? 'groupTitleQuiet' : 'groupTitle'} color={tint} style={styles.grow}>
        {title}
      </Text>
      {detail != null && (
        <Text variant="secondary" tone="muted">
          {detail}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  flatRow: { height: metrics.library.row, justifyContent: 'center' },
  backHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backTitleBlock: { flex: 1, gap: 1 },
  groupHeader: {
    height: metrics.library.rowSmall,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  grow: { flex: 1 },
  pressed: { opacity: 0.7 },
});
