/**
 * "Not feeling 100%": a temporary mode laid over the plan.
 *
 * The user says what is going on, what should change, for how long, and how
 * to come back. The engine only schedules around it — it never diagnoses, and
 * the app always shows the see-a-doctor line for sharp or lasting pain
 * (hard rule: not medical advice).
 *
 * The comeback pacing follows graduated return-to-activity guidance after
 * illness: roughly half volume in the first stretch back, building up over
 * about as many days as the time off (docs/engine-sources.md, item 9).
 */

import { addDays, daysBetween } from './time';
import type { DayString } from './types';

export type ModeCause = 'ill' | 'achesOrPain' | 'busyPeriod' | 'justTired';
export type ModeChange = 'onlyEasy' | 'shorterSessions' | 'fullBreak' | 'keepFixedDropRest';
export type Comeback = 'slowly' | 'balanced' | 'quickly';

export interface ActiveMode {
  cause: ModeCause;
  change: ModeChange;
  /** First day the mode applies. */
  from: DayString;
  /** Last day the mode applies, or undefined for "until I say". */
  until?: DayString;
  comeback: Comeback;
}

export function modeActiveOn(mode: ActiveMode | undefined, day: DayString): boolean {
  if (!mode) return false;
  if (daysBetween(mode.from, day) < 0) return false;
  if (mode.until && daysBetween(day, mode.until) < 0) return false;
  return true;
}

/**
 * The comeback window after a mode ends: for `slowly` one day per day off
 * (capped), `balanced` half of that, `quickly` a quarter. Within the window
 * the day's load target scales linearly from `startFraction` up to 1.
 */
export function comebackFactor(mode: ActiveMode | undefined, day: DayString): number {
  if (!mode?.until) return 1;
  const daysOff = Math.max(1, daysBetween(mode.from, mode.until) + 1);
  const since = daysBetween(mode.until, day);
  if (since <= 0) return 1; // still inside the mode; comeback starts after.
  const windowByComeback: Record<Comeback, number> = {
    slowly: Math.min(14, daysOff),
    balanced: Math.min(7, Math.ceil(daysOff / 2)),
    quickly: Math.min(4, Math.ceil(daysOff / 4)),
  };
  const window = Math.max(1, windowByComeback[mode.comeback]);
  if (since > window) return 1;
  const startFraction = mode.cause === 'ill' ? 0.5 : 0.7;
  return startFraction + (1 - startFraction) * (since / (window + 1));
}

/** The day after a finished mode ends its comeback window (for display). */
export function comebackEndsOn(mode: ActiveMode): DayString | undefined {
  if (!mode.until) return undefined;
  const daysOff = Math.max(1, daysBetween(mode.from, mode.until) + 1);
  const window =
    mode.comeback === 'slowly'
      ? Math.min(14, daysOff)
      : mode.comeback === 'balanced'
        ? Math.min(7, Math.ceil(daysOff / 2))
        : Math.min(4, Math.ceil(daysOff / 4));
  return addDays(mode.until, Math.max(1, window));
}
