/**
 * Every tunable number in the engine, in one place.
 *
 * Each value's basis is recorded in docs/engine-sources.md ("What this means
 * for the model"). Values marked estimate are starting points the user's own
 * check-ins are expected to correct; nothing here is a measurement.
 */

import type { BodyRegion } from './types';

/** Hours for half of a region's fatigue to decay. Estimates; see sources 4-5. */
export const defaultHalfLifeHours: Record<BodyRegion, number> = {
  legs: 16,
  backAndCore: 16,
  armsAndShoulders: 16,
  fingersAndForearms: 30,
  general: 20,
};

/**
 * Readiness thresholds on the 0-1 readiness scale.
 * Above `ready` a region is reported Ready and rates Good; between `borderline`
 * and `ready` it strains a soft rule (OK); below `borderline` it breaks a hard
 * rule (Avoid) for activities that load the region heavily.
 */
export const readiness = {
  ready: 0.8,
  borderline: 0.6,
} as const;

/**
 * A region counts as heavily loaded by an activity when its share of the
 * activity's load profile is at or above this.
 */
export const heavyRegionShare = 0.3;

/**
 * Fatigue is measured relative to the load that would push a region from fully
 * ready to borderline in one session. Expressed as a multiple of the user's
 * typical daily load so it scales with the person (see recovery.ts).
 */
export const fatigueScale = {
  /** A single typical day's full load, landing on one region, takes readiness down by this much. */
  typicalDayImpact: 0.35,
  /** Floor for the typical daily load while history is thin, in load units (minutes x effort). */
  minTypicalDailyLoad: 120,
} as const;

/** Session-dose jump guard (sources, item 3). */
export const bigJump = {
  /** A planned dose above this multiple of the recent maximum rates OK with BIG_JUMP. */
  ofRecentMax: 1.3,
  /** Days of history that "recent" covers. */
  windowDays: 30,
} as const;

/** "Your usual": mean daily load over this many days (descriptive only; sources, item 2). */
export const usualWindowDays = 28;

/**
 * The user's goal setting ("improvement factor") as a multiplier on the weekly
 * volume the engine treats as the aim. Steady = exactly the user's usual;
 * recover/lighter aim below it, build/push above it. Deliberately modest:
 * the guard against single big jumps (bigJump) still applies unchanged.
 */
export const trainingAmountFactor = {
  recover: 0.6,
  lighter: 0.8,
  steady: 1.0,
  build: 1.2,
  push: 1.4,
} as const;

/** Effort nudge per goal setting, applied by suggestedEffort (intensity.ts). */
export const trainingAmountEffortDelta = {
  recover: -2,
  lighter: -1,
  steady: 0,
  build: 1,
  push: 1,
} as const;

/** The 7-day window compared against the usual. */
export const recentWindowDays = 7;

/** Bands for "less / about / more than your usual". */
export const usualBands = {
  lessBelow: 0.8,
  moreAbove: 1.2,
} as const;

/** A session is "hard" above this multiple of the user's median session load. */
export const hardSessionFactor = 1.25;

/** Scheduler scoring weights. Start simple; tune against the scenario tests (gap 5). */
export const weights = {
  /** Placing on a day where every heavily loaded region is ready. */
  readiness: 10,
  /** Per unit of shortfall against an exercise's weekly frequency. */
  frequency: 8,
  /** Even spacing between repeats of the same exercise. */
  spacing: 5,
  /** Day's total load kept reasonable. */
  dayLoad: 4,
  /** Hard sessions not back to back (sources, item 6). */
  sequencing: 4,
  /** Preferred time of day. */
  timeOfDay: 2,
  /** Same weekday and slot as recent weeks. */
  pattern: 2,
  /**
   * Cost per difference from the previous plan, scaled by how soon the day is.
   * This is what keeps the plan from being restless (gap 7).
   */
  stability: 6,
} as const;

/** Stability cost multiplier by days from now (sooner = heavier). */
export function stabilityWeight(daysFromNow: number): number {
  if (daysFromNow <= 1) return 3;
  if (daysFromNow <= 3) return 2;
  if (daysFromNow <= 7) return 1;
  return 0.5;
}

/** Check-in correction: how far one check-in may move a half-life (slow learning). */
export const checkInLearning = {
  /** Multiplicative nudge per disagreeing check-in. */
  halfLifeNudge: 0.05,
  /** Half-lives never leave this band around the default. */
  maxFactor: 2.0,
  minFactor: 0.5,
} as const;

/** Planning horizon. */
export const horizon = {
  firmDays: 14,
  tentativeDays: 42,
} as const;
