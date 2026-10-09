import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { accentPresets, metrics, ratingWord, useTheme, type RatingLevel } from '@/theme';
import {
  AdviceBox,
  BottomBar,
  Button,
  Calendar,
  Icon,
  PlanUpdatedCard,
  RoundIconButton,
  ScreenTitle,
  SectionHeading,
  SelectionRing,
  Text,
  TimelineCard,
  TimelineRow,
  RestDayLine,
  type IconName,
} from '@/ui';

/**
 * Every shared component in every state, in whichever theme the Plan screen is
 * showing. Not a product screen: it exists so that components can be compared
 * against `docs/design/png/` before any screen is composed from them
 * (docs/06-design-fidelity.md, rule 5).
 */
export default function Gallery() {
  const { colors } = useTheme();
  const [selectedBar, setSelectedBar] = useState(true);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.ground }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenTitle
          overline="Gallery"
          title="Components"
          action={{ icon: 'settings', label: 'Goals and settings' }}
        />

        <Group name="Buttons">
          <Button label="Start" variant="primary" />
          <View style={styles.pair}>
            <Button label="Move" style={styles.half} />
            <Button label="Swap" style={styles.half} />
          </View>
        </Group>

        <Group name="Round icon buttons">
          <View style={styles.row}>
            {(['settings', 'chevronDown', 'lock', 'plus'] as IconName[]).map((icon) => (
              <RoundIconButton key={icon} icon={icon} label={icon} />
            ))}
          </View>
        </Group>

        <Group name="Icons">
          <View style={styles.row}>
            {(
              [
                'tabPlan',
                'tabExercises',
                'tabBody',
                'tabLearn',
                'settings',
                'lock',
                'plus',
                'chevronDown',
              ] as IconName[]
            ).map((icon) => (
              <Icon key={icon} name={icon} size={22} color={colors.ink} />
            ))}
          </View>
        </Group>

        <Group name="Section heading">
          <SectionHeading>Tomorrow · Wed 7</SectionHeading>
        </Group>

        <Group name="Advice box">
          <AdviceBox>
            Your legs are fresh, and a run lets your forearms rest before tomorrow’s climb.
          </AdviceBox>
        </Group>

        <Group name="Rating chips">
          <View style={styles.row}>
            {(['good', 'ok', 'avoid'] as RatingLevel[]).map((level) => (
              <View
                key={level}
                style={[styles.ratedDay, { backgroundColor: colors.rating[level].background }]}
              >
                <Text variant="smallLabel" color={colors.rating[level].text}>
                  Tue
                </Text>
                <Text variant="ratedDayNumber" color={colors.rating[level].text}>
                  6
                </Text>
                <Text variant="ratingWord" color={colors.rating[level].text}>
                  {ratingWord[level]}
                </Text>
              </View>
            ))}
          </View>
        </Group>

        <Group name="Timeline cards">
          <TimelineRow time="Afternoon">
            <TimelineCard
              kind="flexible"
              title="Run · 6 km"
              subtitle="40 min · easy pace"
              selected
            />
            <Button label="Start" variant="primary" />
            <View style={styles.pair}>
              <Button label="Move" style={styles.half} />
              <Button label="Swap" style={styles.half} />
            </View>
          </TimelineRow>
          <TimelineRow>
            <TimelineCard
              kind="flexible"
              title="Back routine"
              subtitle="15 min · right after the run"
            />
          </TimelineRow>
          <TimelineRow time="17:00">
            <TimelineCard kind="fixed" title="Climbing gym" subtitle="Until 19:00" />
          </TimelineRow>
          <TimelineRow time="Morning">
            <TimelineCard kind="tentative" title="Run · 6 km" subtitle="40 min · day may change" />
          </TimelineRow>
          <TimelineRow time="Evening">
            <TimelineCard kind="busy" title="Busy" subtitle="Nothing planned around it" />
          </TimelineRow>
          <RestDayLine />
        </Group>

        <Group name="Selection ring">
          <SelectionRing radius={metrics.card.radius}>
            <View
              style={[
                styles.ringSample,
                { backgroundColor: colors.surface, borderColor: colors.accent },
              ]}
            >
              <Text variant="cardTitle">Anything can be ringed</Text>
            </View>
          </SelectionRing>
        </Group>

        <Group name="Calendar">
          <Calendar
            weeks={sampleWeeks(selectedBar)}
            expanded={false}
            onToggleExpanded={() => setSelectedBar((value) => !value)}
          />
        </Group>

        <Group name="Accent presets">
          <View style={styles.row}>
            {[...accentPresets.light, ...accentPresets.dark].map((preset) => (
              <View key={preset} style={[styles.swatch, { backgroundColor: preset }]} />
            ))}
          </View>
        </Group>

        <View style={styles.cardSpacer} />
      </ScrollView>

      <View style={styles.floating} pointerEvents="box-none">
        <PlanUpdatedCard body="Run · 6 km moved to Thu 8, afternoon. Your back routine moved with it, because it works best right after a run." />
      </View>
      <BottomBar current="plan" />
    </SafeAreaView>
  );
}

