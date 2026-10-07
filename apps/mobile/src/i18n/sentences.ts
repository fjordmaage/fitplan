/**
 * Every sentence the app says about the plan, filled from the engine's reason
 * codes. The engine never produces free text; the app can only say what the
 * engine actually decided (hard rule in CLAUDE.md). All UI copy lives in this
 * folder so a Danish version stays possible (gap 35).
 */

import type { PlanChange, Reason } from '@fitplan/engine';

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

export function reasonSentence(reason: Reason, ctx: SentenceContext): string {
  switch (reason.code) {
    case 'BUSY':
      return `You're busy that ${slotWords[reason.slot]}.`;
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
      return 'It would push the week above what you usually do.';
    case 'BIG_JUMP':
      return "It's a lot more than you've done in one go lately.";
    case 'PAST_DAY':
      return 'That day has passed.';
    case 'GOOD_SPACING':
      return 'It spreads your week out nicely.';
    case 'REGIONS_READY':
      return 'Everything it works is recovered.';
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
  switch (change.kind) {
    case 'moved':
      return `${name} moved to ${ctx.shortDay(change.to!.day)}, ${slotWords[change.to!.slot]}.`;
    case 'added':
      return `${name} was added on ${ctx.shortDay(change.to!.day)}.`;
    case 'removed':
      return `${name} on ${ctx.shortDay(change.from!.day)} was taken out.`;
  }
}
