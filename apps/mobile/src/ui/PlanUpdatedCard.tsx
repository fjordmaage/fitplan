import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { Button } from './Button';
import { Text } from './text';

export interface PlanUpdatedCardProps {
  title?: string;
  /** What changed and why, in the engine's own words. */
  body: string;
  onUndo?: () => void;
  onAccept?: () => void;
}

/**
 * The card that floats above the bottom bar after any change. It is the main
 * trust mechanism: it must list every activity that moved.
 */
export function PlanUpdatedCard({
  title = 'Plan updated',
  body,
  onUndo,
  onAccept,
}: PlanUpdatedCardProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.ink }]}>
      <View style={styles.titles}>
        <Text variant="buttonPrimary" tone="onInk">
          {title}
        </Text>
        <Text variant="advice" tone="mutedOnInk">
          {body}
        </Text>
      </View>
      <View style={styles.actions}>
        <Button label="Undo" variant="onInkSecondary" onPress={onUndo} style={styles.action} />
        <Button
          label="Looks good"
          variant="onInkPrimary"
          onPress={onAccept}
          style={styles.action}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 80,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
    elevation: 8,
  },
  titles: { gap: 3 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1 },
});
