import { describe, expect, it } from 'vitest';

import { observations } from '../src/observe';
import { run } from './helpers';

function sessions(efforts: number[], minutes = 40) {
  return efforts.map((effort, i) => ({
    exerciseId: 'run',
    day: `2026-09-${String(i + 1).padStart(2, '0')}`,
    minutes,
    effort,
  }));
}

describe('observations', () => {
  it('needs a minimum of data before claiming a trend', () => {
    expect(observations([run], sessions([7, 6, 5]))).toEqual([]);
  });

  it('sees the same dose getting easier', () => {
    const out = observations([run], sessions([7, 7, 7, 5, 5, 5]));
    expect(out).toEqual([
      { code: 'GETTING_EASIER', exerciseId: 'run', earlierEffort: 7, recentEffort: 5 },
    ]);
  });

  it('says nothing when the dose changed too', () => {
    const grew = [
      ...sessions([7, 7, 7], 40).slice(0, 3),
      ...sessions([5, 5, 5], 70).map((s, i) => ({ ...s, day: `2026-09-1${i}` })),
    ];
    expect(observations([run], grew)).toEqual([]);
  });

  it('reports a region learned to recover slower', () => {
    const out = observations([run], [], { halfLifeFactor: { fingersAndForearms: 1.4 } });
    expect(out).toEqual([{ code: 'SLOW_RECOVERY_REGION', region: 'fingersAndForearms' }]);
  });

  it('is deterministic', () => {
    const history = sessions([7, 7, 7, 5, 5, 5]);
    expect(observations([run], history)).toEqual(observations([run], history));
  });
});
