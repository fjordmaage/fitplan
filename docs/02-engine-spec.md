# Engine spec

The engine is the product. Everything "intelligent" in the prototypes (ratings, reasons, "the app noticed", knock-on moves) is example text or a toy rule written for the mockup. None of it exists yet. Build this first, as a pure TypeScript package with its own tests, before any screen.

No off-the-shelf engine does this. Two open-source references cover parts of it:

- **Load maths:** `github.com/m27w/training-load` (MIT, TypeScript, no dependencies): session-effort load, heart-rate load, 7-day vs 28-day load ratio, monotony and strain, and a fitness-fatigue model. It is unproven (no stars at the time of writing). Read it, check its formulas against the original papers, and either depend on it or reimplement the parts needed. It is retrospective only: no body regions, no scheduling.
- **Scheduling approach:** FluidCalendar (MIT) schedules tasks by generating free slots and scoring each with weighted factors, deterministically. Same approach as below. It is a server app, so it is a design reference, not a dependency.

Recovery per body region feeding a scheduler has no open reference we found. That part is ours.

## Honest limits

These models are useful heuristics, not predictions. The source check is done: see `docs/engine-sources.md` (7 October 2026) for what each rule rests on. Two rules from the original draft did not survive it: the 7-day vs 28-day ratio carries no evidence as an injury predictor and is now purely descriptive ("less / about / more than your usual"), and the ~10%-per-week increase rule has no support — the evidenced risk is a single session far beyond anything recent, so the guard is per-session (`BIG_JUMP`). Recovery times per region are grounded estimates, not measurements. Design the engine so that the user's own check-ins correct it over time, and so that every number is a named, documented parameter in one place (`params.ts`).

## Inputs

- **Profile:** age, height, weight, sex, training background, goal, training amount (Recover / Lighter / Steady / Build / Push).
- **Exercises:** each with type, load profile (below), dose (distance, duration or moves), usual effort, target frequency (N per 7 days, or "app decides"), preferred time of day, pairing ("do right after X"), progression on/off.
- **Anchors**, **blocks**, **locked floaters**: fixed in time.
- **History:** completed sessions with duration and effort; check-ins; imports.
- **Now.**

## Load and recovery model

1. **Session load** = duration in minutes × effort (1–10). For a planned session, use the exercise's usual effort and estimated duration; replace with real values when done.
2. **Load profile.** Each activity type spreads its load across body regions with weights that sum to 1. Regions: legs, back and core, arms and shoulders, fingers and forearms, plus a whole-body "general" channel for overall fatigue. Example starting profiles (guesses, to be checked): running → mostly legs, some general; gym climbing → fingers and forearms, arms and shoulders, back, some general; back routine → back and core. Catalogue exercises derive a profile from their primary and secondary muscles.
3. **Fatigue per region** rises by the region's share of each session's load and decays over time. Start with exponential decay with a per-region half-life. Starting half-lives are guesses to be sourced; connective tissue (fingers) recovers slower than large muscles.
4. **Readiness per region** is a 0–1 value derived from fatigue relative to what that user usually carries. "Ready" above a threshold; otherwise report the time it will cross it ("Ready by tomorrow evening").
5. **Check-in correction.** A before-check-in ("Sore" where the model says "Ready") overrides the estimate now and nudges that region's personal recovery rate a little. One check-in must not swing parameters: use slow learning, and cap the effect on the plan to the next one or two sessions.
6. **Overall load** over 7 days against the user's own typical 28-day level, shown as "less than / about / more than your usual" — a description, never an injury warning (see sources, item 2). Training amount shifts the target: Steady holds it; Build raises it gradually as a pacing choice; Recover and Lighter reduce it. The real safety guard is per-session: a planned dose far beyond anything in the last 30 days rates OK at best, with reason `BIG_JUMP` (sources, item 3).

## Rating function

`rate(activity, day, slot) → { level: good | ok | avoid, reasons[] }`. Used everywhere: the move sheet, swap alternatives, adding a move to a routine, choosing a frequency.

