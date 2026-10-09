/**
 * First-time setup: five short steps, each skippable, ending in the first
 * generated plan (docs/design/html/21-setup.html draws step 3; the other
 * steps reuse its chrome). Shown only when the app has no exercises yet.
 */

import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { activityTypes, weekday, type Exercise, type Slot } from '@fitplan/engine';
import { useStore } from '@/data/store';
import { metrics, useTheme } from '@/theme';
import {
  Button,
  ChoiceButton,
  ChoiceGrid,
  InlineStepper,
  ProgressSegments,
  SlotPicker,
  Stepper,
  Text,
} from '@/ui';

const stepTitles = [
  'About you',
  'Your fixed sessions',
  'What do you want to fit in?',
  'When are you busy?',
  'Your goal',
] as const;

const stepSubtitles = [
  'Just enough to label things properly. Everything is optional.',
  'Things at a set time the app plans around and never moves.',
  'Things without a set time. The app finds the best days and moves them when life gets in the way.',
  'The app never plans anything into busy time.',
  'How much the plan should ask of you.',
] as const;

const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const amounts = ['Recover', 'Lighter', 'Steady', 'Build', 'Push'] as const;
const amountValues = ['recover', 'lighter', 'steady', 'build', 'push'] as const;
const goals = ['General fitness', 'Get stronger', 'Build endurance', 'Feel better day to day'];

interface FixedPick {
  typeId: string;
  weekdays: number[];
  startMinutes: number;
  durationMinutes: number;
}

interface FlexPick {
  typeId: string;
  /** undefined = the app decides. */
  perWeek?: number;
}

