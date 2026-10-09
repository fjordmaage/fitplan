import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { metrics, useTheme } from '@/theme';

/**
 * The selection marker: a gap showing the ground, then an ink ring.
 *
 * The mockups draw it with two stacked outer box-shadows, so it takes no space
 * in layout — the ringed thing keeps its own size and position, and everything
 * beside it stays put (docs/06-design-fidelity.md names this as a tricky spot).
 * React Native has no equivalent, so this draws the ring as an overlay pulled
 * outwards by negative insets. Making it a padded wrapper instead would shrink
 * the card and shift the buttons under it.
 */
export interface SelectionRingProps {
  /** The radius of the thing being ringed. The ring sits outside it. */
  radius: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SelectionRing({ radius, children, style }: SelectionRingProps) {
  const { colors } = useTheme();
  const { gap, ring } = metrics.selection;
  const out = gap + ring;

  return (
    <View style={style}>
      {children}
      <View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            top: -out,
            right: -out,
            bottom: -out,
            left: -out,
            borderWidth: ring,
            borderColor: colors.ink,
            borderRadius: radius + out,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute' },
});
