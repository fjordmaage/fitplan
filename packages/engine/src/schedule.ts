/**
 * plan(inputs, previousPlan) -> { plan, changes }.
 *
 * Greedy placement in a fixed priority order followed by local improvement,
 * exactly as the engine spec prescribes: the problem is tiny, so no solver.
 * Deterministic throughout: ties break by day, then slot order, then exercise
 * id.
 */

import {
  heavyRegionShare,
  horizon,
  readiness as readinessParams,
  weights,
  stabilityWeight,
  hardSessionFactor,
} from './params';
import { addDays, dayRange, daysBetween, slotMinutes, weekday } from './time';
import { medianSessionLoad, plannedLoad } from './load';
import { recoveryAt } from './recovery';
import {
  SLOTS,
  type DayString,
  type EngineInputs,
  type Exercise,
  type Plan,
  type PlanChange,
  type PlannedItem,
  type PlanResult,
  type Slot,
} from './types';

interface Placement {
  day: DayString;
  slot: Slot;
}

function keyOf(item: { exerciseId: string; day: DayString; slot: Slot }): string {
  return `${item.exerciseId}|${item.day}|${item.slot}`;
}

export function plan(inputs: EngineInputs, previousPlan?: Plan): PlanResult {
  const previous = previousPlan ?? { items: [] };
  const today = inputs.now.day;
  const days = dayRange(today, horizon.tentativeDays);
  const exerciseById = new Map(inputs.exercises.map((e) => [e.id, e]));

  // What is immovable: anchors (not cancelled) and locked or frozen items.
  const anchors = inputs.anchors.filter((a) => !a.cancelled && daysBetween(today, a.day) >= 0);
  const frozenLimit = inputs.frozenWindowOn ? addDays(today, 2) : null;
  const keptItems: PlannedItem[] = previous.items.filter((item) => {
    if (daysBetween(today, item.day) < 0) return false;
    if (item.locked) return true;
    if (frozenLimit && daysBetween(item.day, frozenLimit) > 0) return true;
    return false;
  });

  // Flexible exercises to place: those with a frequency, minus kept copies.
  const toPlace: Exercise[] = [];
  for (const exercise of [...inputs.exercises].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!exercise.frequencyPerWeek || exercise.pairAfterExerciseId) continue;
    const perWeek = exercise.frequencyPerWeek;
    const total = Math.round((perWeek / 7) * horizon.tentativeDays);
    const kept = keptItems.filter((i) => i.exerciseId === exercise.id).length;
    for (let i = kept; i < total; i += 1) toPlace.push(exercise);
  }

  // Occupancy maps for hard rules.
  const busy = new Set(inputs.blocks.flatMap((b) => b.slots.map((s) => `${b.day}|${s}`)));
  const taken = new Map<string, number>(); // `${day}|${slot}` -> count
  const dayHas = new Set<string>(); // `${exerciseId}|${day}`
  const dayLoad = new Map<DayString, number>();

  function occupy(exerciseId: string, day: DayString, slot: Slot, load: number): void {
    taken.set(`${day}|${slot}`, (taken.get(`${day}|${slot}`) ?? 0) + 1);
    dayHas.add(`${exerciseId}|${day}`);
    dayLoad.set(day, (dayLoad.get(day) ?? 0) + load);
  }

  for (const a of anchors) {
    const e = exerciseById.get(a.exerciseId);
    occupy(a.exerciseId, a.day, a.slot, e ? plannedLoad(e) : 0);
  }
  for (const item of keptItems) {
    const e = exerciseById.get(item.exerciseId);
    occupy(item.exerciseId, item.day, item.slot, e ? plannedLoad(e) : 0);
  }

  const median = medianSessionLoad(inputs.history);
  const hardLine = median > 0 ? median * hardSessionFactor : Infinity;
  const previousByExercise = new Map<string, Placement[]>();
  for (const item of previous.items) {
    const list = previousByExercise.get(item.exerciseId) ?? [];
    list.push({ day: item.day, slot: item.slot });
    previousByExercise.set(item.exerciseId, list);
  }

  // Recent pattern: weekday+slot of completions in the last 28 days.
  const pattern = new Set<string>();
  for (const s of inputs.history) {
    if (daysBetween(s.day, today) <= 28 && daysBetween(s.day, today) > 0) {
      pattern.add(`${s.exerciseId}|${weekday(s.day)}`);
    }
  }

  const placed: PlannedItem[] = [...keptItems];

  function score(exercise: Exercise, day: DayString, slot: Slot): number | null {
    // Hard rules.
    if (busy.has(`${day}|${slot}`)) return null;
    if (dayHas.has(`${exercise.id}|${day}`)) return null;

    let total = 0;
    const at = { day, minutes: slotMinutes[slot] };
    const recovery = recoveryAt(inputs, at);
    let worst = 1;
    for (const [region, share] of Object.entries(exercise.loadProfile)) {
      if ((share ?? 0) < heavyRegionShare) continue;
      worst = Math.min(worst, recovery[region as keyof typeof recovery].readiness);
    }
    if (worst < readinessParams.borderline && daysBetween(today, day) <= 2) return null;
    total += weights.readiness * worst;

    // Spacing: distance to the nearest same-exercise placement.
    let nearest = Infinity;
    for (const item of placed) {
      if (item.exerciseId === exercise.id) {
        nearest = Math.min(nearest, Math.abs(daysBetween(item.day, day)));
      }
    }
    const idealGap = exercise.frequencyPerWeek ? 7 / exercise.frequencyPerWeek : 3;
    if (nearest !== Infinity) {
      total += weights.spacing * Math.min(1, nearest / idealGap);
      if (nearest === 1) total -= weights.sequencing * 0.5;
    } else {
      total += weights.spacing;
    }

    // Day load kept reasonable.
    const loadAfter = (dayLoad.get(day) ?? 0) + plannedLoad(exercise);
    if (median > 0) total -= weights.dayLoad * Math.max(0, loadAfter / (2 * median) - 1);

    // Hard sessions not back to back with another hard session that day.
    if (plannedLoad(exercise) >= hardLine && (dayLoad.get(day) ?? 0) >= hardLine) {
      total -= weights.sequencing;
    }

    // Time of day preference.
    if (exercise.preferredSlot === slot) total += weights.timeOfDay;

    // Pattern: same weekday as recent completions.
    if (pattern.has(`${exercise.id}|${weekday(day)}`)) total += weights.pattern;

    // Stability: distance from where the previous plan had this exercise.
    const prior = previousByExercise.get(exercise.id) ?? [];
    if (prior.length > 0) {
      const closest = Math.min(...prior.map((p) => Math.abs(daysBetween(p.day, day))));
      total -=
        weights.stability * stabilityWeight(daysBetween(today, day)) * Math.min(1, closest / 7);
    }

    // Light pressure towards earlier placement so frequency is met.
    total -= daysBetween(today, day) * 0.05;
    return total;
  }

  function bestPlacement(exercise: Exercise): Placement | null {
    let best: Placement | null = null;
    let bestScore = -Infinity;
    for (const day of days) {
      for (const slot of SLOTS) {
        const s = score(exercise, day, slot);
        if (s !== null && s > bestScore + 1e-9) {
          bestScore = s;
          best = { day, slot };
        }
      }
    }
    return best;
  }

  // Greedy placement.
  for (const exercise of toPlace) {
    const spot = bestPlacement(exercise);
    if (!spot) continue;
    const item: PlannedItem = {
      exerciseId: exercise.id,
      day: spot.day,
      slot: spot.slot,
      order: taken.get(`${spot.day}|${spot.slot}`) ?? 0,
      tentative: daysBetween(today, spot.day) >= horizon.firmDays,
    };
    placed.push(item);
    occupy(exercise.id, spot.day, spot.slot, plannedLoad(exercise));
  }

  // Local improvement: try moving each flexible, unlocked item once.
  for (let pass = 0; pass < 2; pass += 1) {
    for (const item of [...placed].sort((a, b) => keyOf(a).localeCompare(keyOf(b)))) {
      if (item.locked || keptItems.includes(item)) continue;
      const exercise = exerciseById.get(item.exerciseId);
      if (!exercise) continue;
      // Remove, rescore, re-place.
      taken.set(`${item.day}|${item.slot}`, (taken.get(`${item.day}|${item.slot}`) ?? 1) - 1);
      dayHas.delete(`${item.exerciseId}|${item.day}`);
      dayLoad.set(item.day, (dayLoad.get(item.day) ?? 0) - plannedLoad(exercise));
      const index = placed.indexOf(item);
      placed.splice(index, 1);

      const current = score(exercise, item.day, item.slot) ?? -Infinity;
      const spot = bestPlacement(exercise);
      const target = spot && (score(exercise, spot.day, spot.slot) ?? -Infinity);
      const moveTo =
        spot && target !== null && target > current + 1e-6
          ? spot
          : { day: item.day, slot: item.slot };

      const next: PlannedItem = {
        ...item,
        day: moveTo.day,
        slot: moveTo.slot,
        order: taken.get(`${moveTo.day}|${moveTo.slot}`) ?? 0,
        tentative: daysBetween(today, moveTo.day) >= horizon.firmDays,
      };
      placed.push(next);
      occupy(next.exerciseId, next.day, next.slot, plannedLoad(exercise));
    }
  }

  // Paired exercises ride along: directly after their partner, same slot.
  for (const exercise of inputs.exercises) {
    if (!exercise.pairAfterExerciseId || !exercise.frequencyPerWeek) continue;
    const partners = placed
      .filter((i) => i.exerciseId === exercise.pairAfterExerciseId)
      .sort((a, b) => a.day.localeCompare(b.day));
    const anchorPartners = anchors.filter((a) => a.exerciseId === exercise.pairAfterExerciseId);
    const hosts = [
      ...partners,
      ...anchorPartners.map((a) => ({ day: a.day, slot: a.slot, order: 0 })),
    ].sort((a, b) => a.day.localeCompare(b.day));
    const wanted = Math.round((exercise.frequencyPerWeek / 7) * horizon.tentativeDays);
    for (const host of hosts.slice(0, wanted)) {
      if (dayHas.has(`${exercise.id}|${host.day}`)) continue;
      if (busy.has(`${host.day}|${host.slot}`)) continue;
      const item: PlannedItem = {
        exerciseId: exercise.id,
        day: host.day,
        slot: host.slot,
        order: (host.order ?? 0) + 1,
        tentative: daysBetween(today, host.day) >= horizon.firmDays,
      };
      placed.push(item);
      occupy(exercise.id, host.day, host.slot, plannedLoad(exercise));
    }
  }

  placed.sort(
    (a, b) =>
      a.day.localeCompare(b.day) ||
      SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot) ||
      a.order - b.order ||
      a.exerciseId.localeCompare(b.exerciseId),
  );

  const result: Plan = { items: placed };
  return { plan: result, changes: diff(previous, result, inputs) };
}

