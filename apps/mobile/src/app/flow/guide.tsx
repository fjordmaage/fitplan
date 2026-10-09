import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  SLOTS,
  buildGuide,
  estimatedMinutes,
  suggestedEffort,
  type GuideStep,
  type Slot,
} from '@fitplan/engine';

import { useStore } from '@/data/store';
import { metrics, useTheme } from '@/theme';
import { DashedBorder, Icon, ProgressSegments, RoundIconButton, Text, type IconName } from '@/ui';

/** Seconds a step takes, from `fromSet` onwards (counted ≈ 3 s a rep + rest). */
function stepSeconds(step: GuideStep, fromSet = 0): number {
  if (step.kind === 'timed') return step.seconds;
  return Math.max(0, step.sets - fromSet) * (step.reps * 3 + step.restSeconds);
}

/** The step-by-step guide, one move at a time (mockups 13 and 14). */
export default function Guide() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const store = useStore();
  const { inputs, result, state, dispatch } = store;

  const params = useLocalSearchParams<{ exerciseId?: string; day?: string; slot?: string }>();
  const exerciseId = typeof params.exerciseId === 'string' ? params.exerciseId : '';
  const day = typeof params.day === 'string' ? params.day : store.today;
  const slot: Slot =
    typeof params.slot === 'string' && (SLOTS as readonly string[]).includes(params.slot)
      ? (params.slot as Slot)
      : 'afternoon';

  const exercise = inputs.exercises.find((e) => e.id === exerciseId);

  // The guide is fixed for the whole workout: a hand-saved routine when one
  // exists, otherwise generated on the spot at today's suggested dose.
  const [steps] = useState<readonly GuideStep[]>(() => {
    if (!exercise) return [];
    const saved = state.routines.get(exerciseId);
    if (saved && saved.length > 0) return saved;
    return buildGuide(
      exercise,
      estimatedMinutes(exercise, state.history),
      suggestedEffort(inputs, exercise, day, slot, result.plan).effort,
    ).steps;
  });
  const [startedAt] = useState(() => Date.now());
  const [stepIndex, setStepIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const first = steps[0];
    return first && first.kind === 'timed' ? first.seconds : 0;
  });
  /** "Too hard" trims a counted step's reps for the rest of this workout. */
  const [repsOverride, setRepsOverride] = useState<Record<number, number>>({});

  const step = steps[stepIndex];

  // The countdown: one tick a second while a timed step runs.
  useEffect(() => {
    const current = steps[stepIndex];
    if (paused || !current || current.kind !== 'timed') return undefined;
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [paused, stepIndex, steps]);

  // At zero a timed step advances on its own (past the last step: finish).
  useEffect(() => {
    const current = steps[stepIndex];
    if (paused || secondsLeft > 0 || !current || current.kind !== 'timed') return undefined;
    const t = setTimeout(() => {
      const next = stepIndex + 1;
      if (next >= steps.length) {
        const elapsed = Math.max(1, Math.round((Date.now() - startedAt) / 60_000));
        router.replace({
          pathname: '/flow/after',
          params: { exerciseId, day, slot, elapsed: String(elapsed) },
        });
        return;
      }
      setStepIndex(next);
      setSetIndex(0);
      const coming = steps[next]!;
      setSecondsLeft(coming.kind === 'timed' ? coming.seconds : 0);
    }, 0);
    return () => clearTimeout(t);
  }, [paused, secondsLeft, stepIndex, steps, startedAt, exerciseId, day, slot]);

  if (!exercise || !step) return <Redirect href="/" />;

  const voice = state.settings.voiceCues;
  const finish = () => {
    const elapsed = Math.max(1, Math.round((Date.now() - startedAt) / 60_000));
    router.replace({
      pathname: '/flow/after',
      params: { exerciseId, day, slot, elapsed: String(elapsed) },
    });
  };
  const goToStep = (next: number) => {
    if (next < 0) return;
    if (next >= steps.length) {
      finish();
      return;
    }
    setStepIndex(next);
    setSetIndex(0);
    const coming = steps[next]!;
    setSecondsLeft(coming.kind === 'timed' ? coming.seconds : 0);
  };

  const remainingSeconds =
    (step.kind === 'timed' ? secondsLeft : stepSeconds(step, setIndex)) +
    steps.slice(stepIndex + 1).reduce((sum, s) => sum + stepSeconds(s), 0);
  const minutesLeft = Math.max(1, Math.round(remainingSeconds / 60));

  const next = steps[stepIndex + 1];
  const reps = step.kind === 'counted' ? (repsOverride[stepIndex] ?? step.reps) : 0;

  const advanceSet = () => {
    if (step.kind !== 'counted') return;
    if (setIndex + 1 < step.sets) setSetIndex(setIndex + 1);
    else goToStep(stepIndex + 1);
  };
  const backSet = () => {
    if (setIndex > 0) setSetIndex(setIndex - 1);
    else goToStep(stepIndex - 1);
  };
  const tooHard = () => {
    setRepsOverride((o) => ({ ...o, [stepIndex]: Math.max(1, Math.round(reps * 0.7)) }));
    advanceSet();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <RoundIconButton
            icon="close"
            label="Leave the workout"
            onPress={() => router.replace('/')}
          />
          <View style={styles.headerCentre}>
            <Text variant="cardTitle">{exercise.name}</Text>
            <Text variant="secondary" tone="muted">
              {`Move ${stepIndex + 1} of ${steps.length} · ${minutesLeft} min left`}
            </Text>
          </View>
          <RoundIconButton
            icon={voice ? 'speakerOn' : 'speakerOff'}
            label={voice ? 'Voice cues are on' : 'Voice cues are off'}
            onPress={() => dispatch([{ type: 'settingsChanged', patch: { voiceCues: !voice } }])}
          />
        </View>

        <ProgressSegments total={steps.length} done={stepIndex} current={stepIndex} />

        <View style={[styles.illustration, { backgroundColor: colors.quietFill }]}>
          <DashedBorder
            color={colors.busyBarLine}
            width={1.5}
            radius={metrics.flow.illustrationRadius}
          />
          <Text variant="advice" tone="muted" style={styles.illustrationText}>
            {'Exercise illustration\nfrom the catalogue'}
          </Text>
        </View>

        <View style={styles.move}>
          <Text variant="guideMoveName" style={styles.centred}>
            {step.title}
          </Text>
          {step.detail ? (
            <Text variant="guideCue" tone="muted" style={styles.centred}>
              {step.detail}
            </Text>
          ) : null}
        </View>

        {step.kind === 'timed' ? (
          <>
            <View style={styles.dose}>
              <Text variant="countdown">
                {`${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}
              </Text>
              <Text variant="secondary" tone="muted">
                {step.seconds >= 60
                  ? `of ${Math.round(step.seconds / 60)} min`
                  : `of ${step.seconds} seconds`}
              </Text>
            </View>
            <View style={styles.transport}>
              <TransportButton
                icon="chevronLeft"
                label="Previous move"
                onPress={() => goToStep(stepIndex - 1)}
              />
              <TransportButton
                icon={paused ? 'play' : 'pause'}
                label={paused ? 'Resume' : 'Pause'}
                big
                onPress={() => setPaused((p) => !p)}
              />
              <TransportButton
                icon="chevronRight"
                label="Next move"
                onPress={() => goToStep(stepIndex + 1)}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.dose}>
              <Text variant="doseValue">{`${reps} reps`}</Text>
              <Text variant="secondary" tone="muted">
                {`Set ${setIndex + 1} of ${step.sets} · go at your own pace`}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Done with this set"
              onPress={advanceSet}
              style={({ pressed }) => [
                styles.bigButton,
                { backgroundColor: colors.accent },
                pressed && styles.pressed,
              ]}
            >
              <Text variant="buttonPrimary" tone="onAccent">
                Done with this set
              </Text>
            </Pressable>
            <View style={styles.secondaryRow}>
              <SmallButton label="Back" onPress={backSet} />
              <SmallButton label="Skip move" onPress={() => goToStep(stepIndex + 1)} />
              <SmallButton label="Too hard" onPress={tooHard} />
            </View>
          </>
        )}

        {next ? (
          <View style={[styles.upNext, { backgroundColor: colors.quietFill }]}>
            <View style={styles.upNextText}>
              <Text variant="tinyLabel" tone="muted">
                Up next
              </Text>
              <Text variant="listTitle">{next.title}</Text>
            </View>
            <Text variant="secondary" tone="muted">
              {next.kind === 'timed' ? `${next.seconds} s` : `${next.sets} × ${next.reps}`}
            </Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change the moves"
            onPress={() => router.push(`/routine/${exerciseId}`)}
            style={({ pressed }) => [styles.flatButton, pressed && styles.pressed]}
          >
            <Text variant="actionLabel">Change the moves</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Finish now"
            onPress={finish}
            style={({ pressed }) => [styles.flatButton, pressed && styles.pressed]}
          >
            <Text variant="actionLabel">Finish now</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** The 56-round previous/next and 76-round accent pause/play buttons. */
function TransportButton({
  icon,
  label,
  onPress,
  big = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  big?: boolean;
}) {
  const { colors } = useTheme();
  const f = metrics.flow;
  const size = big ? f.transportBig : f.transportSize;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
        },
        big
          ? { backgroundColor: colors.accent }
          : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.controlBorder },
        pressed && styles.pressed,
      ]}
    >
      <Icon
        name={icon}
        size={big ? f.transportBigGlyph : f.transportGlyph}
        color={big ? colors.textOnAccent : colors.ink}
      />
    </Pressable>
  );
}

/** The Back / Skip move / Too hard outline buttons. */
function SmallButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.smallButton,
        { backgroundColor: colors.surface, borderColor: colors.controlBorder },
        pressed && styles.pressed,
      ]}
    >
      <Text variant="actionLabel">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    flex: 1,
    paddingTop: metrics.flow.paddingTop,
    paddingHorizontal: metrics.flow.paddingHorizontal,
    paddingBottom: metrics.flow.paddingBottom,
    gap: metrics.flow.gap,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCentre: { alignItems: 'center', gap: 1, flexShrink: 1 },
  illustration: {
    flex: 1,
    minHeight: 0,
    borderRadius: metrics.flow.illustrationRadius,
    // The visible outline is the DashedBorder; this one only reserves space.
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  illustrationText: { textAlign: 'center' },
  move: { alignItems: 'center', gap: 4 },
  centred: { textAlign: 'center' },
  dose: { alignItems: 'center', gap: 2 },
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: metrics.flow.transportGap,
  },
  bigButton: {
    height: metrics.flow.bigButtonHeight,
    borderRadius: metrics.flow.bigButtonRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryRow: { flexDirection: 'row', gap: 8 },
  smallButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upNext: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  upNextText: { gap: 1, flexShrink: 1 },
  footer: { flexDirection: 'row', gap: 8 },
  flatButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
