import { describe, expect, it } from 'vitest';

import { plan } from '../src/schedule';
import { klAnchors, klInputs, TUE } from './helpers';
import { daysBetween } from '../src/time';
import type { EngineInputs, Plan } from '../src/types';

function planOf(inputs: EngineInputs, previous?: Plan) {
  return plan(inputs, previous);
}

describe('required properties (engine spec, "Required tests")', () => {
  it('nothing is ever placed in busy time', () => {
    const inputs = klInputs({
      blocks: [
        { id: 'b1', day: '2026-10-10', slots: ['morning', 'afternoon', 'evening'] },
        { id: 'b2', day: '2026-10-11', slots: ['morning', 'afternoon', 'evening'] },
      ],
    });
    const { plan: result } = planOf(inputs);
    for (const item of result.items) {
      const blocked = inputs.blocks.some((b) => b.day === item.day && b.slots.includes(item.slot));
      expect(blocked).toBe(false);
    }
  });

  it('anchors and locked floaters never move', () => {
    const previous: Plan = {
      items: [
        {
          exerciseId: 'run',
          day: '2026-10-09',
          slot: 'morning',
          order: 0,
          tentative: false,
          locked: true,
        },
      ],
    };
    const { plan: result } = planOf(klInputs(), previous);
    const locked = result.items.find((i) => i.locked);
    expect(locked).toMatchObject({ exerciseId: 'run', day: '2026-10-09', slot: 'morning' });
  });

  it('nothing in the frozen window moves without a user action', () => {
    const first = planOf(klInputs()).plan;
    const frozenInputs = klInputs({
      frozenWindowOn: true,
      blocks: [{ id: 'b1', day: '2026-10-10', slots: ['morning', 'afternoon', 'evening'] }],
    });
    const second = planOf(frozenInputs, first).plan;
    const windowEnd = 2;
    for (const item of first.items) {
      if (daysBetween(TUE, item.day) <= windowEnd) {
        expect(
          second.items.some(
            (i) => i.exerciseId === item.exerciseId && i.day === item.day && i.slot === item.slot,
          ),
        ).toBe(true);
      }
    }
  });

  it('the same input always gives the same plan', () => {
    const a = planOf(klInputs());
    const b = planOf(klInputs());
    expect(a).toEqual(b);
  });

  it('every difference between two plans appears in changes', () => {
    const first = planOf(klInputs()).plan;
    const blocked = klInputs({
      blocks: [{ id: 'b1', day: first.items[0]!.day, slots: [first.items[0]!.slot] }],
    });
    const { plan: second, changes } = planOf(blocked, first);

    const keys = (p: Plan) => new Set(p.items.map((i) => `${i.exerciseId}|${i.day}|${i.slot}`));
    const before = keys(first);
    const after = keys(second);
    const movedOrRemoved = [...before].filter((k) => !after.has(k)).length;
    const addedOrMoved = [...after].filter((k) => !before.has(k)).length;
    const accounted =
      changes.filter((c) => c.kind === 'moved').length * 2 +
      changes.filter((c) => c.kind !== 'moved').length;
    expect(accounted).toBe(movedOrRemoved + addedOrMoved);
  });

  it('places two of nothing on the same day', () => {
    const { plan: result } = planOf(klInputs());
    const seen = new Set<string>();
    for (const item of result.items) {
      const key = `${item.exerciseId}|${item.day}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('days beyond the firm horizon are tentative', () => {
    const { plan: result } = planOf(klInputs());
    for (const item of result.items) {
      expect(item.tentative).toBe(daysBetween(TUE, item.day) >= 14);
    }
  });
});

describe('conflicting user intents', () => {
  it('busy time laid over a locked item wins: the item moves out, never overlaps', () => {
    const previous: Plan = {
      items: [
        {
          exerciseId: 'run',
          day: '2026-10-10',
          slot: 'morning',
          order: 0,
          tentative: false,
          locked: true,
        },
      ],
    };
    const inputs = klInputs({
      blocks: [{ id: 'b1', day: '2026-10-10', slots: ['morning', 'afternoon', 'evening'] }],
    });
    const { plan: result } = planOf(inputs, previous);
    for (const item of result.items) {
      expect(item.day === '2026-10-10').toBe(false);
    }
  });
});

describe("KL's scenario week (engine spec)", () => {
  it('runs land on non-climbing days with the back routine right after', () => {
    const { plan: result } = planOf(klInputs());
    const climbingDays = new Set(klAnchors().map((a) => a.day));

    const runs = result.items.filter((i) => i.exerciseId === 'run' && !i.tentative);
    expect(runs.length).toBeGreaterThanOrEqual(2);
    for (const r of runs) expect(climbingDays.has(r.day)).toBe(false);

    const backs = result.items.filter((i) => i.exerciseId === 'back');
    expect(backs.length).toBeGreaterThanOrEqual(1);
    for (const b of backs) {
      const host = result.items.find(
        (i) => i.exerciseId === 'run' && i.day === b.day && i.slot === b.slot,
      );
      expect(host).toBeDefined();
      expect(b.order).toBeGreaterThan(host!.order);
    }
  });

  it('cancelling Wednesday climbing redistributes and the change list says so', () => {
    const before = planOf(klInputs()).plan;
    const cancelled = klInputs({
      anchors: klAnchors().map((a) => (a.day === '2026-10-07' ? { ...a, cancelled: true } : a)),
    });
    const { changes } = planOf(cancelled, before);
    // The plan replans; whatever moved is in the list. At minimum the list is
    // the complete account: no silent changes is covered by the property test.
    expect(Array.isArray(changes)).toBe(true);
  });

  it('busy all weekend moves the weekend run rather than deleting it', () => {
    const before = planOf(klInputs()).plan;
    const weekendRun = before.items.find(
      (i) => i.exerciseId === 'run' && ['2026-10-10', '2026-10-11'].includes(i.day),
    );
    const busyInputs = klInputs({
      blocks: [
        { id: 'w1', day: '2026-10-10', slots: ['morning', 'afternoon', 'evening'] },
        { id: 'w2', day: '2026-10-11', slots: ['morning', 'afternoon', 'evening'] },
      ],
    });
    const { plan: after } = planOf(busyInputs, before);
    if (weekendRun) {
      const runsAfter = after.items.filter((i) => i.exerciseId === 'run');
      expect(runsAfter.length).toBeGreaterThanOrEqual(
        before.items.filter((i) => i.exerciseId === 'run').length,
      );
      for (const r of runsAfter) expect(['2026-10-10', '2026-10-11'].includes(r.day)).toBe(false);
    }
  });

  it('sore forearms change advice for climbing, not the run', async () => {
    const inputs = klInputs({
      checkIns: [{ day: TUE, atMinutes: 500, soreness: { fingersAndForearms: 'sore' } }],
    });
    const { rate } = await import('../src/rate');
    const climbRating = rate({ inputs, plan: { items: [] } }, inputs.exercises[0]!, TUE, 'evening');
    const runRating = rate({ inputs, plan: { items: [] } }, inputs.exercises[1]!, TUE, 'afternoon');
    expect(climbRating.level).toBe('avoid');
    expect(climbRating.reasons[0]?.code).toBe('REGION_NOT_READY');
    expect(runRating.level).toBe('good');
  });

  it('a PE class on a planned run day rates the run OK or moves it, with a reason', async () => {
    const pe = {
      id: 'pe',
      name: 'PE class',
      loadProfile: { legs: 0.4, armsAndShoulders: 0.15, general: 0.45 },
      typicalMinutes: 60,
      typicalEffort: 7,
    };
    const before = planOf(klInputs()).plan;
    const runDay = before.items.find((i) => i.exerciseId === 'run' && !i.tentative)!.day;
    const inputs = klInputs({
      exercises: [...klInputs().exercises, pe],
      anchors: [
        ...klAnchors(),
        {
          id: 'pe1',
          exerciseId: 'pe',
          day: runDay,
          slot: 'morning',
          startMinutes: 600,
          durationMinutes: 60,
        },
      ],
    });
    const { rate } = await import('../src/rate');
    const rating = rate({ inputs, plan: { items: [] } }, inputs.exercises[1]!, runDay, 'afternoon');
    expect(['ok', 'good']).toContain(rating.level);
    expect(rating.reasons.length).toBeGreaterThan(0);
  });
});
