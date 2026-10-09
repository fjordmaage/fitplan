import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ReactNode } from 'react';

import {
  activityType,
  estimatedMinutes,
  guideGroup,
  suggestFrequency,
  type ActivityType,
  type Exercise,
} from '@fitplan/engine';

import { useStore } from '@/data/store';
import { metrics, useTheme, type RatingLevel } from '@/theme';
import {
  BackHeader,
  Button,
  CardDivider,
  ChoiceGrid,
  ListRow,
  Stepper,
  SurfaceCard,
  Text,
} from '@/ui';

const lib = metrics.library;

type Group = ActivityType['group'];

function rawGroupOf(exercise: Exercise): Group {
  if (exercise.activityTypeId) {
    const type = activityType(exercise.activityTypeId);
    if (type) return type.group;
  }
  return guideGroup(exercise);
}

function groupDisplayName(group: Group): string {
  switch (group) {
    case 'strength':
    case 'mobility':
      return 'Strength and mobility';
    case 'ballSports':
      return 'Ball sports';
    case 'racketSports':
      return 'Racket sports';
    default:
      return group.charAt(0).toUpperCase() + group.slice(1);
  }
}

function effortWord(effort: number): string {
  if (effort <= 3) return 'Easy';
  if (effort <= 6) return 'Moderate';
  if (effort <= 8) return 'Hard';
  return 'Very hard';
}

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function monthName(day: string): string {
  return monthNames[Number(day.split('-')[1]) - 1] ?? '';
}

const helpLevels = ['none', 'checklist', 'full'] as const;

/** Exercise details: how often, its properties, help level, and history. */
export default function ExerciseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state } = useStore();
  const exercise = state.exercises.find((e) => e.id === id);

  if (!exercise) {
    return (
      <Shell>
        <BackHeader title="Exercise" backLabel="Back to exercises" />
        <Text variant="advice">This exercise is gone from the list, but its history is kept.</Text>
      </Shell>
    );
  }
  return <Details exercise={exercise} />;
}

