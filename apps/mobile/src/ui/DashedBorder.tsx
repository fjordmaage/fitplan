import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

/**
 * A dashed rounded border.
 *
 * React Native's own `borderStyle: 'dashed'` renders inconsistently on Android
 * once a radius is involved, so this draws the outline as an SVG rectangle
 * instead (docs/06-design-fidelity.md names this as a tricky spot). It is laid
 * over its parent and does not take part in layout, so the parent keeps a
 * transparent border of the same width to reserve the space.
 */
export interface DashedBorderProps {
  color: string;
  width: number;
  radius: number;
  /** Dash and gap length. */
  dash?: readonly [number, number];
}

export function DashedBorder({ color, width, radius, dash = [5, 4] }: DashedBorderProps) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(event) => {
        const { width: w, height: h } = event.nativeEvent.layout;
        setSize((current) =>
          current && current.width === w && current.height === h
            ? current
            : { width: w, height: h },
        );
      }}
    >
      {size ? (
        <Svg width={size.width} height={size.height}>
          <Rect
            x={width / 2}
            y={width / 2}
            width={Math.max(0, size.width - width)}
            height={Math.max(0, size.height - width)}
            rx={Math.max(0, radius - width / 2)}
            fill="none"
            stroke={color}
            strokeWidth={width}
            strokeDasharray={`${dash[0]},${dash[1]}`}
          />
        </Svg>
      ) : null}
    </View>
  );
}
