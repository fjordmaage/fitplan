import { StyleSheet, View } from 'react-native';

import { metrics } from '@/theme';

import { Text } from './text';

/**
 * One row of the timeline: the time on the left ("Afternoon", "17:00"), the
 * card and anything under it on the right. The label is blank for a second
 * card in the same slot, but the column stays, so cards keep their left edge.
 */
export function TimelineRow({ time, children }: { time?: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.timeColumn}>
        {time ? (
          <Text variant="label" tone="muted">
            {time}
          </Text>
        ) : null}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

export function RestDayLine() {
  return (
    <Text variant="secondary" tone="muted" style={styles.restDay}>
      Rest day
    </Text>
  );
}

const m = metrics.timeline;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: m.columnGap },
  timeColumn: {
    width: m.timeColumnWidth,
    paddingTop: m.timeColumnPaddingTop,
    paddingLeft: m.timeColumnInset,
  },
  content: { flex: 1, minWidth: 0, gap: m.rowGap },
  restDay: {
    paddingLeft: m.restDayPaddingLeft,
    paddingRight: m.headingInset,
    paddingVertical: m.restDayPaddingVertical,
  },
});
