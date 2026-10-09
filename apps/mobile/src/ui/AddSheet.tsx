import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  activityTypes,
  addDays,
  dayRange,
  weekday,
  type Exercise,
  type Slot,
} from '@fitplan/engine';
import { metrics, useTheme } from '@/theme';

import { Button } from './Button';
import { ChoiceButton, SwitchRow } from './controls';
import { Marker } from './library';
import { Sheet } from './Sheet';
import { Text } from './text';

export interface AddSheetProps {
  visible: boolean;
  today: string;
  /** The user's active exercises, for logging and fixed sessions. */
  exercises: readonly Exercise[];
  onLogDone: (exerciseId: string, minutes: number, effort: number) => void;
  onAddBusy: (days: readonly string[], slots: readonly Slot[]) => void;
  onAddBusyWeekly: (weekdays: readonly number[], slots: readonly Slot[]) => void;
  onPickUp: (exercise: Exercise) => void;
  onAddFixedSeries: (
    exercise: Exercise,
    weekdays: readonly number[],
    startMinutes: number,
    durationMinutes: number,
  ) => void;
  onAddFixedOnce: (
    exercise: Exercise,
    day: string,
    startMinutes: number,
    durationMinutes: number,
  ) => void;
  useCalendar: boolean;
  onToggleCalendar: (next: boolean) => void;
  onClose: () => void;
}

type Page = 'menu' | 'did' | 'want' | 'dates' | 'repeat' | 'fixed';

const allSlots: readonly Slot[] = ['morning', 'afternoon', 'evening'];
const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const titles: Record<Page, string> = {
  menu: 'Add',
  did: 'Something I did',
  want: 'Something I want to do',
  dates: "I'm busy — pick days",
  repeat: "I'm busy — repeating",
  fixed: 'A fixed session',
};

/**
 * The Add sheet behind the centre button: log something done, pick up
 * something new, set up a fixed session, or mark busy time — one tap for the
 * presets, two for picked dates and repeats (product spec: at most two taps
 * or the user will not do it).
 */
export function AddSheet(props: AddSheetProps) {
  const [page, setPage] = useState<Page>('menu');

  const close = () => {
    setPage('menu');
    props.onClose();
  };

  return (
    <Sheet visible={props.visible} title={titles[page]} onClose={close}>
      {page === 'menu' ? <Menu {...props} onPage={setPage} onClose={close} /> : null}
      {page === 'did' ? <LogDone {...props} onClose={close} /> : null}
      {page === 'want' ? <PickUp {...props} onClose={close} /> : null}
      {page === 'dates' ? <BusyDates {...props} onClose={close} /> : null}
      {page === 'repeat' ? <BusyRepeat {...props} onClose={close} /> : null}
      {page === 'fixed' ? <FixedSession {...props} onClose={close} /> : null}
    </Sheet>
  );
}

function Menu({
  today,
  useCalendar,
  onToggleCalendar,
  onAddBusy,
  onPage,
  onClose,
}: AddSheetProps & { onPage: (page: Page) => void; onClose: () => void }) {
  const { colors } = useTheme();

  const weekend = useMemo(() => {
    const saturday = addDays(today, (5 - weekday(today) + 7) % 7);
    return [saturday, addDays(saturday, 1)];
  }, [today]);

  const busy = (days: readonly string[], slots: readonly Slot[]) => {
    onAddBusy(days, slots);
    onClose();
  };

  return (
    <View style={styles.menu}>
      <MenuRow
        marker="logged"
        label="Something I did"
        hint="A walk, a game, a swim. It counts toward recovery."
        onPress={() => onPage('did')}
      />
      <MenuRow
        marker="flexible"
        label="Something I want to do"
        hint="The app finds the best spot, and you can move it."
        onPress={() => onPage('want')}
      />
      <MenuRow
        marker="fixed"
        label="A fixed session"
        hint="A class or practice at a set time, once or repeating."
        onPress={() => onPage('fixed')}
      />
      <View style={styles.busyBlock}>
        <Text variant="label" tone="muted" style={styles.busyLabel}>
          {"I'm busy"}
        </Text>
        <View style={styles.presets}>
          <Preset label="This evening" onPress={() => busy([today], ['evening'])} />
          <Preset label="Tomorrow" onPress={() => busy([addDays(today, 1)], allSlots)} />
          <Preset label="This weekend" onPress={() => busy(weekend, allSlots)} />
          <Preset label="Pick dates" onPress={() => onPage('dates')} />
          <Preset label="Repeating" onPress={() => onPage('repeat')} />
        </View>
        <Text variant="secondary" tone="muted" style={styles.busyLabel}>
          One tap is enough. The app moves flexible workouts out of the way and tells you what
          changed.
        </Text>
      </View>
      <View style={[styles.calendarPanel, { backgroundColor: colors.quietFill }]}>
        <SwitchRow
          title="Use my phone calendar"
          subtitle="Events become busy time once connections arrive."
          on={useCalendar}
          onToggle={onToggleCalendar}
        />
      </View>
    </View>
  );
}

