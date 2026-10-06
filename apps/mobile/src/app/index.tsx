import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ENGINE_VERSION, sessionLoad } from '@fitplan/engine';
import {
  accentPresets,
  flexibleFill,
  layout,
  ratingWord,
  ThemeProvider,
  type,
  useTheme,
  type RatingLevel,
  type ThemeName,
} from '@/theme';

type Preference = 'phone' | ThemeName;

const preferences: { value: Preference; label: string }[] = [
  { value: 'phone', label: 'Same as phone' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/**
 * Stage 0 placeholder.
 *
 * Its job is to prove, on the phone, that five things work: the bundled font,
 * the colour tokens in both themes, the shape-and-fill encoding, the accent
 * being a parameter rather than a constant, and the engine package being
 * importable from the app. Nothing here survives stage 2.
 */
export default function Placeholder() {
  const phone = useColorScheme();
  const [preference, setPreference] = useState<Preference>('phone');
  const [accentIndex, setAccentIndex] = useState(0);

  const name: ThemeName =
    preference === 'phone' ? (phone === 'dark' ? 'dark' : 'light') : preference;
  const accent = accentPresets[name][accentIndex] ?? accentPresets[name][0];

  return (
    <ThemeProvider preference={name} accent={accent}>
      <Body
        preference={preference}
        onPreference={setPreference}
        accentIndex={accentIndex}
        onAccentIndex={setAccentIndex}
      />
    </ThemeProvider>
  );
}

function Body({
  preference,
  onPreference,
  accentIndex,
  onAccentIndex,
}: {
  preference: Preference;
  onPreference: (value: Preference) => void;
  accentIndex: number;
  onAccentIndex: (value: number) => void;
}) {
  const { name, colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.ground }]}
      edges={['top', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[type.overline, { color: colors.mutedText }]}>Stage 0</Text>
        <Text style={[type.screenTitle, styles.title, { color: colors.ink }]}>fitplan</Text>
        <Text style={[type.advice, { color: colors.mutedText }]}>
          Foundations only. No plan yet, no engine yet. This screen is here so you can check the
          font and the colours on your own phone.
        </Text>

        <Card title="Theme">
          <Text style={[type.secondary, styles.cardIntro, { color: colors.mutedText }]}>
            Showing {name}. Settings will offer these same three choices.
          </Text>
          <View style={styles.choiceRow}>
            {preferences.map((option) => (
              <Choice
                key={option.value}
                label={option.label}
                selected={preference === option.value}
                onPress={() => onPreference(option.value)}
              />
            ))}
          </View>
          <View style={styles.swatchRow}>
            <Swatch label="Ground" color={colors.ground} border={colors.hairline} />
            <Swatch label="Surface" color={colors.surface} border={colors.hairline} />
            <Swatch label="Ink" color={colors.ink} border={colors.hairline} />
            <Swatch label="Accent" color={colors.accent} border={colors.hairline} />
          </View>
        </Card>

        <Card title="Type">
          <Text style={[type.cardTitle, { color: colors.ink }]}>Schibsted Grotesk, bold 16</Text>
          <Text style={[type.body, { color: colors.ink }]}>Row label, semibold 15</Text>
          <Text style={[type.advice, { color: colors.ink }]}>Advice text, regular 14 on 20</Text>
          <Text style={[type.secondary, { color: colors.mutedText }]}>Secondary, regular 13</Text>
          <Text style={[type.guideCountdown, { color: colors.ink }]}>12:00</Text>
          <Text style={[type.secondary, { color: colors.mutedText }]}>
            The countdown uses tabular numerals, so it must not jiggle as it counts down.
          </Text>
        </Card>

        <Card title="Ratings">
          <Text style={[type.secondary, styles.cardIntro, { color: colors.mutedText }]}>
            Each one always carries its word, so colour is never the only signal.
          </Text>
          <View style={styles.chipRow}>
            {(['good', 'ok', 'avoid'] as RatingLevel[]).map((level) => (
              <View
                key={level}
                accessibilityRole="text"
                accessibilityLabel={ratingWord[level]}
                style={[styles.chip, { backgroundColor: colors.rating[level].background }]}
              >
                <Text style={[type.smallLabel, { color: colors.rating[level].text }]}>
                  {ratingWord[level]}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <Card title="The encoding">
          <Text style={[type.secondary, styles.cardIntro, { color: colors.mutedText }]}>
            Shape and fill carry the meaning before colour does.
          </Text>
          <Bar label="Fixed" style={{ backgroundColor: colors.ink }} />
          <Bar
            label="Flexible"
            style={{
              backgroundColor: flexibleFill(name, colors.accent),
              borderWidth: 1.5,
              borderColor: colors.accent,
            }}
          />
          <Bar
            label="Day may change"
            style={{ borderWidth: 1.5, borderColor: colors.accent, borderStyle: 'dashed' }}
          />
          <Bar label="Busy" style={{ backgroundColor: colors.busyHatchGround }} />
          <Bar label="Empty slot" style={{ backgroundColor: colors.quietFill }} />
          <Text style={[type.secondary, { color: colors.mutedText }]}>
            Busy is drawn flat here. Its diagonal hatch arrives with the calendar in stage 2.
          </Text>
        </Card>

        <Card title="Accent">
          <Text style={[type.secondary, styles.cardIntro, { color: colors.mutedText }]}>
            Tap one. Everything accented above follows it.
          </Text>
          <View style={styles.swatchRow}>
            {accentPresets[name].map((preset, index) => (
              <Pressable
                key={preset}
                accessibilityRole="button"
                accessibilityLabel={`Accent ${preset}`}
                accessibilityState={{ selected: index === accentIndex }}
                onPress={() => onAccentIndex(index)}
                style={styles.swatch}
              >
                <View
                  style={[
                    styles.swatchChip,
                    {
                      backgroundColor: preset,
                      borderColor: index === accentIndex ? colors.ink : colors.hairline,
                      borderWidth: index === accentIndex ? 2 : 1,
                    },
                  ]}
                />
                <Text style={[type.smallLabel, styles.swatchLabel, { color: colors.mutedText }]}>
                  {preset}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card title="Engine">
          <Text style={[type.secondary, { color: colors.mutedText }]}>
            Version {ENGINE_VERSION}, imported from the engine package. A 45 minute session at
            effort 6 scores {sessionLoad(45, 6)}. That is the only thing it knows how to do so far.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text style={[type.sectionHeading, styles.cardTitle, { color: colors.ink }]}>{title}</Text>
      {children}
    </View>
  );
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.choice,
        {
          borderColor: selected ? colors.ink : colors.controlBorder,
          borderWidth: selected ? 2 : 1,
        },
      ]}
    >
      <Text
        style={[
          type.smallLabel,
          { color: colors.ink, fontFamily: selected ? type.body.fontFamily : undefined },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Swatch({ label, color, border }: { label: string; color: string; border: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.swatch}>
      <View style={[styles.swatchChip, { backgroundColor: color, borderColor: border }]} />
      <Text style={[type.smallLabel, styles.swatchLabel, { color: colors.mutedText }]}>
        {label}
      </Text>
    </View>
  );
}

function Bar({ label, style }: { label: string; style: object }) {
  const { colors } = useTheme();
  return (
    <View style={styles.barRow}>
      <View style={[styles.bar, style]} />
      <Text style={[type.secondary, { color: colors.ink }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 10,
  },
  title: { marginBottom: 6 },
  card: {
    borderRadius: layout.radius.card,
    padding: layout.cardPadding,
    marginTop: layout.cardGap - 10,
    gap: 8,
  },
  cardTitle: { marginBottom: 2 },
  cardIntro: { marginBottom: 2 },
  choiceRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  choice: {
    minHeight: layout.control.minTapTarget,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: layout.radius.button,
  },
  swatchRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  swatch: { alignItems: 'center', gap: 4 },
  swatchChip: {
    width: 56,
    height: 36,
    borderRadius: layout.radius.button,
    borderWidth: 1,
  },
  swatchLabel: { textAlign: 'center' },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bar: {
    width: 64,
    height: layout.calendar.barHeight,
    borderRadius: layout.radius.calendarBar,
  },
});
