/**
 * Expanding repeating things into the concrete occurrences the engine plans
 * with. A series is stored once; occurrences are derived, never stored, so
 * editing or removing a series can never corrupt history.
 *
 * Occurrence ids are `${seriesId}@${day}`, which is what
 * `anchorOccurrenceCancelled` records when one occurrence is cancelled.
 */

import {
  addDays,
  dayRange,
  weekday,
  type Anchor,
  type Block,
  type DayString,
} from '@fitplan/engine';

import type { AppState } from './state';

export function occurrenceId(seriesId: string, day: DayString): string {
  return `${seriesId}@${day}`;
}

/** Explicit blocks plus series occurrences, over `days` days from `from`. */
export function expandedBlocks(state: AppState, from: DayString, days: number): Block[] {
  const out: Block[] = [...state.blocks];
  for (const series of state.blockSeries) {
    for (const day of dayRange(from, days)) {
      if (weekday(day) !== series.weekday) continue;
      if (day < series.fromDay) continue;
      if (series.untilDay && day > series.untilDay) continue;
      out.push({ id: occurrenceId(series.id, day), day, slots: series.slots });
    }
  }
  return out;
}

/**
 * Explicit anchors plus series occurrences, over `days` days from `from`,
 * including the recent past (so recovery projection knows last week's fixed
 * sessions happened).
 */
export function expandedAnchors(
  state: AppState,
  from: DayString,
  days: number,
  pastDays = 28,
): Anchor[] {
  const out: Anchor[] = [...state.anchors];
  const start = addDays(from, -pastDays);
  for (const series of state.anchorSeries) {
    for (const day of dayRange(start, days + pastDays)) {
      if (weekday(day) !== series.weekday) continue;
      if (day < series.fromDay) continue;
      if (series.untilDay && day > series.untilDay) continue;
      const id = occurrenceId(series.id, day);
      const anchor: Anchor = {
        id,
        exerciseId: series.exerciseId,
        day,
        slot: series.slot,
        startMinutes: series.startMinutes,
        durationMinutes: series.durationMinutes,
      };
      if (state.cancelledAnchorIds.has(id)) anchor.cancelled = true;
      out.push(anchor);
    }
  }
  return out;
}