function MenuRow({
  marker,
  label,
  hint,
  onPress,
}: {
  marker: 'logged' | 'flexible' | 'fixed';
  label: string;
  hint: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        { borderColor: colors.controlBorder, backgroundColor: colors.surface },
        pressed && styles.pressed,
      ]}
    >
      <Marker kind={marker} large />
      <View style={styles.menuRowText}>
        <Text variant="cardTitle">{label}</Text>
        <Text variant="secondary" tone="muted">
          {hint}
        </Text>
      </View>
    </Pressable>
  );
}

function Preset({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Busy: ${label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.preset,
        { borderColor: colors.controlBorder, backgroundColor: colors.surface },
        pressed && styles.pressed,
      ]}
    >
      <Text variant="actionLabel">{label}</Text>
    </Pressable>
  );
}

/** Multi-select chips for the three times of day, plus "All day". */
export function SlotPicker({
  slots,
  onChange,
}: {
  slots: readonly Slot[];
  onChange: (slots: Slot[]) => void;
}) {
  const toggle = (slot: Slot) => {
    const next = slots.includes(slot) ? slots.filter((s) => s !== slot) : [...slots, slot];
    onChange(allSlots.filter((s) => next.includes(s)));
  };
  const allDay = slots.length === 3;
  return (
    <View style={styles.chipsWrap}>
      {allSlots.map((slot) => (
        <ChoiceButton
          key={slot}
          label={slot.charAt(0).toUpperCase() + slot.slice(1)}
          selected={slots.includes(slot)}
          onPress={() => toggle(slot)}
          shape="pill"
        />
      ))}
      <ChoiceButton
        label="All day"
        selected={allDay}
        onPress={() => onChange(allDay ? ['evening'] : [...allSlots])}
        shape="pill"
      />
    </View>
  );
}

