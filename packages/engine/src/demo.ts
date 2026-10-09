/**
 * KL's real week as demo inputs.
 *
 * Stage 1 only: the app shows this until storage exists (stage 2), so the
 * plan on the phone is the engine's real output over known data. The test
 * suite uses the same fixtures, so what KL sees is what the tests check.
 */

import { addDays } from './time';
import type { Anchor, CompletedSession, EngineInputs, Exercise, Instant } from './types';

export const demoExercises: readonly Exercise[] = [
  {
    id: 'climb',
    name: 'Climbing gym',
    loadProfile: {
      fingersAndForearms: 0.35,
      armsAndShoulders: 0.25,
      backAndCore: 0.2,
      general: 0.2,
    },
    typicalMinutes: 120,
    typicalEffort: 6,
  },
  {
    id: 'run',
    name: 'Run · 6 km',
    loadProfile: { legs: 0.7, general: 0.3 },
    typicalMinutes: 40,
    typicalEffort: 5,
    frequencyPerWeek: 2,
    preferredSlot: 'afternoon',
  },
  {
    id: 'back',
    name: 'Back routine',
    loadProfile: { backAndCore: 0.8, general: 0.2 },
    typicalMinutes: 15,
    typicalEffort: 3,
    frequencyPerWeek: 2,
    pairAfterExerciseId: 'run',
  },
];

/** Climbing Mon and Wed 17:00, from the Monday of the week holding `today`. */
export function demoAnchors(monday: string): Anchor[] {
  const anchor = (id: string, day: string): Anchor => ({
    id,
    exerciseId: 'climb',
    day,
    slot: 'evening',
    startMinutes: 17 * 60,
    durationMinutes: 120,
  });
  return [
    anchor('a1', monday),
    anchor('a2', addDays(monday, 2)),
    anchor('a3', addDays(monday, 7)),
    anchor('a4', addDays(monday, 9)),
  ];
}

/** Four weeks of the same routine before `monday`, so statistics exist. */
export function demoHistory(monday: string): CompletedSession[] {
  const sessions: CompletedSession[] = [];
  for (let week = 4; week >= 1; week -= 1) {
    const start = addDays(monday, -7 * week);
    sessions.push({ exerciseId: 'climb', day: start, minutes: 120, effort: 6 });
    sessions.push({ exerciseId: 'run', day: addDays(start, 1), minutes: 40, effort: 5 });
    sessions.push({ exerciseId: 'back', day: addDays(start, 1), minutes: 15, effort: 3 });
    sessions.push({ exerciseId: 'climb', day: addDays(start, 2), minutes: 120, effort: 6 });
    sessions.push({ exerciseId: 'run', day: addDays(start, 4), minutes: 40, effort: 5 });
    sessions.push({ exerciseId: 'back', day: addDays(start, 4), minutes: 15, effort: 3 });
  }
  return sessions;
}

export function demoInputs(now: Instant, monday: string): EngineInputs {
  return {
    now,
    profile: { trainingAmount: 'steady' },
    exercises: demoExercises,
    anchors: demoAnchors(monday),
    blocks: [],
    history: demoHistory(monday),
    checkIns: [],
  };
}
