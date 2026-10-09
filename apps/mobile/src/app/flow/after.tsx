import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SLOTS, estimatedMinutes, suggestedEffort, type Slot } from '@fitplan/engine';

import { useStore } from '@/data/store';
import { effortDescriptions } from '@/i18n/sentences';
import { fontFamily, metrics, useTheme } from '@/theme';
import { Button, ChoiceButton, Text } from '@/ui';

const EFFORTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const PAIN_OPTIONS = ['Nothing', 'Legs', 'Knees', 'Back', 'Somewhere else'] as const;

/** The check-in after a workout (mockup 15). */
export default function CheckInAfter() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const store = useStore();
  const { inputs, result, state, dispatch } = store;

  const params = useLocalSearchParams<{
    exerciseId?: string;
    day?: string;
    slot?: string;
    elapsed?: string;
  }>();
  const exerciseId = typeof params.exerciseId === 'string' ? params.exerciseId : '';
  const day = typeof params.day === 'string' ? params.day : store.today;
  const slot: Slot =
    typeof params.slot === 'string' && (SLOTS as readonly string[]).includes(params.slot)
      ? (params.slot as Slot)
      : 'afternoon';
  const elapsed = typeof params.elapsed === 'string' ? Number.parseInt(params.elapsed, 10) : NaN;

  const exercise = inputs.exercises.find((e) => e.id === exerciseId);

  // What the app suggested beforehand: the default answer, and what the
  // plan-impact line compares the actual effort against. Captured once.
  const [suggestion] = useState(() =>
    exercise ? suggestedEffort(inputs, exercise, day, slot, result.plan) : null,
  );
  const [effort, setEffort] = useState(() => suggestion?.effort ?? 5);
  /** Pain chips besides "Nothing"; an empty list means "Nothing". */
  const [pains, setPains] = useState<readonly string[]>([]);
  const [note, setNote] = useState('');

  if (!exercise || !suggestion) return <Redirect href="/" />;

  const minutes =
    Number.isFinite(elapsed) && elapsed > 0 ? elapsed : estimatedMinutes(exercise, state.history);

  const togglePain = (option: string) => {
    if (option === 'Nothing') setPains([]);
    else {
      setPains((current) =>
        current.includes(option) ? current.filter((p) => p !== option) : [...current, option],
      );
    }
  };

  // What this effort means for the plan, in the app's own words.
  const impact =
    effort > suggestion.effort + 1
      ? "That's harder than the app suggested today — it will go easier on the next sessions."
      : Math.abs(effort - suggestion.baseline) <= 1
        ? 'That matches what the app expected, so the plan stays as it is.'
        : 'Noted. The app counts this toward recovery and adjusts what comes next.';

  const saveSession = () => {
    const trimmed = note.trim();
    dispatch([
      {
        type: 'sessionCompleted',
        session: { exerciseId, day, minutes, effort },
        source: 'planned',
        ...(pains.length > 0 ? { pain: pains } : {}),
        ...(trimmed ? { note: trimmed } : {}),
      },
    ]);
    router.replace('/');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
      <View style={styles.container}>
        <View style={styles.titles}>
          <Text variant="overline" tone="muted">
            {`${exercise.name} · ${minutes} min`}
          </Text>
          <Text variant="screenTitle">Done. How hard was it?</Text>
        </View>

        <View style={styles.effortSection}>
          <View style={styles.effortGrid}>
            {[EFFORTS.slice(0, 5), EFFORTS.slice(5)].map((row) => (
              <View key={row[0]} style={styles.effortRow}>
                {row.map((n) => (
                  <EffortCell key={n} value={n} selected={n === effort} onPress={setEffort} />
                ))}
              </View>
            ))}
          </View>
          <Text variant="advice" tone="muted">
            {`${effort} · ${effortDescriptions[effort]}`}
          </Text>
        </View>

        <View style={styles.painSection}>
          <Text variant="actionLabel">Did anything hurt?</Text>
          <View style={styles.pills}>
            {PAIN_OPTIONS.map((option) => (
              <ChoiceButton
                key={option}
                label={option}
                selected={option === 'Nothing' ? pains.length === 0 : pains.includes(option)}
                onPress={() => togglePain(option)}
                shape="pill"
              />
            ))}
          </View>
        </View>

        <View style={styles.noteSection}>
          <Text variant="actionLabel">Note to yourself (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Windy, new shoes, felt great…"
            placeholderTextColor={colors.mutedText}
            accessibilityLabel="Note to yourself"
            style={[
              styles.noteInput,
              {
                borderColor: colors.controlBorder,
                backgroundColor: colors.surface,
                color: colors.ink,
              },
            ]}
          />
        </View>

        <View style={[styles.impact, { backgroundColor: colors.quietFill }]}>
          <Text variant="advice">{impact}</Text>
        </View>

        <View style={styles.spacer} />

        <Button label="Save" variant="primary" onPress={saveSession} style={styles.saveButton} />
      </View>
    </View>
  );
}

/**
 * One cell of the effort 1-10 grid. Selected is an ink fill with onInk text,
 * the only fill-style selection in the app (design system).
 */
function EffortCell({
  value,
  selected,
  onPress,
}: {
  value: number;
  selected: boolean;
  onPress: (value: number) => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Effort ${value} of 10`}
      accessibilityState={{ selected }}
      onPress={() => onPress(value)}
      style={({ pressed }) => [
        styles.effortCell,
        selected
          ? { backgroundColor: colors.ink, borderWidth: 2, borderColor: colors.ink }
          : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.controlBorder },
        pressed && styles.pressed,
      ]}
    >
      <Text
        variant={selected ? 'effortCellSelected' : 'effortCell'}
        tone={selected ? 'onInk' : 'ink'}
      >
        {value}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    flex: 1,
    paddingTop: 28,
    paddingHorizontal: metrics.flow.paddingHorizontal,
    paddingBottom: metrics.flow.paddingBottom,
    gap: 24,
  },
  titles: { gap: 2 },
  effortSection: { gap: 8 },
  effortGrid: { gap: 6 },
  effortRow: { flexDirection: 'row', gap: 6 },
  effortCell: {
    flex: 1,
    height: metrics.flow.effortCellHeight,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  painSection: { gap: 8 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  noteSection: { gap: 6 },
  noteInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 0,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: fontFamily.regular,
  },
  impact: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  spacer: { flex: 1 },
  saveButton: { height: 48 },
  pressed: { opacity: 0.7 },
});
