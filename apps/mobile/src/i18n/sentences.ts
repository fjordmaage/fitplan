/**
 * Every sentence the app says about the plan, filled from the engine's reason
 * codes. The engine never produces free text; the app can only say what the
 * engine actually decided (hard rule in CLAUDE.md). All UI copy lives in this
 * folder so a Danish version stays possible (gap 35).
 */

import type {
  BodyRegion,
  CompletedSession,
  EffortSuggestion,
  Observation,
  PlanChange,
  Reason,
} from '@fitplan/engine';

export interface SentenceContext {
  /** Exercise id -> display name. */
  names: Map<string, string>;
  /** Day string -> short human form ("Thu 8"). */
  shortDay: (day: string) => string;
}

const slotWords = { morning: 'morning', afternoon: 'afternoon', evening: 'evening' } as const;

const regionWords: Record<string, string> = {
  legs: 'legs',
  backAndCore: 'back',
  armsAndShoulders: 'arms and shoulders',
  fingersAndForearms: 'fingers and forearms',
  general: 'body',
};

/** The region's everyday name ("fingers and forearms"). */
export function regionName(region: BodyRegion): string {
  return regionWords[region] ?? region;
}

/** The region as the Body screen lists it ("Fingers and forearms"). */
export function regionHeading(region: BodyRegion): string {
  const headings: Record<BodyRegion, string> = {
    legs: 'Legs',
    backAndCore: 'Back and core',
    armsAndShoulders: 'Arms and shoulders',
    fingersAndForearms: 'Fingers and forearms',
    general: 'Whole body',
  };
  return headings[region];
}

export function reasonSentence(reason: Reason, ctx: SentenceContext): string {
  switch (reason.code) {
    case 'BUSY':
      return `You're busy that ${slotWords[reason.slot]}.`;
    case 'FULL_BREAK':
      return "You're taking a break — nothing gets planned here.";
    case 'ONLY_EASY':
      return "You've asked for only easy sessions right now.";
    case 'COMEBACK':
      return "You're easing back in, so hard sessions wait a little.";
    case 'REGION_NOT_READY':
      return `Your ${regionWords[reason.region]} won't be recovered — ready ${ctx.shortDay(reason.readyOn)}.`;
    case 'REGION_BORDERLINE':
      return `Your ${regionWords[reason.region]} are still a bit loaded.`;
    case 'ALREADY_THAT_DAY':
      return `${ctx.names.get(reason.exerciseId) ?? 'It'} is already on that day.`;
    case 'BACK_TO_BACK':
      return `It would be two days in a row of ${ctx.names.get(reason.exerciseId) ?? 'the same thing'}.`;
    case 'SAME_DAY_HARD':
      return `It's a hard day already, with ${ctx.names.get(reason.otherExerciseId) ?? 'another hard session'}.`;
    case 'DAY_FULL':
      return 'That day is already full.';
    case 'ABOVE_USUAL':
      return "It would push the week above what you're aiming for.";
    case 'TRAINING_GOAL':
      return reason.amount === 'build' || reason.amount === 'push'
        ? "You're building up, and today can take a bit more."
        : "You've set training to ease off for now.";
    case 'BIG_JUMP':
      return "It's a lot more than you've done in one go lately.";
    case 'PAST_DAY':
      return 'That day has passed.';
    case 'GOOD_SPACING':
      return 'It spreads your week out nicely.';
    case 'REGIONS_READY':
      return 'Everything this session uses will be recovered.';
    case 'PREFERRED_TIME':
      return 'Your preferred time of day.';
    case 'FITS_FREQUENCY':
      return 'It keeps you on your weekly rhythm.';
    case 'PAIRED_AFTER':
      return `Right after ${ctx.names.get(reason.exerciseId) ?? 'its partner'}, where it works best.`;
  }
}

/** Today's one line of advice: the first reason of today's first workout. */
export function adviceSentence(reasons: readonly Reason[], ctx: SentenceContext): string {
  const first = reasons[0];
  if (!first) return 'Nothing stands in the way today.';
  return reasonSentence(first, ctx);
}

