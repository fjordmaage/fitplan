import { StyleSheet, View } from 'react-native';

import { metrics, useTheme } from '@/theme';

import { Text } from './text';

/** The engine's one line of advice, on a tint of the accent. */
export function AdviceBox({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: colors.accentTint }]}>
      <Text variant="advice">{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: metrics.advice.radius,
    paddingVertical: metrics.advice.paddingVertical,
    paddingHorizontal: metrics.advice.paddingHorizontal,
  },
});
