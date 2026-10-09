/**
 * The engine's suggestion outputs: swap alternatives, learned durations, and
 * a frequency suggestion for "let the app decide how often".
 */

import { addDays, daysBetween } from './time';
import {
  BODY_REGIONS,
  type CompletedSession,
  type DayString,
  type Exercise,
  type LoadProfile,
} from './types';

/**
 * How alike two load profiles are: cosine similarity over the region shares.
 * 1 = identical shape, 0 = nothing in common.
 */
export function profileSimilarity(a: LoadProfile, b: LoadProfile): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const region of BODY_REGIONS) {
    const x = a[region] ?? 0;
    const y = b[region] ?? 0;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / Math.sqrt(normA * normB);
}

export interface SwapCandidate {
  exercise: Exercise;
  /** 0-1: how close a stand-in this is for the original. */
  similarity: number;
}

/**
 * Alternatives for a swap: other exercises ordered by how similar their load
 * profile is, with a deterministic tie-break. The caller rates each candidate
 * for the day and slot with `rate` and renders the result.
 */
export function swapAlternatives(
  original: Exercise,
  pool: readonly Exercise[],
  limit = 4,
): SwapCandidate[] {
  return pool
    .filter((e) => e.id !== original.id && !e.pairAfterExerciseId)
    .map((exercise) => ({
      exercise,
      similarity: profileSimilarity(original.loadProfile, exercise.loadProfile),
    }))
    .sort((a, b) => b.similarity - a.similarity || a.exercise.id.localeCompare(b.exercise.id))
    .slice(0, limit);
}

/**
 * Estimated duration: the median of the last up-to-5 completions of this
 * exercise, falling back to its default. Medians resist one odd session.
 */
export function estimatedMinutes(exercise: Exercise, history: readonly CompletedSession[]): number {
  const recent = history
    .filter((s) => s.exerciseId === exercise.id)
    .sort((a, b) => b.day.localeCompare(a.day))
    .slice(0, 5)
    .map((s) => s.minutes)
    .sort((a, b) => a - b);
  if (recent.length === 0) return exercise.typicalMinutes;
  const mid = Math.floor(recent.length / 2);
  return recent.length % 2 === 1 ? recent[mid]! : Math.round((recent[mid - 1]! + recent[mid]!) / 2);
}

export interface FrequencySuggestion {
  perWeek: number;
  /** Why: code only; the app turns it into a sentence. */
  basis: 'GUIDELINE_AEROBIC' | 'GUIDELINE_STRENGTH' | 'CURRENT_HABIT';
}

/**
 * A starting frequency for "let the app decide".
 *
 * Grounded in the WHO 2020 activity guidelines (docs/engine-sources.md,
 * item 10): 150-300 minutes of moderate aerobic work a week, and
 * muscle-strengthening work at least twice a week. The suggestion fills the
 * gap between what the user already does and the guideline, bounded to a
 * sensible 1-4 per week.
 */
export function suggestFrequency(
  exercise: Exercise,
  allExercises: readonly Exercise[],
  history: readonly CompletedSession[],
  today: DayString,
): FrequencySuggestion {
  const isStrength =
    (exercise.loadProfile.general ?? 0) < 0.5 &&
    (exercise.typicalEffort >= 6 ||
      (exercise.loadProfile.backAndCore ?? 0) + (exercise.loadProfile.armsAndShoulders ?? 0) >=
        0.4);
  const aerobicMinutesPerWeek = weeklyMinutes(history, allExercises, today, 'aerobic');

  if (isStrength) {
    const strengthSessions = weeklySessions(history, allExercises, today, 'strength');
    return { perWeek: strengthSessions >= 2 ? 1 : 2, basis: 'GUIDELINE_STRENGTH' };
  }

  const gapMinutes = Math.max(0, 150 - aerobicMinutesPerWeek);
  const perWeek = Math.min(
    4,
    Math.max(1, Math.round(gapMinutes / Math.max(20, exercise.typicalMinutes))),
  );
  return {
    perWeek,
    basis: gapMinutes > 0 ? 'GUIDELINE_AEROBIC' : 'CURRENT_HABIT',
  };
}

function isAerobicProfile(profile: LoadProfile): boolean {
  return (profile.legs ?? 0) + (profile.general ?? 0) >= 0.6;
}

function weeklyMinutes(
  history: readonly CompletedSession[],
  exercises: readonly Exercise[],
  today: DayString,
  kind: 'aerobic' | 'strength',
): number {
  const from = addDays(today, -28);
  const byId = new Map(exercises.map((e) => [e.id, e]));
  let minutes = 0;
  for (const s of history) {
    if (daysBetween(from, s.day) < 0 || daysBetween(s.day, today) <= 0) continue;
    const e = byId.get(s.exerciseId);
    if (!e) continue;
    const aerobic = isAerobicProfile(e.loadProfile);
    if ((kind === 'aerobic') === aerobic) minutes += s.minutes;
  }
  return minutes / 4;
}

function weeklySessions(
  history: readonly CompletedSession[],
  exercises: readonly Exercise[],
  today: DayString,
  kind: 'aerobic' | 'strength',
): number {
  const from = addDays(today, -28);
  const byId = new Map(exercises.map((e) => [e.id, e]));
  let count = 0;
  for (const s of history) {
    if (daysBetween(from, s.day) < 0 || daysBetween(s.day, today) <= 0) continue;
    const e = byId.get(s.exerciseId);
    if (!e) continue;
    const aerobic = isAerobicProfile(e.loadProfile);
    if ((kind === 'aerobic') === aerobic) count += 1;
  }
  return count / 4;
}
