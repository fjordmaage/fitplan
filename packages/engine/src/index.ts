/**
 * @fitplan/engine
 *
 * The planning engine: pure TypeScript. No UI, no storage, no platform
 * imports, no randomness, and no clock of its own — "now" is always an input.
 * Same input, same output, always.
 *
 * Sources for every rule: docs/engine-sources.md.
 */

export const ENGINE_VERSION = '0.1.0';

export * from './types';
export * from './params';
export * from './time';
export * from './load';
export * from './recovery';
export * from './rate';
export * from './schedule';
export * from './catalogue';
export * from './demo';
