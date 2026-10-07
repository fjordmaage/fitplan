/**
 * Print a two-week plan for KL's real week, so a human can sanity-check what
 * the engine decides. Run with: npm run -w @fitplan/engine print-plan
 */

import { plan } from '../src/schedule';
import { rate } from '../src/rate';
import { recoveryAt } from '../src/recovery';
import { loadVersusUsual } from '../src/load';
import { dayRange, weekday } from '../src/time';
import { BODY_REGIONS, SLOTS, type EngineInputs } from '../src/types';
import { backRoutine, climbing, klAnchors, klHistory, run } from '../test/helpers';

const inputs: EngineInputs = {
  now: { day: '2026-10-06', minutes: 9 * 60 },
  profile: { trainingAmount: 'steady' },
  exercises: [climbing, run, backRoutine],
  anchors: klAnchors(),
  blocks: [],
  history: klHistory(),
  checkIns: [],
};

const { plan: result, changes } = plan(inputs);
const names = new Map(inputs.exercises.map((e) => [e.id, e.name]));
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

console.log(
  `\nKL's week, planned ${inputs.now.day} (load vs usual: ${loadVersusUsual(inputs.history, inputs.now.day)})\n`,
);

for (const day of dayRange(inputs.now.day, 14)) {
  const anchors = inputs.anchors.filter((a) => !a.cancelled && a.day === day);
  const items = result.items.filter((i) => i.day === day);
  const label = `${weekdays[weekday(day)]} ${day}`;
  if (anchors.length === 0 && items.length === 0) {
    console.log(`${label}  — rest day`);
    continue;
  }
  const parts: string[] = [];
  for (const slot of SLOTS) {
    for (const a of anchors.filter((x) => x.slot === slot)) {
      parts.push(`${slot}: ${names.get(a.exerciseId)} (fixed)`);
    }
    for (const i of items.filter((x) => x.slot === slot).sort((a, b) => a.order - b.order)) {
      const rating = rate(
        { inputs, plan: result, exclude: i },
        inputs.exercises.find((e) => e.id === i.exerciseId)!,
        day,
        slot,
      );
      parts.push(
        `${slot}: ${names.get(i.exerciseId)}${i.tentative ? ' (day may change)' : ''} [${rating.level}: ${rating.reasons[0]?.code ?? '-'}]`,
      );
    }
  }
  console.log(`${label}  ${parts.join('; ')}`);
}

console.log('\nRecovery now:');
const recovery = recoveryAt(inputs, inputs.now);
for (const region of BODY_REGIONS) {
  const r = recovery[region];
  console.log(
    `  ${region.padEnd(20)} ${(r.readiness * 100).toFixed(0).padStart(3)}%  ${r.ready ? 'ready' : `ready ${r.readyOn}`}`,
  );
}

console.log(`\nChanges from an empty plan: ${changes.length}`);
