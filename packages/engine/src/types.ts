/**
 * The engine's shared vocabulary. Matches docs/01-product-spec.md's table;
 * the names here are the code-side words.
 *
 * The engine never reads a clock: "now" is always an input. Times are ISO
 * strings (`2026-10-07` for days, minutes-from-midnight for exact times) so
 * the engine stays independent of timezones and Date quirks; the app converts
 * at the edge.
 */

export const BODY_REGIONS = [
  'legs',
  'backAndCore',
  'armsAndShoulders',
  'fingersAndForearms',
  'general',
] as const;
export type BodyRegion = (typeof BODY_REGIONS)[number];

export const SLOTS = ['morning', 'afternoon', 'evening'] as const;
export type Slot = (typeof SLOTS)[number];

export type RatingLevel = 'good' | 'ok' | 'avoid';

/** A calendar day as `YYYY-MM-DD`. Always built through time.ts, never Date. */
export type DayString = string;

/** How an activity type spreads its load across regions. Shares sum to 1. */
export type LoadProfile = Partial<Record<BodyRegion, number>>;

export interface Profile {
  /** Recover / Lighter / Steady / Build / Push. */
  trainingAmount: 'recover' | 'lighter' | 'steady' | 'build' | 'push';
}

/** Something the user does, fixed or flexible. */
export interface Exercise {
  id: string;
  name: string;
  loadProfile: LoadProfile;
  /** Minutes a session usually takes. */
  typicalMinutes: number;
  /** Usual effort 1-10. */
  typicalEffort: number;
  /** Times per 7 days the user wants it. Undefined = app decides (stage 6). */
  frequencyPerWeek?: number;
  preferredSlot?: Slot;
  /** Do right after this other exercise, in the same slot. */
  pairAfterExerciseId?: string;
}

/** A session at a set time the app never moves. */
export interface Anchor {
  id: string;
  exerciseId: string;
  day: DayString;
  slot: Slot;
  /** Minutes from midnight. Anchors always have an exact time. */
  startMinutes: number;
  durationMinutes: number;
  cancelled?: boolean;
}

/** Time the user is unavailable. */
export interface Block {
  id: string;
  day: DayString;
  slots: readonly Slot[];
}

/** A completed or logged session. */
export interface CompletedSession {
  exerciseId: string;
  day: DayString;
  /** Real duration and effort; load = minutes x effort. */
  minutes: number;
  effort: number;
}

export type Soreness = 'fresh' | 'bitSore' | 'sore';

/** A before-workout check-in. Regions not asked about are omitted. */
export interface CheckIn {
  day: DayString;
  /** Minutes from midnight when the check-in happened. */
  atMinutes: number;
  soreness: Partial<Record<BodyRegion, Soreness>>;
}

/** Per-user learned corrections, stored by the app, passed in as input. */
export interface LearnedParams {
  /** Multiplier on each region's default half-life. 1 = default. */
  halfLifeFactor?: Partial<Record<BodyRegion, number>>;
}

export interface PlannedItem {
  exerciseId: string;
  day: DayString;
  slot: Slot;
  /** Order within the slot; a paired exercise follows its partner. */
  order: number;
  /** Beyond the firm horizon: shown dashed, "day may change". */
  tentative: boolean;
  /** The user pinned it; the engine plans around it like an anchor. */
  locked?: boolean;
}

export interface Plan {
  items: readonly PlannedItem[];
}

/** A point in time: day plus minutes from midnight. */
export interface Instant {
  day: DayString;
  minutes: number;
}

export interface EngineInputs {
  now: Instant;
  profile: Profile;
  exercises: readonly Exercise[];
  anchors: readonly Anchor[];
  blocks: readonly Block[];
  history: readonly CompletedSession[];
  checkIns: readonly CheckIn[];
  learned?: LearnedParams;
  /** Items the user locked in place (ids match plan items by exercise+day+slot). */
  frozenWindowOn?: boolean;
}

/** Reason codes. The UI turns the top one into a sentence; never free text. */
export type Reason =
  | { code: 'BUSY'; slot: Slot }
  | { code: 'REGION_NOT_READY'; region: BodyRegion; readyOn: DayString }
  | { code: 'REGION_BORDERLINE'; region: BodyRegion }
  | { code: 'ALREADY_THAT_DAY'; exerciseId: string }
  | { code: 'BACK_TO_BACK'; exerciseId: string }
  | { code: 'SAME_DAY_HARD'; otherExerciseId: string }
  | { code: 'DAY_FULL'; load: number }
  | { code: 'ABOVE_USUAL' }
  | { code: 'BIG_JUMP'; recentMaxLoad: number }
  | { code: 'PAST_DAY' }
  | { code: 'GOOD_SPACING' }
  | { code: 'REGIONS_READY' }
  | { code: 'PREFERRED_TIME' }
  | { code: 'FITS_FREQUENCY' }
  | { code: 'PAIRED_AFTER'; exerciseId: string };

export interface Rating {
  level: RatingLevel;
  /** Ordered by fixed precedence (rate.ts); the first is "the" reason. */
  reasons: readonly Reason[];
}

/** Why a plan change happened. */
export type ChangeReason =
  | { code: 'USER_MOVED' }
  | { code: 'USER_SWAPPED' }
  | { code: 'ANCHOR_CANCELLED'; anchorId: string }
  | { code: 'BLOCK_ADDED'; blockId: string }
  | { code: 'REGION_NOT_READY'; region: BodyRegion }
  | { code: 'FREQUENCY'; exerciseId: string }
  | { code: 'PAIRED_WITH'; exerciseId: string }
  | { code: 'BETTER_SPACING' }
  | { code: 'NEW_EXERCISE' }
  | { code: 'HORIZON_ROLLED' };

export interface PlanChange {
  exerciseId: string;
  kind: 'moved' | 'added' | 'removed';
  from?: { day: DayString; slot: Slot };
  to?: { day: DayString; slot: Slot };
  reasons: readonly ChangeReason[];
}

export interface PlanResult {
  plan: Plan;
  changes: readonly PlanChange[];
}
