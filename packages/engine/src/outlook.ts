/**
 * The recovery outlook: day by day, which regions are still recovering and
 * from what. This is what makes recovery *visible* — the calendar marks
 * recovery days, the timeline names the region and the session that caused
 * it, and the Body screen draws the curves.
 *
 * Unlike recoveryAt (history only), the outlook projects the current plan
 * forward: planned items and anchors are assumed done at their typical dose,
 * so a rest day after Wednesday's climbing shows as finger recovery *before*
 * the session has happened.
 */

import { fatigueAt, toReadiness, halfLifeHours } from './recovery';
import { heavyRegionShare, readiness as readinessParams } from './params';
import { sessionLoadOf, usualDailyLoad } from './load';
import { addDays, dayRange, hoursBetween, isBefore, slotMinutes } from './time';
import type { BodyRegion, CompletedSession, DayString, EngineInputs, Instant, Plan } from './types';
import { BODY_REGIONS } from './types';

export interface RegionOutlook {
  /** 0-1, at that day's morning. */
  readiness: number;
  /** Below the ready threshold: the body is still working on it. */
  recovering: boolean;
}

export interface DayOutlook {
  day: DayString;
  regions: Record<BodyRegion, RegionOutlook>;
  /** Regions still recovering that morning, worst first. */
  recovering: readonly BodyRegion[];
}

/**
 * History plus the plan ahead, as if every planned session happens at its
 * typical dose. Future sessions whose exercise already has a completed
 * session that day are skipped (already done, not done twice).
 *
 * This is what lets the engine *mean* recovery: rating Thursday for climbing
 * must know Wednesday's climbing is going to happen.
 */
export function projectedSessions(
  inputs: EngineInputs,
  plan: Plan,
  skipAnchor?: (anchor: EngineInputs['anchors'][number]) => boolean,
): CompletedSession[] {
  const done = new Set(inputs.history.map((s) => `${s.exerciseId}:${s.day}`));
  const byId = new Map(inputs.exercises.map((e) => [e.id, e]));
  const projected: CompletedSession[] = [...inputs.history];

  // Anchors count on past days too: a fixed session is assumed to have
  // happened unless it was cancelled or a real log replaced it. Flexible
  // items only count ahead — in the past they only count once logged.
  const future = [
    ...inputs.anchors
      .filter((a) => !a.cancelled && !skipAnchor?.(a))
      .map((a) => ({ exerciseId: a.exerciseId, day: a.day })),
    ...plan.items
      .filter((i) => !isBefore(i.day, inputs.now.day))
      .map((i) => ({ exerciseId: i.exerciseId, day: i.day })),
  ];
  for (const f of future) {
    if (done.has(`${f.exerciseId}:${f.day}`)) continue;
    const exercise = byId.get(f.exerciseId);
    if (!exercise) continue;
    projected.push({
      exerciseId: f.exerciseId,
      day: f.day,
      minutes: exercise.typicalMinutes,
      effort: exercise.typicalEffort,
    });
  }
  return projected;
}

/** The outlook for `days` days starting today, given the current plan. */
export function recoveryOutlook(inputs: EngineInputs, plan: Plan, days: number): DayOutlook[] {
  const typical = usualDailyLoad(inputs.history, inputs.now.day);
  const sessions = projectedSessions(inputs, plan);

  return dayRange(inputs.now.day, days).map((day) => {
    const at: Instant = { day, minutes: slotMinutes.morning };
    const fatigue = fatigueAt(sessions, inputs.exercises, at, inputs.learned);
    const regions = Object.fromEntries(
      BODY_REGIONS.map((region) => {
        const value = toReadiness(fatigue[region], typical);
        return [region, { readiness: value, recovering: value < readinessParams.ready }];
      }),
    ) as Record<BodyRegion, RegionOutlook>;
    const recovering = BODY_REGIONS.filter((r) => regions[r].recovering).sort(
      (a, b) => regions[a].readiness - regions[b].readiness,
    );
    return { day, regions, recovering };
  });
}

/**
 * The session a region is mostly recovering from at `at` — the one still
 * contributing the most decayed fatigue. Lets the app say "after Tuesday's
 * climbing" instead of just "recovering".
 */
export function mainRecoveryCause(
  inputs: EngineInputs,
  plan: Plan,
  region: BodyRegion,
  at: Instant,
): CompletedSession | undefined {
  const byId = new Map(inputs.exercises.map((e) => [e.id, e]));
  let best: CompletedSession | undefined;
  let bestContribution = 0;
  for (const session of projectedSessions(inputs, plan)) {
    const hours = hoursBetween({ day: session.day, minutes: slotMinutes.evening }, at);
    if (hours < 0) continue;
    const share = byId.get(session.exerciseId)?.loadProfile[region] ?? 0;
    if (share === 0) continue;
    const contribution =
      sessionLoadOf(session) * share * Math.pow(0.5, hours / halfLifeHours(region, inputs.learned));
    if (contribution > bestContribution) {
      bestContribution = contribution;
      best = session;
    }
  }
  return best;
}

/**
 * Days ahead (including today) where recovery is deliberately happening:
 * some region is still recovering and nothing planned or anchored that day
 * loads it heavily. If the user climbs again anyway, that day is not finger
 * recovery. Used for the calendar's recovery marking and the rest-day lines.
 */
export function recoveryDays(
  inputs: EngineInputs,
  plan: Plan,
  days: number,
): Map<DayString, readonly BodyRegion[]> {
  const byId = new Map(inputs.exercises.map((e) => [e.id, e]));
  const outlook = recoveryOutlook(inputs, plan, days);
  const out = new Map<DayString, readonly BodyRegion[]>();
  for (const entry of outlook) {
    if (entry.recovering.length === 0) continue;
    const dayExercises = [
      ...inputs.anchors.filter((a) => !a.cancelled && a.day === entry.day),
      ...plan.items.filter((i) => i.day === entry.day),
    ]
      .map((x) => byId.get(x.exerciseId))
      .filter((e) => e != null);
    const resting = entry.recovering.filter((region) =>
      dayExercises.every((e) => (e.loadProfile[region] ?? 0) < heavyRegionShare),
    );
    if (resting.length > 0) out.set(entry.day, resting);
  }
  return out;
}

/** First day every region is ready, scanning up to 14 days out. */
export function allReadyOn(inputs: EngineInputs, plan: Plan): DayString {
  const outlook = recoveryOutlook(inputs, plan, 14);
  for (const entry of outlook) {
    if (entry.recovering.length === 0) return entry.day;
  }
  return addDays(inputs.now.day, 14);
}
