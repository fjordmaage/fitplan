import { describe, expect, it } from 'vitest';

import { comebackEndsOn, comebackFactor, modeActiveOn, type ActiveMode } from '../src/modes';
import { plan } from '../src/schedule';
import { rate } from '../src/rate';
import { klInputs, run } from './helpers';

const breakWeek: ActiveMode = {
  cause: 'ill',
  change: 'fullBreak',
  from: '2026-10-06',
  until: '2026-10-12',
  comeback: 'balanced',
};

describe('mode windows', () => {
  it('is active between from and until, inclusive', () => {
    expect(modeActiveOn(breakWeek, '2026-10-05')).toBe(false);
    expect(modeActiveOn(breakWeek, '2026-10-06')).toBe(true);
    expect(modeActiveOn(breakWeek, '2026-10-12')).toBe(true);
    expect(modeActiveOn(breakWeek, '2026-10-13')).toBe(false);
  });

  it('"until I say" never ends by itself', () => {
    const open: ActiveMode = { ...breakWeek };
    delete (open as { until?: string }).until;
    expect(modeActiveOn(open, '2027-06-01')).toBe(true);
  });
});

describe('comeback (sources, item 9)', () => {
  it('starts reduced and climbs back to full', () => {
    const dayAfter = comebackFactor(breakWeek, '2026-10-13');
    const later = comebackFactor(breakWeek, '2026-10-15');
    expect(dayAfter).toBeGreaterThanOrEqual(0.5);
    expect(dayAfter).toBeLessThan(later);
    expect(comebackFactor(breakWeek, '2026-11-01')).toBe(1);
  });

  it('illness comes back more carefully than tiredness', () => {
    const tired: ActiveMode = { ...breakWeek, cause: 'justTired' };
    expect(comebackFactor(breakWeek, '2026-10-13')).toBeLessThan(
      comebackFactor(tired, '2026-10-13'),
    );
  });

  it('reports when the comeback ends', () => {
    expect(comebackEndsOn(breakWeek)).toBe('2026-10-16');
  });
});

describe('modes in rating and planning', () => {
  it('a full break rates every flexible day Avoid with FULL_BREAK first', () => {
    const inputs = klInputs({ mode: breakWeek });
    const rating = rate({ inputs, plan: { items: [] } }, run, '2026-10-09', 'afternoon');
    expect(rating.level).toBe('avoid');
    expect(rating.reasons[0]?.code).toBe('FULL_BREAK');
  });

  it('a full break schedules nothing flexible inside the mode', () => {
    const inputs = klInputs({ mode: breakWeek });
    const { plan: result } = plan(inputs);
    for (const item of result.items) {
      expect(modeActiveOn(breakWeek, item.day)).toBe(false);
    }
  });

  it('only-easy keeps easy sessions and strains hard ones', () => {
    const onlyEasy: ActiveMode = { ...breakWeek, change: 'onlyEasy' };
    const inputs = klInputs({ mode: onlyEasy });
    // The run (load 200, median 200) is below the hard line: fine.
    const runRating = rate({ inputs, plan: { items: [] } }, run, '2026-10-09', 'afternoon');
    expect(runRating.level).toBe('good');
    // Climbing (load 720) is a hard session: only-easy strains it.
    const climb = inputs.exercises[0]!;
    const climbRating = rate({ inputs, plan: { items: [] } }, climb, '2026-10-09', 'afternoon');
    expect(climbRating.level).toBe('ok');
    expect(climbRating.reasons.some((r) => r.code === 'ONLY_EASY')).toBe(true);
  });

  it('time off reorganises the plan around it, not just deletes it', () => {
    const before = plan(klInputs()).plan;
    const { plan: after } = plan(klInputs({ mode: breakWeek }), before);
    const runsAfter = after.items.filter((i) => i.exerciseId === 'run');
    // Runs still exist, outside the break.
    expect(runsAfter.length).toBeGreaterThan(0);
    for (const item of runsAfter) expect(modeActiveOn(breakWeek, item.day)).toBe(false);
  });
});