function Group({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <SectionHeading>{name}</SectionHeading>
      <View style={styles.groupBody}>{children}</View>
    </View>
  );
}

function sampleWeeks(selected: boolean) {
  return [
    {
      week: 41,
      days: [
        day(5, [[], [], ['fixed']], { isPast: true }),
        day(6, [[], ['flexible', 'flexible'], []], {
          isToday: true,
          ...(selected ? { selectedBar: [1, 0] as const } : {}),
        }),
        day(7, [[], [], ['fixed']], {}),
        day(8, [[], [], ['busy']], {}),
        day(9, [[], ['flexible'], []], {}),
        day(10, [['flexible'], [], []], {}),
        day(11, [[], [], []], {}),
      ],
    },
    {
      week: 42,
      days: [
        day(12, [[], [], ['fixed']], {}),
        day(13, [[], ['tentative', 'tentative'], []], {}),
        day(14, [[], [], ['fixed']], {}),
        day(15, [[], [], []], {}),
        day(16, [['fixed'], [], []], {}),
        day(17, [['flexible'], [], []], {}),
        day(18, [['busy'], ['busy'], ['busy']], {}),
      ],
    },
  ];
}

function day(
  date: number,
  slots: readonly (readonly ('fixed' | 'flexible' | 'tentative' | 'busy')[])[],
  extra: {
    isToday?: boolean;
    isPast?: boolean;
    selectedBar?: readonly [number, number];
  },
) {
  return { day: `2026-10-${String(date).padStart(2, '0')}`, date, slots, accessibilityLabel: `${date} October`, ...extra };
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingTop: metrics.header.paddingTop,
    paddingHorizontal: metrics.header.paddingHorizontal,
    paddingBottom: metrics.timeline.paddingBottom,
    gap: metrics.timeline.groupGap,
  },
  group: { gap: metrics.timeline.rowGap },
  groupBody: { gap: metrics.timeline.rowGap },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  pair: { flexDirection: 'row', gap: metrics.button.gap },
  half: { flex: 1 },
  ratedDay: {
    width: 48,
    height: metrics.ratedDay.height,
    borderRadius: metrics.ratedDay.radius,
    alignItems: 'center',
    justifyContent: 'center',
    gap: metrics.ratedDay.innerGap,
  },
  ringSample: {
    borderRadius: metrics.card.radius,
    borderWidth: metrics.card.borderWidth,
    paddingVertical: metrics.card.paddingVertical,
    paddingHorizontal: metrics.card.paddingHorizontal,
  },
  swatch: { width: 32, height: 32, borderRadius: metrics.button.radius },
  cardSpacer: { height: 120 },
  floating: { position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 },
});
