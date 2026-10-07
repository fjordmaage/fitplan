import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  type ActivityKind,
  type CalendarWeek,
} from '@/ui';

/**
 * Plan, the home screen. Matched against docs/design/png/01-plan.png and
 * 02-plan-dark.png.
 *
 * The content below is the mockup's own, held here so the layout can be
 * compared against the reference images. The engine replaces it in stage 1 and
 * storage in stage 2; nothing here decides anything.
 */
export default function Plan() {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<string | null>('run-today');

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.ground }]} edges={['top']}>
      <View style={styles.header}>
        <ScreenTitle
          overline="Today"
          title="Tuesday 6 October"
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
        <View style={styles.group}>
          <SectionHeading>Today</SectionHeading>
          <AdviceBox>
            Your legs are fresh, and a run lets your forearms rest before tomorrow’s climb.
          </AdviceBox>

          <TimelineRow time="Afternoon">
            <TimelineCard
              kind="flexible"
              title="Run · 6 km"
              subtitle="40 min · easy pace"
              selected={selected === 'run-today'}
              onPress={() => setSelected(selected === 'run-today' ? null : 'run-today')}
            />
            {selected === 'run-today' ? (
              <>
                <Button label="Start" variant="primary" />
                <View style={styles.pair}>
                  <Button label="Move" style={styles.half} />
                  <Button label="Swap" style={styles.half} />
                </View>
              </>
            ) : null}
          </TimelineRow>

          <TimelineRow>
            <TimelineCard
              kind="flexible"
              title="Back routine"
              subtitle="15 min · right after the run"
              selected={selected === 'back-today'}
              onPress={() => setSelected(selected === 'back-today' ? null : 'back-today')}
            />
          </TimelineRow>
        </View>

        <Day heading="Tomorrow · Wed 7">
          <TimelineRow time="17:00">
            <TimelineCard kind="fixed" title="Climbing gym" subtitle="Until 19:00" />
          </TimelineRow>
        </Day>

        <Day heading="Thu 8 October">
          <TimelineRow time="Evening">
            <TimelineCard kind="busy" title="Busy" subtitle="Nothing planned around it" />
          </TimelineRow>
        </Day>

        <Day heading="Fri 9 October">
          <TimelineRow time="Afternoon">
            <TimelineCard
              kind="flexible"
              title="Run · 6 km"
              subtitle="40 min · easy pace"
              selected={selected === 'run-fri'}
              onPress={() => setSelected(selected === 'run-fri' ? null : 'run-fri')}
            />
          </TimelineRow>
        </Day>

        <Day heading="Sat 10 October">
          <TimelineRow time="Morning">
            <TimelineCard
              kind="flexible"
              title="Climbing gym"
              subtitle="2 h · open session"
              selected={selected === 'climb-sat'}
              onPress={() => setSelected(selected === 'climb-sat' ? null : 'climb-sat')}
            />
          </TimelineRow>
        </Day>

        <Day heading="Sun 11 October">
          <RestDayLine />
        </Day>
      </ScrollView>

      <BottomBar current="plan" />
    </SafeAreaView>
  );
}

function Day({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <SectionHeading>{heading}</SectionHeading>
      {children}
    </View>
  );
}

const bars = (...kinds: readonly (readonly ActivityKind[])[]) => kinds;

const weeks: readonly CalendarWeek[] = [
  {
    week: 41,
    days: [
      {
        date: 5,
        slots: bars([], [], ['fixed']),
        isPast: true,
        accessibilityLabel: 'Mon 5 October',
      },
      {
        date: 6,
        slots: bars([], ['flexible', 'flexible'], []),
        isToday: true,
        selectedBar: [1, 0],
        accessibilityLabel: 'Tue 6 October',
      },
      { date: 7, slots: bars([], [], ['fixed']), accessibilityLabel: 'Wed 7 October' },
      { date: 8, slots: bars([], [], ['busy']), accessibilityLabel: 'Thu 8 October' },
      { date: 9, slots: bars([], ['flexible'], []), accessibilityLabel: 'Fri 9 October' },
      { date: 10, slots: bars(['flexible'], [], []), accessibilityLabel: 'Sat 10 October' },
      { date: 11, slots: bars([], [], []), accessibilityLabel: 'Sun 11 October' },
    ],
  },
  {
    week: 42,
    days: [
      { date: 12, slots: bars([], [], ['fixed']), accessibilityLabel: 'Mon 12 October' },
      {
        date: 13,
        slots: bars([], ['flexible', 'flexible'], []),
        accessibilityLabel: 'Tue 13 October',
      },
      { date: 14, slots: bars([], [], ['fixed']), accessibilityLabel: 'Wed 14 October' },
      { date: 15, slots: bars([], [], []), accessibilityLabel: 'Thu 15 October' },
      { date: 16, slots: bars(['fixed'], [], []), accessibilityLabel: 'Fri 16 October' },
      { date: 17, slots: bars(['flexible'], [], []), accessibilityLabel: 'Sat 17 October' },
      {
        date: 18,
        slots: bars(['busy'], ['busy'], ['busy']),
        accessibilityLabel: 'Sun 18 October',
      },
    ],
  },
];

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
