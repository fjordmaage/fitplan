/**
 * Not feeling 100% (mockup 19): a full-screen flow on the surface colour.
 * The user says what is going on, what should change, for how long, and how
 * to come back; "Ease my plan" starts an ActiveMode and the store replans.
 * The see-a-doctor line is always shown (hard rule: not medical advice).
 */

import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  addDays,
  modeActiveOn,
  type ActiveMode,
  type Comeback,
  type ModeCause,
  type ModeChange,
} from '@fitplan/engine';

import { longDay } from '@/data/plan';
import { useStore } from '@/data/store';
import { metrics, useTheme } from '@/theme';
import { Button, ChoiceButton, ChoiceGrid, RoundIconButton, Text } from '@/ui';

const causes: readonly { value: ModeCause; label: string }[] = [
  { value: 'ill', label: 'Ill' },
  { value: 'achesOrPain', label: 'Aches or pain' },
  { value: 'busyPeriod', label: 'Busy period' },
  { value: 'justTired', label: 'Just tired' },
];

const changes: readonly { value: ModeChange; label: string }[] = [
  { value: 'onlyEasy', label: 'Only easy sessions' },
  { value: 'shorterSessions', label: 'Shorter sessions' },
  { value: 'fullBreak', label: 'A full break' },
  { value: 'keepFixedDropRest', label: 'Keep fixed sessions, drop the rest' },
];

/** `until` is inclusive (modeActiveOn), so 3 days means today + 2. */
const durations = ['3 days', '1 week', 'Until I say'] as const;
const durationExtraDays: readonly (number | undefined)[] = [2, 6, undefined];

const comebacks: readonly Comeback[] = ['slowly', 'balanced', 'quickly'];
const comebackLabels = ['Slowly', 'Balanced', 'Quickly'] as const;

export default function UnwellScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, today, dispatch } = useStore();

  const [cause, setCause] = useState<ModeCause>('ill');
  const [change, setChange] = useState<ModeChange>('fullBreak');
  const [durationIndex, setDurationIndex] = useState(0);
  const [comeback, setComeback] = useState<Comeback>('slowly');

  const activeMode = modeActiveOn(state.mode, today) ? state.mode : undefined;

  function easeMyPlan() {
    const extra = durationExtraDays[durationIndex];
    const mode: ActiveMode = {
      cause,
      change,
      from: today,
      ...(extra != null ? { until: addDays(today, extra) } : {}),
      comeback,
    };
    dispatch([{ type: 'modeStarted', mode }]);
    router.back();
  }

  function backToNormal() {
    dispatch([{ type: 'modeEnded', day: today }]);
    router.back();
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
      <View style={styles.inner}>
        <View style={styles.headerRow}>
          <View style={styles.titleBlock}>
            <Text variant="screenTitle">Not feeling 100%</Text>
            <Text variant="advice" tone="muted">
              The app eases the plan and brings you back gently.
            </Text>
          </View>
          <RoundIconButton icon="close" label="Close" onPress={() => router.back()} />
        </View>

        {activeMode ? (
          <View style={[styles.activePanel, { borderColor: colors.controlBorder }]}>
            <Text variant="listTitle">
              {`You're taking it easier until ${
                activeMode.until ? longDay(activeMode.until) : 'you say otherwise'
              }`}
            </Text>
            <Button label="Back to normal" variant="secondary" onPress={backToNormal} />
          </View>
        ) : (
          <>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              <View style={styles.section}>
                <Text variant="actionLabel">{"What's going on?"}</Text>
                <View style={styles.pillRow}>
                  {causes.map((option) => (
                    <ChoiceButton
                      key={option.value}
                      label={option.label}
                      selected={cause === option.value}
                      onPress={() => setCause(option.value)}
                      shape="pill"
                    />
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text variant="actionLabel">What should change?</Text>
                <View style={styles.rowStack}>
                  {changes.map((option) => (
                    <ChoiceButton
                      key={option.value}
                      label={option.label}
                      selected={change === option.value}
                      onPress={() => setChange(option.value)}
                      shape="row"
                    />
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text variant="actionLabel">For how long?</Text>
                <ChoiceGrid
                  options={durations}
                  selectedIndex={durationIndex}
                  onSelect={setDurationIndex}
                />
              </View>

              <View style={styles.section}>
                <Text variant="actionLabel">Coming back</Text>
                <ChoiceGrid
                  options={comebackLabels}
                  selectedIndex={comebacks.indexOf(comeback)}
                  onSelect={(index) => setComeback(comebacks[index]!)}
                />
              </View>

              <Text variant="cardSubtitle" tone="muted">
                {"For pain that is sharp or doesn't go away, see a doctor or physiotherapist."}
              </Text>
            </ScrollView>

            <Button
              label="Ease my plan"
              variant="primary"
              onPress={easeMyPlan}
              style={styles.footerButton}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: {
    flex: 1,
    paddingTop: metrics.flow.paddingTop,
    paddingHorizontal: metrics.flow.paddingHorizontal,
    paddingBottom: metrics.flow.paddingBottom,
    gap: metrics.flow.gap,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: { flexShrink: 1, gap: 2 },
  activePanel: {
    borderRadius: metrics.library.cardRadius,
    borderWidth: 1,
    padding: metrics.library.cardPadding,
    gap: 12,
  },
  scroll: { flex: 1 },
  scrollContent: { gap: metrics.flow.gap },
  section: { gap: metrics.flow.sectionGap },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rowStack: { gap: 6 },
  footerButton: { height: metrics.choice.heightTall },
});