function Shell({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.ground, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

function Details({ exercise }: { exercise: Exercise }) {
  const { colors } = useTheme();
  const router = useRouter();
  const store = useStore();
  const { state, inputs, names, today } = store;

  const isFixed =
    state.anchorSeries.some((s) => s.exerciseId === exercise.id) ||
    state.anchors.some(
      (a) => a.exerciseId === exercise.id && !a.cancelled && !state.cancelledAnchorIds.has(a.id),
    );

  const suggested = suggestFrequency(
    exercise,
    inputs.exercises,
    state.history,
    today,
    state.settings.trainingAmount,
  ).perWeek;
  const perWeek = exercise.frequencyPerWeek ?? suggested;
  const level: RatingLevel =
    perWeek <= suggested ? 'good' : perWeek === suggested + 1 ? 'ok' : 'avoid';
  const adviceText =
    level === 'good'
      ? `Fits well. The app can space ${perWeek} session${perWeek === 1 ? '' : 's'} with full rest between them.`
      : level === 'ok'
        ? `A bit much. ${perWeek} a week fits, but recovery will be tight some weeks.`
        : "That's more than your recovery can carry right now.";

  function setFrequency(next: number) {
    const clamped = Math.min(7, Math.max(1, next));
    if (clamped === exercise.frequencyPerWeek) return;
    store.dispatch([
      { type: 'exerciseUpdated', exerciseId: exercise.id, patch: { frequencyPerWeek: clamped } },
    ]);
  }

  const mine = state.history.filter((session) => session.exerciseId === exercise.id);
  let soFar = 'Nothing logged yet.';
  if (mine.length > 0) {
    const oldest = mine.reduce((a, b) => (a.day <= b.day ? a : b)).day;
    const hours = Math.round(mine.reduce((sum, session) => sum + session.minutes, 0) / 60);
    soFar = `${mine.length} sessions since ${monthName(oldest)}, about ${hours} h in total.`;
  }

  const helpIndex = helpLevels.indexOf(exercise.helpLevel ?? 'checklist');

  function archive() {
    store.dispatch([{ type: 'exerciseArchived', exerciseId: exercise.id, day: today }]);
    router.back();
  }

  const adviceStyle: ViewStyle = {
    borderRadius: metrics.advice.radius,
    paddingVertical: metrics.advice.paddingVertical,
    paddingHorizontal: metrics.advice.paddingHorizontal,
    backgroundColor: colors.rating[level].background,
  };

  return (
    <Shell>
      <BackHeader
        title={exercise.name}
        subtitle={`${groupDisplayName(rawGroupOf(exercise))} · ${isFixed ? 'fixed' : 'flexible'}`}
        backLabel="Back to exercises"
      />

      <SurfaceCard style={styles.oftenCard}>
        <Text variant="sectionHeading">How often</Text>
        <Stepper
          value={`${perWeek} times`}
          unit="a week"
          onLess={() => setFrequency(perWeek - 1)}
          onMore={() => setFrequency(perWeek + 1)}
          lessLabel="Less often"
          moreLabel="More often"
        />
        <View style={adviceStyle}>
          <Text variant="advice" color={colors.rating[level].text}>
            {adviceText}
          </Text>
        </View>
        <Button
          label={`Use the suggested ${suggested} a week`}
          onPress={() => setFrequency(suggested)}
        />
      </SurfaceCard>

      <SurfaceCard list>
        <ListRow
          label="Usual effort"
          value={effortWord(exercise.typicalEffort)}
          height={lib.rowTall}
        />
        <CardDivider />
        <ListRow
          label="Takes about"
          value={`${estimatedMinutes(exercise, state.history)} min${
            mine.length > 0 ? ', from your last sessions' : ''
          }`}
          height={lib.rowTall}
        />
        <CardDivider />
        <ListRow
          label="Best time of day"
          value={capitalise(exercise.preferredSlot ?? 'any')}
          height={lib.rowTall}
        />
        <CardDivider />
        {/* Pairing reads in both directions: what this follows, or what
            follows it (the back routine names the run; the run should still
            show the link). */}
        <ListRow
          label={exercise.pairAfterExerciseId ? 'Do right after' : 'Followed by'}
          value={
            exercise.pairAfterExerciseId
              ? (names.get(exercise.pairAfterExerciseId) ?? 'Nothing')
              : (state.exercises.find((e) => e.pairAfterExerciseId === exercise.id)?.name ??
                'Nothing')
          }
          height={lib.rowTall}
        />
      </SurfaceCard>

      <SurfaceCard style={styles.helpCard}>
        <Text variant="sectionHeading">How much help during it</Text>
        <ChoiceGrid
          options={['None', 'Checklist', 'Full guide']}
          selectedIndex={helpIndex}
          onSelect={(index) =>
            store.dispatch([
              {
                type: 'exerciseUpdated',
                exerciseId: exercise.id,
                patch: { helpLevel: helpLevels[index] ?? 'checklist' },
              },
            ])
          }
        />
        <Text variant="secondary" tone="muted">
          Choose how much the app walks you through a session.
        </Text>
      </SurfaceCard>

      <SurfaceCard style={styles.soFarCard}>
        <Text variant="sectionHeading">So far</Text>
        <Text variant="advice">{soFar}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`See everything logged for ${exercise.name}`}
          onPress={() =>
            // The History screen lands later in this stage; the cast bridges
            // the typed routes until the file exists.
            router.push({
              pathname: '/history',
              params: { exercise: exercise.id },
            } as unknown as Href)
          }
          style={({ pressed }) => [styles.flatLink, pressed && styles.pressed]}
        >
          <Text variant="actionLabel">See everything</Text>
        </Pressable>
      </SurfaceCard>

      <View style={styles.footerGrid}>
        <Button label="Pause for a while" style={styles.footerButton} onPress={archive} />
        <Button label="Stop doing this" style={styles.footerButton} onPress={archive} />
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingTop: lib.scrollPaddingTop,
    paddingHorizontal: lib.scrollPaddingHorizontal,
    paddingBottom: lib.scrollPaddingBottom,
    gap: 18,
  },
  oftenCard: { gap: 12 },
  helpCard: { gap: 10 },
  soFarCard: { gap: 4 },
  flatLink: { height: metrics.minTapTarget, justifyContent: 'center' },
  footerGrid: { flexDirection: 'row', gap: 8 },
  footerButton: { flex: 1, height: 46 },
  pressed: { opacity: 0.7 },
});
