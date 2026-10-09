import { useLocalSearchParams, useRouter } from 'expo-router';
import { Fragment, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildGuide, type Exercise, type GuideStep } from '@fitplan/engine';

import { useStore } from '@/data/store';
import { metrics, ratingWord, useTheme } from '@/theme';
import {
  BackHeader,
  Button,
  CardDivider,
  FlatRowButton,
  Icon,
  RatingChipBadge,
  Section,
  SurfaceCard,
  Text,
} from '@/ui';

const lib = metrics.library;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Minutes a set of steps takes: timed as given, counted at ~3 s a rep. */
function totalMinutes(steps: readonly GuideStep[]): number {
  let seconds = 0;
  for (const step of steps) {
    if (step.kind === 'timed') seconds += step.seconds;
    else seconds += step.sets * (step.reps * 3 + step.restSeconds);
  }
  return Math.round(seconds / 60);
}

function doseText(step: GuideStep): string {
  return step.kind === 'counted' ? `${step.sets} × ${step.reps}` : `${step.seconds} s`;
}

/** The routine designer: the moves of one exercise, editable and reorderable. */
export default function RoutineDesignerScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state } = useStore();
  const exercise = state.exercises.find((e) => e.id === id);

  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!exercise) {
    return (
      <View style={[styles.root, { backgroundColor: colors.ground, paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <BackHeader title="Routine" backLabel="Back to exercises" />
          <Text variant="advice">
            This exercise is gone from the list, but its history is kept.
          </Text>
        </ScrollView>
      </View>
    );
  }
  return <Designer exercise={exercise} />;
}

function Designer({ exercise }: { exercise: Exercise }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const store = useStore();

  const [steps, setSteps] = useState<readonly GuideStep[]>(
    () => store.state.routines.get(exercise.id) ?? buildGuide(exercise).steps,
  );
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [searchNote, setSearchNote] = useState(false);

  const total = totalMinutes(steps);

  const presets = [
    { name: 'Short', minutes: Math.max(5, Math.round(exercise.typicalMinutes * 0.55)) },
    { name: 'Standard', minutes: exercise.typicalMinutes },
    { name: 'Long', minutes: Math.round(exercise.typicalMinutes * 1.6) },
  ];
  const selectedPreset = presets.findIndex(
    (preset) => Math.abs(total - preset.minutes) <= preset.minutes * 0.2,
  );

  const candidates = useMemo(() => {
    const present = new Set(steps.map((step) => step.title));
    const picked: GuideStep[] = [];
    for (const step of buildGuide(exercise, exercise.typicalMinutes * 2).steps) {
      if (picked.length >= 3) break;
      if (present.has(step.title) || picked.some((p) => p.title === step.title)) continue;
      picked.push(step);
    }
    for (const title of ['Plank', 'Side plank', 'Glute bridge']) {
      if (picked.length >= 3) break;
      if (present.has(title) || picked.some((p) => p.title === title)) continue;
      picked.push({ kind: 'counted', phase: 'main', title, sets: 2, reps: 10, restSeconds: 30 });
    }
    return picked;
  }, [steps, exercise]);

  function regenerate(minutes?: number) {
    setSteps(minutes == null ? buildGuide(exercise).steps : buildGuide(exercise, minutes).steps);
    setExpandedIndex(null);
  }

  function replaceStep(index: number, next: GuideStep) {
    setSteps(steps.map((step, i) => (i === index ? next : step)));
  }

  function adjustCounted(index: number, field: 'sets' | 'reps' | 'restSeconds', delta: number) {
    const step = steps[index];
    if (!step || step.kind !== 'counted') return;
    const limits = { sets: [1, 10], reps: [1, 30], restSeconds: [0, 300] } as const;
    const [min, max] = limits[field];
    replaceStep(index, { ...step, [field]: clamp(step[field] + delta, min, max) });
  }

  function adjustTimed(index: number, delta: number) {
    const step = steps[index];
    if (!step || step.kind !== 'timed') return;
    replaceStep(index, { ...step, seconds: clamp(step.seconds + delta, 15, 600) });
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    const a = next[index]!;
    next[index] = next[target]!;
    next[target] = a;
    setSteps(next);
    setExpandedIndex(target);
  }

  function remove(index: number) {
    setSteps(steps.filter((_, i) => i !== index));
    setExpandedIndex(null);
  }

  function save() {
    store.dispatch([
      { type: 'routineSaved', exerciseId: exercise.id, steps },
      {
        type: 'exerciseUpdated',
        exerciseId: exercise.id,
        patch: { typicalMinutes: Math.max(1, total) },
      },
    ]);
    router.back();
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.ground, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BackHeader
          title={exercise.name}
          subtitle={`${steps.length} moves · about ${total} min`}
          backLabel="Back to exercises"
        />

        <SurfaceCard style={styles.designCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Let the app design it"
            onPress={() => regenerate()}
            style={({ pressed }) => [
              styles.inkButton,
              { backgroundColor: colors.ink },
              pressed && styles.pressed,
            ]}
          >
            <Text variant="buttonPrimary" tone="onInk">
              Let the app design it
            </Text>
          </Pressable>
          <Text variant="secondary" tone="muted" style={styles.explainer}>
            It picks moves that suit your goal, your level and how your body is recovering, and
            refreshes them now and then. You can still change anything below.
          </Text>
        </SurfaceCard>

        <Section heading="Ready-made versions">
          <View style={styles.presetRow}>
            {presets.map((preset, index) => {
              const selected = index === selectedPreset;
              return (
                <Pressable
                  key={preset.name}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${preset.name}, about ${preset.minutes} minutes`}
                  onPress={() => regenerate(preset.minutes)}
                  style={({ pressed }) => [
                    styles.preset,
                    {
                      backgroundColor: colors.surface,
                      borderWidth: selected ? metrics.choice.selectedBorder : metrics.choice.border,
                      borderColor: selected ? colors.ink : colors.controlBorder,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    variant={selected ? 'choiceSelected' : 'choice'}
                    style={styles.presetText}
                  >{`${preset.name}\n${preset.minutes} min`}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section heading="Your moves">
          <SurfaceCard list tight>
            {steps.map((step, index) => (
              <Fragment key={`${step.title}-${index}`}>
                {index > 0 ? <CardDivider /> : null}
                {expandedIndex === index ? (
                  <View style={styles.expandedBlock}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Collapse ${step.title}`}
                      onPress={() => setExpandedIndex(null)}
                      style={styles.moveRow}
                    >
                      <Icon name="dragHandle" size={18} color={colors.mutedText} />
                      <Text variant="sectionHeading" style={styles.grow}>
                        {step.title}
                      </Text>
                      <Text variant="secondary" tone="muted">
                        {doseText(step)}
                      </Text>
                    </Pressable>
                    <View style={[styles.dosePanel, { backgroundColor: colors.quietFill }]}>
                      {step.kind === 'counted' ? (
                        <>
                          <DoseColumn
                            label="Sets"
                            value={`${step.sets}`}
                            lessLabel="Fewer sets"
                            moreLabel="More sets"
                            onLess={() => adjustCounted(index, 'sets', -1)}
                            onMore={() => adjustCounted(index, 'sets', 1)}
                          />
                          <DoseColumn
                            label="Reps"
                            value={`${step.reps}`}
                            lessLabel="Fewer reps"
                            moreLabel="More reps"
                            onLess={() => adjustCounted(index, 'reps', -1)}
                            onMore={() => adjustCounted(index, 'reps', 1)}
                          />
                          <DoseColumn
                            label="Rest"
                            value={`${step.restSeconds} s`}
                            lessLabel="Shorter rest"
                            moreLabel="Longer rest"
                            onLess={() => adjustCounted(index, 'restSeconds', -5)}
                            onMore={() => adjustCounted(index, 'restSeconds', 5)}
                          />
                        </>
                      ) : (
                        <DoseColumn
                          label="Seconds"
                          value={`${step.seconds} s`}
                          lessLabel="Shorter"
                          moreLabel="Longer"
                          onLess={() => adjustTimed(index, -15)}
                          onMore={() => adjustTimed(index, 15)}
                        />
                      )}
                    </View>
                    <View style={styles.actionRow}>
                      <Button
                        label="Move up"
                        style={styles.action}
                        onPress={() => move(index, -1)}
                      />
                      <Button
                        label="Move down"
                        style={styles.action}
                        onPress={() => move(index, 1)}
                      />
                      <Button label="Remove" style={styles.action} onPress={() => remove(index)} />
                    </View>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${step.title}, ${doseText(step)}`}
                    onPress={() => setExpandedIndex(index)}
                    style={({ pressed }) => [styles.moveRow, pressed && styles.pressed]}
                  >
                    <Icon name="dragHandle" size={18} color={colors.mutedText} />
                    <Text variant="listTitle" style={styles.grow}>
                      {step.title}
                    </Text>
                    <Text variant="secondary" tone="muted">
                      {doseText(step)}
                    </Text>
                  </Pressable>
                )}
              </Fragment>
            ))}
            {steps.length === 0 ? (
              <View style={styles.moveRow}>
                <Text variant="secondary" tone="muted">
                  No moves yet — add some below.
                </Text>
              </View>
            ) : null}
          </SurfaceCard>
        </Section>

        <Section heading="Add a move">
          <SurfaceCard list tight>
            {candidates.map((candidate, index) => (
              <Fragment key={candidate.title}>
                {index > 0 ? <CardDivider /> : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${candidate.title}`}
                  onPress={() => setSteps([...steps, candidate])}
                  style={({ pressed }) => [styles.candidateRow, pressed && styles.pressed]}
                >
                  <View style={styles.grow}>
                    <Text variant="listTitle">{candidate.title}</Text>
                    <Text variant="secondary" color={colors.rating.good.text}>
                      Works what this routine works.
                    </Text>
                  </View>
                  <RatingChipBadge level="good" word={ratingWord.good} />
                </Pressable>
              </Fragment>
            ))}
            {candidates.length > 0 ? <CardDivider /> : null}
            <FlatRowButton
              label="Search all moves, or write your own"
              onPress={() => setSearchNote((value) => !value)}
            />
            {searchNote ? (
              <Text variant="secondary" tone="muted" style={styles.searchNote}>
                Coming soon — the catalogue search lands with a later stage.
              </Text>
            ) : null}
          </SurfaceCard>
        </Section>
      </ScrollView>

      <View
        style={[
          styles.saveBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.hairline,
            paddingBottom: 20 + insets.bottom,
          },
        ]}
      >
        <Button label="Save routine" variant="primary" style={styles.saveButton} onPress={save} />
      </View>
    </View>
  );
}

/** One stepper column in the quiet dose panel: label, −, value, +. */
function DoseColumn({
  label,
  value,
  lessLabel,
  moreLabel,
  onLess,
  onMore,
}: {
  label: string;
  value: string;
  lessLabel: string;
  moreLabel: string;
  onLess: () => void;
  onMore: () => void;
}) {
  return (
    <View style={styles.doseColumn}>
      <Text variant="tinyLabel" tone="muted">
        {label}
      </Text>
      <View style={styles.doseControls}>
        <DoseButton glyph={'−'} label={lessLabel} onPress={onLess} />
        <Text variant="stepperValue" style={styles.doseValue}>
          {value}
        </Text>
        <DoseButton glyph="+" label={moreLabel} onPress={onMore} />
      </View>
    </View>
  );
}

function DoseButton({
  glyph,
  label,
  onPress,
}: {
  glyph: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.doseButton, pressed && styles.pressed]}
    >
      <Text variant="stepperValue">{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingTop: lib.scrollPaddingTop,
    paddingHorizontal: lib.scrollPaddingHorizontal,
    paddingBottom: lib.scrollPaddingBottom,
    gap: 20,
  },
  designCard: { padding: 14, gap: 10 },
  inkButton: {
    height: 48,
    borderRadius: metrics.button.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  explainer: { lineHeight: 18 },
  presetRow: { flexDirection: 'row', gap: metrics.choice.gap },
  preset: {
    flex: 1,
    height: 56,
    borderRadius: metrics.choice.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: { textAlign: 'center' },
  moveRow: {
    minHeight: lib.rowTall,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  grow: { flex: 1 },
  expandedBlock: { gap: 10, paddingVertical: 12 },
  dosePanel: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 14,
    padding: 10,
  },
  doseColumn: { flex: 1, alignItems: 'center', gap: 6 },
  doseControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doseButton: {
    width: 32,
    height: metrics.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doseValue: { minWidth: 22, textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 8 },
  action: { flex: 1 },
  candidateRow: {
    minHeight: lib.rowRated,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchNote: { paddingBottom: 12 },
  saveBar: {
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  saveButton: { height: 48 },
  pressed: { opacity: 0.7 },
});
