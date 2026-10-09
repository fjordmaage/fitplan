/**
 * Session load and its spread across body regions.
 * Load = minutes x effort (session-RPE; docs/engine-sources.md, item 1).
 */

import { bigJump, usualBands, usualWindowDays, recentWindowDays } from './params';
import { addDays, daysBetween } from './time';
import type { BodyRegion, CompletedSession, DayString, Exercise, LoadProfile } from './types';

export function sessionLoad(durationMinutes: number, effort: number): number {
  if (!Number.isFinite(durationMinutes) || durationMinutes < 0) {
    throw new RangeError('durationMinutes must be a finite number >= 0');
  }
  if (!Number.isFinite(effort) || effort < 1 || effort > 10) {
    throw new RangeError('effort must be between 1 and 10');
  }
  return durationMinutes * effort;
}

/** A load spread across regions by the activity's profile. */
export function regionLoads(
  load: number,
  profile: LoadProfile,
): Partial<Record<BodyRegion, number>> {
  const out: Partial<Record<BodyRegion, number>> = {};
  for (const [region, share] of Object.entries(profile) as [BodyRegion, number][]) {
    if (share > 0) out[region] = load * share;
  }
  return out;
}

/** Shares must sum to 1 (within rounding); enforced where exercises enter the engine. */
export function validateProfile(profile: LoadProfile): void {
  const sum = Object.values(profile).reduce((a, b) => a + (b ?? 0), 0);
  if (Math.abs(sum - 1) > 0.001) {
    throw new RangeError(`load profile shares sum to ${sum}, not 1`);
  }
}

export function sessionLoadOf(session: CompletedSession): number {
  return sessionLoad(session.minutes, session.effort);
}

/** Planned load of an exercise, from its typical duration and effort. */
export function plannedLoad(exercise: Exercise): number {
  return sessionLoad(exercise.typicalMinutes, exercise.typicalEffort);
}

/** Sum of completed load per day within [from, to]. */
export function dailyLoads(
  history: readonly CompletedSession[],
  from: DayString,
  to: DayString,
): Map<DayString, number> {
  const days = new Map<DayString, number>();
  for (const s of history) {
    if (daysBetween(from, s.day) >= 0 && daysBetween(s.day, to) >= 0) {
      days.set(s.day, (days.get(s.day) ?? 0) + sessionLoadOf(s));
    }
  }
  return days;
}

/** Mean daily load over the usual window ending the day before `today`. */
export function usualDailyLoad(history: readonly CompletedSession[], today: DayString): number {
  const from = addDays(today, -usualWindowDays);
  const to = addDays(today, -1);
  let total = 0;
  for (const load of dailyLoads(history, from, to).values()) total += load;
  return total / usualWindowDays;
}

/** The last 7 days against the user's usual: a description, never a warning. */
export function loadVersusUsual(
  history: readonly CompletedSession[],
  today: DayString,
): 'less' | 'about' | 'more' | 'unknown' {
  const usual = usualDailyLoad(history, today);
  if (usual <= 0) return 'unknown';
  const from = addDays(today, -recentWindowDays);
  const to = addDays(today, -1);
  let recent = 0;
  for (const load of dailyLoads(history, from, to).values()) recent += load;
  const ratio = recent / recentWindowDays / usual;
  if (ratio < usualBands.lessBelow) return 'less';
  if (ratio > usualBands.moreAbove) return 'more';
  return 'about';
}

/** Largest single-session load of the same exercise in the recent window. */
export function recentMaxLoad(
  history: readonly CompletedSession[],
  exerciseId: string,
  today: DayString,
): number {
  const from = addDays(today, -bigJump.windowDays);
  let max = 0;
  for (const s of history) {
    if (
      s.exerciseId === exerciseId &&
      daysBetween(from, s.day) >= 0 &&
      daysBetween(s.day, today) > 0
    ) {
      max = Math.max(max, sessionLoadOf(s));
    }
  }
  return max;
}

/** The evidenced risk is one session far beyond anything recent (sources, item 3). */
export function isBigJump(
  history: readonly CompletedSession[],
  exercise: Exercise,
  today: DayString,
): { jump: boolean; recentMax: number } {
  const recentMax = recentMaxLoad(history, exercise.id, today);
  if (recentMax <= 0) return { jump: false, recentMax };
  return { jump: plannedLoad(exercise) > bigJump.ofRecentMax * recentMax, recentMax };
}

/** Median completed session load, for the "hard session" line. */
export function medianSessionLoad(history: readonly CompletedSession[]): number {
  return median(history.map(sessionLoadOf));
}

/** Median completed session length, for the "shorter sessions" mode. */
export function medianSessionMinutes(history: readonly CompletedSession[]): number {
  return median(history.map((s) => s.minutes));
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const low = sorted[mid - 1];
  const high = sorted[mid];
  return sorted.length % 2 === 1 ? (high ?? 0) : ((low ?? 0) + (high ?? 0)) / 2;
}
