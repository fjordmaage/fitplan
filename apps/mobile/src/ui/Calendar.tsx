import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { metrics, useTheme } from '@/theme';

import { DashedBorder } from './DashedBorder';
import { Hatch } from './Hatch';
import { Icon } from './Icon';
import { SelectionRing } from './SelectionRing';
import { Text } from './text';
import type { ActivityKind } from './TimelineCard';

/** What a single bar in one slot shows. `null` is an empty slot. */
export type SlotBar = ActivityKind;

export interface CalendarDay {
  /** Day of the month, as shown in the circle. */
  date: number;
  /** Three slots, am / pm / eve, each holding zero or more bars. */
  slots: readonly (readonly SlotBar[])[];
  isToday?: boolean;
  isPast?: boolean;
  /** Which bar, if any, carries the selection ring: [slotIndex, barIndex]. */
  selectedBar?: readonly [number, number];
  accessibilityLabel: string;
}

export interface CalendarWeek {
  /** ISO week number, shown in the gutter. */
  week: number;
  days: readonly CalendarDay[];
}

export interface CalendarProps {
  weeks: readonly CalendarWeek[];
  expanded: boolean;
  onToggleExpanded: () => void;
  onSelectDay?: (week: number, date: number) => void;
}

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const slotLabels = ['am', 'pm', 'eve'] as const;

export function Calendar({ weeks, expanded, onToggleExpanded, onSelectDay }: CalendarProps) {
  const { colors } = useTheme();
  const m = metrics.calendar;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.headerRow}>
        <View style={styles.gutter}>
          <Text variant="gutterHeading" tone="muted" style={styles.gutterText}>
            wk
          </Text>
        </View>
        <View style={styles.grid}>
          {weekdays.map((day) => (
            <Text key={day} variant="smallLabel" tone="muted" style={styles.weekdayLabel}>
              {day}
            </Text>
          ))}
        </View>
      </View>

      {weeks.map((week) => (
        <View key={week.week} style={styles.weekRow}>
          <View style={styles.gutterColumn}>
            <Text variant="weekNumber" tone="muted" style={styles.gutterText}>
              {String(week.week)}
            </Text>
            {slotLabels.map((label) => (
              <Text key={label} variant="gutter" tone="muted" style={styles.gutterText}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {week.days.map((day) => (
              <Day
                key={`${week.week}-${day.date}`}
                day={day}
                onPress={onSelectDay ? () => onSelectDay(week.week, day.date) : undefined}
              />
            ))}
          </View>
        </View>
      ))}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Show less' : 'Look further ahead'}
        onPress={onToggleExpanded}
        style={styles.handle}
      >
        <Text variant="label" tone="muted">
          {expanded ? 'Show less' : 'Look further ahead'}
        </Text>
        <View style={expanded ? styles.flipped : undefined}>
          <Icon name="chevronDown" size={m.handleGlyph} color={colors.mutedText} />
        </View>
      </Pressable>
    </View>
  );
}

function Day({ day, onPress }: { day: CalendarDay; onPress?: () => void }) {
  const { colors } = useTheme();
  const m = metrics.calendar;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={day.accessibilityLabel}
      onPress={onPress}
      style={[
        styles.day,
        day.isPast ? { opacity: m.pastOpacity } : null,
        day.isToday
          ? { borderWidth: m.todayBorderWidth, borderColor: colors.mutedText }
          : { borderWidth: m.todayBorderWidth, borderColor: 'transparent' },
      ]}
    >
      <View style={styles.dateRow}>
        <View style={[styles.dateCircle, day.isToday ? { backgroundColor: colors.ink } : null]}>
          <Text variant="dateNumber" tone={day.isToday ? 'onInk' : 'ink'}>
            {String(day.date)}
          </Text>
        </View>
      </View>

      {day.slots.map((bars, slotIndex) => (
        <View key={slotIndex} style={styles.slot}>
          {bars.length === 0 ? (
            <Bar kind={null} />
          ) : (
            bars.map((kind, barIndex) => (
              <Bar
                key={barIndex}
                kind={kind}
                selected={day.selectedBar?.[0] === slotIndex && day.selectedBar[1] === barIndex}
              />
            ))
          )}
        </View>
      ))}
    </Pressable>
  );
}

