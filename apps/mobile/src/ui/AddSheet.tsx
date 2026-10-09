import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { activityTypes, addDays, weekday, type Exercise } from '@fitplan/engine';
import { metrics, useTheme } from '@/theme';

import { Button } from './Button';
import { Sheet } from './Sheet';
import { Text } from './text';

export interface AddSheetProps {
  visible: boolean;
  today: string;
  /** The user's active exercises, for logging. */
  exercises: readonly Exercise[];
  onLogDone: (exerciseId: string, minutes: number, effort: number) => void;
  onAddBusy: (
    days: readonly string[],
    slots: readonly ('morning' | 'afternoon' | 'evening')[],
  ) => void;
  onPickUp: (exercise: Exercise) => void;
  onClose: () => void;
}

type Page = 'menu' | 'did' | 'want';

/**
 * The Add sheet behind the centre button: log something done, pick up
 * something new, or mark busy time with one-tap presets (at most two taps,
 * per the product spec). "A fixed session" arrives with the setup flow.
 */
export function AddSheet(props: AddSheetProps) {
  const [page, setPage] = useState<Page>('menu');

  const close = () => {
    setPage('menu');
    props.onClose();
  };

  return (
    <Sheet
      visible={props.visible}
      title={
        page === 'menu' ? 'Add' : page === 'did' ? 'Something I did' : 'Something I want to do'
      }
      onClose={close}
    >
      {page === 'menu' ? <Menu {...props} onPage={setPage} onClose={close} /> : null}
      {page === 'did' ? <LogDone {...props} onClose={close} /> : null}
      {page === 'want' ? <PickUp {...props} onClose={close} /> : null}
    </Sheet>
  );
}

function Menu({
  today,
  onAddBusy,
  onPage,
  onClose,
}: AddSheetProps & { onPage: (page: Page) => void; onClose: () => void }) {
  const { colors } = useTheme();

  const weekend = useMemo(() => {
    const saturday = addDays(today, (5 - weekday(today) + 7) % 7);
    return [saturday, addDays(saturday, 1)];
  }, [today]);

  const busy = (
    days: readonly string[],
    slots: readonly ('morning' | 'afternoon' | 'evening')[],
  ) => {
    onAddBusy(days, slots);
    onClose();
  };

  return (
    <View style={styles.menu}>
      <MenuRow
        label="Something I did"
        hint="A workout the plan didn't know about"
        onPress={() => onPage('did')}
      />
      <MenuRow
        label="Something I want to do"
        hint="Pick up a new exercise"
        onPress={() => onPage('want')}
      />
      <MenuRow label="A fixed session" hint="Coming with the setup flow" disabled />
      <View style={styles.busyBlock}>
        <Text variant="label" tone="muted" style={styles.busyLabel}>
          {"I'm busy"}
        </Text>
        <View style={styles.presets}>
          <Preset label="This evening" onPress={() => busy([today], ['evening'])} />
          <Preset
            label="Tomorrow"
            onPress={() => busy([addDays(today, 1)], ['morning', 'afternoon', 'evening'])}
          />
          <Preset
            label="This weekend"
            onPress={() => busy(weekend, ['morning', 'afternoon', 'evening'])}
          />
        </View>
        <Text variant="secondary" tone="muted">
          Date ranges and repeats arrive with the setup flow. The plan moves out of the way as soon
          as you tap.
        </Text>
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: colors.hairlineInCard }} />
    </View>
  );
}

function MenuRow({
  label,
  hint,
  onPress,
  disabled,
}: {
  label: string;
  hint: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.menuRow,
        { borderColor: colors.controlBorder, backgroundColor: colors.surface },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text variant="cardTitle">{label}</Text>
      <Text variant="secondary" tone="muted">
        {hint}
      </Text>
    </Pressable>
  );
}

function Preset({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Busy ${label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.preset,
        { borderColor: colors.controlBorder, backgroundColor: colors.surface },
        pressed && styles.pressed,
      ]}
    >
      <Text variant="buttonSecondary">{label}</Text>
    </Pressable>
  );
}

function LogDone({ exercises, onLogDone, onClose }: AddSheetProps & { onClose: () => void }) {
  const { colors } = useTheme();
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? '');
  const chosen = exercises.find((e) => e.id === exerciseId);
  const [minutes, setMinutes] = useState(chosen?.typicalMinutes ?? 30);
  const [effort, setEffort] = useState(chosen?.typicalEffort ?? 5);

  return (
    <View style={styles.menu}>
      <View style={styles.chipsWrap}>
        {exercises.map((exercise) => {
          const selected = exercise.id === exerciseId;
          return (
            <Pressable
              key={exercise.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                setExerciseId(exercise.id);
                setMinutes(exercise.typicalMinutes);
                setEffort(exercise.typicalEffort);
              }}
              style={[
                styles.choiceChip,
                {
                  backgroundColor: colors.surface,
                  borderColor: selected ? colors.ink : colors.controlBorder,
                  borderWidth: selected ? 2 : 1,
                },
              ]}
            >
              <Text variant={selected ? 'buttonPrimary' : 'smallLabel'}>{exercise.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Stepper
        label="How long"
        value={minutes}
        unit="min"
        step={5}
        min={5}
        max={360}
        onChange={setMinutes}
      />
      <Stepper
        label="How hard (1-10)"
        value={effort}
        unit=""
        step={1}
        min={1}
        max={10}
        onChange={setEffort}
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
  const suggestions = activityTypes.filter((t) => !have.has(t.id)).slice(0, 30);

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
          <Text variant="cardTitle">{type.name}</Text>
          <Text variant="secondary" tone="muted">
            {`About ${type.typicalMinutes} min · starts at once a week; change it any time`}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function Stepper({
  label,
  value,
  unit,
  step,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  step: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
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
          accessibilityLabel={`Less ${label}`}
          onPress={() => onChange(Math.max(min, value - step))}
          style={[styles.stepButton, { borderColor: colors.controlBorder }]}
        >
          <Text variant="sheetTitle">−</Text>
        </Pressable>
        <Text variant="cardTitle" style={styles.stepValue}>
          {value}
          {unit ? ` ${unit}` : ''}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`More ${label}`}
          onPress={() => onChange(Math.min(max, value + step))}
          style={[styles.stepButton, { borderColor: colors.controlBorder }]}
        >
          <Text variant="sheetTitle">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  menu: { gap: 10 },
  menuRow: {
    borderWidth: 1,
    borderRadius: metrics.card.radius,
    paddingVertical: metrics.card.paddingVertical,
    paddingHorizontal: metrics.card.paddingHorizontal,
    gap: 2,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
  busyBlock: { gap: 8 },
  busyLabel: { paddingHorizontal: metrics.sheet.inset },
  presets: { flexDirection: 'row', gap: 8 },
  preset: {
    flex: 1,
    height: metrics.button.height,
    borderRadius: metrics.button.radius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: {
    minHeight: metrics.minTapTarget,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: metrics.button.radius,
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
  pickList: { maxHeight: 420 },
});
