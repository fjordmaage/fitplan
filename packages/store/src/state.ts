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
  GuideStep,
  LearnedParams,
  Plan,
  PlanChange,
} from '@fitplan/engine';

import {
  defaultSettings,
  type AnchorSeries,
  type BlockSeries,
  type EventEnvelope,
  type PersonProfile,
  type Settings,
  type StoreEvent,
} from './events';

/** Per-session detail that goes beyond the engine's CompletedSession. */
export interface SessionDetail {
  exerciseId: string;
  day: string;
  source: 'planned' | 'logged' | 'imported';
  pain?: readonly string[];
  note?: string;
}

export interface AppState {
  exercises: Exercise[];
  archivedExerciseIds: Set<string>;
  /** Day the exercise was archived, for "last done in ..." copy. */
  archivedOn: Map<string, string>;
  anchors: Anchor[];
  anchorSeries: AnchorSeries[];
  /** Cancelled occurrence ids, including expanded series occurrences. */
  cancelledAnchorIds: Set<string>;
  blocks: Block[];
  blockSeries: BlockSeries[];
  history: CompletedSession[];
  sessionDetails: SessionDetail[];
  skips: { exerciseId: string; day: string; at: string }[];
  checkIns: CheckIn[];
  learned: LearnedParams;
  settings: Settings;
  person: PersonProfile;
  /** Hand-saved routines by exercise id; absent = generate on the spot. */
  routines: Map<string, readonly GuideStep[]>;
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
    archivedOn: new Map(),
    anchors: [],
    anchorSeries: [],
    cancelledAnchorIds: new Set(),
    blocks: [],
    blockSeries: [],
    history: [],
    sessionDetails: [],
    skips: [],
    checkIns: [],
    learned: {},
    settings: { ...defaultSettings },
    person: {},
    routines: new Map(),
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
      state.archivedOn.set(event.exerciseId, event.day);
      break;
    case 'exerciseResumed':
      state.archivedExerciseIds.delete(event.exerciseId);
      state.archivedOn.delete(event.exerciseId);
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
      // Series occurrences don't live in state.anchors; remember the id so
      // expansion can mark the occurrence cancelled.
      state.cancelledAnchorIds.add(event.anchorId);
      break;
    }
    case 'anchorSeriesAdded': {
      if (!state.anchorSeries.some((s) => s.id === event.series.id)) {
        state.anchorSeries.push(event.series);
      }
      break;
    }
    case 'anchorSeriesRemoved': {
      state.anchorSeries = state.anchorSeries.filter((s) => s.id !== event.seriesId);
      break;
    }
    case 'blockSeriesAdded': {
      if (!state.blockSeries.some((s) => s.id === event.series.id)) {
        state.blockSeries.push(event.series);
      }
      break;
    }
    case 'blockSeriesRemoved': {
      state.blockSeries = state.blockSeries.filter((s) => s.id !== event.seriesId);
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
    case 'sessionCompleted': {
      state.history.push(event.session);
      const detail: SessionDetail = {
        exerciseId: event.session.exerciseId,
        day: event.session.day,
        source: event.source,
      };
      if (event.pain) detail.pain = event.pain;
      if (event.note) detail.note = event.note;
      state.sessionDetails.push(detail);
      break;
    }
    case 'sessionSkipped':
      state.skips.push({ exerciseId: event.exerciseId, day: event.day, at });
      break;
    case 'profileUpdated':
      state.person = { ...state.person, ...event.patch };
      break;
    case 'routineSaved':
      state.routines.set(event.exerciseId, event.steps);
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
