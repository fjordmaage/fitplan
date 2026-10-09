/**
 * The Body screen's recovery meters and training-load gauge, and the
 * segment progress bar the guide and setup share.
 */

import { StyleSheet, View } from 'react-native';

import { metrics, useTheme } from '@/theme';

import { Text } from './text';

const m = metrics.meter;

/** One region's recovery: name, verdict words, and a filled track. */
export function MeterBar({
  label,
  words,
  fraction,
}: {
  label: string;
  words: string;
  fraction: number;
}) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, fraction));
  return (
    <View
      style={styles.meter}
      accessibilityLabel={`${label}: ${words}`}
      accessibilityRole="progressbar"
    >
      <View style={styles.meterLabels}>
        <Text variant="listTitle">{label}</Text>
        <Text variant="secondary" tone="muted">
          {words}
        </Text>
      </View>
      <View
        style={[
          styles.track,
          { backgroundColor: colors.hairlineInCard, borderRadius: m.trackRadius },
        ]}
      >
        <View
          style={{
            width: `${clamped * 100}%`,
            height: m.trackHeight,
            borderRadius: m.trackRadius,
            backgroundColor: colors.accent,
          }}
        />
      </View>
    </View>
  );
}

/**
 * Training load vs usual: a track with the "usual" band and a marker dot.
 * `position` is 0-1 along the track; the band sits at 35%-65%.
 */
export function RangeGauge({
  position,
  leftLabel,
  midLabel,
  rightLabel,
}: {
  position: number;
  leftLabel: string;
  midLabel: string;
  rightLabel: string;
}) {
  const { colors } = useTheme();
  const clamped = Math.max(0.02, Math.min(0.98, position));
  return (
    <View style={styles.gaugeBlock}>
      <View style={styles.gauge}>
        <View
          style={[
            styles.gaugeTrack,
            { backgroundColor: colors.hairlineInCard, borderRadius: m.trackRadius },
          ]}
        />
        <View
          style={[
            styles.gaugeTrack,
            {
              left: `${m.bandStart * 100}%`,
              right: undefined,
              width: `${m.bandWidth * 100}%`,
              backgroundColor: colors.busyBarLine,
              borderRadius: m.trackRadius,
            },
          ]}
        />
        <View
          style={[
            styles.gaugeDot,
            {
              left: `${clamped * 100}%`,
              backgroundColor: colors.ink,
              borderColor: colors.surface,
            },
          ]}
        />
      </View>
      <View style={styles.gaugeLabels}>
        <Text variant="smallLabel" tone="muted">
          {leftLabel}
        </Text>
        <Text variant="smallLabel" tone="muted">
          {midLabel}
        </Text>
        <Text variant="smallLabel" tone="muted">
          {rightLabel}
        </Text>
      </View>
    </View>
  );
}

/** Done / current / upcoming segments (guide moves, setup steps). */
export function ProgressSegments({
  total,
  done,
  current,
}: {
  total: number;
  /** How many segments are completed (before the current one). */
  done: number;
  /** Index of the current segment; -1 for none. */
  current: number;
}) {
  const { colors } = useTheme();
  const f = metrics.flow;
  return (
    <View style={styles.segments}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: f.segmentHeight,
            borderRadius: f.segmentRadius,
            backgroundColor:
              i < done ? colors.ink : i === current ? colors.accent : colors.busyBarGround,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  meter: { gap: 6 },
  meterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  track: { height: m.trackHeight },
  gaugeBlock: { gap: 6 },
  gauge: { height: m.gaugeHeight, justifyContent: 'center' },
  gaugeTrack: { position: 'absolute', left: 0, right: 0, height: m.trackHeight },
  gaugeDot: {
    position: 'absolute',
    top: 0,
    width: m.dotSize,
    height: m.dotSize,
    borderRadius: m.dotSize / 2,
    borderWidth: m.dotBorder,
    marginLeft: -m.dotSize / 2,
  },
  gaugeLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  segments: { flexDirection: 'row', gap: metrics.flow.segmentGap },
});
