/**
 * Every visual value in the app.
 *
 * The numbers come from the mockups themselves (`docs/design/html/`), read off
 * the elements they apply to, not from the prose tables in
 * `docs/03-design-system.md`. Where the two disagree the mockup wins; see
 * `docs/06-design-fidelity.md`. Disagreements found so far are listed in
 * `docs/05-known-gaps.md`.
 *
 * No screen may contain a literal colour or size. If a value is missing here,
 * add it here.
 */

import type { TextStyle } from 'react-native';

export type ThemeName = 'light' | 'dark';
export type RatingLevel = 'good' | 'ok' | 'avoid';

/** Ratings always carry a word; colour is never the only signal. */
export const ratingWord: Record<RatingLevel, string> = {
  good: 'Good',
  ok: 'OK',
  avoid: 'Avoid',
};

/** The four accent presets per theme, in the order the design system lists them. */
export const accentPresets = {
  light: ['#0F6B5C', '#1D4ED8', '#B4530B', '#7C3AED'],
  dark: ['#5FD0B8', '#8AB4FF', '#F2A65A', '#C4A7FF'],
} as const;

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
  scrim: 'rgba(8,14,12,0.5)',
  /** Busy bars in the calendar: 2 units of line, 3 of ground, at 135 degrees. */
  busyBarLine: '#7A8580',
  busyBarGround: '#DDE3E0',
  /** Busy cards in the timeline: 6 units of base, 2 of stripe. */
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
  scrim: 'rgba(0,0,0,0.6)',
  busyBarLine: '#8A9691',
  busyBarGround: '#2A3531',
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
  /** Flexible fill: the accent at 45% (light) / 50% (dark). `#0F6B5C73`. */
  accentFill: string;
  /** Advice boxes: the accent at 13% (light) / 18% (dark). `#0F6B5C22`. */
  accentTint: string;
};

