/**
 * Observations: plain trends over history, each from a fixed rule with a
 * minimum amount of data. Codes only; the app renders sentences.
 */

import type { BodyRegion, CompletedSession, Exercise, LearnedParams } from './types';

export type Observation =
  | { code: 'GETTING_EASIER'; exerciseId: string; earlierEffort: number; recentEffort: number }
  | { code: 'GETTING_HARDER'; exerciseId: string; earlierEffort: number; recentEffort: number }
  | { code: 'SLOW_RECOVERY_REGION'; region: BodyRegion }
  | { code: 'FAST_RECOVERY_REGION'; region: BodyRegion };

/** Minimum completions of one exercise before an effort trend may be claimed. */
export const minSessionsForTrend = 6;

/** Effort must shift by at least this much to count as a trend. */
export const minEffortShift = 1;

export function observations(
  exercises: readonly Exercise[],
  history: readonly CompletedSession[],
  learned?: LearnedParams,
): Observation[] {
  const out: Observation[] = [];

  for (const exercise of [...exercises].sort((a, b) => a.id.localeCompare(b.id))) {
    const sessions = history
      .filter((s) => s.exerciseId === exercise.id)
      .sort((a, b) => a.day.localeCompare(b.day));
    if (sessions.length < minSessionsForTrend) continue;

    // Same dose: compare efforts only across sessions of similar length.
    const half = Math.floor(sessions.length / 2);
    const earlier = sessions.slice(0, half);
    const recent = sessions.slice(half);
    const meanMinutes = (list: readonly CompletedSession[]) =>
      list.reduce((a, s) => a + s.minutes, 0) / list.length;
    if (Math.abs(meanMinutes(earlier) - meanMinutes(recent)) > 0.2 * meanMinutes(earlier)) {
      continue; // the dose changed; an effort comparison would mislead.
    }
    const meanEffort = (list: readonly CompletedSession[]) =>
      list.reduce((a, s) => a + s.effort, 0) / list.length;
    const before = meanEffort(earlier);
    const after = meanEffort(recent);
    if (before - after >= minEffortShift) {
      out.push({
        code: 'GETTING_EASIER',
        exerciseId: exercise.id,
        earlierEffort: Math.round(before * 10) / 10,
        recentEffort: Math.round(after * 10) / 10,
      });
    } else if (after - before >= minEffortShift) {
      out.push({
        code: 'GETTING_HARDER',
        exerciseId: exercise.id,
        earlierEffort: Math.round(before * 10) / 10,
        recentEffort: Math.round(after * 10) / 10,
      });
    }
  }

  // A region whose learned half-life has drifted far from the default is
  // recovering unusually for this user.
  for (const [region, factor] of Object.entries(learned?.halfLifeFactor ?? {}) as [
    BodyRegion,
    number,
  ][]) {
    if (factor >= 1.3) out.push({ code: 'SLOW_RECOVERY_REGION', region });
    else if (factor <= 0.7) out.push({ code: 'FAST_RECOVERY_REGION', region });
  }

  return out;
}
