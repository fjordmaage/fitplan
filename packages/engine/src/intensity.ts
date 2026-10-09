/**
 * Suggested intensity for a session: an effort target (the same 1-10 scale
 * the user logs with) adjusted for recovery, soreness, "not feeling 100%",
 * and the goal setting.
 *
 * This is RPE-based autoregulation (docs/engine-sources.md, item 11): the
 * baseline is what the user usually does, and the engine only nudges it for
 * reasons it can name. It never invents a number from nothing.
 */

import {
  readiness as readinessParams,
  heavyRegionShare,
  trainingAmountEffortDelta,
} from './params';
import { comebackFactor, modeActiveOn } from './modes';
import { recoveryAt } from './recovery';
import { projectedSessions } from './outlook';
import { sortReasons } from './rate';
import { slotMinutes } from './time';
import type { BodyRegion, DayString, EngineInputs, Exercise, Plan, Reason, Slot } from './types';

export interface EffortSuggestion {
  /** Target effort 1-10 for this session. */
  effort: number;
  /** Against the user's own baseline for this exercise. */
  direction: 'easier' | 'usual' | 'harder';
  /** The user's baseline the target is measured against. */
  baseline: number;
  /** Ordered like ratings; the first is "the" reason. Empty = nothing to adjust. */
  reasons: readonly Reason[];
}

/** Median effort of the last up-to-5 completions, falling back to the default. */
export function baselineEffort(exercise: Exercise, inputs: EngineInputs): number {
  const recent = inputs.history
    .filter((s) => s.exerciseId === exercise.id)
    .sort((a, b) => b.day.localeCompare(a.day))
    .slice(0, 5)
    .map((s) => s.effort)
    .sort((a, b) => a - b);
  if (recent.length === 0) return exercise.typicalEffort;
  const mid = Math.floor(recent.length / 2);
  return recent.length % 2 === 1 ? recent[mid]! : Math.round((recent[mid - 1]! + recent[mid]!) / 2);
}

export function suggestedEffort(
  inputs: EngineInputs,
  exercise: Exercise,
  day: DayString,
  slot: Slot,
  plan: Plan = { items: [] },
): EffortSuggestion {
  const baseline = baselineEffort(exercise, inputs);
  const reasons: Reason[] = [];
  let target = baseline;

  // Recovery of the regions this session loads heavily, projected over the
  // plan ahead (the session's own day doesn't count against itself). A region
  // below borderline caps the session at genuinely easy; borderline takes one off.
  const projected = {
    ...inputs,
    history: projectedSessions(
      {
        ...inputs,
        anchors: inputs.anchors.filter((a) => !(a.exerciseId === exercise.id && a.day === day)),
      },
      { items: plan.items.filter((i) => !(i.exerciseId === exercise.id && i.day === day)) },
    ),
  };
  const recovery = recoveryAt(projected, { day, minutes: slotMinutes[slot] });
  for (const [region, share] of Object.entries(exercise.loadProfile)) {
    if ((share ?? 0) < heavyRegionShare) continue;
    const state = recovery[region as BodyRegion];
    if (state.readiness < readinessParams.borderline) {
      target = Math.min(target, 3);
      reasons.push({
        code: 'REGION_NOT_READY',
        region: region as BodyRegion,
        readyOn: state.readyOn ?? day,
      });
    } else if (state.readiness < readinessParams.ready) {
      target = Math.min(target, baseline - 1);
      reasons.push({ code: 'REGION_BORDERLINE', region: region as BodyRegion });
    }
  }

  // "Not feeling 100%": only-easy caps hard work; the comeback window scales
  // the baseline down and lets it climb back as the window closes.
  const mode = inputs.mode;
  if (mode && modeActiveOn(mode, day) && mode.change === 'onlyEasy') {
    if (target > 4) {
      target = 4;
      reasons.push({ code: 'ONLY_EASY' });
    }
  }
  const factor = comebackFactor(mode, day);
  if (factor < 1) {
    const scaled = Math.max(2, Math.round(baseline * factor));
    if (scaled < target) {
      target = scaled;
      reasons.push({ code: 'COMEBACK' });
    }
  }

  // The goal setting nudges effort only when recovery has nothing to say:
  // easing off always applies, pushing up only on a fully ready day.
  const delta = trainingAmountEffortDelta[inputs.profile.trainingAmount];
  if (delta < 0 && baseline + delta < target) {
    target = baseline + delta;
    reasons.push({ code: 'TRAINING_GOAL', amount: inputs.profile.trainingAmount });
  } else if (delta > 0 && reasons.length === 0) {
    target = baseline + delta;
    reasons.push({ code: 'TRAINING_GOAL', amount: inputs.profile.trainingAmount });
  }

  target = Math.max(1, Math.min(10, target));
  sortReasons(reasons);
  return {
    effort: target,
    direction: target < baseline ? 'easier' : target > baseline ? 'harder' : 'usual',
    baseline,
    reasons,
  };
}
