import { Fragment, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  activityType,
  activityTypes,
  estimatedMinutes,
  guideGroup,
  pickForFocus,
  weekday,
  type ActivityType,
  type BodyRegion,
  type Exercise,
} from '@fitplan/engine';
import { type AppState } from '@fitplan/store';

import { useStore } from '@/data/store';
import { regionHeading } from '@/i18n';
import { metrics, useTheme } from '@/theme';
import {
  BottomBar,
  CardDivider,
  ChoiceButton,
  FlatRowButton,
  GroupHeader,
  Marker,
  Section,
  SurfaceCard,
  Text,
} from '@/ui';

const lib = metrics.library;

type Group = ActivityType['group'];

/** The activity group an exercise belongs to: catalogue first, else inferred. */
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

interface FixedTimes {
  weekdays: number[];
  startMinutes: number;
}

/** Set times for an exercise, from its series or its standalone anchors. */
function fixedTimesFor(state: AppState, exerciseId: string): FixedTimes | null {
  const series = state.anchorSeries.filter((s) => s.exerciseId === exerciseId);
  if (series.length > 0) {
    const sorted = [...series].sort((a, b) => a.weekday - b.weekday);
    return {
      weekdays: [...new Set(sorted.map((s) => s.weekday))],
      startMinutes: sorted[0]!.startMinutes,
    };
  }
  const anchors = state.anchors.filter(
    (a) => a.exerciseId === exerciseId && !a.cancelled && !state.cancelledAnchorIds.has(a.id),
  );
  if (anchors.length === 0) return null;
  const weekdays = [...new Set(anchors.map((a) => weekday(a.day)))].sort((a, b) => a - b);
  return { weekdays, startMinutes: anchors[0]!.startMinutes };
}

const weekdayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function dayList(weekdays: readonly number[]): string {
  const names = weekdays.map((d) => weekdayShort[d] ?? '');
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function timeOfDay(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
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

/** The Exercises tab: what KL does now, could pick up, and has done before. */
export default function Exercises() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const store = useStore();
  const { state } = store;

  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [browsing, setBrowsing] = useState(false);
  const [focusRegion, setFocusRegion] = useState<BodyRegion | null>(null);

  const active = useMemo(
    () => state.exercises.filter((e) => !state.archivedExerciseIds.has(e.id)),
    [state],
  );

  const groups = useMemo(() => {
    const byName = new Map<string, Exercise[]>();
    for (const exercise of active) {
      const name = groupDisplayName(rawGroupOf(exercise));
      const list = byName.get(name) ?? [];
      list.push(exercise);
      byName.set(name, list);
    }
    return [...byName.entries()].map(([name, exercises]) => ({ name, exercises }));
  }, [active]);

  const suggestions = useMemo(() => {
    const used = new Set<string>();
    for (const exercise of state.exercises) {
      used.add(exercise.id);
      if (exercise.activityTypeId) used.add(exercise.activityTypeId);
    }
    const userGroups = new Set<Group>(active.map(rawGroupOf));
    if (userGroups.has('strength') || userGroups.has('mobility')) {
      userGroups.add('strength');
      userGroups.add('mobility');
    }
    return activityTypes
      .filter((type) => userGroups.has(type.group) && !used.has(type.id))
      .sort((a, b) => a.group.localeCompare(b.group) || a.id.localeCompare(b.id))
      .slice(0, 4);
  }, [state, active]);

  const catalogue = useMemo(
    () =>
      [...activityTypes].sort((a, b) => a.group.localeCompare(b.group) || a.id.localeCompare(b.id)),
    [],
  );

  const archived = useMemo(
    () =>
      state.exercises
        .filter((e) => state.archivedExerciseIds.has(e.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [state],
  );

  function toggleGroup(name: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function addType(type: ActivityType) {
    store.dispatch([
      {
        type: 'exerciseAdded',
        exercise: {
          id: type.id,
          name: type.name,
          activityTypeId: type.id,
          loadProfile: type.loadProfile,
          typicalMinutes: type.typicalMinutes,
          typicalEffort: type.typicalEffort,
          frequencyPerWeek: 1,
        },
      },
    ]);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.ground, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="screenTitle" style={styles.title}>
          Exercises
        </Text>

        <Section heading="Doing now">
          <SurfaceCard list tight style={styles.listCard}>
            {groups.length === 0 ? (
              <View style={styles.pickRow}>
                <Text variant="secondary" tone="muted">
                  Nothing at the moment — pick something up below.
                </Text>
              </View>
            ) : (
              groups.map((group, index) => {
                const expanded = !collapsed.has(group.name);
                const total = group.exercises.reduce(
                  (sum, exercise) =>
                    sum +
                    (exercise.frequencyPerWeek ??
                      fixedTimesFor(state, exercise.id)?.weekdays.length ??
                      0),
                  0,
                );
                return (
                  <Fragment key={group.name}>
                    {index > 0 ? <CardDivider /> : null}
                    <GroupHeader
                      title={group.name}
                      expanded={expanded}
                      onPress={() => toggleGroup(group.name)}
                      {...(total > 0 ? { detail: `${total} a week` } : {})}
                    />
                    {expanded ? (
                      <View style={[styles.rail, { borderLeftColor: colors.hairline }]}>
                        {group.exercises.map((exercise) => {
                          const fixed = fixedTimesFor(state, exercise.id);
                          const raw = rawGroupOf(exercise);
                          const designable =
                            state.routines.has(exercise.id) ||
                            raw === 'strength' ||
                            raw === 'mobility';
                          const meta = fixed
                            ? `Fixed · ${dayList(fixed.weekdays)} ${timeOfDay(fixed.startMinutes)}`
                            : `Flexible · ${estimatedMinutes(exercise, state.history)} min`;
                          return (
                            <View key={exercise.id} style={styles.childRow}>
                              <Marker kind={fixed ? 'fixed' : 'flexible'} />
                              <View style={styles.childText}>
                                <Text variant="listTitle">{exercise.name}</Text>
                                <Text variant="secondary" tone="muted">
                                  {meta}
                                </Text>
                              </View>
                              {fixed ? null : designable ? (
                                <OutlineChip
                                  narrow
                                  label="Design"
                                  accessibilityLabel={`Design the ${exercise.name} routine`}
                                  onPress={() => router.push(`/routine/${exercise.id}` as Href)}
                                />
                              ) : (
                                <OutlineChip
                                  narrow
                                  label="Details"
                                  accessibilityLabel={`${exercise.name} details`}
                                  onPress={() => router.push(`/exercise/${exercise.id}` as Href)}
                                />
                              )}
                            </View>
                          );
                        })}
                      </View>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </SurfaceCard>
        </Section>

        <Section heading="Could pick up">
          <SurfaceCard list tight style={styles.listCard}>
            {(browsing ? catalogue : suggestions).map((type, index) => (
              <Fragment key={type.id}>
                {index > 0 ? <CardDivider /> : null}
                <View style={styles.pickRow}>
                  <View style={styles.childText}>
                    <Text variant="tinyLabel" tone="muted">
                      {groupDisplayName(type.group)}
                    </Text>
                    <Text variant="listTitle">{type.name}</Text>
                  </View>
                  <OutlineChip
                    label="Add"
                    accessibilityLabel={`Add ${type.name}`}
                    onPress={() => addType(type)}
                  />
                </View>
              </Fragment>
            ))}
            {(browsing ? catalogue : suggestions).length > 0 ? <CardDivider /> : null}
            <FlatRowButton
              label={browsing ? 'Show fewer' : 'Browse the full catalogue'}
              onPress={() => setBrowsing((value) => !value)}
            />
          </SurfaceCard>

          {/* "Pick suitable exercises for a focus a doctor gave you": the
              user names the region; the app only picks and places. */}
          <SurfaceCard style={styles.focusCard}>
            <Text variant="sectionHeading">For a focus you were given</Text>
            <Text variant="secondary" tone="muted">
              Told to strengthen something? Pick the area and the app suggests what works it. It
              schedules; it never diagnoses.
            </Text>
            <View style={styles.focusChips}>
              {(
                ['legs', 'backAndCore', 'armsAndShoulders', 'fingersAndForearms'] as BodyRegion[]
              ).map((region) => (
                <ChoiceButton
                  key={region}
                  label={regionHeading(region)}
                  selected={focusRegion === region}
                  onPress={() => setFocusRegion(focusRegion === region ? null : region)}
                  shape="pill"
                />
              ))}
            </View>
            {focusRegion
              ? pickForFocus(focusRegion)
                  .filter((candidate) => !active.some((e) => e.id === candidate.type.id))
                  .slice(0, 4)
                  .map((candidate, index) => (
                    <Fragment key={candidate.type.id}>
                      {index > 0 ? <CardDivider /> : null}
                      <View style={styles.pickRow}>
                        <View style={styles.childText}>
                          <Text variant="tinyLabel" tone="muted">
                            {`Works your ${regionHeading(focusRegion).toLowerCase()}`}
                          </Text>
                          <Text variant="listTitle">{candidate.type.name}</Text>
                        </View>
                        <OutlineChip
                          label="Add"
                          accessibilityLabel={`Add ${candidate.type.name}`}
                          onPress={() => addType(candidate.type)}
                        />
                      </View>
                    </Fragment>
                  ))
              : null}
          </SurfaceCard>
        </Section>

        <Section heading="Done before">
          <SurfaceCard list tight style={styles.listCard}>
            {archived.length === 0 ? (
              <View style={styles.pickRow}>
                <Text variant="secondary" tone="muted" style={styles.emptyLine}>
                  Nothing here yet — things you stop doing are kept, never deleted.
                </Text>
              </View>
            ) : (
              archived.map((exercise, index) => {
                const day = state.archivedOn.get(exercise.id);
                return (
                  <Fragment key={exercise.id}>
                    {index > 0 ? <CardDivider /> : null}
                    <View style={styles.pickRow}>
                      <View style={styles.childText}>
                        <Text variant="listTitle">{exercise.name}</Text>
                        <Text variant="secondary" tone="muted">
                          {day ? `Last active in ${monthName(day)}` : 'Kept, never deleted'}
                        </Text>
                      </View>
                      <OutlineChip
                        label="Resume"
                        accessibilityLabel={`Resume ${exercise.name}`}
                        onPress={() =>
                          store.dispatch([
                            {
                              type: 'exerciseResumed',
                              exerciseId: exercise.id,
                              day: store.today,
                            },
                          ])
                        }
                      />
                    </View>
                  </Fragment>
                );
              })
            )}
          </SurfaceCard>
        </Section>
      </ScrollView>

      <BottomBar
        current="exercises"
        onSelect={(tab) => {
          if (tab === 'exercises') return;
          router.replace((tab === 'plan' ? '/' : `/${tab}`) as Href);
        }}
        onAdd={() => router.push({ pathname: '/', params: { add: '1' } })}
      />
    </View>
  );
}

/** The small outlined trailing button on list rows (Details, Add, Resume). */
function OutlineChip({
  label,
  onPress,
  accessibilityLabel,
  narrow = false,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  narrow?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        narrow && styles.chipNarrow,
        { borderColor: colors.controlBorder, backgroundColor: colors.surface },
        pressed && styles.pressed,
      ]}
    >
      <Text variant="actionLabel">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingTop: lib.scrollPaddingTop,
    paddingHorizontal: lib.scrollPaddingHorizontal,
    paddingBottom: lib.scrollPaddingBottom,
    gap: 22,
  },
  title: { paddingHorizontal: metrics.header.inset },
  /** The 09 mockup's list cards sit at 6px vertical, not the usual 4. */
  listCard: { paddingVertical: 6 },
  focusCard: { gap: 8 },
  focusChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rail: {
    marginLeft: lib.treeRailInset,
    paddingLeft: lib.treeRailPadding,
    borderLeftWidth: lib.treeRailWidth,
  },
  childRow: {
    minHeight: lib.row,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  childText: { flex: 1 },
  pickRow: {
    minHeight: lib.rowPick,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyLine: { flex: 1 },
  chip: {
    height: metrics.minTapTarget,
    paddingHorizontal: 16,
    borderRadius: metrics.button.radius,
    borderWidth: metrics.button.borderWidth,
    justifyContent: 'center',
  },
  chipNarrow: { paddingHorizontal: 14 },
  pressed: { opacity: 0.7 },
});