export default function Setup() {
  const { colors } = useTheme();
  const store = useStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);

  // Step 1: about you.
  const [age, setAge] = useState(30);
  const [height, setHeight] = useState(180);
  const [weight, setWeight] = useState(75);

  // Step 2: fixed sessions.
  const [fixed, setFixed] = useState<FixedPick[]>([]);
  const [fixedDraft, setFixedDraft] = useState<FixedPick | null>(null);

  // Step 3: flexible picks.
  const [flex, setFlex] = useState<FlexPick[]>([]);
  const [browsing, setBrowsing] = useState(false);

  // Step 4: busy time.
  const [busyWeekdays, setBusyWeekdays] = useState<number[]>([]);
  const [busySlots, setBusySlots] = useState<readonly Slot[]>(['morning', 'afternoon']);

  // Step 5: goal.
  const [amountIndex, setAmountIndex] = useState(2);
  const [goalIndex, setGoalIndex] = useState(0);

  const typeById = new Map(activityTypes.map((t) => [t.id, t]));
  const nameOf = (typeId: string) => typeById.get(typeId)?.name ?? typeId;

  function toExercise(typeId: string, perWeek?: number): Exercise {
    const type = typeById.get(typeId)!;
    return {
      id: type.id,
      name: type.name,
      activityTypeId: type.id,
      loadProfile: type.loadProfile,
      typicalMinutes: type.typicalMinutes,
      typicalEffort: type.typicalEffort,
      ...(perWeek != null ? { frequencyPerWeek: perWeek } : {}),
    };
  }

  function finish() {
    const events = [];
    events.push({
      type: 'profileUpdated' as const,
      patch: { ageYears: age, heightCm: height, weightKg: weight },
    });
    const added = new Set<string>();
    for (const pick of fixed) {
      if (!added.has(pick.typeId)) {
        events.push({ type: 'exerciseAdded' as const, exercise: toExercise(pick.typeId) });
        added.add(pick.typeId);
      }
      for (const wd of pick.weekdays) {
        events.push({
          type: 'anchorSeriesAdded' as const,
          series: {
            id: `fixed-${pick.typeId}-${wd}-${pick.startMinutes}`,
            exerciseId: pick.typeId,
            weekday: wd,
            slot: slotOf(pick.startMinutes),
            startMinutes: pick.startMinutes,
            durationMinutes: pick.durationMinutes,
            fromDay: store.today,
          },
        });
      }
    }
    for (const pick of flex) {
      if (added.has(pick.typeId)) continue;
      events.push({
        type: 'exerciseAdded' as const,
        exercise: toExercise(pick.typeId, pick.perWeek),
      });
      added.add(pick.typeId);
    }
    for (const wd of busyWeekdays) {
      events.push({
        type: 'blockSeriesAdded' as const,
        series: {
          id: `busy-week-${wd}-${busySlots.join('-')}`,
          weekday: wd,
          slots: busySlots,
          fromDay: store.today,
        },
      });
    }
    events.push({
      type: 'settingsChanged' as const,
      patch: {
        trainingAmount: amountValues[amountIndex]!,
        goalText: goals[goalIndex]!,
        setupDone: true,
      },
    });
    store.dispatch(events);
    router.replace('/');
  }

  const last = step === stepTitles.length - 1;

  return (
    <View style={[styles.root, { backgroundColor: colors.surface, paddingTop: insets.top + 20 }]}>
      <View style={styles.progressBlock}>
        <ProgressSegments total={5} done={step} current={step} />
        <Text variant="secondary" tone="muted">
          {`Step ${step + 1} of 5 · about a minute left`}
        </Text>
      </View>

      <View style={styles.titleBlock}>
        <Text variant="screenTitle">{stepTitles[step]}</Text>
        <Text variant="advice" tone="muted">
          {stepSubtitles[step]}
        </Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {step === 0 ? (
          <View style={styles.stack16}>
            <Stepper
              value={String(age)}
              unit="years"
              lessLabel="Younger"
              moreLabel="Older"
              onLess={() => setAge(Math.max(10, age - 1))}
              onMore={() => setAge(Math.min(100, age + 1))}
            />
            <Stepper
              value={String(height)}
              unit="cm"
              lessLabel="Shorter"
              moreLabel="Taller"
              onLess={() => setHeight(Math.max(120, height - 1))}
              onMore={() => setHeight(Math.min(220, height + 1))}
            />
            <Stepper
              value={String(weight)}
              unit="kg"
              lessLabel="Less"
              moreLabel="More"
              onLess={() => setWeight(Math.max(30, weight - 1))}
              onMore={() => setWeight(Math.min(200, weight + 1))}
            />
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.stack8}>
            {fixed.map((pick, index) => (
              <PickedCard
                key={`${pick.typeId}-${index}`}
                title={nameOf(pick.typeId)}
                subtitle={`${pick.weekdays.map((w) => weekdayNames[w]).join(', ')} · ${timeOf(pick.startMinutes)} · ${pick.durationMinutes} min`}
                onChange={() => {
                  setFixedDraft(pick);
                  setFixed(fixed.filter((_, i) => i !== index));
                }}
              />
            ))}
            {fixedDraft ? (
              <View style={[styles.draft, { borderColor: colors.controlBorder }]}>
                <View style={styles.chipsWrap}>
                  {activityTypes.slice(0, 12).map((type) => (
                    <ChoiceButton
                      key={type.id}
                      label={type.name}
                      selected={fixedDraft.typeId === type.id}
                      onPress={() => setFixedDraft({ ...fixedDraft, typeId: type.id })}
                      shape="pill"
                    />
                  ))}
                </View>
                <View style={styles.chipsWrap}>
                  {weekdayNames.map((name, index) => (
                    <ChoiceButton
                      key={name}
                      label={name}
                      selected={fixedDraft.weekdays.includes(index)}
                      onPress={() =>
                        setFixedDraft({
                          ...fixedDraft,
                          weekdays: fixedDraft.weekdays.includes(index)
                            ? fixedDraft.weekdays.filter((w) => w !== index)
                            : [...fixedDraft.weekdays, index].sort((a, b) => a - b),
                        })
                      }
                      shape="pill"
                    />
                  ))}
                </View>
                <InlineStepper
                  label="Starts at"
                  value={timeOf(fixedDraft.startMinutes)}
                  onLess={() =>
                    setFixedDraft({
                      ...fixedDraft,
                      startMinutes: Math.max(5 * 60, fixedDraft.startMinutes - 30),
                    })
                  }
                  onMore={() =>
                    setFixedDraft({
                      ...fixedDraft,
                      startMinutes: Math.min(22 * 60, fixedDraft.startMinutes + 30),
                    })
                  }
                />
                <InlineStepper
                  label="Lasts"
                  value={`${fixedDraft.durationMinutes} min`}
                  onLess={() =>
                    setFixedDraft({
                      ...fixedDraft,
                      durationMinutes: Math.max(15, fixedDraft.durationMinutes - 15),
                    })
                  }
                  onMore={() =>
                    setFixedDraft({
                      ...fixedDraft,
                      durationMinutes: Math.min(240, fixedDraft.durationMinutes + 15),
                    })
                  }
                />
                <Button
                  label={fixedDraft.weekdays.length === 0 ? 'Pick at least one weekday' : 'Keep it'}
                  variant="primary"
                  onPress={() => {
                    if (fixedDraft.weekdays.length === 0) return;
                    setFixed([...fixed, fixedDraft]);
                    setFixedDraft(null);
                  }}
                />
              </View>
            ) : (
              <AddAnother
                label={fixed.length === 0 ? 'Add a fixed session' : 'Add another'}
                onPress={() =>
                  setFixedDraft({
                    typeId: activityTypes[0]!.id,
                    weekdays: [weekday(store.today)],
                    startMinutes: 17 * 60,
                    durationMinutes: 90,
                  })
                }
              />
            )}
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.stack8}>
            {flex.map((pick, index) => (
              <PickedCard
                key={pick.typeId}
                title={nameOf(pick.typeId)}
                subtitle={
                  pick.perWeek != null
                    ? `${pick.perWeek} ${pick.perWeek === 1 ? 'time' : 'times'} a week`
                    : 'App decides how often'
                }
                changeLabel={
                  pick.perWeek == null ? '1 a week' : pick.perWeek < 4 ? 'More' : 'Fewer'
                }
                onChange={() => {
                  const next = [...flex];
                  const current = next[index]!;
                  next[index] = {
                    ...current,
                    perWeek:
                      current.perWeek == null ? 1 : current.perWeek < 4 ? current.perWeek + 1 : 1,
                  };
                  setFlex(next);
                }}
                onRemove={() => setFlex(flex.filter((_, i) => i !== index))}
              />
            ))}
            <Text variant="label" tone="muted">
              Common picks
            </Text>
            <View style={styles.chipsWrap}>
              {(browsing ? activityTypes : activityTypes.slice(0, 10))
                .filter((t) => !flex.some((p) => p.typeId === t.id))
                .map((type) => (
                  <ChoiceButton
                    key={type.id}
                    label={type.name}
                    selected={false}
                    onPress={() => setFlex([...flex, { typeId: type.id }])}
                    shape="pill"
                  />
                ))}
            </View>
            <AddAnother
              label={browsing ? 'Show fewer' : 'Show everything'}
              onPress={() => setBrowsing(!browsing)}
            />
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.stack8}>
            <Text variant="label" tone="muted">
              Busy every week on
            </Text>
            <View style={styles.chipsWrap}>
              {weekdayNames.map((name, index) => (
                <ChoiceButton
                  key={name}
                  label={name}
                  selected={busyWeekdays.includes(index)}
                  onPress={() =>
                    setBusyWeekdays(
                      busyWeekdays.includes(index)
                        ? busyWeekdays.filter((w) => w !== index)
                        : [...busyWeekdays, index].sort((a, b) => a - b),
                    )
                  }
                  shape="pill"
                />
              ))}
            </View>
            {busyWeekdays.length > 0 ? (
              <>
                <Text variant="label" tone="muted">
                  Which part of those days
                </Text>
                <SlotPicker slots={busySlots} onChange={setBusySlots} />
              </>
            ) : (
              <Text variant="secondary" tone="muted">
                Nothing regular? Skip this — one-off busy time is two taps from the plan.
              </Text>
            )}
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.stack16}>
            <ChoiceGrid
              options={[...amounts]}
              selectedIndex={amountIndex}
              onSelect={setAmountIndex}
              shape="cellDense"
              gap={4}
            />
            <View style={styles.stack8}>
              <Text variant="label" tone="muted">
                Training for
              </Text>
              <View style={styles.chipsWrap}>
                {goals.map((goal, index) => (
                  <ChoiceButton
                    key={goal}
                    label={goal}
                    selected={goalIndex === index}
                    onPress={() => setGoalIndex(index)}
                    shape="pill"
                  />
                ))}
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <Text variant="secondary" tone="muted" style={styles.footerNote}>
        The five steps: about you, your fixed sessions, what to fit in, when you&apos;re busy, your
        goal. Everything can be changed later.
      </Text>
      <View style={styles.footer}>
        {step > 0 ? (
          <Button label="Back" style={styles.back} onPress={() => setStep(step - 1)} />
        ) : null}
        <Button
          label={last ? 'Show my plan' : 'Next'}
          variant="primary"
          style={styles.next}
          onPress={() => (last ? finish() : setStep(step + 1))}
        />
      </View>
    </View>
  );
}

