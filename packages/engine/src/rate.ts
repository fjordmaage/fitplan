/**
 * rate(exercise, day, slot) -> Good / OK / Avoid with reason codes.
 *
 * Reasons are ordered by a fixed precedence so "the" reason (the first) is a
 * deterministic part of the output, not an accident of evaluation order
 * (gap 8). Hard rules first, then soft strains, then positives.
 */

import {
  heavyRegionShare,
  readiness as readinessParams,
  hardSessionFactor,
  trainingAmountFactor,
  usualBands,
} from './params';
import { comebackFactor, modeActiveOn } from './modes';
import { isBefore, slotMinutes, daysBetween } from './time';
import { isBigJump, medianSessionLoad, plannedLoad, sessionLoadOf, usualDailyLoad } from './load';
import { recoveryAt } from './recovery';
import { projectedSessions } from './outlook';
import type { DayString, EngineInputs, Exercise, Plan, Rating, Reason, Slot } from './types';

/** Fixed precedence: lower number wins the first spot. */
const precedence: Record<Reason['code'], number> = {
  PAST_DAY: 0,
  FULL_BREAK: 1,
  BUSY: 2,
  ALREADY_THAT_DAY: 3,
  REGION_NOT_READY: 4,
  ONLY_EASY: 9,
  BIG_JUMP: 10,
  REGION_BORDERLINE: 11,
  BACK_TO_BACK: 12,
  SAME_DAY_HARD: 13,
  DAY_FULL: 14,
  ABOVE_USUAL: 15,
  COMEBACK: 16,
  TRAINING_GOAL: 17,
  PAIRED_AFTER: 20,
  REGIONS_READY: 21,
  GOOD_SPACING: 22,
  FITS_FREQUENCY: 23,
  PREFERRED_TIME: 24,
};

const hardCodes: ReadonlySet<Reason['code']> = new Set([
  'PAST_DAY',
  'FULL_BREAK',
  'BUSY',
  'ALREADY_THAT_DAY',
  'REGION_NOT_READY',
]);

export function sortReasons(reasons: Reason[]): Reason[] {
  return reasons.sort((a, b) => precedence[a.code] - precedence[b.code]);
}

export interface RateContext {
  inputs: EngineInputs;
  /** The plan being rated against (other placed items). */
  plan: Plan;
  /**
   * The item being re-rated, when rating alternative days for something
   * already in the plan (the move sheet). It must not collide with itself.
   */
  exclude?: { exerciseId: string; day: DayString; slot: Slot };
}

