import { Pressable, StyleSheet, View } from 'react-native';

import type { Rating } from '@fitplan/engine';
import { metrics, ratingWord, useTheme } from '@/theme';

import { Button } from './Button';
import { Sheet } from './Sheet';
import { Text } from './text';

export interface SwapCandidateView {
  id: string;
  name: string;
  rating: Rating | undefined;
}

export interface SwapSheetProps {
  visible: boolean;
  title: string;
  subtitle: string;
  candidates: readonly SwapCandidateView[];
  reasonLine: (rating: Rating | undefined) => string;
  onPick: (exerciseId: string) => void;
  onClose: () => void;
}

/** "Do something else": rated alternatives; tapping one replaces the workout. */
export function SwapSheet(props: SwapSheetProps) {
  const { colors } = useTheme();
  return (
    <Sheet
      visible={props.visible}
      title={props.title}
      subtitle={props.subtitle}
      onClose={props.onClose}
    >
      <View style={styles.list}>
        {props.candidates.map((candidate) => {
          const level = candidate.rating?.level;
          const palette = level ? colors.rating[level] : undefined;
          return (
            <Pressable
              key={candidate.id}
              accessibilityRole="button"
              accessibilityLabel={`${candidate.name}: ${level ? ratingWord[level] : ''}`}
              onPress={() => props.onPick(candidate.id)}
              style={({ pressed }) => [
                styles.row,
                { borderColor: colors.controlBorder, backgroundColor: colors.surface },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.texts}>
                <Text variant="cardTitle">{candidate.name}</Text>
                <Text variant="secondary" tone="muted">
                  {props.reasonLine(candidate.rating)}
                </Text>
              </View>
              {level ? (
                <View style={[styles.chip, { backgroundColor: palette!.background }]}>
                  <Text variant="smallLabel" color={palette!.text}>
                    {ratingWord[level]}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <Button label="Keep as it is" onPress={props.onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: metrics.card.radius,
    paddingVertical: metrics.card.paddingVertical,
    paddingHorizontal: metrics.card.paddingHorizontal,
  },
  texts: { flex: 1, minWidth: 0, gap: 2 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pressed: { opacity: 0.7 },
});
