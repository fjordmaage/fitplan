import { describe, expect, it } from 'vitest';

import { BODY_REGIONS, ENGINE_VERSION, sessionLoad, SLOTS } from '../src/index.js';

describe('sessionLoad', () => {
  it('multiplies minutes by effort', () => {
    expect(sessionLoad(45, 6)).toBe(270);
  });

  it('is zero for a zero-length session', () => {
    expect(sessionLoad(0, 10)).toBe(0);
  });

  it('is deterministic', () => {
    expect(sessionLoad(32, 7)).toBe(sessionLoad(32, 7));
  });

  it.each([
    [-1, 5],
    [30, 0],
    [30, 11],
    [Number.NaN, 5],
  ])('rejects out-of-range input (%s, %s)', (minutes, effort) => {
    expect(() => sessionLoad(minutes, effort)).toThrow(RangeError);
  });
});

describe('shared vocabulary', () => {
  it('names the five regions the recovery model tracks', () => {
    expect(BODY_REGIONS).toHaveLength(5);
    expect(BODY_REGIONS).toContain('fingersAndForearms');
  });

  it('names three slots', () => {
    expect(SLOTS).toEqual(['morning', 'afternoon', 'evening']);
  });

  it('reports a version', () => {
    expect(ENGINE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
