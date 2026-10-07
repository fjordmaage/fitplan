/** Shared test fixtures: KL's real week, from the engine's own demo module. */

import { demoAnchors, demoExercises, demoHistory } from '../src/demo';
import type { Anchor, CompletedSession, EngineInputs, Exercise } from '../src/types';

export const climbing: Exercise = demoExercises[0]!;
export const run: Exercise = demoExercises[1]!;
export const backRoutine: Exercise = demoExercises[2]!;

/** Monday-based: 2026-10-05 is a Monday. */
export const MON = '2026-10-05';
export const TUE = '2026-10-06';
export const WED = '2026-10-07';

export function klAnchors(): Anchor[] {
  return demoAnchors(MON);
}

export function klHistory(): CompletedSession[] {
  return demoHistory(MON);
}

export function klInputs(overrides: Partial<EngineInputs> = {}): EngineInputs {
  return {
    now: { day: TUE, minutes: 9 * 60 },
    profile: { trainingAmount: 'steady' },
    exercises: demoExercises,
    anchors: klAnchors(),
    blocks: [],
    history: klHistory(),
    checkIns: [],
    ...overrides,
  };
}
