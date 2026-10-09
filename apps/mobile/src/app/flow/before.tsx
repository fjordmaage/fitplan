import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  SLOTS,
  learnFromCheckIn,
  projectedSessions,
  rate,
  readiness as readinessParams,
  recoveryAt,
  suggestedEffort,
  type CheckIn,
  type RegionState,
  type Slot,
  type Soreness,
} from '@fitplan/engine';

import { deviceNow, shortDay } from '@/data/plan';
import { useStore } from '@/data/store';
import { effortSentence, reasonSentence } from '@/i18n/sentences';
import { metrics, useTheme } from '@/theme';
import { Button, ChoiceGrid, RoundIconButton, Text } from '@/ui';

const SORENESS_OPTIONS = ['Fresh', 'A bit sore', 'Sore'] as const;
const ENERGY_OPTIONS = ['Low', 'Normal', 'High'] as const;

/** Choice index (0 Fresh / 1 A bit sore / 2 Sore) to the engine's word. */
const sorenessOf: readonly Soreness[] = ['fresh', 'bitSore', 'sore'];

/** Readiness to a default choice index: ready, borderline, below. */
function defaultIndex(state: RegionState): number {
  if (state.readiness >= readinessParams.ready) return 0;
  if (state.readiness >= readinessParams.borderline) return 1;
  return 2;
}

const verdictLead = {
  good: 'Good to go as planned.',
  ok: 'Go, but take it easier today.',
  avoid: 'Better to hold off.',
} as const;

