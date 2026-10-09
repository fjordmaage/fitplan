import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

import { metrics } from '@/theme';

/**
 * The diagonal hatch that marks busy time.
 *
 * React Native has no repeating gradient, so this draws the stripes as an SVG
 * pattern and clips them with the parent's border radius. The mockups use two
 * different densities: tight stripes on calendar bars, wider ones on timeline
 * cards (docs/06-design-fidelity.md names this as a tricky spot).
 */
export interface HatchProps {
  /** Stripe colour. */
  line: string;
  /** Colour behind the stripes. */
  ground: string;
  density: 'bar' | 'cardStripe';
  radius: number;
  style?: ViewStyle;
}

export function Hatch({ line, ground, density, radius, style }: HatchProps) {
  const { line: lineWidth, period } = metrics.hatch[density];
  const id = `hatch-${density}`;

  return (
    <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id={id}
            width={period}
            height={period}
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(${metrics.hatch.angle - 90})`}
          >
            <Rect width={period} height={period} fill={ground} />
            <Line
              x1={lineWidth / 2}
              y1="0"
              x2={lineWidth / 2}
              y2={period}
              stroke={line}
              strokeWidth={lineWidth}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
