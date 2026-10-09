import { describe, expect, it } from 'vitest';

import { emptyState } from '../src/state';
import { expandedAnchors, expandedBlocks, occurrenceId } from '../src/expand';

const MON = '2026-10-05';

describe('expandedBlocks', () => {
  it('turns a weekly series into one block per matching weekday', () => {
    const state = emptyState();
    state.blockSeries.push({ id: 'work', weekday: 0, slots: ['morning', 'afternoon'], fromDay: MON });
    const blocks = expandedBlocks(state, MON, 14);
    expect(blocks).toHaveLength(2); // two Mondays in 14 days
    expect(blocks[0]!.day).toBe('2026-10-05');
    expect(blocks[1]!.day).toBe('2026-10-12');
    expect(blocks[0]!.slots).toEqual(['morning', 'afternoon']);
  });

  it('respects fromDay and untilDay', () => {
    const state = emptyState();
    state.blockSeries.push({
      id: 'course',
      weekday: 2,
      slots: ['evening'],
      fromDay: '2026-10-07',
      untilDay: '2026-10-14',
    });
    const days = expandedBlocks(state, MON, 28).map((b) => b.day);
    expect(days).toEqual(['2026-10-07', '2026-10-14']);
  });

  it('keeps explicit one-off blocks alongside series', () => {
    const state = emptyState();
    state.blocks.push({ id: 'b1', day: '2026-10-06', slots: ['evening'] });
    state.blockSeries.push({ id: 'work', weekday: 0, slots: ['morning'], fromDay: MON });
    expect(expandedBlocks(state, MON, 7)).toHaveLength(2);
  });
});

describe('expandedAnchors', () => {
  it('expands a weekly fixed session with exact time, into the past too', () => {
    const state = emptyState();
    state.anchorSeries.push({
      id: 'climb-mon',
      exerciseId: 'climb',
      weekday: 0,
      slot: 'evening',
      startMinutes: 17 * 60,
      durationMinutes: 120,
      fromDay: '2026-09-07',
    });
    const anchors = expandedAnchors(state, MON, 14);
    // 28 past days + 14 ahead = 6 Mondays from 2026-09-07.
    expect(anchors.length).toBeGreaterThanOrEqual(6);
    expect(anchors.every((a) => a.startMinutes === 17 * 60)).toBe(true);
  });

  it('marks a cancelled occurrence without touching the rest', () => {
    const state = emptyState();
    state.anchorSeries.push({
      id: 'climb-mon',
      exerciseId: 'climb',
      weekday: 0,
      slot: 'evening',
      startMinutes: 17 * 60,
      durationMinutes: 120,
      fromDay: MON,
    });
    state.cancelledAnchorIds.add(occurrenceId('climb-mon', '2026-10-12'));
    const anchors = expandedAnchors(state, MON, 14, 0);
    const cancelled = anchors.filter((a) => a.cancelled);
    expect(cancelled).toHaveLength(1);
    expect(cancelled[0]!.day).toBe('2026-10-12');
  });
});
