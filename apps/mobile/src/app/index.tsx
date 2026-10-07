import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { addDays, dayRange, weekday, type PlannedItem } from '@fitplan/engine';
import {
  buildToday,
  entriesFor,
  firstToday,
  headingFor,
  isoWeek,
  longDay,
  mondayOf,
  ratingAt,
  ratingFor,
  type DayEntry,
} from '@/data/plan';
import { adviceSentence, shortDay as sentenceShortDay } from '@/i18n';
import { metrics, useTheme } from '@/theme';
import {
  AdviceBox,
  BottomBar,
  Button,
  Calendar,
  RestDayLine,
  ScreenTitle,
  SectionHeading,
  TimelineCard,
  TimelineRow,
  type CalendarWeek,
  type SlotBar,
} from '@/ui';

/**
 * Plan, the home screen, fed by the real engine over the demo week (KL's
 * routine). Storage replaces the demo inputs in stage 2; Move/Swap sheets
 * arrive there too.
 */
export default function Plan() {
  const { colors } = useTheme();
  const model = useMemo(() => buildToday(), []);
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<PlannedItem | null>(
    () => firstActionable(model) ?? null,
  );

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
    return adviceSentence(rating?.reasons ?? [], {
      names: model.names,
      shortDay: sentenceShortDay,
    });
  }, [model]);

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
                  />
                ))
              )}
            </View>
          );
        })}
      </ScrollView>

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
}: {
  entry: DayEntry;
  showTime: boolean;
  today: boolean;
  selected: boolean;
  onSelect: () => void;
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
            <Button label="Move" style={styles.half} />
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