function Bar({ kind, selected }: { kind: SlotBar | null; selected?: boolean }) {
  const { colors } = useTheme();
  const m = metrics.calendar;

  const bar = (
    <View style={[styles.bar, barSurface(kind, colors)]}>
      {kind === 'busy' ? (
        <Hatch
          line={colors.busyBarLine}
          ground={colors.busyBarGround}
          density="bar"
          radius={m.barRadius}
        />
      ) : null}
      {kind === 'tentative' ? (
        <DashedBorder
          color={colors.accent}
          width={m.barBorderWidth}
          radius={m.barRadius}
          dash={[3, 3]}
        />
      ) : null}
    </View>
  );

  if (!selected) return bar;

  // The ring sits in the 2 unit gap between bars. Lifted above the sibling
  // bar, which would otherwise paint over its right edge and look broken —
  // KL flagged exactly this.
  return (
    <SelectionRing radius={m.barRadius} style={[styles.selectedBar, styles.lifted]}>
      {bar}
    </SelectionRing>
  );
}

function barSurface(
  kind: SlotBar | null,
  colors: ReturnType<typeof useTheme>['colors'],
): ViewStyle {
  switch (kind) {
    case 'fixed':
      return { backgroundColor: colors.ink, borderColor: colors.ink };
    case 'flexible':
      return { backgroundColor: colors.accentFill, borderColor: colors.accent };
    case 'tentative':
      return { backgroundColor: 'transparent', borderColor: 'transparent' };
    case 'busy':
      return { backgroundColor: colors.busyBarGround, borderColor: 'transparent' };
    case null:
      return { backgroundColor: colors.quietFill, borderColor: 'transparent' };
  }
}

const m = metrics.calendar;

const styles = StyleSheet.create({
  card: {
    borderRadius: m.cardRadius,
    paddingTop: m.cardPaddingTop,
    paddingRight: m.cardPaddingRight,
    paddingBottom: m.cardPaddingBottom,
    paddingLeft: m.cardPaddingLeft,
    gap: m.cardGap,
  },
  headerRow: { flexDirection: 'row', gap: m.gutterGap },
  weekRow: { flexDirection: 'row', gap: m.gutterGap },
  gutter: { width: m.gutterWidth },
  gutterColumn: {
    width: m.gutterWidth,
    gap: m.dayGap,
    paddingTop: m.gutterPaddingTop,
  },
  gutterText: { textAlign: 'right' },
  grid: { flex: 1, flexDirection: 'row', gap: m.columnGap },
  weekdayLabel: { flex: 1, textAlign: 'center' },
  day: {
    flex: 1,
    minWidth: 0,
    paddingVertical: m.dayPaddingVertical,
    paddingHorizontal: m.dayPaddingHorizontal,
    borderRadius: m.dayRadius,
    gap: m.dayGap,
  },
  dateRow: { height: m.dateCircle, alignItems: 'center', justifyContent: 'center' },
  dateCircle: {
    width: m.dateCircle,
    height: m.dateCircle,
    borderRadius: m.dateRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slot: { flexDirection: 'row', gap: m.barGap, height: m.slotHeight },
  bar: {
    flex: 1,
    minWidth: 0,
    borderRadius: m.barRadius,
    borderWidth: m.barBorderWidth,
    overflow: 'hidden',
  },
  selectedBar: { flex: 1, minWidth: 0 },
  lifted: { zIndex: 1, elevation: 1 },
  handle: {
    height: m.handleHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m.handleGap,
  },
  flipped: { transform: [{ rotate: '180deg' }] },
});
