import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  addDays,
  dayRange,
  SLOTS,
  weekday,
  type Rating,
  type RatingLevel,
  type Slot,
} from '@fitplan/engine';
import { metrics, ratingWord, useTheme } from '@/theme';

import { Button } from './Button';
import { Sheet } from './Sheet';
import { Text } from './text';

const weekdayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const slotNames: Record<Slot, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

export interface MoveSheetProps {
  visible: boolean;
  title: string;
  /** "Now: today, afternoon · 40 min". */
  subtitle: string;
  today: string;
  current: { day: string; slot: Slot };
  /** Rate a candidate day and slot for this item. */
  rateDay: (day: string, slot: Slot) => Rating | undefined;
  /** One sentence for the selected day's top reason. */
  reasonLine: (rating: Rating | undefined) => string;
  shortDay: (day: string) => string;
  onSave: (day: string, slot: Slot, lock: boolean) => void;
  onAlreadyDone?: () => void;
  onClose: () => void;
}

/** The move sheet: two rated weeks, time of day, lock, and a save button that names what it does. */
export function MoveSheet(props: MoveSheetProps) {
  const { colors } = useTheme();
  const [day, setDay] = useState(props.current.day);
  const [slot, setSlot] = useState<Slot>(props.current.slot);
  const [lock, setLock] = useState(false);

  const days = useMemo(() => {
    const monday = addDays(props.today, -weekday(props.today));
    return dayRange(monday, 14);
  }, [props.today]);

  const selectedRating = props.rateDay(day, slot);
  const unchanged = day === props.current.day && slot === props.current.slot;

  return (
    <Sheet
      visible={props.visible}
      title={props.title}
      subtitle={props.subtitle}
      onClose={props.onClose}
    >
      <View style={styles.section}>
        <Text variant="label" tone="muted" style={styles.sectionLabel}>
          Which day
        </Text>
        <View style={styles.grid}>
          {days.map((candidate) => {
            const past = candidate < props.today;
            const rating = past ? undefined : props.rateDay(candidate, slot);
            const level: RatingLevel | undefined = rating?.level;
            const palette = level ? colors.rating[level] : undefined;
            const selected = candidate === day;
            return (
              <Pressable
                key={candidate}
                accessibilityRole="button"
                accessibilityLabel={`${props.shortDay(candidate)}: ${level ? ratingWord[level] : 'past'}`}
                accessibilityState={{ selected, disabled: past }}
                disabled={past}
                onPress={() => setDay(candidate)}
                style={[
                  styles.day,
                  { backgroundColor: palette?.background ?? colors.quietFill },
                  { borderColor: selected ? colors.ink : 'transparent' },
                ]}
              >
                <Text variant="smallLabel" color={palette?.text ?? colors.mutedText}>
                  {weekdayShort[weekday(candidate)]}
                </Text>
                <Text variant="ratedDayNumber" color={palette?.text ?? colors.mutedText}>
                  {Number(candidate.split('-')[2])}
                </Text>
                <Text variant="ratingWord" color={palette?.text ?? colors.mutedText}>
                  {past ? 'Past' : level ? ratingWord[level] : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View
          style={[
            styles.reason,
            {
              backgroundColor: selectedRating
                ? colors.rating[selectedRating.level].background
                : colors.quietFill,
            },
          ]}
        >
          <Text
            variant="advice"
            color={selectedRating ? colors.rating[selectedRating.level].text : colors.mutedText}
          >
            {props.reasonLine(selectedRating)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="label" tone="muted" style={styles.sectionLabel}>
          Time of day
        </Text>
        <View style={styles.slotRow}>
          {SLOTS.map((candidate) => {
            const selected = candidate === slot;
            return (
              <Pressable
                key={candidate}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setSlot(candidate)}
                style={[
                  styles.slotChoice,
                  {
                    backgroundColor: colors.surface,
                    borderColor: selected ? colors.ink : colors.controlBorder,
                  },
                ]}
              >
                <Text variant={selected ? 'buttonPrimary' : 'smallLabel'} tone="ink">
                  {slotNames[candidate]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: lock }}
        onPress={() => setLock((value) => !value)}
        style={[styles.lockRow, { backgroundColor: colors.quietFill }]}
      >
        <View style={styles.lockTexts}>
          <Text variant="buttonSecondary">Lock in place</Text>
          <Text variant="secondary" tone="muted">
            The app plans around it and will not move it.
          </Text>
        </View>
        <View
          style={[
            styles.lockBox,
            { borderColor: colors.controlBorder },
            lock && { backgroundColor: colors.accent, borderColor: colors.accent },
          ]}
        />
      </Pressable>

      <View style={styles.actions}>
        <Button
          label={
            unchanged
              ? 'Keep as it is'
              : `Move to ${props.shortDay(day)}, ${slotNames[slot].toLowerCase()}`
          }
          variant="primary"
          onPress={() => (unchanged ? props.onClose() : props.onSave(day, slot, lock))}
        />
        <View style={styles.pair}>
          <Button label="I already did it" style={styles.half} onPress={props.onAlreadyDone} />
          <Button label="Keep as it is" style={styles.half} onPress={props.onClose} />
        </View>
      </View>
    </Sheet>
  );
}

const m = metrics;

const styles = StyleSheet.create({
  section: { gap: m.sheet.sectionGap },
  sectionLabel: { paddingHorizontal: m.sheet.inset },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m.ratedDay.gap,
  },
  day: {
    flexBasis: '13%',
    flexGrow: 1,
    height: m.ratedDay.height,
    borderRadius: m.ratedDay.radius,
    borderWidth: m.ratedDay.borderWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: m.ratedDay.innerGap,
  },
  reason: {
    borderRadius: m.advice.radius,
    paddingVertical: m.advice.paddingVertical,
    paddingHorizontal: m.advice.paddingHorizontal,
  },
  slotRow: { flexDirection: 'row', gap: 6 },
  slotChoice: {
    flex: 1,
    height: m.button.height,
    borderRadius: m.button.radius,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: m.card.radius,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  lockTexts: { flex: 1, gap: 2 },
  lockBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
  },
  actions: { gap: 8 },
  pair: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
});
