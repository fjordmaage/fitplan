import type { TextStyle } from 'react-native';

/**
 * Colour and type tokens, transcribed from docs/03-design-system.md.
 * This file is the single source of truth for visual values in the app.
 * If a value here disagrees with the design system doc, fix both in the
 * same commit.
 */

export type ThemeName = 'light' | 'dark';
export type RatingLevel = 'good' | 'ok' | 'avoid';

/** The four accent presets per theme, in the order the design system lists them. */
export const accentPresets = {
  light: ['#0F6B5C', '#1D4ED8', '#B4530B', '#7C3AED'],
  dark: ['#5FD0B8', '#8AB4FF', '#F2A65A', '#C4A7FF'],
} as const;

/** Ratings always carry a word; colour is never the only signal. */
export const ratingWord: Record<RatingLevel, string> = {
  good: 'Good',
  ok: 'OK',
  avoid: 'Avoid',
};

const lightBase = {
  ground: '#EBEFED',
  surface: '#FFFFFF',
  ink: '#14201C',
  mutedText: '#4D5A55',
  hairline: '#D5DCD8',
  hairlineInCard: '#E3E8E5',
  controlBorder: '#C9D2CE',
  quietFill: '#EDF1EF',
  textOnInk: '#FFFFFF',
  mutedTextOnInk: '#D5DDD9',
  busyHatchLine: '#7A8580',
  busyHatchGround: '#DDE3E0',
  busyCardBase: '#E3E8E5',
  busyCardStripe: '#D3DAD6',
  busyText: '#3C4843',
  rating: {
    good: { background: '#DDF0E4', text: '#17603A' },
    ok: { background: '#FBEBC4', text: '#7A5200' },
    avoid: { background: '#F9D9D3', text: '#9B2C1C' },
  },
};

const darkBase = {
  ground: '#0D1412',
  surface: '#18211E',
  ink: '#EEF3F1',
  mutedText: '#A7B3AE',
  hairline: '#2A3531',
  hairlineInCard: '#2A3531',
  controlBorder: '#3A4641',
  quietFill: '#232D2A',
  textOnInk: '#0D1412',
  mutedTextOnInk: '#3C4843',
  busyHatchLine: '#8A9691',
  busyHatchGround: '#2A3531',
  busyCardBase: '#1F2926',
  busyCardStripe: '#2C3834',
  busyText: '#C5CFCA',
  rating: {
    good: { background: '#173626', text: '#8FDDB0' },
    ok: { background: '#3D3212', text: '#F0CE74' },
    avoid: { background: '#46201A', text: '#F5A99B' },
  },
};

export type Palette = typeof lightBase & {
  accent: string;
  textOnAccent: string;
  /** Advice boxes: accent at ~13% (light) / ~18% (dark). */
  accentTint: string;
};

/** A hex colour plus an alpha fraction, as the 8-digit hex React Native accepts. */
export function withAlpha(hex: string, alpha: number): string {
  const clamped = Math.min(1, Math.max(0, alpha));
  const byte = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${byte}`;
}

/**
 * Build a palette. The accent is user-changeable, so it is a parameter rather
 * than a baked-in token.
 */
export function palette(theme: ThemeName, accent?: string): Palette {
  const base = theme === 'light' ? lightBase : darkBase;
  const chosen = accent ?? accentPresets[theme][0];
  return {
    ...base,
    accent: chosen,
    textOnAccent: theme === 'light' ? '#FFFFFF' : '#0D1412',
    accentTint: withAlpha(chosen, theme === 'light' ? 0.13 : 0.18),
  };
}

/** Flexible items are filled with the accent at 45% (light) / 50% (dark). */
export function flexibleFill(theme: ThemeName, accent: string): string {
  return withAlpha(accent, theme === 'light' ? 0.45 : 0.5);
}

/** Spacing, radii and sizes from "Shape and spacing". */
export const layout = {
  screenPadding: 16,
  fullScreenPadding: 20,
  cardGap: 20,
  cardPadding: 15,
  radius: {
    card: 20,
    sheetTop: 24,
    innerPanel: 13,
    button: 12,
    calendarBar: 6,
  },
  control: {
    minTapTarget: 44,
    primaryButtonHeight: 48,
    secondaryButtonHeight: 46,
  },
  bottomBarHeight: 68,
  addButtonSize: 52,
  calendar: {
    dayColumnWidth: 44,
    dateCircle: 26,
    barHeight: 18,
    barGap: 4,
    gutterWidth: 26,
  },
} as const;

export const fontFamily = {
  regular: 'SchibstedGrotesk_400Regular',
  medium: 'SchibstedGrotesk_500Medium',
  semiBold: 'SchibstedGrotesk_600SemiBold',
  bold: 'SchibstedGrotesk_700Bold',
} as const;

/** Type scale from the design system's table. */
export const type = {
  screenTitle: { fontSize: 26, lineHeight: 30, fontFamily: fontFamily.bold },
  sheetTitle: { fontSize: 22, lineHeight: 28, fontFamily: fontFamily.bold },
  guideMoveName: { fontSize: 28, lineHeight: 34, fontFamily: fontFamily.bold },
  guideCountdown: {
    fontSize: 72,
    lineHeight: 76,
    fontFamily: fontFamily.bold,
    // The countdown must not jiggle as the digits change.
    fontVariant: ['tabular-nums'],
  },
  cardTitle: { fontSize: 16, lineHeight: 22, fontFamily: fontFamily.bold },
  sectionHeading: { fontSize: 15, fontFamily: fontFamily.bold },
  body: { fontSize: 15, fontFamily: fontFamily.semiBold },
  advice: { fontSize: 14, lineHeight: 20, fontFamily: fontFamily.regular },
  secondary: { fontSize: 13, lineHeight: 18, fontFamily: fontFamily.regular },
  smallLabel: { fontSize: 12, fontFamily: fontFamily.medium },
  overline: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
} satisfies Record<string, TextStyle>;
