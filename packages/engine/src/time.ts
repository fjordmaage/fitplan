/**
 * Deterministic day arithmetic on `YYYY-MM-DD` strings.
 *
 * The engine never constructs `new Date()` without arguments and never reads
 * the clock; these helpers use Date.UTC on explicit fields only, so the same
 * input gives the same output in any timezone.
 */

import type { DayString, Instant } from './types';

const DAY_MS = 86_400_000;

function toUtc(day: DayString): number {
  const [y, m, d] = day.split('-').map(Number);
  if (!y || !m || !d) throw new RangeError(`not a day: ${day}`);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms: number): DayString {
  const date = new Date(ms);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(day: DayString, days: number): DayString {
  return fromUtc(toUtc(day) + days * DAY_MS);
}

/** Whole days from a to b (positive when b is later). */
export function daysBetween(a: DayString, b: DayString): number {
  return Math.round((toUtc(b) - toUtc(a)) / DAY_MS);
}

export function isBefore(a: DayString, b: DayString): boolean {
  return daysBetween(a, b) > 0;
}

/** Hours from instant a to instant b. */
export function hoursBetween(a: Instant, b: Instant): number {
  return daysBetween(a.day, b.day) * 24 + (b.minutes - a.minutes) / 60;
}

/** 0 = Monday ... 6 = Sunday, matching the Monday-based calendar. */
export function weekday(day: DayString): number {
  const jsDay = new Date(toUtc(day)).getUTCDay();
  return (jsDay + 6) % 7;
}

/** Each day from `from` for `count` days, in order. */
export function dayRange(from: DayString, count: number): DayString[] {
  const days: DayString[] = [];
  for (let i = 0; i < count; i += 1) days.push(addDays(from, i));
  return days;
}

/** A coarse slot's representative time, minutes from midnight. */
export const slotMinutes = { morning: 9 * 60, afternoon: 14 * 60, evening: 18 * 60 } as const;
