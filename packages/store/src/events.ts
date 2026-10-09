/**
 * The append-only event log.
 *
 * Everything the user does and everything that happens to the plan is one of
 * these events. Events are never edited or deleted (hard rule: never delete
 * user data); an `eventUndone` event neutralises an earlier one instead, so
 * history is always complete. State is a pure fold over the log (state.ts).
 *
 * `schemaVersion` is stored with every event so stage-later migrations can
 * read old logs. Bump it when a payload shape changes, and keep the old
 * shape readable in migrate.ts.
 */

import type {
  ActiveMode,
  Anchor,
  Block,
  CheckIn,
  CompletedSession,
  DayString,
  Exercise,
  GuideStep,
  LearnedParams,
  Plan,
  PlanChange,
  Slot,
} from '@fitplan/engine';

export const schemaVersion = 1;

/** A weekly repeating busy time ("every Monday evening"). */
export interface BlockSeries {
  id: string;
  /** 0 = Monday … 6 = Sunday, matching the engine's weekday(). */
  weekday: number;
  slots: readonly Slot[];
  fromDay: DayString;
  /** Inclusive end; open-ended when missing. */
  untilDay?: DayString;
}

/** A weekly repeating fixed session ("climbing Monday 17:00"). */
export interface AnchorSeries {
  id: string;
  exerciseId: string;
  /** 0 = Monday … 6 = Sunday. */
  weekday: number;
  slot: Slot;
  startMinutes: number;
  durationMinutes: number;
  fromDay: DayString;
  untilDay?: DayString;
}

/** About-you data. Stored and shown; the engine only uses what it can defend. */
export interface PersonProfile {
  ageYears?: number;
  heightCm?: number;
  weightKg?: number;
  sex?: 'male' | 'female' | 'other';
}

export interface EventEnvelope {
  /** Assigned by the persistence adapter, monotonically increasing. */
  id: number;
  /** Device wall-clock when recorded, ISO. For display only, never planning. */
  at: string;
  event: StoreEvent;
  schemaVersion: number;
}

export type StoreEvent =
  | { type: 'exerciseAdded'; exercise: Exercise }
  | { type: 'exerciseUpdated'; exerciseId: string; patch: Partial<Omit<Exercise, 'id'>> }
  | { type: 'exerciseArchived'; exerciseId: string; day: DayString }
  | { type: 'exerciseResumed'; exerciseId: string; day: DayString }
  | { type: 'anchorAdded'; anchor: Anchor }
  | { type: 'anchorOccurrenceCancelled'; anchorId: string }
  | { type: 'blockAdded'; block: Block }
  | { type: 'blockRemoved'; blockId: string }
  | { type: 'blockSeriesAdded'; series: BlockSeries }
  | { type: 'blockSeriesRemoved'; seriesId: string }
  | { type: 'anchorSeriesAdded'; series: AnchorSeries }
  | { type: 'anchorSeriesRemoved'; seriesId: string }
  | {
      type: 'sessionCompleted';
      session: CompletedSession;
      source: 'planned' | 'logged' | 'imported';
      /** "Did anything hurt?" chips from the after check-in. */
      pain?: readonly string[];
      /** The user's own note. Free text is fine: it is the user's, not the app's. */
      note?: string;
    }
  | { type: 'sessionSkipped'; exerciseId: string; day: DayString }
  | { type: 'profileUpdated'; patch: Partial<PersonProfile> }
  | { type: 'routineSaved'; exerciseId: string; steps: readonly GuideStep[] }
  | { type: 'checkInRecorded'; checkIn: CheckIn }
  | {
      type: 'userMoved';
      exerciseId: string;
      from: { day: DayString; slot: Slot };
      to: { day: DayString; slot: Slot };
      locked: boolean;
    }
  | {
      type: 'userSwapped';
      fromExerciseId: string;
      toExerciseId: string;
      day: DayString;
      slot: Slot;
    }
  | { type: 'planSaved'; plan: Plan; changes: readonly PlanChange[]; by: 'user' | 'app' }
  | { type: 'learnedUpdated'; learned: LearnedParams }
  | { type: 'settingsChanged'; patch: Partial<Settings> }
  | { type: 'modeStarted'; mode: ActiveMode }
  | { type: 'modeEnded'; day: DayString }
  | { type: 'eventUndone'; undoneEventId: number };

export interface Settings {
  trainingAmount: 'recover' | 'lighter' | 'steady' | 'build' | 'push';
  /** Ask me first / change then tell / only big changes. */
  changePolicy: 'askFirst' | 'changeThenTell' | 'onlyBigChanges';
  keepNextTwoDaysSteady: boolean;
  theme: 'phone' | 'light' | 'dark';
  accentIndex: number;
  /** The user's own words for what he is training for. */
  goalText: string;
  voiceCues: boolean;
  reminders: 'off' | 'morningSummary';
  useCalendar: boolean;
  /** First-time setup finished (or skipped); gates the setup flow. */
  setupDone: boolean;
}

export const defaultSettings: Settings = {
  trainingAmount: 'steady',
  changePolicy: 'changeThenTell',
  keepNextTwoDaysSteady: false,
  theme: 'phone',
  accentIndex: 0,
  goalText: 'General fitness',
  voiceCues: true,
  reminders: 'morningSummary',
  useCalendar: false,
  setupDone: false,
};
