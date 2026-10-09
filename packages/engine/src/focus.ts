/**
 * Picking exercises for a focus the user was given — typically a region a
 * doctor or physio said to strengthen ("do more for your back"). The engine
 * only picks and places; what the focus *is* comes from the user (hard rule:
 * not medical advice).
 */

import { activityTypes, type ActivityType } from './catalogue';
import type { BodyRegion } from './types';

export interface FocusCandidate {
  type: ActivityType;
  /** Share of the activity's load that lands on the focus region. */
  share: number;
}

/**
 * Catalogue activities that work the region, most targeted first; gentler
 * options rank above harder ones at equal share, so the natural entry point
 * comes first. Deterministic order.
 */
export function pickForFocus(region: BodyRegion, limit = 6): FocusCandidate[] {
  return activityTypes
    .map((type) => ({ type, share: type.loadProfile[region] ?? 0 }))
    .filter((c) => c.share >= 0.2)
    .sort(
      (a, b) =>
        b.share - a.share ||
        a.type.typicalEffort - b.type.typicalEffort ||
        a.type.id.localeCompare(b.type.id),
    )
    .slice(0, limit);
}