/** The next 14 days as a 7-wide grid of toggling day cells. */
export function DayGrid({
  today,
  selected,
  onToggle,
}: {
  today: string;
  selected: ReadonlySet<string>;
  onToggle: (day: string) => void;
}) {
  const { colors } = useTheme();
  const days = dayRange(today, 14);
  return (
    <View>
      <View style={styles.dayGridRow}>
        {weekdayNames.map((name, i) => (
          <Text
            key={name}
            variant="smallLabel"
            tone="muted"
            style={[styles.dayCellBase, styles.dayGridHeading]}
          >
            {weekdayNames[(weekday(today) + i) % 7]}
          </Text>
        ))}
      </View>
      {[0, 1].map((row) => (
        <View key={row} style={styles.dayGridRow}>
          {days.slice(row * 7, row * 7 + 7).map((day) => {
            const isSelected = selected.has(day);
            return (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={day}
                onPress={() => onToggle(day)}
                style={[
                  styles.dayCellBase,
                  styles.dayCell,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? colors.ink : colors.controlBorder,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <Text variant={isSelected ? 'choiceSelected' : 'choice'}>
                  {String(Number(day.split('-')[2]))}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function BusyDates({ today, onAddBusy, onClose }: AddSheetProps & { onClose: () => void }) {
  const [days, setDays] = useState<ReadonlySet<string>>(new Set());
  const [slots, setSlots] = useState<readonly Slot[]>([...allSlots]);

  const toggle = (day: string) => {
    const next = new Set(days);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    setDays(next);
  };

  return (
    <View style={styles.menu}>
      <DayGrid today={today} selected={days} onToggle={toggle} />
      <Text variant="label" tone="muted" style={styles.busyLabel}>
        Which part of the day
      </Text>
      <SlotPicker slots={slots} onChange={setSlots} />
      <Button
        label={
          days.size === 0
            ? 'Pick at least one day'
            : `Mark ${days.size} ${days.size === 1 ? 'day' : 'days'} busy`
        }
        variant="primary"
        onPress={() => {
          if (days.size === 0 || slots.length === 0) return;
          onAddBusy([...days].sort(), slots);
          onClose();
        }}
      />
    </View>
  );
}

function BusyRepeat({ onAddBusyWeekly, onClose }: AddSheetProps & { onClose: () => void }) {
  const [weekdays, setWeekdays] = useState<readonly number[]>([]);
  const [slots, setSlots] = useState<readonly Slot[]>([...allSlots]);

  const toggle = (index: number) => {
    setWeekdays(
      weekdays.includes(index)
        ? weekdays.filter((w) => w !== index)
        : [...weekdays, index].sort((a, b) => a - b),
    );
  };

  const label =
    weekdays.length === 0
      ? 'Pick at least one weekday'
      : `Repeat every ${weekdays.map((w) => weekdayNames[w]).join(', ')}`;

  return (
    <View style={styles.menu}>
      <Text variant="label" tone="muted" style={styles.busyLabel}>
        Every week on
      </Text>
      <View style={styles.chipsWrap}>
        {weekdayNames.map((name, index) => (
          <ChoiceButton
            key={name}
            label={name}
            selected={weekdays.includes(index)}
            onPress={() => toggle(index)}
            shape="pill"
          />
        ))}
      </View>
      <Text variant="label" tone="muted" style={styles.busyLabel}>
        Which part of the day
      </Text>
      <SlotPicker slots={slots} onChange={setSlots} />
      <Button
        label={label}
        variant="primary"
        onPress={() => {
          if (weekdays.length === 0 || slots.length === 0) return;
          onAddBusyWeekly(weekdays, slots);
          onClose();
        }}
      />
    </View>
  );
}

function FixedSession(props: AddSheetProps & { onClose: () => void }) {
  const { today, exercises, onAddFixedSeries, onAddFixedOnce, onClose } = props;
  const owned = new Set(exercises.map((e) => e.id));
  const candidates = activityTypes.filter((t) => !owned.has(t.id)).slice(0, 8);

  const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? candidates[0]?.id ?? '');
  const [weekdays, setWeekdays] = useState<readonly number[]>([weekday(today)]);
  const [startMinutes, setStartMinutes] = useState(17 * 60);
  const [duration, setDuration] = useState(90);
  const [repeats, setRepeats] = useState(true);
  const [onceDay, setOnceDay] = useState(today);

  const chosenExercise: Exercise | undefined =
    exercises.find((e) => e.id === exerciseId) ??
    (() => {
      const type = candidates.find((t) => t.id === exerciseId);
      if (!type) return undefined;
      return {
        id: type.id,
        name: type.name,
        activityTypeId: type.id,
        loadProfile: type.loadProfile,
        typicalMinutes: type.typicalMinutes,
        typicalEffort: type.typicalEffort,
      };
    })();

  const time = `${Math.floor(startMinutes / 60)}:${String(startMinutes % 60).padStart(2, '0')}`;
  const saveLabel = !chosenExercise
    ? 'Pick what it is'
    : repeats
      ? weekdays.length === 0
        ? 'Pick at least one weekday'
        : `Add ${weekdays.map((w) => weekdayNames[w]).join(' and ')} ${time}`
      : `Add once, ${onceDay === today ? 'today' : onceDay.slice(5)} ${time}`;

  return (
    <ScrollView style={styles.pickList} contentContainerStyle={styles.menu}>
      <Text variant="label" tone="muted" style={styles.busyLabel}>
        What is it
      </Text>
      <View style={styles.chipsWrap}>
        {[...exercises.map((e) => ({ id: e.id, name: e.name })), ...candidates].map((option) => (
          <ChoiceButton
            key={option.id}
            label={option.name}
            selected={option.id === exerciseId}
            onPress={() => setExerciseId(option.id)}
            shape="pill"
          />
        ))}
      </View>

      <SwitchRow
        title="Every week"
        subtitle={repeats ? 'Repeats until you remove it.' : 'Just this once.'}
        on={repeats}
        onToggle={setRepeats}
      />

      {repeats ? (
        <View style={styles.chipsWrap}>
          {weekdayNames.map((name, index) => (
            <ChoiceButton
              key={name}
              label={name}
              selected={weekdays.includes(index)}
              onPress={() =>
                setWeekdays(
                  weekdays.includes(index)
                    ? weekdays.filter((w) => w !== index)
                    : [...weekdays, index].sort((a, b) => a - b),
                )
              }
              shape="pill"
            />
          ))}
        </View>
      ) : (
        <DayGrid today={today} selected={new Set([onceDay])} onToggle={(day) => setOnceDay(day)} />
      )}

      <InlineStepper
        label="Starts at"
        value={time}
        onLess={() => setStartMinutes(Math.max(5 * 60, startMinutes - 30))}
        onMore={() => setStartMinutes(Math.min(22 * 60, startMinutes + 30))}
      />
      <InlineStepper
        label="Lasts"
        value={`${duration} min`}
        onLess={() => setDuration(Math.max(15, duration - 15))}
        onMore={() => setDuration(Math.min(240, duration + 15))}
      />

      <Button
        label={saveLabel}
        variant="primary"
        onPress={() => {
          if (!chosenExercise) return;
          if (repeats) {
            if (weekdays.length === 0) return;
            onAddFixedSeries(chosenExercise, weekdays, startMinutes, duration);
          } else {
            onAddFixedOnce(chosenExercise, onceDay, startMinutes, duration);
          }
          onClose();
        }}
      />
    </ScrollView>
  );
}

export function InlineStepper({
  label,
  value,
  onLess,
  onMore,
}: {
  label: string;
  value: string;
  onLess: () => void;
  onMore: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.stepperRow}>
      <Text variant="buttonSecondary" style={styles.stepperLabel}>
        {label}
      </Text>
      <View style={styles.stepperControls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Earlier or less: ${label}`}
          onPress={onLess}
          style={[styles.stepButton, { borderColor: colors.controlBorder }]}
        >
          <Text variant="sheetTitle">−</Text>
        </Pressable>
        <Text variant="cardTitle" style={styles.stepValue}>
          {value}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Later or more: ${label}`}
          onPress={onMore}
          style={[styles.stepButton, { borderColor: colors.controlBorder }]}
        >
          <Text variant="sheetTitle">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LogDone({ exercises, onLogDone, onClose }: AddSheetProps & { onClose: () => void }) {
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? '');
  const chosen = exercises.find((e) => e.id === exerciseId);
  const [minutes, setMinutes] = useState(chosen?.typicalMinutes ?? 30);
  const [effort, setEffort] = useState(chosen?.typicalEffort ?? 5);

  return (
    <View style={styles.menu}>
      <View style={styles.chipsWrap}>
        {exercises.map((exercise) => (
          <ChoiceButton
            key={exercise.id}
            label={exercise.name}
            selected={exercise.id === exerciseId}
            onPress={() => {
              setExerciseId(exercise.id);
              setMinutes(exercise.typicalMinutes);
              setEffort(exercise.typicalEffort);
            }}
            shape="pill"
          />
        ))}
      </View>

      <InlineStepper
        label="How long"
        value={`${minutes} min`}
        onLess={() => setMinutes(Math.max(5, minutes - 5))}
        onMore={() => setMinutes(Math.min(360, minutes + 5))}
      />
      <InlineStepper
        label="How hard (1-10)"
        value={String(effort)}
        onLess={() => setEffort(Math.max(1, effort - 1))}
        onMore={() => setEffort(Math.min(10, effort + 1))}
      />

      <Button
        label={`Log ${chosen?.name ?? ''} · ${minutes} min`}
        variant="primary"
        onPress={() => {
          if (chosen) onLogDone(chosen.id, minutes, effort);
          onClose();
        }}
      />
    </View>
  );
}

function PickUp({ exercises, onPickUp, onClose }: AddSheetProps & { onClose: () => void }) {
  const { colors } = useTheme();
  const have = new Set(exercises.map((e) => e.id));
  const suggestions = activityTypes.filter((t) => !have.has(t.id));

  return (
    <ScrollView style={styles.pickList} contentContainerStyle={styles.menu}>
      {suggestions.map((type) => (
        <Pressable
          key={type.id}
          accessibilityRole="button"
          accessibilityLabel={`Add ${type.name}`}
          onPress={() => {
            onPickUp({
              id: type.id,
              name: type.name,
              activityTypeId: type.id,
              loadProfile: type.loadProfile,
              typicalMinutes: type.typicalMinutes,
              typicalEffort: type.typicalEffort,
              frequencyPerWeek: 1,
            });
            onClose();
          }}
          style={({ pressed }) => [
            styles.menuRow,
            { borderColor: colors.controlBorder, backgroundColor: colors.surface },
            pressed && styles.pressed,
          ]}
        >
          <Marker kind="flexible" large />
          <View style={styles.menuRowText}>
            <Text variant="cardTitle">{type.name}</Text>
            <Text variant="secondary" tone="muted">
              {`About ${type.typicalMinutes} min · starts at once a week; change it any time`}
            </Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  menu: { gap: 10 },
  menuRow: {
    borderWidth: 1,
    borderRadius: 16,
    padding: metrics.card.paddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuRowText: { flex: 1, gap: 2 },
  pressed: { opacity: 0.7 },
  busyBlock: { gap: 8 },
  busyLabel: { paddingHorizontal: metrics.sheet.inset },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  preset: {
    height: metrics.choice.height,
    paddingHorizontal: metrics.choice.pillPaddingHorizontal,
    borderRadius: metrics.choice.pillRadius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarPanel: {
    borderRadius: metrics.card.radius,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayGridRow: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  dayGridHeading: { textAlign: 'center' },
  dayCellBase: { flex: 1, minWidth: 0 },
  dayCell: {
    height: metrics.minTapTarget,
    borderRadius: metrics.choice.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center' },
  stepperLabel: { flex: 1 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepButton: {
    width: metrics.minTapTarget,
    height: metrics.minTapTarget,
    borderRadius: metrics.button.radius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { minWidth: 72, textAlign: 'center' },
  pickList: { maxHeight: 460 },
});
