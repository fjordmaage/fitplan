/**
 * @fitplan/engine
 *
 * The planning engine: pure TypeScript. No UI, no storage, no platform
 * imports, no randomness and no clock of its own — "now" is always passed in.
 * Same input, same output, always.
 *
 * Stage 0 only establishes the package, its tests and its boundaries.
 * The real model (load, per-region recovery, rating, scheduling) is stage 1;
 * see docs/02-engine-spec.md.
 */

export const ENGINE_VERSION = '0.0.0';

/**
 * A fixed, shared vocabulary for the body regions the recovery model tracks.
 * Declared here in stage 0 so the app and the engine cannot drift apart later.
 * See docs/02-engine-spec.md, "Load and recovery model".
 */
export const BODY_REGIONS = [
  'legs',
  'backAndCore',
  'armsAndShoulders',
  'fingersAndForearms',
  'general',
] as const;

export type BodyRegion = (typeof BODY_REGIONS)[number];

/** Coarse time of day. Fixed sessions also carry an exact time. */
export const SLOTS = ['morning', 'afternoon', 'evening'] as const;
export type Slot = (typeof SLOTS)[number];

/** How well an option fits. Always rendered with its word, never colour alone. */
export type RatingLevel = 'good' | 'ok' | 'avoid';

/**
 * Session load = duration in minutes x effort (1-10).
 * The one formula stage 0 commits to, so there is something real to test.
 * See docs/02-engine-spec.md, "Load and recovery model", point 1.
 */
export function sessionLoad(durationMinutes: number, effort: number): number {
  if (!Number.isFinite(durationMinutes) || durationMinutes < 0) {
    throw new RangeError('durationMinutes must be a finite number >= 0');
  }
  if (!Number.isFinite(effort) || effort < 1 || effort > 10) {
    throw new RangeError('effort must be between 1 and 10');
  }
  return durationMinutes * effort;
}