/** Every difference between two plans appears in changes (required property). */
export function diff(previous: Plan, next: Plan, inputs: EngineInputs): PlanChange[] {
  const today = inputs.now.day;
  const relevant = (items: readonly PlannedItem[]) =>
    items.filter((i) => daysBetween(today, i.day) >= 0);

  const changes: PlanChange[] = [];
  const prevItems = [...relevant(previous.items)];
  const nextItems = [...relevant(next.items)];

  for (const exerciseId of new Set([...prevItems, ...nextItems].map((i) => i.exerciseId))) {
    const before = prevItems.filter((i) => i.exerciseId === exerciseId);
    const after = nextItems.filter((i) => i.exerciseId === exerciseId);
    const beforeKeys = new Set(before.map(keyOf));
    const afterKeys = new Set(after.map(keyOf));
    const removed = before.filter((i) => !afterKeys.has(keyOf(i)));
    const added = after.filter((i) => !beforeKeys.has(keyOf(i)));

    // Pair removed+added as moves, in deterministic order.
    const pairedAfter = inputs.exercises.find((e) => e.id === exerciseId)?.pairAfterExerciseId;
    const moves = Math.min(removed.length, added.length);
    for (let i = 0; i < moves; i += 1) {
      const from = removed[i];
      const to = added[i];
      if (!from || !to) break;
      // A paired exercise that landed next to its partner moved because of it.
      const movedWithPartner =
        pairedAfter != null &&
        nextItems.some(
          (item) => item.exerciseId === pairedAfter && item.day === to.day && item.slot === to.slot,
        );
      changes.push({
        exerciseId,
        kind: 'moved',
        from: { day: from.day, slot: from.slot },
        to: { day: to.day, slot: to.slot },
        reasons: movedWithPartner
          ? [{ code: 'PAIRED_WITH', exerciseId: pairedAfter }]
          : [{ code: 'BETTER_SPACING' }],
      });
    }
    for (const item of removed.slice(moves)) {
      changes.push({
        exerciseId,
        kind: 'removed',
        from: { day: item.day, slot: item.slot },
        reasons: [{ code: 'HORIZON_ROLLED' }],
      });
    }
    for (const item of added.slice(moves)) {
      changes.push({
        exerciseId,
        kind: 'added',
        to: { day: item.day, slot: item.slot },
        reasons:
          previous.items.length === 0
            ? [{ code: 'NEW_EXERCISE' }]
            : [{ code: 'FREQUENCY', exerciseId }],
      });
    }
  }
  changes.sort((a, b) => a.exerciseId.localeCompare(b.exerciseId));
  return changes;
}
