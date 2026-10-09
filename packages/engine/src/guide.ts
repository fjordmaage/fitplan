/**
 * Step-by-step session guides, generated on the spot when no hand-written
 * routine exists. Deterministic templates per activity group: a warm-up, the
 * main work, a cool-down. Timed steps drive the timed guide screen (and
 * voice cues); counted steps drive the sets-and-reps screen.
 *
 * These are generic, sensible session structures — not coaching programmes.
 * The user can always replace them with a routine of his own (routine
 * designer, stage 5).
 */

import { activityTypes, type ActivityType } from './catalogue';
import type { Exercise } from './types';

export type GuidePhase = 'warmup' | 'main' | 'cooldown';

export type GuideStep =
  | { kind: 'timed'; phase: GuidePhase; title: string; detail?: string; seconds: number }
  | {
      kind: 'counted';
      phase: GuidePhase;
      title: string;
      detail?: string;
      sets: number;
      reps: number;
      restSeconds: number;
    };

export interface Guide {
  steps: readonly GuideStep[];
  totalMinutes: number;
}

type Group = ActivityType['group'];

const typeById = new Map(activityTypes.map((t) => [t.id, t]));

/** Which template family an exercise belongs to. */
export function guideGroup(exercise: Exercise): Group {
  const fromCatalogue = exercise.activityTypeId
    ? typeById.get(exercise.activityTypeId)?.group
    : undefined;
  if (fromCatalogue) return fromCatalogue;

  // No catalogue type: infer from the load profile.
  const p = exercise.loadProfile;
  if ((p.fingersAndForearms ?? 0) >= 0.2) return 'climbing';
  if ((p.legs ?? 0) + (p.general ?? 0) >= 0.7) return 'running';
  return 'strength';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function buildGuide(
  exercise: Exercise,
  minutes: number = exercise.typicalMinutes,
  effort: number = exercise.typicalEffort,
): Guide {
  const group = guideGroup(exercise);
  const warm = clamp(Math.round(minutes * 0.15), 5, 12);
  const cool = clamp(Math.round(minutes * 0.1), 4, 8);
  const main = Math.max(5, minutes - warm - cool);
  const steps: GuideStep[] = [];

  const timed = (phase: GuidePhase, title: string, seconds: number, detail?: string) =>
    steps.push(
      detail
        ? { kind: 'timed', phase, title, seconds, detail }
        : { kind: 'timed', phase, title, seconds },
    );
  const counted = (
    phase: GuidePhase,
    title: string,
    sets: number,
    reps: number,
    restSeconds: number,
    detail?: string,
  ) =>
    steps.push(
      detail
        ? { kind: 'counted', phase, title, sets, reps, restSeconds, detail }
        : { kind: 'counted', phase, title, sets, reps, restSeconds },
    );

  switch (group) {
    case 'running':
    case 'cycling':
    case 'swimming':
    case 'outdoor':
    case 'winter':
    case 'water': {
      timed(
        'warmup',
        'Easy pace to start',
        warm * 60,
        'Loose and comfortable — you should be able to talk.',
      );
      if (group === 'running')
        counted('warmup', 'Leg swings and ankle circles', 1, 10, 0, 'Each side.');
      if (effort >= 7) {
        // Hard day: intervals. 2 minutes on, 2 minutes off, as many pairs as fit.
        const pairs = Math.max(3, Math.floor((main * 60) / 240));
        for (let i = 1; i <= pairs; i += 1) {
          timed('main', `Hard effort ${i} of ${pairs}`, 120, 'Strong but controlled.');
          timed('main', 'Easy recovery', 120, 'Shake it out, breathe.');
        }
      } else {
        timed('main', 'Steady work', main * 60, 'Hold an even, sustainable effort.');
      }
      timed(
        'cooldown',
        'Easy pace to finish',
        Math.max(180, (cool - 2) * 60),
        'Let the heart rate come down.',
      );
      timed('cooldown', 'Calf and hip stretches', 120, '30 seconds per side, no bouncing.');
      break;
    }
    case 'climbing': {
      timed(
        'warmup',
        'Easy climbing or traverses',
        warm * 60,
        'Big holds, straight arms, no pump.',
      );
      counted(
        'warmup',
        'Progressively harder problems',
        1,
        4,
        60,
        'Step the difficulty up one at a time.',
      );
      timed('main', 'Main climbing', main * 60, 'Rest fully between attempts on hard problems.');
      timed('cooldown', 'Easy down-climbs', 180, 'Finish on something you can do relaxed.');
      timed('cooldown', 'Forearm and finger stretches', 120, '30 seconds per side.');
      break;
    }
    case 'strength':
    case 'combat': {
      timed(
        'warmup',
        'Joint circles and light cardio',
        warm * 60,
        'Shoulders, hips, knees; break a light sweat.',
      );
      counted(
        'warmup',
        'Warm-up set, light weight',
        1,
        12,
        45,
        'Half your working weight or less.',
      );
      if (effort <= 4)
        counted('main', 'Working sets', 2, 12, 60, 'Light and controlled; two in reserve.');
      else if (effort <= 6)
        counted(
          'main',
          'Working sets',
          3,
          10,
          90,
          'Moderate weight; last reps should feel honest.',
        );
      else if (effort <= 8)
        counted('main', 'Working sets', 4, 8, 120, 'Heavy; keep the form, rest fully.');
      else counted('main', 'Working sets', 5, 5, 180, 'Near maximal; stop a rep short of failure.');
      timed('cooldown', 'Stretch what you worked', cool * 60, '30 seconds per muscle, gently.');
      break;
    }
    case 'mobility': {
      timed('warmup', 'Gentle movement to warm up', warm * 60);
      timed('main', 'Main flow', main * 60, 'Slow, full range, steady breathing.');
      timed('cooldown', 'Rest and breathe', cool * 60);
      break;
    }
    default: {
      // Ball sports, racket sports, dance, school PE: the activity is the
      // session; the guide adds the frame around it.
      timed(
        'warmup',
        'Easy movement and dynamic stretches',
        warm * 60,
        'Jog, skip, swing arms and legs.',
      );
      counted('warmup', 'Short accelerations', 1, 4, 30, 'Build to about 80% speed.');
      timed('main', exercise.name, main * 60);
      timed('cooldown', 'Walk it off and stretch', cool * 60, 'Legs, hips and back.');
      break;
    }
  }

  const totalSeconds = steps.reduce(
    (sum, s) => sum + (s.kind === 'timed' ? s.seconds : s.sets * (s.reps * 3 + s.restSeconds)),
    0,
  );
  return { steps, totalMinutes: Math.round(totalSeconds / 60) };
}
