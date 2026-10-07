import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { metrics, useTheme } from '@/theme';

import { DashedBorder } from './DashedBorder';
import { Hatch } from './Hatch';
import { Icon } from './Icon';
import { SelectionRing } from './SelectionRing';
import { Text } from './text';

/** The encoding, as the design system defines it. */
export type ActivityKind = 'fixed' | 'flexible' | 'tentative' | 'busy';

export interface TimelineCardProps {
  kind: ActivityKind;
  title: string;
  subtitle: string;
  selected?: boolean;
  onPress?: () => void;
}

export function TimelineCard({ kind, title, subtitle, selected, onPress }: TimelineCardProps) {
  const { colors } = useTheme();

  const card = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      accessibilityState={{ selected: Boolean(selected) }}
      onPress={onPress}
      disabled={kind === 'busy'}
      style={[styles.card, surface(kind, colors)]}
    >
      {kind === 'busy' ? (
        <Hatch
          line={colors.busyCardStripe}
          ground={colors.busyCardBase}
          density="cardStripe"
          radius={metrics.card.radius}
        />
      ) : null}
      {kind === 'tentative' ? (
        <DashedBorder
          color={colors.accent}
          width={metrics.card.borderWidth}
          radius={metrics.card.radius}
        />
      ) : null}

      <View style={styles.titles}>
        <Text
          variant="cardTitle"
          tone={kind === 'fixed' ? 'onInk' : kind === 'busy' ? 'busy' : 'ink'}
        >
          {title}
        </Text>
        <Text
          variant="cardSubtitle"
          tone={kind === 'fixed' ? 'mutedOnInk' : kind === 'busy' ? 'busy' : 'muted'}
        >
          {subtitle}
        </Text>
      </View>

      {kind === 'fixed' ? (
        <Icon name="lock" size={metrics.card.glyph} color={colors.textOnInk} />
      ) : null}
      {kind === 'flexible' || kind === 'tentative' ? (
        <Icon name="chevronDown" size={metrics.card.glyph} color={colors.ink} />
      ) : null}
    </Pressable>
  );

  return selected ? <SelectionRing radius={metrics.card.radius}>{card}</SelectionRing> : card;
}

function surface(kind: ActivityKind, colors: ReturnType<typeof useTheme>['colors']): ViewStyle {
  switch (kind) {
    case 'fixed':
      return { backgroundColor: colors.ink, borderColor: colors.ink };
    case 'flexible':
      return { backgroundColor: colors.surface, borderColor: colors.accent };
    case 'tentative':
      // The visible outline is drawn by DashedBorder; this transparent one only
      // reserves the same space so the two kinds line up.
      return { backgroundColor: colors.surface, borderColor: 'transparent' };
    case 'busy':
      return { backgroundColor: colors.busyCardBase, borderColor: 'transparent' };
  }
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: metrics.card.gap,
    borderRadius: metrics.card.radius,
    borderWidth: metrics.card.borderWidth,
    paddingVertical: metrics.card.paddingVertical,
    paddingHorizontal: metrics.card.paddingHorizontal,
    overflow: 'hidden',
  },
  titles: { flex: 1, minWidth: 0, gap: metrics.card.titleGap },
});
