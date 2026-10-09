/**
 * The store invariant the app relies on: folding a log, planning, saving the
 * plan as an event, and folding again converges — a second reconcile finds
 * nothing to change. This is the no-restless-plan property (gap 11) at the
 * storage level.
 */

import { describe, expect, it } from 'vitest';

import { demoAnchors, demoExercises, demoHistory, plan } from '@fitplan/engine';
import { activeExercises, fold } from '../src/state';
import { schemaVersion, type EventEnvelope, type StoreEvent } from '../src/events';

function log(): { envelopes: EventEnvelope[]; append: (e: StoreEvent) => EventEnvelope } {
  const envelopes: EventEnvelope[] = [];
  return {
    envelopes,
    append(event) {
      const envelope = {
        id: envelopes.length + 1,
        at: '2026-10-07T10:00:00Z',
        event,
        schemaVersion,
      };
      envelopes.push(envelope);
      return envelope;
    },
  };
}

function inputsOf(envelopes: EventEnvelope[]) {
  const state = fold(envelopes);
  return {
    state,
    inputs: {
      now: { day: '2026-10-06', minutes: 540 },
      profile: { trainingAmount: state.settings.trainingAmount },
      exercises: activeExercises(state),
      anchors: state.anchors,
      blocks: state.blocks,
      history: state.history,
      checkIns: state.checkIns,
      learned: state.learned,
    },
  };
}

function seeded() {
  const db = log();
  for (const exercise of demoExercises) db.append({ type: 'exerciseAdded', exercise });
  for (const anchor of demoAnchors('2026-10-05')) db.append({ type: 'anchorAdded', anchor });
  for (const session of demoHistory('2026-10-05')) {
    db.append({ type: 'sessionCompleted', session, source: 'logged' });
  }
  return db;
}

describe('log -> state -> plan round trip', () => {
  it('reconciling twice changes nothing the second time', () => {
    const db = seeded();
    const first = inputsOf(db.envelopes);
    const planned = plan(first.inputs, first.state.currentPlan);
    db.append({ type: 'planSaved', plan: planned.plan, changes: planned.changes, by: 'app' });

    const second = inputsOf(db.envelopes);
    const replanned = plan(second.inputs, second.state.currentPlan);
    expect(replanned.changes).toEqual([]);
    expect(replanned.plan).toEqual(planned.plan);
  });

  it('undoing a user move restores the previous saved plan', () => {
    const db = seeded();
    const base = inputsOf(db.envelopes);
    const planned = plan(base.inputs, base.state.currentPlan);
    db.append({ type: 'planSaved', plan: planned.plan, changes: planned.changes, by: 'app' });

    const moved = db.append({
      type: 'userMoved',
      exerciseId: 'run',
      from: { day: '2026-10-09', slot: 'afternoon' },
      to: { day: '2026-10-08', slot: 'morning' },
      locked: true,
    });
    const movedPlan = {
      items: planned.plan.items.map((i) =>
        i.exerciseId === 'run' && i.day === '2026-10-09'
          ? { ...i, day: '2026-10-08', slot: 'morning' as const, locked: true }
          : i,
      ),
    };
    const savedMove = db.append({ type: 'planSaved', plan: movedPlan, changes: [], by: 'user' });

    db.append({ type: 'eventUndone', undoneEventId: moved.id });
    db.append({ type: 'eventUndone', undoneEventId: savedMove.id });

    const after = fold(db.envelopes);
    expect(after.currentPlan).toEqual(planned.plan);
  });
});
