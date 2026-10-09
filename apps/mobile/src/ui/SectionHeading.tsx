import { StyleSheet, View } from 'react-native';

import { metrics, useTheme } from '@/theme';

import { Text } from './text';

/** A day heading with a hairline running to the right edge. */
export function SectionHeading({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row} accessibilityRole="header">
      <Text variant="sectionHeading">{children}</Text>
      <View style={[styles.rule, { backgroundColor: colors.hairline }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: metrics.timeline.headingGap,
    paddingHorizontal: metrics.timeline.headingInset,
  },
  rule: { flex: 1, height: metrics.timeline.hairlineHeight },
});
