import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { addDays, dayRange, type PlannedItem } from '@fitplan/engine';
import {
  applyMove,
  buildToday,
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
  type TodayModel,
} from '@/data/plan';
import { adviceSentence, changeSentence, reasonSentence } from '@/i18n';
import { metrics, useTheme } from '@/theme';
import {
  AdviceBox,
  BottomBar,
  Button,
  Calendar,
  MoveSheet,
  PlanUpdatedCard,
  RestDayLine,
  ScreenTitle,
  SectionHeading,
  TimelineCard,
  TimelineRow,
  type CalendarWeek,
  type SlotBar,
} from '@/ui';
import type { PlanChange, Rating } from '@fitplan/engine';

/**
 * Plan, the home screen, fed by the real engine over the demo week (KL's
 * routine). Storage replaces the demo inputs in stage 2; Move/Swap sheets
 * arrive there too.
 */
export default function Plan() {
  const { colors } = useTheme();
  const initial = useMemo(() => buildToday(), []);
  const [model, setModel] = useState<TodayModel>(initial);
  const [undoStack, setUndoStack] = useState<TodayModel[]>([]);
  const [updateCard, setUpdateCard] = useState<readonly PlanChange[] | null>(null);
  const [moving, setMoving] = useState<PlannedItem | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<PlannedItem | null>(
    () => firstActionable(initial) ?? null,
  );

  const sentenceCtx = useMemo(() => ({ names: model.names, shortDay }), [model]);

  const weeks = useMemo(
    () => calendarWeeks(model, expanded ? 6 : 2, selected),
    [model, expanded, selected],
  );
  const timelineDays = useMemo(
    () => dayRange(model.today, 14).filter((day, index) => index < 14),
    [model],
  );

  const advice = useMemo(() => {
    const first = firstToday(model);
    if (!first) return 'Nothing planned today. Enjoy the rest.';
    const rating = first.item
      ? ratingFor(model, first.item)
      : ratingAt(model, first.exerciseId, first.day, first.slot);
    return adviceSentence(rating?.reasons ?? [], sentenceCtx);
  }, [model, sentenceCtx]);

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
                    selected={entry.item != null && itemsEqual(entry.item, selected)}
                    onSelect={() =>
                      setSelected(
                        entry.item && !itemsEqual(entry.item, selected) ? entry.item : null,
                      )
                    }
                    onMove={() => entry.item && setMoving(entry.item)}
                  />
                ))
              )}
            </View>
          );
        })}
      </ScrollView>

      {updateCard ? (
        <PlanUpdatedCard
          body={updateCard.map((c) => changeSentence(c, sentenceCtx)).join(' ')}
          onUndo={() => {
            const last = undoStack[undoStack.length - 1];
            if (last) {
              setModel(last);
              setUndoStack((stack) => stack.slice(0, -1));
            }
            setUpdateCard(null);
          }}
          onAccept={() => setUpdateCard(null)}
        />
      ) : null}

      {moving ? (
        <MoveSheet
          visible
          title={model.names.get(moving.exerciseId) ?? ''}
          subtitle={`Now: ${moving.day === model.today ? 'today' : shortDay(moving.day)}, ${moving.slot}`}
          today={model.today}
          current={{ day: moving.day, slot: moving.slot }}
          rateDay={(day, slot) => {
            const exercise = model.inputs.exercises.find((e) => e.id === moving.exerciseId);
            if (!exercise) return undefined;
            return ratingAt({ ...model }, moving.exerciseId, day, slot);
          }}
          reasonLine={(rating: Rating | undefined) =>
            rating?.reasons[0]
              ? reasonSentence(rating.reasons[0], sentenceCtx)
              : 'No planned or busy time is in the way.'
          }
          shortDay={shortDay}
          onSave={(day, slot, lock) => {
            const { model: next, changes } = applyMove(model, moving, { day, slot, lock });
            setUndoStack((stack) => [...stack, model]);
            setModel(next);
            setSelected(null);
            setMoving(null);
            setUpdateCard(changes);
          }}
          onClose={() => setMoving(null)}
        />
      ) : null}

      <BottomBar current="plan" />
    </SafeAreaView>
  );
}

function Entry({
  entry,
  showTime,
  today,
  selected,
  onSelect,
  onMove,
}: {
  entry: DayEntry;
  showTime: boolean;
  today: boolean;
  selected: boolean;
  onSelect: () => void;
  onMove: () => void;
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
        {...(entry.item ? { onPress: onSelect } : {})}
      />
      {selected ? (
        <>
          {today ? <Button label="Start" variant="primary" /> : null}
          <View style={styles.pair}>
            <Button label="Move" style={styles.half} onPress={onMove} />
            <Button label="Swap" style={styles.half} />
          </View>
        </>
      ) : null}
    </TimelineRow>
  );
}

function firstActionable(model: ReturnType<typeof buildToday>): PlannedItem | undefined {
  return model.result.plan.items.find((item) => item.day === model.today);
}

function itemsEqual(a: PlannedItem | null | undefined, b: PlannedItem | null | undefined): boolean {
  return (
    a != null && b != null && a.exerciseId === b.exerciseId && a.day === b.day && a.slot === b.slot
  );
}

function calendarWeeks(
  model: ReturnType<typeof buildToday>,
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
