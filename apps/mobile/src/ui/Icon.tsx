import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

/**
 * The mockups' icons, reused as their exact paths rather than substituted from
 * an icon set (docs/06-design-fidelity.md, rule 7). Every one is a 24x24
 * viewBox of 2px round-capped lines; the stroke width varies per icon and is
 * kept as drawn.
 */

export type IconName =
  | 'settings'
  | 'chevronDown'
  | 'lock'
  | 'plus'
  | 'tabPlan'
  | 'tabExercises'
  | 'tabBody'
  | 'tabLearn';

export interface IconProps {
  name: IconName;
  size: number;
  color: string;
}

const strokeWidths: Record<IconName, number> = {
  settings: 2,
  chevronDown: 2.4,
  lock: 2,
  plus: 2.4,
  tabPlan: 2.4,
  tabExercises: 2,
  tabBody: 2,
  tabLearn: 2,
};

export function Icon({ name, size, color }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidths[name]}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {glyph(name)}
    </Svg>
  );
}

function glyph(name: IconName) {
  switch (name) {
    case 'settings':
      return (
        <>
          <Line x1="4" y1="7" x2="20" y2="7" />
          <Line x1="4" y1="17" x2="20" y2="17" />
          <Circle cx="9" cy="7" r="2.5" />
          <Circle cx="15" cy="17" r="2.5" />
        </>
      );
    case 'chevronDown':
      return <Polyline points="6 9 12 15 18 9" />;
    case 'lock':
      return (
        <>
          <Rect x="5" y="11" width="14" height="9" rx="2" />
          <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </>
      );
    case 'plus':
      return (
        <>
          <Line x1="12" y1="5" x2="12" y2="19" />
          <Line x1="5" y1="12" x2="19" y2="12" />
        </>
      );
    case 'tabPlan':
      return (
        <>
          <Rect x="4" y="5" width="16" height="15" rx="3" />
          <Line x1="4" y1="10" x2="20" y2="10" />
          <Line x1="9" y1="3" x2="9" y2="7" />
          <Line x1="15" y1="3" x2="15" y2="7" />
        </>
      );
    case 'tabExercises':
      return (
        <>
          <Line x1="8" y1="7" x2="20" y2="7" />
          <Line x1="8" y1="12" x2="20" y2="12" />
          <Line x1="8" y1="17" x2="20" y2="17" />
          <Circle cx="4.5" cy="7" r="1" />
          <Circle cx="4.5" cy="12" r="1" />
          <Circle cx="4.5" cy="17" r="1" />
        </>
      );
    case 'tabBody':
      return <Path d="M3 12h4l2.5-6 4 12 2.5-6h5" />;
    case 'tabLearn':
      return (
        <>
          <Path d="M5 5h10a3 3 0 0 1 3 3v11H8a3 3 0 0 1-3-3z" />
          <Line x1="9" y1="10" x2="14" y2="10" />
          <Line x1="9" y1="14" x2="13" y2="14" />
        </>
      );
  }
}
