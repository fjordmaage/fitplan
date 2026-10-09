import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  addDays,
  dayRange,
  swapAlternatives,
  type PlanChange,
  type PlannedItem,
  type Rating,
} from '@fitplan/engine';
import {
  applyMove,
  applySwap,
  entriesFor,
  firstToday,
  headingFor,
  isoWeek,
  longDay,
  mondayOf,
  ratingAt,
  ratingFor,
  shortDay,
  type DayEntry,
  type PlanView,
} from '@/data/plan';
import { useStore } from '@/data/store';
import { adviceSentence, changeSentence, reasonSentence } from '@/i18n';
import { metrics, useTheme } from '@/theme';
import {
  AddSheet,
  AdviceBox,
  BottomBar,
  Button,
  Calendar,
  MoveSheet,
  PlanUpdatedCard,
  RestDayLine,
  ScreenTitle,
  SectionHeading,
  SwapSheet,
  TimelineCard,
  TimelineRow,
  type CalendarWeek,
  type SlotBar,
} from '@/ui';

/**
 * Plan, the home screen. Everything shown comes from the store (the event
 * log folded and planned); every action appends events, so it survives a
 * restart and nothing ever changes silently.
 */
export default function Plan() {
  const { colors } = useTheme();
  const store = useStore();
  const model: PlanView = store;

  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<PlannedItem | null>(null);
  const [moving, setMoving] = useState<PlannedItem | null>(null);
  const [swapping, setSwapping] = useState<PlannedItem | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [userCard, setUserCard] = useState<{
    changes: readonly PlanChange[];
    undoIds?: readonly number[];
  } | null>(null);
  const [dismissedAutoVersion, setDismissedAutoVersion] = useState(0);

  // The store replanned (on launch, or because a dispatch changed the
  // inputs): show what changed, derived straight from the store. Never
  // silent, and no copying through effects.
  const autoCard: { changes: readonly PlanChange[]; undoIds?: readonly number[] } | null =
    store.autoChangesVersion > dismissedAutoVersion && store.autoChanges.length > 0
      ? { changes: store.autoChanges }
      : null;
  const updateCard = userCard ?? autoCard;

  function dismissCard() {
    if (userCard) setUserCard(null);
    else setDismissedAutoVersion(store.autoChangesVersion);
  }

  const sentenceCtx = useMemo(() => ({ names: store.names, shortDay }), [store.names]);

  const advice = useMemo(() => {
    const first = firstToday(model);
    if (!first) return 'Nothing planned today. Enjoy the rest.';
    const rating = first.item
      ? ratingFor(model, first.item)
      : ratingAt(model, first.exerciseId, first.day, first.slot);
    return adviceSentence(rating?.reasons ?? [], sentenceCtx);
  }, [model, sentenceCtx]);

  const weeks = useMemo(
    () => calendarWeeks(model, expanded ? 6 : 2, selected),
    [model, expanded, selected],
  );
  const timelineDays = useMemo(() => dayRange(model.today, 14), [model]);

  function saveMove(item: PlannedItem, day: string, slot: PlannedItem['slot'], lock: boolean) {
    const { model: next, changes } = applyMove(model, item, { day, slot, lock });
    const ids = store.dispatch([
      {
        type: 'userMoved',
        exerciseId: item.exerciseId,
        from: { day: item.day, slot: item.slot },
        to: { day, slot },
        locked: true,
      },
      { type: 'planSaved', plan: next.result.plan, changes, by: 'user' },
    ]);
    setSelected(null);
    setMoving(null);
    setUserCard({ changes, undoIds: ids });
  }

  function saveSwap(item: PlannedItem, toExerciseId: string) {
    const { model: next, changes } = applySwap(model, item, toExerciseId);
    const ids = store.dispatch([
      {
        type: 'userSwapped',
        fromExerciseId: item.exerciseId,
        toExerciseId,
        day: item.day,
        slot: item.slot,
      },
      { type: 'planSaved', plan: next.result.plan, changes, by: 'user' },
    ]);
    setSelected(null);
    setSwapping(null);
    setUserCard({ changes, undoIds: ids });
  }

  function cancelAnchor(anchorId: string) {
    const ids = store.dispatch([{ type: 'anchorOccurrenceCancelled', anchorId }]);
    setCancelling(null);
    setSelected(null);
    // The replan runs in the store; its changes arrive via launchChanges.
    void ids;
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.ground }]} edges={['top']}>
      <View style={styles.header}>
        <ScreenTitle
          overline="Today"
          title={longDay(model.today)}
          action={{ icon: 'settings', label: 'Goals and settings' }}
        />
        <Calendar
          weeks={weeks}
          expanded={expanded}
          onToggleExpanded={() => setExpanded((value) => !value)}
        />
      </View>

      <ScrollView
        style={styles.timeline}
        contentContainerStyle={styles.timelineContent}
        showsVerticalScrollIndicator={false}
      >
        {timelineDays.map((day) => {
          const entries = entriesFor(model, day);
          return (
            <View key={day} style={styles.group}>
              <SectionHeading>{headingFor(model, day)}</SectionHeading>
              {day === model.today && entries.length > 0 ? <AdviceBox>{advice}</AdviceBox> : null}
              {entries.length === 0 ? (
                <RestDayLine />
              ) : (
                entries.map((entry, index) => (
                  <Entry
                    key={`${entry.kind}-${entry.exerciseId ?? entry.slot}-${index}`}
                    entry={entry}
                    showTime={index === 0 || entries[index - 1]?.slot !== entry.slot}
                    today={day === model.today}
                    selected={
                      entry.item
                        ? itemsEqual(entry.item, selected)
                        : entry.anchorId != null && entry.anchorId === cancelling
                    }
                    onSelect={() => {
                      if (entry.item) {
                        setSelected(itemsEqual(entry.item, selected) ? null : entry.item);
                        setCancelling(null);
                      } else if (entry.anchorId) {
                        setCancelling(cancelling === entry.anchorId ? null : entry.anchorId);
                        setSelected(null);
                      }
                    }}
                    onMove={() => entry.item && setMoving(entry.item)}
                    onSwap={() => entry.item && setSwapping(entry.item)}
                    onCancel={() => entry.anchorId && cancelAnchor(entry.anchorId)}
                  />
                ))
              )}
            </View>
          );
        })}
      </ScrollView>

      {updateCard ? (
        <PlanUpdatedCard
          body={updateCard.changes.map((c) => changeSentence(c, sentenceCtx)).join(' ')}
          onUndo={() => {
            if (updateCard.undoIds) {
              store.dispatch(
                updateCard.undoIds.map((undoneEventId) => ({
                  type: 'eventUndone' as const,
                  undoneEventId,
                })),
              );
            }
            dismissCard();
          }}
          onAccept={dismissCard}
        />
      ) : null}

      {moving ? (
        <MoveSheet
          visible
          title={store.names.get(moving.exerciseId) ?? ''}
          subtitle={`Now: ${moving.day === model.today ? 'today' : shortDay(moving.day)}, ${moving.slot}`}
          today={model.today}
          current={{ day: moving.day, slot: moving.slot }}
          rateDay={(day, slot) => ratingAt(model, moving.exerciseId, day, slot)}
          reasonLine={(rating: Rating | undefined) =>
            rating?.reasons[0]
              ? reasonSentence(rating.reasons[0], sentenceCtx)
              : 'No planned or busy time is in the way.'
          }
          shortDay={shortDay}
          onSave={(day, slot, lock) => saveMove(moving, day, slot, lock)}
          onClose={() => setMoving(null)}
        />
      ) : null}

      {swapping ? (
        <SwapSheet
          visible
          title="Do something else"
          subtitle={`Instead of ${store.names.get(swapping.exerciseId) ?? ''} on ${shortDay(swapping.day)}`}
          candidates={swapAlternatives(
            store.inputs.exercises.find((e) => e.id === swapping.exerciseId)!,
            store.inputs.exercises,
          ).map((candidate) => ({
            id: candidate.exercise.id,
            name: candidate.exercise.name,
            rating: ratingAt(
              { ...model, result: withoutItem(model, swapping) },
              candidate.exercise.id,
              swapping.day,
              swapping.slot,
            ),
          }))}
          reasonLine={(rating) =>
            rating?.reasons[0] ? reasonSentence(rating.reasons[0], sentenceCtx) : ''
          }
          onPick={(exerciseId) => saveSwap(swapping, exerciseId)}
          onClose={() => setSwapping(null)}
        />
      ) : null}

      <AddSheet
        visible={adding}
        today={model.today}
        exercises={store.inputs.exercises}
        onLogDone={(exerciseId, minutes, effort) => {
          store.dispatch([
            {
              type: 'sessionCompleted',
              session: { exerciseId, day: model.today, minutes, effort },
              source: 'logged',
            },
          ]);
        }}
        onAddBusy={(days, slots) => {
          store.dispatch(
            days.map((day) => ({
              type: 'blockAdded' as const,
              block: { id: `block-${day}-${slots.join('-')}`, day, slots },
            })),
          );
        }}
        onPickUp={(exercise) => {
          store.dispatch([{ type: 'exerciseAdded', exercise }]);
        }}
        onClose={() => setAdding(false)}
      />

      <BottomBar current="plan" onAdd={() => setAdding(true)} />
    </SafeAreaView>
  );
}

