import { describe, expect, it } from 'vitest';

import { rate } from '../src/rate';
import { klInputs, run, TUE, WED } from './helpers';
import type { Plan } from '../src/types';

const emptyPlan: Plan = { items: [] };

describe('rate (engine spec, "Rating function")', () => {
  it('avoids busy time, and says so first', () => {
    const inputs = klInputs({ blocks: [{ id: 'b1', day: WED, slots: ['afternoon'] }] });
    const rating = rate({ inputs, plan: emptyPlan }, run, WED, 'afternoon');
    expect(rating.level).toBe('avoid');
    expect(rating.reasons[0]).toEqual({ code: 'BUSY', slot: 'afternoon' });
  });

  it('avoids a second copy of the same exercise on one day', () => {
    const plan: Plan = {
      items: [{ exerciseId: 'run', day: WED, slot: 'morning', order: 0, tentative: false }],
    };
    const rating = rate({ inputs: klInputs(), plan }, run, WED, 'evening');
    expect(rating.level).toBe('avoid');
    expect(rating.reasons[0]?.code).toBe('ALREADY_THAT_DAY');
  });

  it('avoids days before now', () => {
    const rating = rate({ inputs: klInputs(), plan: emptyPlan }, run, '2026-10-01', 'morning');
    expect(rating.level).toBe('avoid');
    expect(rating.reasons[0]?.code).toBe('PAST_DAY');
  });

  it('rates a sensible day good, with a positive reason to show', () => {
    const rating = rate({ inputs: klInputs(), plan: emptyPlan }, run, TUE, 'afternoon');
    expect(rating.level).toBe('good');
    expect(rating.reasons.length).toBeGreaterThan(0);
  });

  it('downgrades a big jump to ok (sources, item 3)', () => {
    const longRun = { ...run, id: 'run', typicalMinutes: 90 };
    const rating = rate({ inputs: klInputs(), plan: emptyPlan }, longRun, TUE, 'afternoon');
    expect(rating.level).toBe('ok');
    expect(rating.reasons.some((r) => r.code === 'BIG_JUMP')).toBe(true);
  });

  it('notes back-to-back days with the same exercise', () => {
    const plan: Plan = {
      items: [{ exerciseId: 'run', day: TUE, slot: 'afternoon', order: 0, tentative: false }],
    };
    const rating = rate({ inputs: klInputs(), plan }, run, WED, 'afternoon');
    expect(rating.level).toBe('ok');
    expect(rating.reasons.some((r) => r.code === 'BACK_TO_BACK')).toBe(true);
  });

  it('reasons have a fixed precedence: busy beats everything soft', () => {
    const inputs = klInputs({ blocks: [{ id: 'b1', day: WED, slots: ['afternoon'] }] });
    const plan: Plan = {
      items: [{ exerciseId: 'run', day: TUE, slot: 'afternoon', order: 0, tentative: false }],
    };
    const rating = rate({ inputs, plan }, run, WED, 'afternoon');
    expect(rating.reasons[0]?.code).toBe('BUSY');
  });

  it('is deterministic', () => {
    const a = rate({ inputs: klInputs(), plan: emptyPlan }, run, WED, 'afternoon');
    const b = rate({ inputs: klInputs(), plan: emptyPlan }, run, WED, 'afternoon');
    expect(a).toEqual(b);
  });
});
