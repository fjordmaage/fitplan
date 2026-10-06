# Build plan

Build in this order. Each stage ends with something KL can open on his phone and a short list of things for him to try. Do not start a stage until the previous one works on the device. Design is frozen: 16 screens exist. Do not design more before stage 2 is in daily use.

## Stage 0 — Foundations

- Clone `github.com/fjordmaage/fitplan`. Add `LICENSE` (GPL-3.0-or-later), `README.md`, `.gitignore`.
- Monorepo: `packages/engine` (pure TypeScript) and `apps/mobile` (Expo, TypeScript).
- Lint, formatting, type-check, unit tests; CI on every push and pull request.
- A development build running on KL's phone over USB, showing a placeholder screen with the app's font and colours. Walk KL through whatever he must install or enable, one step at a time.
- Decide and document how releases are built (a signed APK he can install without a cable).

**Done when:** KL changes nothing, plugs in, and sees the app start.

## Stage 1 — Engine core

- Source check first: `docs/engine-sources.md` with a citation for each rule, and a note for any rule that does not hold up (see engine spec).
- Data types, load and per-region recovery, the rating function, the scheduler with stability and the frozen window, the change list with reason codes.
- All required tests from the engine spec, including KL's scenario week.
- A tiny command-line or test-screen view that prints a two-week plan for the scenario so KL can sanity-check it.

**Done when:** tests pass and the printed plan for his real week looks sensible to him.

## Stage 2 — The plan you can live in

- Storage: the append-only event log and derived tables. Nothing is ever deleted.
- First-time setup, minimal: fixed sessions, flexible exercises with frequency, goal and amount.
- Plan screen: calendar, timeline, two-way selection, expand and collapse, move sheet with ratings, swap, cancel, lock, the plan-updated card with undo.
- Add sheet: something I did, something I want to do, a fixed session (one-off and repeating), busy time with presets.
- Exercises list and exercise details (frequency, dose, pairing).
- Light and dark from the token table; accent presets.

**Done when:** KL plans a real week in it and uses it daily instead of his old schedule. Stop here for a week of real use and collect what feels wrong before continuing.

## Stage 3 — Feedback loop

- Check-in before and after; effort and soreness feed the engine.
- Body screen; History with filters and totals; export and backup.
- The change log and "why your plan looks like this" (Learn, first two sections).
- Settings: how much to train, when the plan may change, keep the next two days steady.

**Done when:** a "Sore" check-in visibly and explainably changes the next session, and KL can export everything he has entered.

## Stage 4 — Less typing

- Phone calendar as busy time.
- Health Connect import (runs recorded in Strava), matched to planned sessions.
- Reminders: a morning summary and a nudge before a planned slot; quiet by default.

## Stage 5 — The guide

- Import the exercise catalogue (see known gaps on its images).
- Routine designer: let the app design it, ready-made versions, by hand.
- Guide for timed and counted moves; generated routines; warm-up and cool-down.
- Voice cues and tones with the screen off; lock-screen controls.

## Stage 6 — Rounding off

- Not feeling 100% mode. Learn's short reads. Observations on Body.
- Remaining setup steps, empty states, accessibility pass (screen reader, text scaling, contrast), free accent colour and wallpaper matching.
- Progression ("let it grow over time") and suggestions for new exercises.

## Later, if wanted

Strava's own API; run and climbing live guides; publishing (F-Droid suits a GPL app with no trackers; Play Store also possible); iPhone.
