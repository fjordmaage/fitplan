import { describe, expect, it } from 'vitest';

import {
  estimatedMinutes,
  profileSimilarity,
  suggestFrequency,
  swapAlternatives,
} from '../src/suggest';
import { activityTypes } from '../src/catalogue';
import { klHistory, klInputs, run, TUE } from './helpers';

describe('profileSimilarity', () => {
  it('is 1 for identical profiles and 0 for disjoint ones', () => {
    expect(profileSimilarity({ legs: 1 }, { legs: 1 })).toBeCloseTo(1);
    expect(profileSimilarity({ legs: 1 }, { fingersAndForearms: 1 })).toBe(0);
  });

  it('is symmetric', () => {
    const a = { legs: 0.7, general: 0.3 };
    const b = { legs: 0.5, backAndCore: 0.3, general: 0.2 };
    expect(profileSimilarity(a, b)).toBeCloseTo(profileSimilarity(b, a));
  });
});

describe('swapAlternatives', () => {
  it('prefers lookalikes and is deterministic', () => {
    const pool = activityTypes.map((t) => ({
      id: t.id,
      name: t.name,
      loadProfile: t.loadProfile,
      typicalMinutes: t.typicalMinutes,
      typicalEffort: t.typicalEffort,
    }));
    const a = swapAlternatives(run, pool);
    const b = swapAlternatives(run, pool);
    expect(a).toEqual(b);
    // A leg-dominant activity should top the list for a run.
    expect(a[0]!.exercise.loadProfile.legs ?? 0).toBeGreaterThanOrEqual(0.5);
    expect(a.length).toBe(4);
  });

  it('never suggests the exercise itself or a paired rider', () => {
    const inputs = klInputs();
    const list = swapAlternatives(run, inputs.exercises);
    expect(list.some((c) => c.exercise.id === 'run')).toBe(false);
    expect(list.some((c) => c.exercise.id === 'back')).toBe(false);
  });
});

describe('estimatedMinutes', () => {
  it('falls back to the default with no history', () => {
    expect(estimatedMinutes(run, [])).toBe(40);
  });

  it('uses the median of recent sessions', () => {
    const history = [
      { exerciseId: 'run', day: '2026-10-01', minutes: 38, effort: 5 },
      { exerciseId: 'run', day: '2026-10-02', minutes: 44, effort: 5 },
      { exerciseId: 'run', day: '2026-10-03', minutes: 41, effort: 5 },
    ];
    expect(estimatedMinutes(run, history)).toBe(41);
  });

  it('resists one odd session', () => {
    const history = [
      { exerciseId: 'run', day: '2026-10-01', minutes: 40, effort: 5 },
      { exerciseId: 'run', day: '2026-10-02', minutes: 40, effort: 5 },
      { exerciseId: 'run', day: '2026-10-03', minutes: 120, effort: 5 },
      { exerciseId: 'run', day: '2026-10-04', minutes: 40, effort: 5 },
      { exerciseId: 'run', day: '2026-10-05', minutes: 40, effort: 5 },
    ];
    expect(estimatedMinutes(run, history)).toBe(40);
  });
});

describe('suggestFrequency (sources, item 10)', () => {
  it('fills the aerobic guideline gap for someone doing little', () => {
    const s = suggestFrequency(run, [run], [], TUE);
    expect(s.basis).toBe('GUIDELINE_AEROBIC');
    expect(s.perWeek).toBeGreaterThanOrEqual(2);
    expect(s.perWeek).toBeLessThanOrEqual(4);
  });

  it('respects the habit of someone already past the guideline', () => {
    const inputs = klInputs();
    const s = suggestFrequency(run, inputs.exercises, klHistory(), TUE);
    expect(s.perWeek).toBeGreaterThanOrEqual(1);
  });
});
