/**
 * Stage 1 bridge between the engine and the Plan screen.
 *
 * "Now" comes from the device here, at the app edge — never inside the engine.
 * The inputs are the engine's demo week (KL's real routine) until storage
 * arrives in stage 2.
 */

import {
  addDays,
  demoInputs,
  plan,
  rate,
  weekday,
  type EngineInputs,
  type PlannedItem,
  type PlanResult,
  type Slot,
} from '@fitplan/engine';

export interface TodayModel {
  inputs: EngineInputs;
  result: PlanResult;
  names: Map<string, string>;
  today: string;
}

export function deviceNow(): { day: string; minutes: number } {
  const now = new Date();
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  return { day, minutes: now.getHours() * 60 + now.getMinutes() };
}

export function mondayOf(day: string): string {
  return addDays(day, -weekday(day));
}

export function buildToday(): TodayModel {
  const now = deviceNow();
  const inputs = demoInputs(now, mondayOf(now.day));
  const result = plan(inputs);
  return {
    inputs,
    result,
    names: new Map(inputs.exercises.map((e) => [e.id, e.name])),
    today: now.day,
  };
}

/** Today's first workout, flexible or fixed, as (exerciseId, day, slot). */
export function firstToday(
  model: TodayModel,
): { exerciseId: string; day: string; slot: Slot; item?: PlannedItem } | undefined {
  const slotOrder: Slot[] = ['morning', 'afternoon', 'evening'];
  const candidates: { exerciseId: string; day: string; slot: Slot; item?: PlannedItem }[] = [];
  for (const item of model.result.plan.items) {
    if (item.day === model.today)
      candidates.push({ exerciseId: item.exerciseId, day: item.day, slot: item.slot, item });
  }
  for (const anchor of model.inputs.anchors) {
    if (!anchor.cancelled && anchor.day === model.today) {
      candidates.push({ exerciseId: anchor.exerciseId, day: anchor.day, slot: anchor.slot });
    }
  }
  candidates.sort((a, b) => slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot));
  return candidates[0];
}

export function ratingAt(model: TodayModel, exerciseId: string, day: string, slot: Slot) {
  const exercise = model.inputs.exercises.find((e) => e.id === exerciseId);
  if (!exercise) return undefined;
  return rate(
    { inputs: model.inputs, plan: model.result.plan, exclude: { exerciseId, day, slot } },
    exercise,
    day,
    slot,
  );
}

export function ratingFor(model: TodayModel, item: PlannedItem) {
  const exercise = model.inputs.exercises.find((e) => e.id === item.exerciseId);
  if (!exercise) return undefined;
  return rate(
    { inputs: model.inputs, plan: model.result.plan, exclude: item },
    exercise,
    item.day,
    item.slot,
  );
}

export interface DayEntry {
  kind: 'fixed' | 'flexible' | 'tentative' | 'busy';
  exerciseId?: string;
  title: string;
  subtitle: string;
  slot: Slot;
  time?: string;
  order: number;
  item?: PlannedItem;
}

/** Everything happening on one day, in slot order. */
export function entriesFor(model: TodayModel, day: string): DayEntry[] {
  const entries: DayEntry[] = [];
  for (const anchor of model.inputs.anchors) {
    if (anchor.cancelled || anchor.day !== day) continue;
    const h = Math.floor(anchor.startMinutes / 60);
    const m = String(anchor.startMinutes % 60).padStart(2, '0');
    const endMinutes = anchor.startMinutes + anchor.durationMinutes;
    const eh = Math.floor(endMinutes / 60);
    const em = String(endMinutes % 60).padStart(2, '0');
    entries.push({
      kind: 'fixed',
      exerciseId: anchor.exerciseId,
      title: model.names.get(anchor.exerciseId) ?? anchor.exerciseId,
      subtitle: `Until ${eh}:${em}`,
      slot: anchor.slot,
      time: `${h}:${m}`,
      order: -1,
    });
  }
  for (const item of model.result.plan.items) {
    if (item.day !== day) continue;
    const exercise = model.inputs.exercises.find((e) => e.id === item.exerciseId);
    entries.push({
      kind: item.tentative ? 'tentative' : 'flexible',
      exerciseId: item.exerciseId,
      title: model.names.get(item.exerciseId) ?? item.exerciseId,
      subtitle: item.tentative
        ? `${exercise?.typicalMinutes ?? '?'} min · day may change`
        : `${exercise?.typicalMinutes ?? '?'} min`,
      slot: item.slot,
      order: item.order,
      item,
    });
  }
  for (const block of model.inputs.blocks) {
    if (block.day !== day) continue;
    for (const slot of block.slots) {
      entries.push({
        kind: 'busy',
        title: 'Busy',
        subtitle: 'Nothing planned around it',
        slot,
        order: 99,
      });
    }
  }
  const slotOrder: Slot[] = ['morning', 'afternoon', 'evening'];
  entries.sort(
    (a, b) => slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot) || a.order - b.order,
  );
  return entries;
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const weekdayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function longDay(day: string): string {
  const [, m, d] = day.split('-').map(Number);
  return `${weekdayNames[weekday(day)]} ${d} ${monthNames[(m ?? 1) - 1]}`;
}

export function shortDay(day: string): string {
  const [, , d] = day.split('-').map(Number);
  return `${weekdayShort[weekday(day)]} ${d}`;
}

export function headingFor(model: TodayModel, day: string): string {
  const diff = Math.round((Date.parse(day) - Date.parse(model.today)) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return `Tomorrow · ${shortDay(day)}`;
  const [, m, d] = day.split('-').map(Number);
  return `${weekdayShort[weekday(day)]} ${d} ${monthNames[(m ?? 1) - 1]}`;
}

/** ISO week number, for the calendar gutter. */
export function isoWeek(day: string): number {
  const date = new Date(Date.parse(day));
  const target = new Date(date.valueOf());
  const dayNumber = (date.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604_800_000);
}
