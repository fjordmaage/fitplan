/**
 * The app's single source of truth: the event log, folded to state, planned
 * by the engine. Everything a screen shows comes from here; everything the
 * user does goes through dispatch and is appended to the log first.
 *
 * The store lives outside React (useSyncExternalStore) and keeps one
 * invariant itself: after every append, the latest saved plan matches what
 * the engine computes from the log. Replanning after an input change is
 * therefore part of the write, never a render side effect, and an unchanged
 * life produces zero changes and no card (gap 11).
 */

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';

import {
  demoAnchors,
  demoExercises,
  demoHistory,
  plan,
  type EngineInputs,
  type PlanChange,
  type PlanResult,
} from '@fitplan/engine';
import {
  activeExercises,
  fold,
  type AppState,
  type EventEnvelope,
  type StoreEvent,
} from '@fitplan/store';

import { openEventDb, type EventDb } from './db';
import { deviceNow, mondayOf } from './plan';

interface Snapshot {
  envelopes: readonly EventEnvelope[];
  /** Changes from the latest app-initiated replan, for the plan-updated card. */
  autoChanges: readonly PlanChange[];
  /** Bumps when autoChanges should be shown again. */
  autoChangesVersion: number;
}

let db: EventDb | null = null;
let snapshot: Snapshot | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function seed(target: EventDb): void {
  const now = deviceNow();
  const monday = mondayOf(now.day);
  const at = new Date();
  for (const exercise of demoExercises) target.append({ type: 'exerciseAdded', exercise }, at);
  for (const anchor of demoAnchors(monday)) target.append({ type: 'anchorAdded', anchor }, at);
  for (const session of demoHistory(monday)) {
    target.append({ type: 'sessionCompleted', session, source: 'logged' }, at);
  }
}

function toInputs(state: AppState, today: string, minutes: number): EngineInputs {
  return {
    now: { day: today, minutes },
    profile: { trainingAmount: state.settings.trainingAmount },
    exercises: activeExercises(state),
    anchors: state.anchors,
    blocks: state.blocks,
    history: state.history,
    checkIns: state.checkIns,
    learned: state.learned,
    frozenWindowOn: state.settings.keepNextTwoDaysSteady,
    ...(state.mode ? { mode: state.mode } : {}),
  };
}

/**
 * Bring the saved plan up to date with the log. Appends at most one
 * planSaved event; with unchanged inputs the engine is deterministic and the
 * diff is empty, so this converges immediately.
 */
function reconcile(target: EventDb): readonly PlanChange[] {
  const envelopes = target.loadAll();
  const state = fold(envelopes);
  const now = deviceNow();
  const inputs = toInputs(state, now.day, now.minutes);
  const result = plan(inputs, state.currentPlan);
  if (!state.currentPlan || result.changes.length > 0) {
    target.append(
      { type: 'planSaved', plan: result.plan, changes: result.changes, by: 'app' },
      new Date(),
    );
    return state.currentPlan ? result.changes : [];
  }
  return [];
}

function ensureLoaded(): Snapshot {
  if (snapshot) return snapshot;
  db = openEventDb();
  if (db.loadAll().length === 0) seed(db);
  const autoChanges = reconcile(db);
  snapshot = {
    envelopes: db.loadAll(),
    autoChanges,
    autoChangesVersion: autoChanges.length > 0 ? 1 : 0,
  };
  return snapshot;
}

function getSnapshot(): Snapshot {
  return ensureLoaded();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function appendAll(events: readonly StoreEvent[]): number[] {
  const current = ensureLoaded();
  const target = db!;
  const at = new Date();
  const ids = events.map((event) => target.append(event, at).id);
  const autoChanges = reconcile(target);
  snapshot = {
    envelopes: target.loadAll(),
    autoChanges,
    autoChangesVersion:
      autoChanges.length > 0 ? current.autoChangesVersion + 1 : current.autoChangesVersion,
  };
  emit();
  return ids;
}

export interface Store {
  state: AppState;
  inputs: EngineInputs;
  result: PlanResult;
  names: Map<string, string>;
  today: string;
  /** Append events; the store replans and persists before returning. */
  dispatch(events: readonly StoreEvent[]): number[];
  /** Changes from the store's own replans (launch, or after a dispatch). */
  autoChanges: readonly PlanChange[];
  autoChangesVersion: number;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const snap = useSyncExternalStore(subscribe, getSnapshot);

  const value = useMemo<Store>(() => {
    const now = deviceNow();
    const state = fold(snap.envelopes);
    const inputs = toInputs(state, now.day, now.minutes);
    // The stored plan is current by the store's invariant; recompute cheaply
    // for the result shape the screens use.
    const result: PlanResult = { plan: state.currentPlan ?? { items: [] }, changes: [] };
    return {
      state,
      inputs,
      result,
      names: new Map(inputs.exercises.map((e) => [e.id, e.name])),
      today: now.day,
      dispatch: appendAll,
      autoChanges: snap.autoChanges,
      autoChangesVersion: snap.autoChangesVersion,
    };
  }, [snap]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside a StoreProvider');
  return store;
}
