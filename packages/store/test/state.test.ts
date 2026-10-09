import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import { demoExercises } from '@fitplan/engine';
import { fold, activeExercises } from '../src/state';
import { schemaVersion, type EventEnvelope, type StoreEvent } from '../src/events';

let nextId = 1;
function env(event: StoreEvent): EventEnvelope {
  return { id: nextId++, at: '2026-10-07T10:00:00Z', event, schemaVersion };
}

const run = demoExercises[1]!;

describe('fold', () => {
  it('builds state from events', () => {
    const state = fold([
      env({ type: 'exerciseAdded', exercise: run }),
      env({
        type: 'sessionCompleted',
        session: { exerciseId: run.id, day: '2026-10-06', minutes: 40, effort: 5 },
        source: 'planned',
      }),
      env({ type: 'settingsChanged', patch: { trainingAmount: 'build' } }),
    ]);
    expect(activeExercises(state).map((e) => e.id)).toEqual([run.id]);
    expect(state.history).toHaveLength(1);
    expect(state.settings.trainingAmount).toBe('build');
  });

  it('an undone event leaves no trace in state but stays in the log', () => {
    const add = env({ type: 'exerciseAdded', exercise: run });
    const undo = env({ type: 'eventUndone', undoneEventId: add.id });
    const state = fold([add, undo]);
    expect(activeExercises(state)).toHaveLength(0);
  });

  it('archiving hides an exercise; resuming brings it back', () => {
    const state = fold([
      env({ type: 'exerciseAdded', exercise: run }),
      env({ type: 'exerciseArchived', exerciseId: run.id, day: '2026-10-06' }),
    ]);
    expect(activeExercises(state)).toHaveLength(0);
    expect(state.exercises).toHaveLength(1); // never deleted

    const resumed = fold([
      env({ type: 'exerciseAdded', exercise: run }),
      env({ type: 'exerciseArchived', exerciseId: run.id, day: '2026-10-06' }),
      env({ type: 'exerciseResumed', exerciseId: run.id, day: '2026-10-07' }),
    ]);
    expect(activeExercises(resumed)).toHaveLength(1);
  });

  it('cancelling an anchor keeps it, marked cancelled', () => {
    const anchor = {
      id: 'a1',
      exerciseId: run.id,
      day: '2026-10-07',
      slot: 'evening' as const,
      startMinutes: 1020,
      durationMinutes: 120,
    };
    const state = fold([
      env({ type: 'anchorAdded', anchor }),
      env({ type: 'anchorOccurrenceCancelled', anchorId: 'a1' }),
    ]);
    expect(state.anchors).toHaveLength(1);
    expect(state.anchors[0]?.cancelled).toBe(true);
  });

  it('the latest planSaved wins and the log keeps all of them', () => {
    const planA = { items: [] };
    const planB = {
      items: [
        {
          exerciseId: run.id,
          day: '2026-10-09',
          slot: 'afternoon' as const,
          order: 0,
          tentative: false,
        },
      ],
    };
    const state = fold([
      env({ type: 'planSaved', plan: planA, changes: [], by: 'app' }),
      env({ type: 'planSaved', plan: planB, changes: [], by: 'user' }),
    ]);
    expect(state.currentPlan).toEqual(planB);
    expect(state.planLog).toHaveLength(2);
  });

  it('is deterministic and order-respecting for any event sequence', () => {
    const eventArb = fc.oneof(
      fc.constant<StoreEvent>({ type: 'exerciseAdded', exercise: run }),
      fc.constant<StoreEvent>({ type: 'exerciseArchived', exerciseId: run.id, day: '2026-10-06' }),
      fc.constant<StoreEvent>({ type: 'exerciseResumed', exerciseId: run.id, day: '2026-10-07' }),
      fc.constant<StoreEvent>({ type: 'settingsChanged', patch: { accentIndex: 2 } }),
    );
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        const envelopes = events.map((event, i) => ({
          id: i + 1,
          at: '2026-10-07T10:00:00Z',
          event,
          schemaVersion,
        }));
        expect(fold(envelopes)).toEqual(fold(envelopes));
      }),
    );
  });
});
