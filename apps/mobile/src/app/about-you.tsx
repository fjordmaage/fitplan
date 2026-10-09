/**
 * About you: age, height and weight. No drawn mockup — follows the settings
 * card style. Every change dispatches immediately and is kept in the log.
 */

import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PersonProfile } from '@fitplan/store';

import { useStore } from '@/data/store';
import { useTheme } from '@/theme';
import { BackHeader, Stepper, SurfaceCard, Text } from '@/ui';

interface Field {
  key: keyof Pick<PersonProfile, 'ageYears' | 'heightCm' | 'weightKg'>;
  label: string;
  unit: string;
  fallback: number;
  min: number;
  max: number;
}

const fields: readonly Field[] = [
  { key: 'ageYears', label: 'Age', unit: 'years', fallback: 30, min: 10, max: 100 },
  { key: 'heightCm', label: 'Height', unit: 'cm', fallback: 180, min: 120, max: 220 },
  { key: 'weightKg', label: 'Weight', unit: 'kg', fallback: 75, min: 30, max: 200 },
];

export default function AboutYouScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useStore();
  const { person } = state;

  function set(field: Field, next: number) {
    const clamped = Math.min(field.max, Math.max(field.min, next));
    dispatch([{ type: 'profileUpdated', patch: { [field.key]: clamped } }]);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.ground, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackHeader title="About you" backLabel="Back to settings" />

        <SurfaceCard style={styles.card}>
          {fields.map((field) => {
            const value = person[field.key] ?? field.fallback;
            return (
              <View key={field.key} style={styles.field}>
                <Text variant="label">{field.label}</Text>
                <Stepper
                  value={`${value}`}
                  unit={field.unit}
                  onLess={() => set(field, value - 1)}
                  onMore={() => set(field, value + 1)}
                  lessLabel={`Decrease ${field.label.toLowerCase()}`}
                  moreLabel={`Increase ${field.label.toLowerCase()}`}
                />
              </View>
            );
          })}
        </SurfaceCard>

        <Text variant="cardSubtitle" tone="muted" style={styles.note}>
          The app stores these for you and your exports. It only uses them where the science is
          clear — it never guesses fitness from a number.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingTop: 20, paddingHorizontal: 16, paddingBottom: 28, gap: 20 },
  card: { gap: 16 },
  field: { gap: 6 },
  note: { paddingHorizontal: 4 },
});
