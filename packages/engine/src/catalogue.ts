/**
 * Built-in activity types with load profiles.
 *
 * KL asked for the engine to work with every sport he can or could think of,
 * so this list is deliberately broad. Every profile is an estimate (gap 2):
 * shares of a session's load across the five regions, summing to 1. Users'
 * own exercises reference one of these types or carry a custom profile.
 *
 * `typicalMinutes` and `typicalEffort` are only defaults for a first session;
 * the app learns real durations from history (engine spec, "Duration
 * estimates").
 */

import type { LoadProfile } from './types';
import { validateProfile } from './load';

export interface ActivityType {
  id: string;
  name: string;
  group:
    | 'running'
    | 'cycling'
    | 'swimming'
    | 'climbing'
    | 'strength'
    | 'mobility'
    | 'ballSports'
    | 'racketSports'
    | 'combat'
    | 'outdoor'
    | 'winter'
    | 'water'
    | 'dance'
    | 'school';
  loadProfile: LoadProfile;
  typicalMinutes: number;
  typicalEffort: number;
}

export const activityTypes: readonly ActivityType[] = [
  // Running
  {
    id: 'run-easy',
    name: 'Running (easy)',
    group: 'running',
    loadProfile: { legs: 0.7, general: 0.3 },
    typicalMinutes: 40,
    typicalEffort: 4,
  },
  {
    id: 'run-intervals',
    name: 'Running (intervals)',
    group: 'running',
    loadProfile: { legs: 0.7, general: 0.3 },
    typicalMinutes: 40,
    typicalEffort: 8,
  },
  {
    id: 'trail-run',
    name: 'Trail running',
    group: 'running',
    loadProfile: { legs: 0.7, backAndCore: 0.1, general: 0.2 },
    typicalMinutes: 60,
    typicalEffort: 6,
  },
  {
    id: 'sprint',
    name: 'Sprinting',
    group: 'running',
    loadProfile: { legs: 0.75, general: 0.25 },
    typicalMinutes: 30,
    typicalEffort: 9,
  },

  // Cycling and similar
  {
    id: 'cycling-road',
    name: 'Cycling (road)',
    group: 'cycling',
    loadProfile: { legs: 0.65, backAndCore: 0.1, general: 0.25 },
    typicalMinutes: 60,
    typicalEffort: 5,
  },
  {
    id: 'cycling-commute',
    name: 'Cycling (commute)',
    group: 'cycling',
    loadProfile: { legs: 0.65, general: 0.35 },
    typicalMinutes: 25,
    typicalEffort: 3,
  },
  {
    id: 'mtb',
    name: 'Mountain biking',
    group: 'cycling',
    loadProfile: { legs: 0.5, armsAndShoulders: 0.15, backAndCore: 0.1, general: 0.25 },
    typicalMinutes: 75,
    typicalEffort: 6,
  },
  {
    id: 'spinning',
    name: 'Spinning / indoor bike',
    group: 'cycling',
    loadProfile: { legs: 0.7, general: 0.3 },
    typicalMinutes: 45,
    typicalEffort: 7,
  },

  // Swimming and water
  {
    id: 'swim',
    name: 'Swimming',
    group: 'swimming',
    loadProfile: { armsAndShoulders: 0.4, backAndCore: 0.2, legs: 0.15, general: 0.25 },
    typicalMinutes: 45,
    typicalEffort: 5,
  },
  {
    id: 'open-water',
    name: 'Open water swimming',
    group: 'swimming',
    loadProfile: { armsAndShoulders: 0.4, backAndCore: 0.2, legs: 0.1, general: 0.3 },
    typicalMinutes: 40,
    typicalEffort: 6,
  },
  {
    id: 'rowing',
    name: 'Rowing',
    group: 'water',
    loadProfile: { legs: 0.3, backAndCore: 0.3, armsAndShoulders: 0.2, general: 0.2 },
    typicalMinutes: 40,
    typicalEffort: 6,
  },
  {
    id: 'kayak',
    name: 'Kayaking / canoeing',
    group: 'water',
    loadProfile: { armsAndShoulders: 0.35, backAndCore: 0.3, general: 0.35 },
    typicalMinutes: 60,
    typicalEffort: 5,
  },
  {
    id: 'surf',
    name: 'Surfing',
    group: 'water',
    loadProfile: { armsAndShoulders: 0.35, backAndCore: 0.25, legs: 0.1, general: 0.3 },
    typicalMinutes: 90,
    typicalEffort: 6,
  },
  {
    id: 'sup',
    name: 'Stand-up paddling',
    group: 'water',
    loadProfile: { backAndCore: 0.3, armsAndShoulders: 0.25, legs: 0.15, general: 0.3 },
    typicalMinutes: 60,
    typicalEffort: 4,
  },

  // Climbing
  {
    id: 'climb-gym',
    name: 'Climbing (gym, ropes)',
    group: 'climbing',
    loadProfile: {
      fingersAndForearms: 0.35,
      armsAndShoulders: 0.25,
      backAndCore: 0.2,
      general: 0.2,
    },
    typicalMinutes: 120,
    typicalEffort: 6,
  },
  {
    id: 'boulder',
    name: 'Bouldering',
    group: 'climbing',
    loadProfile: {
      fingersAndForearms: 0.4,
      armsAndShoulders: 0.25,
      backAndCore: 0.15,
      general: 0.2,
    },
    typicalMinutes: 90,
    typicalEffort: 7,
  },
  {
    id: 'climb-outdoor',
    name: 'Climbing (outdoors)',
    group: 'climbing',
    loadProfile: {
      fingersAndForearms: 0.35,
      armsAndShoulders: 0.2,
      backAndCore: 0.15,
      legs: 0.1,
      general: 0.2,
    },
    typicalMinutes: 180,
    typicalEffort: 6,
  },
  {
    id: 'hangboard',
    name: 'Hangboard session',
    group: 'climbing',
    loadProfile: { fingersAndForearms: 0.7, armsAndShoulders: 0.2, general: 0.1 },
    typicalMinutes: 30,
    typicalEffort: 7,
  },

  // Strength and mobility
  {
    id: 'strength-full',
    name: 'Strength (full body)',
    group: 'strength',
    loadProfile: { legs: 0.3, backAndCore: 0.25, armsAndShoulders: 0.25, general: 0.2 },
    typicalMinutes: 60,
    typicalEffort: 7,
  },
  {
    id: 'strength-upper',
    name: 'Strength (upper body)',
    group: 'strength',
    loadProfile: {
      armsAndShoulders: 0.45,
      backAndCore: 0.25,
      fingersAndForearms: 0.1,
      general: 0.2,
    },
    typicalMinutes: 50,
    typicalEffort: 7,
  },
  {
    id: 'strength-lower',
    name: 'Strength (legs)',
    group: 'strength',
    loadProfile: { legs: 0.6, backAndCore: 0.2, general: 0.2 },
    typicalMinutes: 50,
    typicalEffort: 7,
  },
  {
    id: 'back-routine',
    name: 'Back routine',
    group: 'strength',
    loadProfile: { backAndCore: 0.8, general: 0.2 },
    typicalMinutes: 15,
    typicalEffort: 3,
  },
  {
    id: 'core',
    name: 'Core routine',
    group: 'strength',
    loadProfile: { backAndCore: 0.75, general: 0.25 },
    typicalMinutes: 20,
    typicalEffort: 4,
  },
  {
    id: 'hiit',
    name: 'HIIT / circuit',
    group: 'strength',
    loadProfile: { legs: 0.3, armsAndShoulders: 0.2, backAndCore: 0.15, general: 0.35 },
    typicalMinutes: 30,
    typicalEffort: 8,
  },
  {
    id: 'crossfit',
    name: 'CrossFit',
    group: 'strength',
    loadProfile: {
      legs: 0.25,
      armsAndShoulders: 0.25,
      backAndCore: 0.2,
      fingersAndForearms: 0.05,
      general: 0.25,
    },
    typicalMinutes: 60,
    typicalEffort: 8,
  },
  {
    id: 'calisthenics',
    name: 'Calisthenics',
    group: 'strength',
    loadProfile: { armsAndShoulders: 0.35, backAndCore: 0.25, legs: 0.15, general: 0.25 },
    typicalMinutes: 45,
    typicalEffort: 6,
  },
  {
    id: 'yoga',
    name: 'Yoga',
    group: 'mobility',
    loadProfile: { backAndCore: 0.3, legs: 0.2, armsAndShoulders: 0.15, general: 0.35 },
    typicalMinutes: 45,
    typicalEffort: 3,
  },
  {
    id: 'pilates',
    name: 'Pilates',
    group: 'mobility',
    loadProfile: { backAndCore: 0.45, legs: 0.15, general: 0.4 },
    typicalMinutes: 45,
    typicalEffort: 4,
  },
  {
    id: 'stretching',
    name: 'Stretching',
    group: 'mobility',
    loadProfile: { general: 1 },
    typicalMinutes: 20,
    typicalEffort: 2,
  },
  {
    id: 'physio',
    name: 'Physio exercises',
    group: 'mobility',
    loadProfile: { general: 1 },
    typicalMinutes: 20,
    typicalEffort: 3,
  },

  // Ball sports
  {
    id: 'football',
    name: 'Football',
    group: 'ballSports',
    loadProfile: { legs: 0.6, general: 0.4 },
    typicalMinutes: 90,
    typicalEffort: 7,
  },
  {
    id: 'basketball',
    name: 'Basketball',
    group: 'ballSports',
    loadProfile: { legs: 0.55, armsAndShoulders: 0.1, general: 0.35 },
    typicalMinutes: 60,
    typicalEffort: 7,
  },
  {
    id: 'volleyball',
    name: 'Volleyball',
    group: 'ballSports',
    loadProfile: { legs: 0.4, armsAndShoulders: 0.25, general: 0.35 },
    typicalMinutes: 60,
    typicalEffort: 6,
  },
  {
    id: 'handball',
    name: 'Handball',
    group: 'ballSports',
    loadProfile: { legs: 0.45, armsAndShoulders: 0.2, general: 0.35 },
    typicalMinutes: 60,
    typicalEffort: 7,
  },

  // Racket sports
  {
    id: 'tennis',
    name: 'Tennis',
    group: 'racketSports',
    loadProfile: { legs: 0.4, armsAndShoulders: 0.25, backAndCore: 0.1, general: 0.25 },
    typicalMinutes: 60,
    typicalEffort: 6,
  },
  {
    id: 'badminton',
    name: 'Badminton',
    group: 'racketSports',
    loadProfile: { legs: 0.45, armsAndShoulders: 0.2, general: 0.35 },
    typicalMinutes: 60,
    typicalEffort: 6,
  },
  {
    id: 'padel',
    name: 'Padel',
    group: 'racketSports',
    loadProfile: { legs: 0.4, armsAndShoulders: 0.2, general: 0.4 },
    typicalMinutes: 60,
    typicalEffort: 5,
  },
  {
    id: 'table-tennis',
    name: 'Table tennis',
    group: 'racketSports',
    loadProfile: { legs: 0.25, armsAndShoulders: 0.25, general: 0.5 },
    typicalMinutes: 45,
    typicalEffort: 4,
  },
  {
    id: 'squash',
    name: 'Squash',
    group: 'racketSports',
    loadProfile: { legs: 0.5, armsAndShoulders: 0.2, general: 0.3 },
    typicalMinutes: 45,
    typicalEffort: 7,
  },

  // Combat and dance
  {
    id: 'martial-arts',
    name: 'Martial arts',
    group: 'combat',
    loadProfile: { legs: 0.3, armsAndShoulders: 0.25, backAndCore: 0.2, general: 0.25 },
    typicalMinutes: 75,
    typicalEffort: 7,
  },
  {
    id: 'boxing',
    name: 'Boxing training',
    group: 'combat',
    loadProfile: { armsAndShoulders: 0.35, backAndCore: 0.2, legs: 0.2, general: 0.25 },
    typicalMinutes: 60,
    typicalEffort: 8,
  },
  {
    id: 'dance',
    name: 'Dancing',
    group: 'dance',
    loadProfile: { legs: 0.5, backAndCore: 0.15, general: 0.35 },
    typicalMinutes: 60,
    typicalEffort: 5,
  },

  // Outdoor and winter
  {
    id: 'hike',
    name: 'Hiking',
    group: 'outdoor',
    loadProfile: { legs: 0.65, backAndCore: 0.1, general: 0.25 },
    typicalMinutes: 150,
    typicalEffort: 4,
  },
  {
    id: 'walk',
    name: 'Walking',
    group: 'outdoor',
    loadProfile: { legs: 0.6, general: 0.4 },
    typicalMinutes: 45,
    typicalEffort: 2,
  },
  {
    id: 'xc-ski',
    name: 'Cross-country skiing',
    group: 'winter',
    loadProfile: { legs: 0.4, armsAndShoulders: 0.2, backAndCore: 0.15, general: 0.25 },
    typicalMinutes: 75,
    typicalEffort: 6,
  },
  {
    id: 'alpine-ski',
    name: 'Alpine skiing',
    group: 'winter',
    loadProfile: { legs: 0.6, backAndCore: 0.15, general: 0.25 },
    typicalMinutes: 180,
    typicalEffort: 5,
  },
  {
    id: 'skate',
    name: 'Skating',
    group: 'winter',
    loadProfile: { legs: 0.65, backAndCore: 0.1, general: 0.25 },
    typicalMinutes: 60,
    typicalEffort: 5,
  },

  // School
  {
    id: 'pe-class',
    name: 'PE class',
    group: 'school',
    loadProfile: { legs: 0.4, armsAndShoulders: 0.15, general: 0.45 },
    typicalMinutes: 60,
    typicalEffort: 5,
  },
];

// Fail at import time if any profile does not sum to 1.
for (const type of activityTypes) validateProfile(type.loadProfile);

export function activityType(id: string): ActivityType | undefined {
  return activityTypes.find((t) => t.id === id);
}
