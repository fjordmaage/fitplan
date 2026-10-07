import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import { addDays, dayRange, daysBetween, hoursBetween, weekday } from '../src/time';

const day = fc
  .date({ min: new Date('2000-01-01'), max: new Date('2100-01-01'), noInvalidDate: true })
  .map((d) => d.toISOString().slice(0, 10));

describe('day arithmetic', () => {
  it('adds and subtracts days', () => {
    expect(addDays('2026-10-05', 2)).toBe('2026-10-07');
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('is Monday-based', () => {
    expect(weekday('2026-10-05')).toBe(0); // a Monday
    expect(weekday('2026-10-11')).toBe(6); // a Sunday
  });

  it('round-trips: daysBetween(a, addDays(a, n)) === n', () => {
    fc.assert(
      fc.property(day, fc.integer({ min: -1000, max: 1000 }), (a, n) => {
        expect(daysBetween(a, addDays(a, n))).toBe(n);
      }),
    );
  });

  it('builds ranges in order', () => {
    expect(dayRange('2026-10-05', 3)).toEqual(['2026-10-05', '2026-10-06', '2026-10-07']);
  });

  it('measures hours across days', () => {
    expect(
      hoursBetween({ day: '2026-10-05', minutes: 600 }, { day: '2026-10-06', minutes: 540 }),
    ).toBe(23);
  });
});
