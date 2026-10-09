import { describe, expect, it } from 'vitest';
import { plan } from '../src/schedule';
import { allReadyOn, mainRecoveryCause, projectedSessions, recoveryOutlook } from '../src/outlook';
import { klInputs, MON, TUE, run } from './helpers';
import type { CompletedSession } from '../src/types';

describe('projectedSessions', () => {
  it('includes history, future anchors and planned items at typical dose', () => {
    const inputs = klInputs();
    const { plan: p } = plan(inputs);
    const projected = projectedSessions(inputs, p);
    expect(projected.length).toBeGreaterThan(inputs.history.length);
    // Wednesday's climbing anchor is in the future and projected.
    expect(projected.some((s) => s.exerciseId === 'climb' && s.day === '2026-10-07')).toBe(true);
  });

  it('does not double-count a day already completed', () => {
    const inputs = klInputs();
    const done: CompletedSession = {
      exerciseId: 'climb',
      day: '2026-10-07',
      minutes: 90,
      effort: 7,
    };
    const withDone = klInputs({ history: [...inputs.history, done] });
    const { plan: p } = plan(withDone);
    const climbs = projectedSessions(withDone, p).filter(
      (s) => s.exerciseId === 'climb' && s.day === '2026-10-07',
    );
    expect(climbs).toHaveLength(1);
  });
});

describe('recoveryOutlook', () => {
  it('marks regions recovering the morning after a planned hard session', () => {
    const inputs = klInputs();
    const { plan: p } = plan(inputs);
    const outlook = recoveryOutlook(inputs, p, 14);
    // Thursday morning, after Wednesday evening climbing: fingers not fully ready.
    const thursday = outlook.find((o) => o.day === '2026-10-08')!;
    expect(thursday.regions.fingersAndForearms.recovering).toBe(true);
    expect(thursday.recovering).toContain('fingersAndForearms');
  });

  it('is deterministic', () => {
    const inputs = klInputs();
    const { plan: p } = plan(inputs);
    expect(recoveryOutlook(inputs, p, 14)).toEqual(recoveryOutlook(inputs, p, 14));
  });
});

describe('mainRecoveryCause', () => {
  it('names the session a region is recovering from', () => {
    const inputs = klInputs({ now: { day: '2026-10-08', minutes: 9 * 60 } });
    const { plan: p } = plan(inputs);
    const cause = mainRecoveryCause(inputs, p, 'fingersAndForearms', {
      day: '2026-10-08',
      minutes: 9 * 60,
    });
    expect(cause?.exerciseId).toBe('climb');
  });
});

describe('allReadyOn', () => {
  it('returns a day no earlier than today', () => {
    const inputs = klInputs();
    const { plan: p } = plan(inputs);
    expect(allReadyOn(inputs, p) >= TUE).toBe(true);
  });
});

describe('run import sanity', () => {
  it('fixtures are what the outlook tests assume', () => {
    expect(MON).toBe('2026-10-05');
    expect(run.id).toBe('run');
  });
});
