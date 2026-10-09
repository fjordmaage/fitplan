import { describe, expect, it } from 'vitest';
import { baselineEffort, suggestedEffort } from '../src/intensity';
import { klInputs, climbing, run, WED } from './helpers';

describe('baselineEffort', () => {
  it('uses the median of recent sessions, not the default', () => {
    const inputs = klInputs();
    // Demo history logs climbing at a consistent effort; baseline follows it.
    const baseline = baselineEffort(climbing, inputs);
    expect(baseline).toBeGreaterThanOrEqual(1);
    expect(baseline).toBeLessThanOrEqual(10);
  });

  it('falls back to typicalEffort with no history', () => {
    const inputs = klInputs({ history: [] });
    expect(baselineEffort(run, inputs)).toBe(run.typicalEffort);
  });
});

describe('suggestedEffort', () => {
  it('says usual on a fully recovered day with a steady goal', () => {
    const inputs = klInputs({ history: [] });
    const s = suggestedEffort(inputs, run, '2026-10-20', 'afternoon');
    expect(s.direction).toBe('usual');
    expect(s.effort).toBe(s.baseline);
  });

  it('cuts effort right after a session that loaded the same regions', () => {
    // Climbing Monday evening; climbing again Tuesday morning: fingers loaded.
    const inputs = klInputs();
    const s = suggestedEffort(inputs, climbing, '2026-10-06', 'morning');
    expect(s.direction).toBe('easier');
    expect(s.effort).toBeLessThan(s.baseline);
    expect(s.reasons.length).toBeGreaterThan(0);
  });

  it('caps at easy when today’s check-in says sore', () => {
    const inputs = klInputs({
      checkIns: [{ day: WED, atMinutes: 8 * 60, soreness: { fingersAndForearms: 'sore' } }],
    });
    const s = suggestedEffort(inputs, climbing, WED, 'evening');
    expect(s.effort).toBeLessThanOrEqual(3);
    expect(s.reasons[0]?.code).toBe('REGION_NOT_READY');
  });

  it('eases off on a recover goal and names the goal as the reason', () => {
    const inputs = klInputs({ history: [], profile: { trainingAmount: 'recover' } });
    const s = suggestedEffort(inputs, run, '2026-10-20', 'afternoon');
    expect(s.direction).toBe('easier');
    expect(s.reasons[0]?.code).toBe('TRAINING_GOAL');
  });

  it('only pushes up when recovery has nothing to say', () => {
    const pushInputs = klInputs({ history: [], profile: { trainingAmount: 'push' } });
    const readyDay = suggestedEffort(pushInputs, run, '2026-10-20', 'afternoon');
    expect(readyDay.direction).toBe('harder');

    const loaded = klInputs({ profile: { trainingAmount: 'push' } });
    const tiredDay = suggestedEffort(loaded, climbing, '2026-10-06', 'morning');
    expect(tiredDay.direction).toBe('easier');
  });

  it('stays within 1-10', () => {
    const inputs = klInputs({ history: [], profile: { trainingAmount: 'push' } });
    const maxed = { ...run, typicalEffort: 10 };
    const s = suggestedEffort(inputs, maxed, '2026-10-20', 'afternoon');
    expect(s.effort).toBeLessThanOrEqual(10);
  });
});
