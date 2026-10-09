/**
 * Fatigue and readiness per body region.
 *
 * Each completed session adds its region share of load to that region's
 * fatigue; fatigue decays exponentially with a per-region half-life
 * (docs/engine-sources.md, items 4-5). Readiness maps fatigue to 0-1 relative
 * to what this user typically carries, so the same absolute load matters less
 * for someone who trains more.
 */

import {
  checkInLearning,
  defaultHalfLifeHours,
  fatigueScale,
  readiness as readinessParams,
} from './params';
import { hoursBetween, addDays, slotMinutes } from './time';
import { sessionLoadOf, usualDailyLoad } from './load';
import type {
  BodyRegion,
  CheckIn,
  CompletedSession,
  DayString,
  EngineInputs,
  Exercise,
  Instant,
  LearnedParams,
  Soreness,
} from './types';
import { BODY_REGIONS } from './types';

export interface RegionState {
  /** Raw decayed fatigue in load units. */
  fatigue: number;
  /** 0-1; 1 is fully ready. */
  readiness: number;
  ready: boolean;
  /** First day the region crosses the ready threshold, if not ready now. */
  readyOn?: DayString;
}

export type RecoveryState = Record<BodyRegion, RegionState>;

export function halfLifeHours(region: BodyRegion, learned?: LearnedParams): number {
  const factor = Math.min(
    checkInLearning.maxFactor,
    Math.max(checkInLearning.minFactor, learned?.halfLifeFactor?.[region] ?? 1),
  );
  return defaultHalfLifeHours[region] * factor;
}

function decayFactor(hours: number, halfLife: number): number {
  return Math.pow(0.5, hours / halfLife);
}

/** Decayed fatigue per region at `at`, from history up to that instant. */
export function fatigueAt(
  history: readonly CompletedSession[],
  exercises: readonly Exercise[],
  at: Instant,
  learned?: LearnedParams,
): Record<BodyRegion, number> {
  const profiles = new Map(exercises.map((e) => [e.id, e.loadProfile]));
  const out = Object.fromEntries(BODY_REGIONS.map((r) => [r, 0])) as Record<BodyRegion, number>;

  for (const session of history) {
    // Sessions count from their day's evening slot unless they are today.
    const when: Instant = { day: session.day, minutes: slotMinutes.evening };
    const hours = hoursBetween(when, at);
    if (hours < 0) continue;
    const profile = profiles.get(session.exerciseId);
    if (!profile) continue;
    const load = sessionLoadOf(session);
    for (const [region, share] of Object.entries(profile) as [BodyRegion, number][]) {
      out[region] += load * share * decayFactor(hours, halfLifeHours(region, learned));
    }
  }
  return out;
}

/**
 * Map fatigue to readiness relative to the user's own typical daily load:
 * carrying one typical day of load on a region costs `typicalDayImpact`
 * readiness; readiness floors at 0.
 */
export function toReadiness(fatigue: number, typicalDailyLoad: number): number {
  const scale = Math.max(typicalDailyLoad, fatigueScale.minTypicalDailyLoad);
  const impact = (fatigue / scale) * fatigueScale.typicalDayImpact;
  return Math.max(0, Math.min(1, 1 - impact));
}

/**
 * A before-check-in overrides the estimate now: "sore" caps readiness below
 * borderline, "a bit sore" caps it below ready, "fresh" lifts it to ready.
 * The override applies while the check-in is fresh (same day).
 */
function applyCheckIn(readinessValue: number, soreness: Soreness | undefined): number {
  switch (soreness) {
    case 'sore':
      return Math.min(readinessValue, readinessParams.borderline - 0.05);
    case 'bitSore':
      return Math.min(readinessValue, readinessParams.ready - 0.05);
    case 'fresh':
      return Math.max(readinessValue, readinessParams.ready);
    default:
      return readinessValue;
  }
}

export function recoveryAt(inputs: EngineInputs, at: Instant): RecoveryState {
  const typical = usualDailyLoad(inputs.history, at.day);
  const fatigue = fatigueAt(inputs.history, inputs.exercises, at, inputs.learned);
  const todayCheckIn = inputs.checkIns.findLast((c) => c.day === at.day);

  const state = {} as RecoveryState;
  for (const region of BODY_REGIONS) {
    let value = toReadiness(fatigue[region], typical);
    if (todayCheckIn) value = applyCheckIn(value, todayCheckIn.soreness[region]);
    const ready = value >= readinessParams.ready;
    const entry: RegionState = { fatigue: fatigue[region], readiness: value, ready };
    if (!ready) {
      entry.readyOn = firstReadyDay(inputs, region, at, typical);
    }
    state[region] = entry;
  }
  return state;
}

/** Walk forward (no new sessions assumed) to the first day the region is ready. */
function firstReadyDay(
  inputs: EngineInputs,
  region: BodyRegion,
  from: Instant,
  typicalDailyLoad: number,
): DayString {
  let day = from.day;
  for (let i = 0; i < 14; i += 1) {
    day = addDays(from.day, i);
    const at: Instant = { day, minutes: slotMinutes.morning };
    if (i === 0) continue; // not ready today by definition
    const fatigue = fatigueAt(inputs.history, inputs.exercises, at, inputs.learned);
    if (toReadiness(fatigue[region], typicalDailyLoad) >= readinessParams.ready) return day;
  }
  return day;
}

/**
 * Slow learning from one check-in (sources: one check-in must not swing
 * parameters). When the model says ready but the user is sore, that region
 * recovers slower than assumed: lengthen its half-life a step. When the model
 * says not ready but the user is fresh, shorten it. Returns the new factors;
 * the app stores them and passes them back in as `learned`.
 */
export function learnFromCheckIn(
  inputs: EngineInputs,
  checkIn: CheckIn,
): NonNullable<LearnedParams['halfLifeFactor']> {
  const at: Instant = { day: checkIn.day, minutes: checkIn.atMinutes };
  const typical = usualDailyLoad(inputs.history, checkIn.day);
  const fatigue = fatigueAt(inputs.history, inputs.exercises, at, inputs.learned);
  const factors = { ...(inputs.learned?.halfLifeFactor ?? {}) };

  for (const [region, soreness] of Object.entries(checkIn.soreness) as [BodyRegion, Soreness][]) {
    const modelled = toReadiness(fatigue[region], typical);
    const current = factors[region] ?? 1;
    let next = current;
    if (soreness === 'sore' && modelled >= readinessParams.ready) {
      next = current * (1 + checkInLearning.halfLifeNudge);
    } else if (soreness === 'fresh' && modelled < readinessParams.borderline) {
      next = current * (1 - checkInLearning.halfLifeNudge);
    }
    factors[region] = Math.min(
      checkInLearning.maxFactor,
      Math.max(checkInLearning.minFactor, next),
    );
  }
  return factors;
}
