/**
 * The fold: event log in, app state out. Pure and deterministic — the same
 * log always produces the same state, so storage can always be rebuilt and
 * nothing is ever lost by a later edit.
 */

import type {
  ActiveMode,
  Anchor,
  Block,
  CheckIn,
  CompletedSession,
  Exercise,
  LearnedParams,
  Plan,
  PlanChange,
} from '@fitplan/engine';

import { defaultSettings, type EventEnvelope, type Settings, type StoreEvent } from './events';

export interface AppState {
  exercises: Exercise[];
  archivedExerciseIds: Set<string>;
  anchors: Anchor[];
  blocks: Block[];
  history: CompletedSession[];
  checkIns: CheckIn[];
  learned: LearnedParams;
  settings: Settings;
  mode?: ActiveMode;
  /** The latest saved plan, if any. */
  currentPlan?: Plan;
  /** Every saved plan change, newest last, for the change log in Learn. */
  planLog: { at: string; changes: readonly PlanChange[]; by: 'user' | 'app' }[];
}

export function emptyState(): AppState {
  return {
    exercises: [],
    archivedExerciseIds: new Set(),
    anchors: [],
    blocks: [],
    history: [],
    checkIns: [],
    learned: {},
    settings: { ...defaultSettings },
    planLog: [],
  };
}

export function fold(envelopes: readonly EventEnvelope[]): AppState {
  const undone = new Set<number>();
  for (const e of envelopes) {
    if (e.event.type === 'eventUndone') undone.add(e.event.undoneEventId);
  }

  const state = emptyState();
  for (const envelope of envelopes) {
    if (undone.has(envelope.id)) continue;
    apply(state, envelope.event, envelope.at);
  }
  return state;
}

function apply(state: AppState, event: StoreEvent, at: string): void {
  switch (event.type) {
    case 'exerciseAdded': {
      if (!state.exercises.some((e) => e.id === event.exercise.id)) {
        state.exercises.push(event.exercise);
      }
      state.archivedExerciseIds.delete(event.exercise.id);
      break;
    }
    case 'exerciseUpdated': {
      const index = state.exercises.findIndex((e) => e.id === event.exerciseId);
      if (index >= 0) {
        state.exercises[index] = { ...state.exercises[index]!, ...event.patch };
      }
      break;
    }
    case 'exerciseArchived':
      state.archivedExerciseIds.add(event.exerciseId);
      break;
    case 'exerciseResumed':
      state.archivedExerciseIds.delete(event.exerciseId);
      break;
    case 'anchorAdded': {
      if (!state.anchors.some((a) => a.id === event.anchor.id)) {
        state.anchors.push(event.anchor);
      }
      break;
    }
    case 'anchorOccurrenceCancelled': {
      const index = state.anchors.findIndex((a) => a.id === event.anchorId);
      if (index >= 0) state.anchors[index] = { ...state.anchors[index]!, cancelled: true };
      break;
    }
    case 'blockAdded': {
      if (!state.blocks.some((b) => b.id === event.block.id)) {
        state.blocks.push(event.block);
      }
      break;
    }
    case 'blockRemoved': {
      state.blocks = state.blocks.filter((b) => b.id !== event.blockId);
      break;
    }
    case 'sessionCompleted':
      state.history.push(event.session);
      break;
    case 'sessionSkipped':
      // Kept in the log for History; no derived effect on load.
      break;
    case 'checkInRecorded':
      state.checkIns.push(event.checkIn);
      break;
    case 'userMoved':
      // The resulting plan arrives as its own planSaved event.
      break;
    case 'userSwapped':
      break;
    case 'planSaved':
      state.currentPlan = event.plan;
      state.planLog.push({ at, changes: event.changes, by: event.by });
      break;
    case 'learnedUpdated':
      state.learned = event.learned;
      break;
    case 'settingsChanged':
      state.settings = { ...state.settings, ...event.patch };
      break;
    case 'modeStarted':
      state.mode = event.mode;
      break;
    case 'modeEnded': {
      if (state.mode) state.mode = { ...state.mode, until: event.day };
      break;
    }
    case 'eventUndone':
      break;
  }
}

/** The exercises the plan works with: not archived. */
export function activeExercises(state: AppState): Exercise[] {
  return state.exercises.filter((e) => !state.archivedExerciseIds.has(e.id));
}
