import { describe, expect, it } from 'vitest';

import {
  dailyLoads,
  isBigJump,
  loadVersusUsual,
  medianSessionLoad,
  regionLoads,
  sessionLoad,
  usualDailyLoad,
  validateProfile,
} from '../src/load';
import { addDays } from '../src/time';
import { klHistory, run, TUE } from './helpers';

describe('sessionLoad', () => {
  it('multiplies minutes by effort', () => {
    expect(sessionLoad(45, 6)).toBe(270);
  });

  it('is zero for a zero-length session', () => {
    expect(sessionLoad(0, 10)).toBe(0);
  });

  it.each([
    [-1, 5],
    [30, 0],
    [30, 11],
    [Number.NaN, 5],
  ])('rejects out-of-range input (%s, %s)', (minutes, effort) => {
    expect(() => sessionLoad(minutes, effort)).toThrow(RangeError);
  });
});

describe('regionLoads', () => {
  it('splits by the profile shares', () => {
    expect(regionLoads(100, { legs: 0.7, general: 0.3 })).toEqual({ legs: 70, general: 30 });
  });

  it('rejects profiles that do not sum to 1', () => {
    expect(() => validateProfile({ legs: 0.5 })).toThrow(RangeError);
    expect(() => validateProfile({ legs: 0.7, general: 0.3 })).not.toThrow();
  });
});

describe('history statistics', () => {
  it('sums load per day', () => {
    const loads = dailyLoads(klHistory(), '2026-09-07', '2026-09-13');
    expect(loads.get('2026-09-07')).toBe(720); // climbing 120x6
    expect(loads.get('2026-09-08')).toBe(245); // run 200 + back 45
  });

  it('computes the usual daily load over 28 days', () => {
    const usual = usualDailyLoad(klHistory(), TUE);
    // The 28-day window (8 Sep - 5 Oct) holds all of the four weeks' sessions
    // except the oldest Monday climb: 4x1930 - 720 = 7000 over 28 days.
    expect(usual).toBeCloseTo(7000 / 28, 1);
  });

  it('describes the recent week against the usual without judging it', () => {
    // KL's fixture week tapers off (last session 2 Oct, today 6 Oct): "less".
    expect(loadVersusUsual(klHistory(), TUE)).toBe('less');
    // A uniform history reads "about".
    const uniform = Array.from({ length: 28 }, (_, i) => ({
      exerciseId: 'run',
      day: addDays(TUE, -(i + 1)),
      minutes: 40,
      effort: 5,
    }));
    expect(loadVersusUsual(uniform, TUE)).toBe('about');
    expect(loadVersusUsual([], TUE)).toBe('unknown');
  });

  it('finds the median session load', () => {
    // 4x45, 4x200, 4x720 -> median 200.
    expect(medianSessionLoad(klHistory())).toBe(200);
  });
});

describe('isBigJump (sources, item 3)', () => {
  it('is calm about a session like the recent ones', () => {
    expect(isBigJump(klHistory(), run, TUE).jump).toBe(false);
  });

  it('flags a dose far beyond anything recent', () => {
    const longRun = { ...run, typicalMinutes: 90 }; // 450 vs recent max 200
    expect(isBigJump(klHistory(), longRun, TUE).jump).toBe(true);
  });

  it('does not flag the first ever session (nothing to compare)', () => {
    expect(isBigJump([], run, TUE).jump).toBe(false);
  });
});