function withoutItem(model: PlanView, item: PlannedItem) {
  return {
    ...model.result,
    plan: {
      items: model.result.plan.items.filter(
        (i) => !(i.exerciseId === item.exerciseId && i.day === item.day && i.slot === item.slot),
      ),
    },
  };
}

function Entry({
  entry,
  showTime,
  today,
  selected,
  onSelect,
  onMove,
  onSwap,
  onCancel,
}: {
  entry: DayEntry;
  showTime: boolean;
  today: boolean;
  selected: boolean;
  onSelect: () => void;
  onMove: () => void;
  onSwap: () => void;
  onCancel: () => void;
}) {
  const slotWord = entry.slot.charAt(0).toUpperCase() + entry.slot.slice(1);
  const timeLabel = showTime ? (entry.time ?? slotWord) : undefined;
  return (
    <TimelineRow {...(timeLabel ? { time: timeLabel } : {})}>
      <TimelineCard
        kind={entry.kind}
        title={entry.title}
        subtitle={entry.subtitle}
        selected={selected}
        {...(entry.item || entry.anchorId ? { onPress: onSelect } : {})}
      />
      {selected && entry.item ? (
        <>
          {today ? <Button label="Start" variant="primary" /> : null}
          <View style={styles.pair}>
            <Button label="Move" style={styles.half} onPress={onMove} />
            <Button label="Swap" style={styles.half} onPress={onSwap} />
          </View>
        </>
      ) : null}
      {selected && entry.anchorId ? <Button label="Cancel this one" onPress={onCancel} /> : null}
    </TimelineRow>
  );
}