export function changeSentence(change: PlanChange, ctx: SentenceContext): string {
  const name = ctx.names.get(change.exerciseId) ?? 'A session';
  const why = changeWhy(change, ctx);
  switch (change.kind) {
    case 'moved':
      return `${name} moved to ${ctx.shortDay(change.to!.day)}, ${slotWords[change.to!.slot]}${why}.`;
    case 'added':
      return `${name} was added on ${ctx.shortDay(change.to!.day)}${why}.`;
    case 'removed':
      return `${name} on ${ctx.shortDay(change.from!.day)} was taken out${why}.`;
  }
}

/** The Body screen's verdict words for one region. */
export function readinessWords(
  ready: boolean,
  readyOn: string | undefined,
  ctx: SentenceContext,
  today: string,
): string {
  if (ready) return 'Ready';
  if (!readyOn || readyOn === today) return 'Ready later today';
  return `Ready ${ctx.shortDay(readyOn)}`;
}

/** The timeline's rest-day line when a region is recovering. */
export function recoverySentence(
  regions: readonly BodyRegion[],
  cause: CompletedSession | undefined,
  ctx: SentenceContext,
): string {
  if (regions.length === 0) return 'Rest day';
  const what = regionWords[regions[0]!] ?? regions[0]!;
  if (!cause) return `Recovery — ${what}`;
  const causeName = ctx.names.get(cause.exerciseId) ?? 'training';
  return `Recovery — ${what}, after ${ctx.shortDay(cause.day)}'s ${causeName.toLowerCase()}`;
}

/** The suggested-intensity line ("Keep it easy today — ...") */
export function effortSentence(s: EffortSuggestion, ctx: SentenceContext): string {
  const why = s.reasons[0] ? ` ${reasonSentence(s.reasons[0], ctx)}` : '';
  if (s.direction === 'easier') return `Keep it easier than usual today (${s.effort} of 10).${why}`;
  if (s.direction === 'harder') return `Today can take a bit more (${s.effort} of 10).${why}`;
  return `Your usual effort is right today (${s.effort} of 10).`;
}

/** Plain-language observations for the Body screen. */
export function observationSentence(o: Observation, ctx: SentenceContext): string {
  switch (o.code) {
    case 'GETTING_EASIER':
      return `${ctx.names.get(o.exerciseId) ?? 'One exercise'} is getting easier: the same dose went from effort ${o.earlierEffort} to ${o.recentEffort}.`;
    case 'GETTING_HARDER':
      return `${ctx.names.get(o.exerciseId) ?? 'One exercise'} has felt harder lately: the same dose went from effort ${o.earlierEffort} to ${o.recentEffort}.`;
    case 'SLOW_RECOVERY_REGION':
      return `Your ${regionWords[o.region]} take longer to recover than the starting guess; the app has adjusted.`;
    case 'FAST_RECOVERY_REGION':
      return `Your ${regionWords[o.region]} recover faster than the starting guess; the app has adjusted.`;
  }
}

/** One line describing each effort number, for the after check-in. */
export const effortDescriptions: Record<number, string> = {
  1: 'Barely anything. You could do this all day.',
  2: 'Very light. Breathing easy throughout.',
  3: 'Light. You could talk in full sentences.',
  4: 'Comfortable. You could have kept going for a long time.',
  5: 'Moderate. Working, but in control.',
  6: 'Somewhat hard. Talking comes in shorter sentences.',
  7: 'Hard. You had to concentrate to keep it up.',
  8: 'Very hard. A few words at a time, no more.',
  9: 'Close to your limit. You could not have done much more.',
  10: 'Everything you had.',
};

/** The knock-on clause: ", because ..." from the change's first reason. */
function changeWhy(change: PlanChange, ctx: SentenceContext): string {
  const reason = change.reasons[0];
  if (!reason) return '';
  switch (reason.code) {
    case 'PAIRED_WITH':
      return `, because it works best right after ${ctx.names.get(reason.exerciseId) ?? 'its partner'}`;
    case 'REGION_NOT_READY':
      return ', to give your body time to recover';
    case 'BLOCK_ADDED':
      return ', because you are busy then';
    case 'ANCHOR_CANCELLED':
      return ', after the cancelled session';
    default:
      return '';
  }
}