/** A hex colour plus an alpha fraction, as the 8-digit hex React Native accepts. */
export function withAlpha(hex: string, alpha: number): string {
  const byte = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${byte}`;
}

/** Build a palette. The accent is a parameter because the user can change it. */
export function palette(theme: ThemeName, accent?: string): Palette {
  const base = theme === 'light' ? lightBase : darkBase;
  const chosen = accent ?? accentPresets[theme][0];
  return {
    ...base,
    accent: chosen,
    textOnAccent: theme === 'light' ? '#FFFFFF' : '#0D1412',
    accentFill: withAlpha(chosen, theme === 'light' ? 0.45 : 0.5),
    accentTint: withAlpha(chosen, theme === 'light' ? 0.13 : 0.18),
  };
}

/**
 * Sizes, read off the mockups. The mockups are 390 points wide; these numbers
 * are density-independent units. Widths stretch on other phones, these do not.
 */
export const metrics = {
  screen: { width: 390, height: 844 },

  /** Every control at least this tall (design principles). */
  minTapTarget: 44,

  /** Header block above the calendar: padding 20/16/0, gap 14. */
  header: {
    paddingTop: 20,
    paddingHorizontal: 16,
    gap: 14,
    /** The title and the overline sit 4 in from the screen padding. */
    inset: 4,
    titleGap: 2,
  },

  /** 44 round, 1px control border, 20px glyph. */
  roundIconButton: { size: 44, radius: 22, borderWidth: 1, glyph: 20 },

  calendar: {
    cardRadius: 20,
    cardPaddingTop: 12,
    cardPaddingRight: 10,
    cardPaddingBottom: 4,
    cardPaddingLeft: 6,
    cardGap: 6,
    /** The wk / am / pm / eve gutter. */
    gutterWidth: 26,
    gutterGap: 4,
    gutterFontSize: 11,
    gutterLineHeight: 18,
    gutterPaddingTop: 3,
    weekNumberHeight: 26,
    /** Gap between day columns. */
    columnGap: 3,
    dayPaddingVertical: 3,
    dayPaddingHorizontal: 2,
    dayRadius: 10,
    dayGap: 4,
    /** The today column's outline. */
    todayBorderWidth: 1.5,
    dateCircle: 26,
    dateRadius: 13,
    slotHeight: 18,
    /** Gap between two bars sharing one slot. */
    barGap: 2,
    barRadius: 6,
    barBorderWidth: 1.5,
    /** Past days. */
    pastOpacity: 0.5,
    handleHeight: 40,
    handleGap: 6,
    handleGlyph: 16,
  },

  /** The 2 unit gap then 2 unit ink ring that marks the selected thing. */
  selection: { gap: 2, ring: 2 },

  timeline: {
    paddingTop: 14,
    paddingHorizontal: 16,
    /** Room for the bottom bar and the centre Add button. */
    paddingBottom: 120,
    /** Between day groups. */
    groupGap: 18,
    /** Between a day heading and its rows, and between stacked cards. */
    rowGap: 8,
    /** The "Afternoon" / "17:00" column. */
    timeColumnWidth: 74,
    timeColumnPaddingTop: 14,
    timeColumnInset: 4,
    columnGap: 10,
    headingGap: 10,
    headingInset: 4,
    hairlineHeight: 1,
    /** "Rest day" is indented past the time column. */
    restDayPaddingLeft: 88,
    restDayPaddingVertical: 2,
  },

  card: {
    radius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    gap: 10,
    titleGap: 1,
    glyph: 16,
  },

  advice: { radius: 12, paddingVertical: 10, paddingHorizontal: 12 },

  button: {
    /** Both primary and secondary are 44 in the mockups, not 48. */
    height: 44,
    radius: 12,
    borderWidth: 1,
    gap: 8,
  },

  sheet: {
    radius: 24,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 16,
    inset: 4,
    titleGap: 2,
    handleWidth: 40,
    handleHeight: 4,
    handleRadius: 2,
    sectionGap: 8,
  },

  /** The rated day buttons in the move sheet. */
  ratedDay: { height: 62, radius: 12, borderWidth: 2, gap: 4, innerGap: 1 },

  bottomBar: {
    height: 68,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    itemHeight: 56,
    itemGap: 3,
    glyph: 22,
    addSize: 52,
    addRadius: 26,
    addGlyph: 24,
  },

  /** Library screens (Exercises, Body, Learn, History, Settings, details). */
  library: {
    /** The scroll region: 20 top, 16 sides, 24 bottom. */
    scrollPaddingTop: 20,
    scrollPaddingHorizontal: 16,
    scrollPaddingBottom: 24,
    /** Gap between sections; per-screen 18-22, 20 is the default. */
    sectionGap: 20,
    /** Heading to card. */
    headingGap: 8,
    /** Surface cards on these screens are radius 20, no border. */
    cardRadius: 20,
    cardPadding: 16,
    /** List cards: tight vertical padding, rows do the spacing. */
    listPaddingVertical: 4,
    listPaddingHorizontal: 16,
    listPaddingHorizontalTight: 14,
    /** Common row heights. */
    rowSmall: 44,
    row: 48,
    rowTall: 52,
    rowSession: 56,
    rowPick: 60,
    rowRated: 64,
    /** The Exercises tree rail. */
    treeRailInset: 7,
    treeRailPadding: 16,
    treeRailWidth: 1.5,
    /** The date gutter in lists (Body recent, Learn change log). */
    dateGutter: 44,
  },

  /** Full-screen flow chrome (check-ins, guides, unwell, setup). */
  flow: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 20,
    sectionGap: 8,
    /** Progress segments (guide moves, setup steps). */
    segmentHeight: 5,
    segmentRadius: 3,
    segmentGap: 4,
    /** Guide transport. */
    transportSize: 56,
    transportBig: 76,
    transportGap: 20,
    transportGlyph: 22,
    transportBigGlyph: 28,
    /** The one oversized button: "Done with this set". */
    bigButtonHeight: 64,
    bigButtonRadius: 16,
    /** Effort 1-10 cells. */
    effortCellHeight: 52,
    /** The illustration placeholder panel. */
    illustrationRadius: 20,
  },

  /** Choice controls: segmented cells, pills, stacked rows. */
  choice: {
    height: 44,
    heightTall: 48,
    radius: 12,
    radiusDense: 10,
    gap: 6,
    selectedBorder: 2,
    border: 1,
    pillRadius: 22,
    pillPaddingHorizontal: 16,
    rowPaddingHorizontal: 14,
  },

  /** The custom switch (never the platform one). */
  switch: {
    tapWidth: 52,
    tapHeight: 44,
    trackWidth: 52,
    trackHeight: 30,
    trackRadius: 15,
    trackPadding: 3,
    knob: 24,
  },

  /** The 48-round +/- stepper on Exercise details. */
  stepper: { size: 48, radius: 24, glyph: 22 },

  /** Recovery meters and the training-load gauge on Body. */
  meter: {
    trackHeight: 6,
    trackRadius: 3,
    gaugeHeight: 14,
    dotSize: 14,
    dotBorder: 2,
    /** The "usual" band: 35%-65% of the track. */
    bandStart: 0.35,
    bandWidth: 0.3,
  },

  /** Rating chips ("Good" on a list row). */
  ratingChip: { radius: 8, paddingVertical: 4, paddingHorizontal: 8 },

  /** Shape markers encoding fixed / flexible / logged. */
  marker: { size: 12, sizeLarge: 14, radius: 4, border: 1.5 },

  /** Diagonal hatch, drawn with SVG because React Native has no such fill. */
  hatch: {
    angle: 135,
    /** Calendar bars: 2 units of line in every 5. */
    bar: { line: 2, period: 5 },
    /** Timeline cards: 2 units of stripe in every 8. */
    cardStripe: { line: 2, period: 8 },
  },
} as const;

/**
 * Font family names as bundled. On Android `fontWeight` does not select a
 * custom font's weight, so every weight is its own family.
 */
export const fontFamily = {
  regular: 'SchibstedGrotesk_400Regular',
  medium: 'SchibstedGrotesk_500Medium',
  semiBold: 'SchibstedGrotesk_600SemiBold',
  bold: 'SchibstedGrotesk_700Bold',
} as const;

/** Named text roles, each exactly as the mockups set them. */
export const text = {
  /** "TODAY" above a screen title. */
  overline: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    letterSpacing: 0.52,
    textTransform: 'uppercase',
  },
  /** "Tuesday 6 October". */
  screenTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.26,
  },
  /** "Run · 6 km" at the top of a sheet. */
  sheetTitle: { fontFamily: fontFamily.bold, fontSize: 22, lineHeight: 28 },
  /** "Today", "Tomorrow · Wed 7". */
  sectionHeading: { fontFamily: fontFamily.bold, fontSize: 15 },
  /** A timeline card's name. */
  cardTitle: { fontFamily: fontFamily.bold, fontSize: 16, lineHeight: 22 },
  /** A timeline card's second line. */
  cardSubtitle: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 18 },
  /** Advice boxes and explanations. */
  advice: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  /** Primary button labels. */
  buttonPrimary: { fontFamily: fontFamily.bold, fontSize: 15 },
  /** Secondary button labels. */
  buttonSecondary: { fontFamily: fontFamily.semiBold, fontSize: 15 },
  /** "Afternoon", "Which day", "Look further ahead". */
  label: { fontFamily: fontFamily.semiBold, fontSize: 13 },
  /** "Rest day", "Now: today, afternoon · 40 min". */
  secondary: { fontFamily: fontFamily.regular, fontSize: 13 },
  /** Mon / Tue / Wed above the calendar, and bottom bar labels. */
  smallLabel: { fontFamily: fontFamily.medium, fontSize: 12 },
  /** The selected bottom bar label. */
  smallLabelSelected: { fontFamily: fontFamily.bold, fontSize: 12 },
  /** Week numbers. */
  weekNumber: { fontFamily: fontFamily.semiBold, fontSize: 12, lineHeight: 26 },
  /** am / pm / eve. */
  gutter: { fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 18 },
  /** "wk", above the week numbers. Same size, tighter line. */
  gutterHeading: { fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 16 },
  /** The date inside a calendar day. */
  dateNumber: { fontFamily: fontFamily.semiBold, fontSize: 15 },
  /** The date inside a rated day button in the move sheet. */
  ratedDayNumber: { fontFamily: fontFamily.bold, fontSize: 17, lineHeight: 22 },
  /** "Good" / "OK" / "Avoid" under a rated day. */
  ratingWord: { fontFamily: fontFamily.bold, fontSize: 11 },
  /** The guide's countdown. Tabular so it does not jiggle. */
  countdown: {
    fontFamily: fontFamily.bold,
    fontSize: 72,
    lineHeight: 76,
    fontVariant: ['tabular-nums'],
  },
  /** The guide's move name. */
  guideMoveName: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 34 },
  /** Titles behind a back button: 24, no letter-spacing. */
  backTitle: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 28 },
  /** The big stepper value ("2 times") and similar. */
  bigValue: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 32 },
  /** Stat values ("3 h 34") and big verdicts. */
  statValue: { fontFamily: fontFamily.bold, fontSize: 22, lineHeight: 26 },
  /** The counted guide's dose ("10 each side"). */
  doseValue: { fontFamily: fontFamily.bold, fontSize: 56, lineHeight: 62 },
  /** List row titles ("Easy run · 6 km"). */
  listTitle: { fontFamily: fontFamily.semiBold, fontSize: 15 },
  /** List row values, right-aligned muted. */
  listValue: { fontFamily: fontFamily.regular, fontSize: 15 },
  /** Group headers in the Exercises tree. */
  groupTitle: { fontFamily: fontFamily.bold, fontSize: 16 },
  groupTitleQuiet: { fontFamily: fontFamily.semiBold, fontSize: 16 },
  /** Entry row titles on the Add sheet and setup cards. */
  entryTitle: { fontFamily: fontFamily.bold, fontSize: 16 },
  /** Unselected choices: 14 medium. */
  choice: { fontFamily: fontFamily.medium, fontSize: 14 },
  /** Selected choices: 14 bold. */
  choiceSelected: { fontFamily: fontFamily.bold, fontSize: 14 },
  /** Action chips and secondary action buttons: 14 semibold. */
  actionLabel: { fontFamily: fontFamily.semiBold, fontSize: 14 },
  /** Stacked list choices: 15. */
  choiceRow: { fontFamily: fontFamily.medium, fontSize: 15 },
  choiceRowSelected: { fontFamily: fontFamily.bold, fontSize: 15 },
  /** Dense 5-across choices (How much to train): 12. */
  choiceDense: { fontFamily: fontFamily.medium, fontSize: 12 },
  choiceDenseSelected: { fontFamily: fontFamily.bold, fontSize: 12 },
  /** Tiny eyebrow labels ("Up next", "Sets"). */
  tinyLabel: { fontFamily: fontFamily.semiBold, fontSize: 12 },
  /** The effort grid cells. */
  effortCell: { fontFamily: fontFamily.medium, fontSize: 17 },
  effortCellSelected: { fontFamily: fontFamily.bold, fontSize: 17 },
  /** The rating word inside a chip on list rows. */
  ratingChip: { fontFamily: fontFamily.bold, fontSize: 12 },
  /** Guide cue line under the move name. */
  guideCue: { fontFamily: fontFamily.regular, fontSize: 15 },
  /** Stepper panel values in the routine designer. */
  stepperValue: { fontFamily: fontFamily.bold, fontSize: 17 },
} satisfies Record<string, TextStyle>;