function itemsEqual(a: PlannedItem | null | undefined, b: PlannedItem | null | undefined): boolean {
  return (
    a != null && b != null && a.exerciseId === b.exerciseId && a.day === b.day && a.slot === b.slot
  );
}

function calendarWeeks(
  model: PlanView,
  count: number,
  selected: PlannedItem | null,
): CalendarWeek[] {
  const monday = mondayOf(model.today);
  const weeks: CalendarWeek[] = [];
  for (let w = 0; w < count; w += 1) {
    const start = addDays(monday, w * 7);
    weeks.push({
      week: isoWeek(start),
      days: dayRange(start, 7).map((day) => {
        const entries = entriesFor(model, day);
        const slots: SlotBar[][] = [[], [], []];
        let selectedBar: readonly [number, number] | undefined;
        for (const entry of entries) {
          const slotIndex = ['morning', 'afternoon', 'evening'].indexOf(entry.slot);
          const slot = slots[slotIndex];
          if (!slot) continue;
          if (entry.item && itemsEqual(entry.item, selected)) {
            selectedBar = [slotIndex, slot.length];
          }
          slot.push(entry.kind);
        }
        return {
          date: Number(day.split('-')[2]),
          slots,
          isToday: day === model.today,
          isPast: day < model.today,
          ...(selectedBar ? { selectedBar } : {}),
          accessibilityLabel: longDay(day),
        };
      }),
    });
  }
  return weeks;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingTop: metrics.header.paddingTop,
    paddingHorizontal: metrics.header.paddingHorizontal,
    gap: metrics.header.gap,
  },
  timeline: { flex: 1 },
  timelineContent: {
    paddingTop: metrics.timeline.paddingTop,
    paddingHorizontal: metrics.timeline.paddingHorizontal,
    paddingBottom: metrics.timeline.paddingBottom,
    gap: metrics.timeline.groupGap,
  },
  group: { gap: metrics.timeline.rowGap },
  pair: { flexDirection: 'row', gap: metrics.button.gap },
  half: { flex: 1 },
});