/** The check-in before a workout (mockup 12). */
export default function CheckInBefore() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const store = useStore();
  const { inputs, result, names, dispatch } = store;

  const params = useLocalSearchParams<{
    exerciseId?: string;
    day?: string;
    slot?: string;
    correct?: string;
  }>();
  const exerciseId = typeof params.exerciseId === 'string' ? params.exerciseId : '';
  const day = typeof params.day === 'string' ? params.day : store.today;
  const slot: Slot =
    typeof params.slot === 'string' && (SLOTS as readonly string[]).includes(params.slot)
      ? (params.slot as Slot)
      : 'afternoon';
  const correcting = params.correct === '1';

  const exercise = inputs.exercises.find((e) => e.id === exerciseId);

  // Defaults come from the engine's own current estimate, so the user only
  // has to correct it where it is wrong. Captured once, at open.
  const [answers, setAnswers] = useState(() => {
    const rec = recoveryAt(
      { ...inputs, history: projectedSessions(inputs, result.plan) },
      deviceNow(),
    );
    return {
      legs: defaultIndex(rec.legs),
      back: defaultIndex(rec.backAndCore),
      // One control fans out to both regions; default from the worse of the two.
      arms: Math.max(defaultIndex(rec.armsAndShoulders), defaultIndex(rec.fingersAndForearms)),
      energy: 1,
    };
  });
  const [openedAt] = useState(() => deviceNow());

  if (!exercise) return <Redirect href="/" />;

  // The draft check-in the verdict is computed from and save() records.
  const draft: CheckIn = {
    day,
    atMinutes: openedAt.minutes,
    soreness: {
      legs: sorenessOf[answers.legs]!,
      backAndCore: sorenessOf[answers.back]!,
      // "Arms and fingers" is one question covering two engine regions.
      armsAndShoulders: sorenessOf[answers.arms]!,
      fingersAndForearms: sorenessOf[answers.arms]!,
      // Energy maps onto the whole-body region: Low reads as a bit worn,
      // High as fully fresh, Normal says nothing (no override).
      ...(answers.energy === 0
        ? { general: 'bitSore' as const }
        : answers.energy === 2
          ? { general: 'fresh' as const }
          : {}),
    },
  };

  // The verdict is live: rate and suggest against the inputs *with* the draft
  // check-in applied, since the store's inputs cannot know it yet.
  const draftInputs = { ...inputs, checkIns: [...inputs.checkIns, draft] };
  const rating = rate(
    { inputs: draftInputs, plan: result.plan, exclude: { exerciseId, day, slot } },
    exercise,
    day,
    slot,
  );
  const suggestion = suggestedEffort(draftInputs, exercise, day, slot, result.plan);
  const ctx = { names, shortDay };
  const firstReason = rating.reasons[0];
  const verdict = [
    verdictLead[rating.level],
    firstReason ? reasonSentence(firstReason, ctx) : undefined,
    // The effort line only earns its place when it says something unusual.
    suggestion.direction !== 'usual' ? effortSentence(suggestion, ctx) : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  const save = () => {
    dispatch([
      { type: 'checkInRecorded', checkIn: draft },
      { type: 'learnedUpdated', learned: { halfLifeFactor: learnFromCheckIn(inputs, draft) } },
    ]);
  };
  const flowParams = { exerciseId, day, slot };
  const startGuide = () => {
    save();
    router.replace({ pathname: '/flow/guide', params: flowParams });
  };
  const onMyOwn = () => {
    save();
    router.replace({ pathname: '/flow/after', params: flowParams });
  };
  const saveAndBack = () => {
    save();
    router.back();
  };
  // When correcting from the Body screen, any exit saves what was entered.
  const close = correcting ? saveAndBack : () => router.back();

  const groups: {
    label: string;
    options: readonly string[];
    value: number;
    set: (index: number) => void;
  }[] = [
    {
      label: 'Legs',
      options: SORENESS_OPTIONS,
      value: answers.legs,
      set: (i) => setAnswers((a) => ({ ...a, legs: i })),
    },
    {
      label: 'Back',
      options: SORENESS_OPTIONS,
      value: answers.back,
      set: (i) => setAnswers((a) => ({ ...a, back: i })),
    },
    {
      label: 'Arms and fingers',
      options: SORENESS_OPTIONS,
      value: answers.arms,
      set: (i) => setAnswers((a) => ({ ...a, arms: i })),
    },
    {
      label: 'Energy',
      options: ENERGY_OPTIONS,
      value: answers.energy,
      set: (i) => setAnswers((a) => ({ ...a, energy: i })),
    },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titles}>
            <Text variant="overline" tone="muted">
              Before today&apos;s workout
            </Text>
            <Text variant="screenTitle">How do you feel?</Text>
          </View>
          <RoundIconButton icon="close" label="Close" onPress={close} />
        </View>

        <View style={styles.groups}>
          {groups.map((group) => (
            <View key={group.label} style={styles.group}>
              <Text variant="actionLabel">{group.label}</Text>
              <ChoiceGrid
                options={group.options}
                selectedIndex={group.value}
                onSelect={group.set}
                shape="cell"
              />
            </View>
          ))}
        </View>

        <View style={[styles.verdict, { backgroundColor: colors.rating[rating.level].background }]}>
          <Text variant="advice" color={colors.rating[rating.level].text}>
            {verdict}
          </Text>
        </View>

        <View style={styles.spacer} />

        <View style={styles.footer}>
          {correcting ? (
            <Button
              label="Save how I feel"
              variant="primary"
              onPress={saveAndBack}
              style={styles.primaryButton}
            />
          ) : (
            <>
              <Button
                label="Start with the guide"
                variant="primary"
                onPress={startGuide}
                style={styles.primaryButton}
              />
              <Button
                label="I'll do it on my own"
                variant="secondary"
                onPress={onMyOwn}
                style={styles.secondaryButton}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Not feeling 100%?"
                onPress={() => router.push('/unwell')}
                style={({ pressed }) => [styles.flatButton, pressed && styles.pressed]}
              >
                <Text variant="actionLabel">Not feeling 100%?</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    flex: 1,
    paddingTop: metrics.flow.paddingTop,
    paddingHorizontal: metrics.flow.paddingHorizontal,
    paddingBottom: metrics.flow.paddingBottom,
    gap: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titles: { gap: 2, flexShrink: 1 },
  groups: { gap: 14 },
  group: { gap: 6 },
  verdict: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  spacer: { flex: 1 },
  footer: { gap: 8 },
  primaryButton: { height: 48 },
  secondaryButton: { height: 46 },
  flatButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
