import { describe, expect, it } from 'vitest';
import { pickForFocus } from '../src/focus';

describe('pickForFocus', () => {
  it('returns activities that actually work the region, most targeted first', () => {
    const picks = pickForFocus('backAndCore');
    expect(picks.length).toBeGreaterThan(0);
    for (const pick of picks) expect(pick.share).toBeGreaterThanOrEqual(0.2);
    for (let i = 1; i < picks.length; i += 1) {
      expect(picks[i - 1]!.share).toBeGreaterThanOrEqual(picks[i]!.share);
    }
  });

  it('finds something for every region', () => {
    for (const region of [
      'legs',
      'backAndCore',
      'armsAndShoulders',
      'fingersAndForearms',
    ] as const) {
      expect(pickForFocus(region).length).toBeGreaterThan(0);
    }
  });

  it('is deterministic', () => {
    expect(pickForFocus('legs')).toEqual(pickForFocus('legs'));
  });
});
