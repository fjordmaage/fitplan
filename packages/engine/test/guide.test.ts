import { describe, expect, it } from 'vitest';
import { buildGuide, guideGroup } from '../src/guide';
import { activityTypes } from '../src/catalogue';
import { climbing, run, backRoutine } from './helpers';

describe('guideGroup', () => {
  it('uses the catalogue group when the exercise came from it', () => {
    const fromCatalogue = { ...run, activityTypeId: 'strength-heavy' };
    // Whatever group that id has in the catalogue wins over the profile.
    const type = activityTypes.find((t) => t.id === 'strength-heavy');
    if (type) expect(guideGroup(fromCatalogue)).toBe(type.group);
  });

  it('infers sensibly from the load profile otherwise', () => {
    expect(guideGroup(climbing)).toBe('climbing');
    expect(guideGroup(run)).toBe('running');
  });
});

describe('buildGuide', () => {
  it('always has a warm-up, main work and cool-down', () => {
    for (const exercise of [climbing, run, backRoutine]) {
      const guide = buildGuide(exercise);
      const phases = new Set(guide.steps.map((s) => s.phase));
      expect(phases.has('warmup')).toBe(true);
      expect(phases.has('main')).toBe(true);
      expect(phases.has('cooldown')).toBe(true);
    }
  });

  it('gives intervals on a hard endurance day and steady work on an easy one', () => {
    const easy = buildGuide(run, 40, 4);
    const hard = buildGuide(run, 40, 8);
    expect(easy.steps.filter((s) => s.phase === 'main')).toHaveLength(1);
    expect(hard.steps.filter((s) => s.phase === 'main').length).toBeGreaterThan(2);
  });

  it('scales strength sets with effort', () => {
    const { activityTypeId: _omit, ...plainBack } = backRoutine;
    const light = buildGuide(plainBack, 30, 3);
    const heavy = buildGuide(plainBack, 30, 9);
    const mainOf = (g: typeof light) => g.steps.find((s) => s.phase === 'main');
    const lightMain = mainOf(light);
    const heavyMain = mainOf(heavy);
    expect(lightMain?.kind).toBe('counted');
    expect(heavyMain?.kind).toBe('counted');
    if (lightMain?.kind === 'counted' && heavyMain?.kind === 'counted') {
      expect(heavyMain.sets).toBeGreaterThan(lightMain.sets);
      expect(heavyMain.reps).toBeLessThan(lightMain.reps);
    }
  });

  it('builds a guide for every catalogue type without throwing', () => {
    for (const type of activityTypes) {
      const guide = buildGuide({
        id: type.id,
        name: type.name,
        activityTypeId: type.id,
        loadProfile: type.loadProfile,
        typicalMinutes: type.typicalMinutes,
        typicalEffort: type.typicalEffort,
      });
      expect(guide.steps.length).toBeGreaterThanOrEqual(3);
      expect(guide.totalMinutes).toBeGreaterThan(0);
    }
  });

  it('is deterministic', () => {
    expect(buildGuide(run, 40, 8)).toEqual(buildGuide(run, 40, 8));
  });
});