- **Avoid** if a hard rule breaks: overlaps busy time, the same activity is already on that day, a region it loads heavily is well below ready, or the user is in a "full break" mode.
- **OK** if only soft rules are strained: back-to-back with the same activity, same day as a heavy fixed session, a loaded region is borderline, the day's total load is high, overall load would drift above the usual range.
- **Good** otherwise.

Each reason is a code plus values (`REGION_NOT_READY { region: forearms, readyAt }`, `BACK_TO_BACK { with }`, `BUSY { slot }`…). The UI turns the top reason into one sentence from a template. Never free text from the engine.

## Scheduler

`plan(inputs, previousPlan) → { plan, changes[] }`.

- **Horizon:** 14 days placed firmly, then up to 6 weeks tentatively (pattern-based, shown dashed).
- **Hard constraints:** never overlap a block; never move an anchor or a locked floater; never place two of the same exercise on one day; respect pairings (the paired exercise goes directly after its partner in the same slot); respect "full break" and similar modes.
- **Score to maximise,** per candidate placement and summed over the plan: region readiness at that time; spacing between repeats of the same exercise (even spread beats clumps); meeting each exercise's frequency; keeping day load reasonable; sequencing rules (hard sessions not back to back, easy day after a hard one); time-of-day preference; **pattern** (prefer the same weekday and slot as recent weeks, so a rhythm emerges); and **stability** (a cost for every difference from `previousPlan`, heavier the sooner the day).
- **Frozen window:** with "Keep the next 2 days steady" on, the engine does not move anything in the next two days by itself. User edits and cancellations still apply.
- **Method:** the problem is tiny (a handful of floaters, 14 days × 3 slots). Greedy placement in priority order followed by local improvement (try moving or swapping one item, keep if the score improves) is enough. No solver library needed. Must be deterministic: break ties by a fixed order.
- **Output changes:** a list of what moved, appeared or disappeared compared with `previousPlan`, each with reason codes. The "Plan updated" card and the change log are rendered from this list and nothing else.

## Replanning triggers

A check-in; a session completed, skipped or logged; an anchor cancelled or added; busy time added or removed (including from the calendar); a user move, swap or lock; a settings change (amount, goal, frequency); entering or leaving "Not feeling 100%"; and the first open of each day.

How a change is applied depends on the setting: ask first (show the proposal, apply on accept), change then tell (apply, show the card with Undo), or only tell about big changes (apply; show the card only if something within the next few days moved). Every change is logged in all three modes.

## Behaviour rules learned from other apps' users

- Never adapt silently, and always allow undo.
- Time off must reorganise the plan around it, not just delete what was there. After a long break, do not schedule a rest block right after.
- One bad day adjusts the next session or two, not the whole plan.
- Illness and bad weeks get an explicit mode with a chosen way back.

## Other engine outputs

- **Today's advice:** one sentence for today's first workout, from its top reasons.
- **Observations:** simple trends over history (effort falling for the same dose; a region recovering slower than the default), each from a fixed rule with a minimum amount of data.
- **Duration estimates:** median of recent completions of that exercise, falling back to the exercise's default.
- **Frequency suggestion** when the user picks "app decides".
- **Alternatives for a swap:** activities with a similar load profile or purpose, each rated for that day and slot, with a line on what the swap would do to the rest of the plan.
- **Generated routines:** warm-up, main moves, cool-down chosen from the catalogue by region, level and equipment, with sets and rests from fixed tables.

## Required tests

Unit tests for every formula. Property tests that hold for any input: nothing is ever placed in busy time; anchors and locked floaters never move; nothing in the frozen window moves without a user action; the same input always gives the same plan; every difference between two plans appears in `changes`. Scenario tests from KL's real week:

- Climbing Mon and Wed 17:00, two 6 km runs, back routine paired after runs → runs land on non-climbing days with a rest day kept.
- Wednesday climbing cancelled → flexible sessions redistribute, and the change list says so.
- Busy all weekend added → Saturday's run moves earlier or later, not deleted.
- "Sore" forearms on a climbing day → advice changes; the run is unaffected.
- A PE class added on a planned run day → the run is rated OK or moved, with the reason.
