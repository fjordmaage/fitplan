/**
 * Goals and settings (mockup 20). Every control dispatches immediately —
 * there is no save button, because changes are logged over time and the
 * store replans as part of the write.
 */

import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Settings } from '@fitplan/store';

import { useStore } from '@/data/store';
import { accentPresets, metrics, useTheme } from '@/theme';
import {
  BackHeader,
  CardDivider,
  ChoiceButton,
  ChoiceGrid,
  ListRow,
  SurfaceCard,
  SwitchRow,
  Text,
} from '@/ui';

const trainingAmounts: readonly Settings['trainingAmount'][] = [
  'recover',
  'lighter',
  'steady',
  'build',
  'push',
];
const trainingLabels = ['Recover', 'Lighter', 'Steady', 'Build', 'Push'] as const;

/** What the chosen amount means, in the app's own words. */
const trainingMeaning: Record<Settings['trainingAmount'], string> = {
  recover: 'Recover trims the plan hard: fewer, easier sessions while you get back on your feet.',
  lighter: 'Lighter eases things off: a bit less volume and easier days than usual.',
  steady: 'Steady keeps you where you are: your usual sessions with the load held level.',
  build: 'Build adds a little: an extra session or a harder day when your body is ready.',
  push: 'Push aims clearly higher — the app still guards against doing too much at once.',
};

const goals = [
  'General fitness',
  'Get stronger',
  'Build endurance',
  'Feel better day to day',
] as const;

const changePolicies: readonly Settings['changePolicy'][] = [
  'askFirst',
  'changeThenTell',
  'onlyBigChanges',
];
const changePolicyLabels = [
  'Ask me first',
  'Change it, then tell me why',
  'Only tell me about big changes',
] as const;

const themes: readonly Settings['theme'][] = ['phone', 'light', 'dark'];
const themeLabels = ['Same as phone', 'Light', 'Dark'] as const;

const accentLabels = ['Green accent', 'Blue accent', 'Orange accent', 'Purple accent'] as const;

export default function SettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, dispatch } = useStore();
  const { settings, person } = state;

  function change(patch: Partial<Settings>) {
    dispatch([{ type: 'settingsChanged', patch }]);
  }

  const personPieces = [
    person.ageYears != null ? `${person.ageYears} years` : null,
    person.heightCm != null ? `${person.heightCm} cm` : null,
    person.weightKg != null ? `${person.weightKg} kg` : null,
  ].filter((piece): piece is string => piece != null);

  return (
    <View style={[styles.root, { backgroundColor: colors.ground, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackHeader title="Goals and settings" backLabel="Back to the plan" />

        <SurfaceCard style={styles.trainCard}>
          <Text variant="sectionHeading">How much to train</Text>
          <ChoiceGrid
            options={trainingLabels}
            selectedIndex={trainingAmounts.indexOf(settings.trainingAmount)}
            onSelect={(index) => change({ trainingAmount: trainingAmounts[index] })}
            shape="cellDense"
            gap={4}
          />
          <Text variant="cardSubtitle" tone="muted">
            {trainingMeaning[settings.trainingAmount]}
          </Text>
          <CardDivider />
          <ListRow
            label="Goal"
            value={settings.goalText}
            height={metrics.minTapTarget}
            onPress={() => {
              const index = goals.indexOf(settings.goalText as (typeof goals)[number]);
              change({ goalText: goals[(index + 1) % goals.length] });
            }}
          />
        </SurfaceCard>

        <SurfaceCard style={styles.changeCard}>
          <Text variant="sectionHeading">When the plan needs to change</Text>
          {changePolicies.map((policy, index) => (
            <ChoiceButton
              key={policy}
              label={changePolicyLabels[index]!}
              selected={settings.changePolicy === policy}
              onPress={() => change({ changePolicy: policy })}
              shape="row"
            />
          ))}
          <SwitchRow
            title="Keep the next 2 days steady"
            subtitle="Near-term plans only move if you ask."
            on={settings.keepNextTwoDaysSteady}
            onToggle={(next) => change({ keepNextTwoDaysSteady: next })}
          />
        </SurfaceCard>

        <SurfaceCard style={styles.lookCard}>
          <Text variant="sectionHeading">Look</Text>
          <ChoiceGrid
            options={themeLabels}
            selectedIndex={themes.indexOf(settings.theme)}
            onSelect={(index) => change({ theme: themes[index]! })}
          />
          <View style={styles.accentRow}>
            {accentPresets.light.map((preset, index) => {
              const selected = settings.accentIndex === index;
              const swatch = (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${accentLabels[index]}${selected ? ', selected' : ''}`}
                  onPress={() => change({ accentIndex: index })}
                  style={({ pressed }) => [
                    styles.swatch,
                    { backgroundColor: preset },
                    selected && { borderWidth: 3, borderColor: colors.surface },
                    pressed && styles.pressed,
                  ]}
                />
              );
              return (
                <View key={preset} style={styles.swatchSlot}>
                  {selected ? (
                    <View style={[styles.swatchRing, { borderColor: colors.ink }]}>{swatch}</View>
                  ) : (
                    swatch
                  )}
                </View>
              );
            })}
          </View>
        </SurfaceCard>

        <SurfaceCard list>
          <ListRow
            label="About you"
            value={personPieces.length > 0 ? personPieces.join(', ') : 'Age, height, weight'}
            height={metrics.library.row}
            onPress={() => router.push('/about-you')}
          />
          <CardDivider />
          <ListRow
            label="Voice and sound"
            value={settings.voiceCues ? 'Spoken cues on' : 'Spoken cues off'}
            height={metrics.library.row}
            onPress={() => change({ voiceCues: !settings.voiceCues })}
          />
          <CardDivider />
          <ListRow
            label="Reminders"
            value={settings.reminders === 'morningSummary' ? 'Morning summary' : 'Off'}
            height={metrics.library.row}
            onPress={() =>
              change({
                reminders: settings.reminders === 'morningSummary' ? 'off' : 'morningSummary',
              })
            }
          />
          <CardDivider />
          <ListRow
            label="Connections"
            value="Health Connect, calendar — coming"
            height={metrics.library.row}
          />
          <CardDivider />
          <ListRow
            label="Your data"
            value="Export or back up — coming"
            height={metrics.library.row}
          />
        </SurfaceCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingTop: 20, paddingHorizontal: 16, paddingBottom: 28, gap: 20 },
  trainCard: { gap: 14 },
  changeCard: { gap: 10 },
  lookCard: { gap: 12 },
  accentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  /** Keeps the row steady whether or not the outer ring is present. */
  swatchSlot: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 44, height: 44, borderRadius: 22 },
  swatchRing: { borderRadius: 25, borderWidth: 2, padding: 1 },
  pressed: { opacity: 0.7 },
});