function PickedCard({
  title,
  subtitle,
  changeLabel = 'Change',
  onChange,
  onRemove,
}: {
  title: string;
  subtitle: string;
  changeLabel?: string;
  onChange: () => void;
  onRemove?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.picked, { borderColor: colors.accent }]}>
      <View style={styles.pickedText}>
        <Text variant="cardTitle">{title}</Text>
        <Text variant="secondary" tone="muted">
          {subtitle}
        </Text>
      </View>
      <Button label={changeLabel} onPress={onChange} style={styles.pickedButton} />
      {onRemove ? <Button label="Remove" onPress={onRemove} style={styles.pickedButton} /> : null}
    </View>
  );
}

function AddAnother({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Button
      label={label}
      onPress={onPress}
      style={[styles.addAnother, { borderColor: colors.controlBorder }]}
    />
  );
}

function slotOf(startMinutes: number): Slot {
  if (startMinutes < 12 * 60) return 'morning';
  if (startMinutes < 17 * 60) return 'afternoon';
  return 'evening';
}

function timeOf(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: metrics.flow.paddingHorizontal,
    paddingBottom: metrics.flow.paddingBottom,
    gap: 22,
  },
  progressBlock: { gap: 10 },
  titleBlock: { gap: 4 },
  body: { flex: 1 },
  bodyContent: { gap: 8, paddingBottom: 8 },
  stack8: { gap: 8 },
  stack16: { gap: 16 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  picked: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickedText: { flex: 1, gap: 1 },
  pickedButton: { paddingHorizontal: 14 },
  draft: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  addAnother: { borderWidth: 1.5, borderStyle: 'dashed' },
  footerNote: {},
  footer: { flexDirection: 'row', gap: 8 },
  back: { width: 96 },
  next: { flex: 1 },
});
