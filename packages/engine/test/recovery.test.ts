import { describe, expect, it } from 'vitest';

import { fatigueAt, learnFromCheckIn, recoveryAt, toReadiness } from '../src/recovery';
import { klHistory, klInputs, TUE, WED } from './helpers';

describe('fatigue decay', () => {
  it('fatigue right after a session is higher than a day later', () => {
    const inputs = klInputs();
    const evening = fatigueAt(inputs.history, inputs.exercises, {
      day: '2026-10-05',
      minutes: 1140,
    });
    const nextDay = fatigueAt(inputs.history, inputs.exercises, {
      day: '2026-10-06',
      minutes: 1140,
    });
    // KL's history has climbing on Mondays (2026-10-05 has no entry; last was 2026-09-30 Wed).
    expect(nextDay.fingersAndForearms).toBeLessThanOrEqual(evening.fingersAndForearms);
  });

  it('fingers decay slower than legs (sources, item 5)', () => {
    const history = [{ exerciseId: 'even', day: '2026-10-05', minutes: 60, effort: 6 }];
    const exercises = [
      {
        id: 'even',
        name: 'Even split',
        loadProfile: { legs: 0.5, fingersAndForearms: 0.5 },
        typicalMinutes: 60,
        typicalEffort: 6,
      },
    ];
    const after = fatigueAt(history, exercises, { day: '2026-10-07', minutes: 1080 });
    expect(after.fingersAndForearms).toBeGreaterThan(after.legs);
  });

  it('ignores sessions after the asked-for instant', () => {
    const inputs = klInputs();
    const before = fatigueAt(inputs.history, inputs.exercises, { day: '2026-09-01', minutes: 0 });
    for (const value of Object.values(before)) expect(value).toBe(0);
  });
});

describe('readiness', () => {
  it('maps zero fatigue to fully ready', () => {
    expect(toReadiness(0, 300)).toBe(1);
  });

  it('is lower for more fatigue', () => {
    expect(toReadiness(600, 300)).toBeLessThan(toReadiness(200, 300));
  });

  it('never leaves 0..1', () => {
    expect(toReadiness(1e9, 300)).toBe(0);
    expect(toReadiness(0, 1)).toBe(1);
  });

  it('reports a ready-by day when a region is not ready', () => {
    // A brutal climbing day yesterday.
    const inputs = klInputs({
      history: [
        ...klHistory(),
        { exerciseId: 'climb', day: '2026-10-05', minutes: 240, effort: 9 },
      ],
    });
    const state = recoveryAt(inputs, { day: TUE, minutes: 540 });
    expect(state.fingersAndForearms.ready).toBe(false);
    expect(state.fingersAndForearms.readyOn).toBeDefined();
  });
});

describe('check-ins (engine spec, point 5)', () => {
  it('a "sore" check-in overrides the estimate today', () => {
    const inputs = klInputs({
      checkIns: [{ day: TUE, atMinutes: 500, soreness: { fingersAndForearms: 'sore' } }],
    });
    const state = recoveryAt(inputs, { day: TUE, minutes: 540 });
    expect(state.fingersAndForearms.ready).toBe(false);
  });

  it('the override does not leak into other days', () => {
    const inputs = klInputs({
      checkIns: [{ day: TUE, atMinutes: 500, soreness: { fingersAndForearms: 'sore' } }],
    });
    const state = recoveryAt(inputs, { day: WED, minutes: 540 });
    expect(state.fingersAndForearms.ready).toBe(true);
  });

  it('one check-in nudges the half-life a little, never past the cap', () => {
    const inputs = klInputs();
    const checkIn = { day: TUE, atMinutes: 500, soreness: { legs: 'sore' as const } };
    const factors = learnFromCheckIn(inputs, checkIn);
    expect(factors.legs).toBeGreaterThan(1);
    expect(factors.legs).toBeLessThan(1.1);

    // Hammering the same check-in 100 times stays within the band.
    let learned = { halfLifeFactor: factors };
    for (let i = 0; i < 100; i += 1) {
      learned = { halfLifeFactor: learnFromCheckIn(klInputs({ learned }), checkIn) };
    }
    expect(learned.halfLifeFactor.legs).toBeLessThanOrEqual(2);
  });

  it('is deterministic', () => {
    const a = recoveryAt(klInputs(), { day: TUE, minutes: 540 });
    const b = recoveryAt(klInputs(), { day: TUE, minutes: 540 });
    expect(a).toEqual(b);
  });
});