export function rate(context: RateContext, exercise: Exercise, day: DayString, slot: Slot): Rating {
  const { inputs, exclude } = context;
  const plan: Plan = exclude
    ? {
        items: context.plan.items.filter(
          (i) =>
            !(
              i.exerciseId === exclude.exerciseId &&
              i.day === exclude.day &&
              i.slot === exclude.slot
            ),
        ),
      }
    : context.plan;
  const reasons: Reason[] = [];

  if (isBefore(day, inputs.now.day)) reasons.push({ code: 'PAST_DAY' });

  // "Not feeling 100%" (docs/engine-sources.md, item 9). A full break (or
  // keep-fixed) blocks flexible placements; only-easy strains hard sessions;
  // the comeback window after an illness keeps things gentle for a while.
  const mode = inputs.mode;
  if (mode && modeActiveOn(mode, day)) {
    if (mode.change === 'fullBreak' || mode.change === 'keepFixedDropRest') {
      reasons.push({ code: 'FULL_BREAK' });
    }
  }

  // Hard: never place in busy time.
  const blocked = inputs.blocks.some((b) => b.day === day && b.slots.includes(slot));
  if (blocked) reasons.push({ code: 'BUSY', slot });

  // Hard: the same exercise twice on one day. The excluded item (the thing
  // being re-rated, planned or anchored) never collides with itself.
  const excluded = (candidate: { exerciseId: string; day: DayString; slot: Slot }) =>
    exclude != null &&
    candidate.exerciseId === exclude.exerciseId &&
    candidate.day === exclude.day &&
    candidate.slot === exclude.slot;
  const sameDay =
    plan.items.some((i) => i.exerciseId === exercise.id && i.day === day) ||
    inputs.anchors.some(
      (a) => !a.cancelled && a.exerciseId === exercise.id && a.day === day && !excluded(a),
    );
  if (sameDay) reasons.push({ code: 'ALREADY_THAT_DAY', exerciseId: exercise.id });

  // Readiness of the regions this exercise loads heavily, at that day and
  // slot — *projected*: the fatigue estimate includes the sessions already
  // planned or anchored between now and then, not just the past. Without
  // this, every future day looks fully recovered and recovery never shapes
  // the plan.
  const projectedInputs = {
    ...inputs,
    history: projectedSessions(inputs, plan, excluded),
  };
  const recovery = recoveryAt(projectedInputs, { day, minutes: slotMinutes[slot] });
  let anyBorderline = false;
  for (const [region, share] of Object.entries(exercise.loadProfile)) {
    if ((share ?? 0) < heavyRegionShare) continue;
    const state = recovery[region as keyof typeof recovery];
    if (state.readiness < readinessParams.borderline) {
      reasons.push({
        code: 'REGION_NOT_READY',
        region: region as never,
        readyOn: state.readyOn ?? day,
      });
    } else if (state.readiness < readinessParams.ready) {
      anyBorderline = true;
      reasons.push({ code: 'REGION_BORDERLINE', region: region as never });
    }
  }

  // Mode soft rules.
  const median0 = medianSessionLoad(inputs.history);
  if (mode && modeActiveOn(mode, day) && mode.change === 'onlyEasy') {
    const hardLine0 = median0 > 0 ? median0 * hardSessionFactor : Infinity;
    if (plannedLoad(exercise) >= hardLine0) reasons.push({ code: 'ONLY_EASY' });
  }
  if (mode && comebackFactor(mode, day) < 1) {
    const hardLine0 = median0 > 0 ? median0 * hardSessionFactor : Infinity;
    if (plannedLoad(exercise) >= hardLine0 * comebackFactor(mode, day)) {
      reasons.push({ code: 'COMEBACK' });
    }
  }

  // Soft: the rolling week around this day ends up above what the user is
  // aiming for. "Aiming for" is their usual volume scaled by the goal setting
  // (the improvement factor): on "recover" this fires early, on "push" late.
  const usual = usualDailyLoad(inputs.history, inputs.now.day);
  if (usual > 0) {
    // The 7 days ending at the candidate day.
    const inWindow = (d: DayString) => {
      const offset = daysBetween(day, d);
      return offset > -7 && offset <= 0;
    };
    const exerciseById = new Map(inputs.exercises.map((e) => [e.id, e]));
    let weekLoad = plannedLoad(exercise);
    for (const s of inputs.history) if (inWindow(s.day)) weekLoad += sessionLoadOf(s);
    for (const i of plan.items) {
      const e = exerciseById.get(i.exerciseId);
      if (e && inWindow(i.day) && !isBefore(i.day, inputs.now.day)) weekLoad += plannedLoad(e);
    }
    for (const a of inputs.anchors) {
      if (a.cancelled || !inWindow(a.day) || isBefore(a.day, inputs.now.day) || excluded(a))
        continue;
      const e = exerciseById.get(a.exerciseId);
      if (e) weekLoad += plannedLoad(e);
    }
    const aim =
      usual * 7 * usualBands.moreAbove * trainingAmountFactor[inputs.profile.trainingAmount];
    if (weekLoad > aim) reasons.push({ code: 'ABOVE_USUAL' });
  }

  // Soft: a dose far beyond anything recent (sources, item 3).
  const jump = isBigJump(inputs.history, exercise, inputs.now.day);
  if (jump.jump) reasons.push({ code: 'BIG_JUMP', recentMaxLoad: jump.recentMax });

  // Soft: same activity on neighbouring days.
  const nextTo = plan.items.some(
    (i) => i.exerciseId === exercise.id && Math.abs(daysBetween(i.day, day)) === 1,
  );
  if (nextTo) reasons.push({ code: 'BACK_TO_BACK', exerciseId: exercise.id });

  // Soft: two hard sessions on the same day (sources, items 6-7).
  const median = medianSessionLoad(inputs.history);
  const hardLine = median > 0 ? median * hardSessionFactor : Infinity;
  const thisHard = plannedLoad(exercise) >= hardLine;
  if (thisHard) {
    const exerciseById = new Map(inputs.exercises.map((e) => [e.id, e]));
    const others = [
      ...plan.items.filter((i) => i.day === day && i.exerciseId !== exercise.id),
      ...inputs.anchors.filter(
        (a) => !a.cancelled && a.day === day && a.exerciseId !== exercise.id && !excluded(a),
      ),
    ];
    for (const other of others) {
      const otherExercise = exerciseById.get(other.exerciseId);
      if (otherExercise && plannedLoad(otherExercise) >= hardLine) {
        reasons.push({ code: 'SAME_DAY_HARD', otherExerciseId: otherExercise.id });
        break;
      }
    }
  }

  // Positives, so a Good rating still carries a sentence.
  if (reasons.length === 0 || (!anyBorderline && reasons.every((r) => !hardCodes.has(r.code)))) {
    const allReady = Object.entries(exercise.loadProfile).every(
      ([region, share]) =>
        (share ?? 0) < heavyRegionShare || recovery[region as keyof typeof recovery].ready,
    );
    if (allReady) reasons.push({ code: 'REGIONS_READY' });
    if (exercise.preferredSlot === slot) reasons.push({ code: 'PREFERRED_TIME' });
  }

  sortReasons(reasons);

  const level: Rating['level'] = reasons.some((r) => hardCodes.has(r.code))
    ? 'avoid'
    : reasons.some((r) => precedence[r.code] >= 9 && precedence[r.code] < 20)
      ? 'ok'
      : 'good';

  return { level, reasons };
}
