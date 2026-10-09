# Known gaps

What is unsolved, unverified or only sketched. Each has either a proposed solution or a plain statement of the problem. Keep this file current: remove items when closed, add new ones as found.

## The engine

1. **The engine core is broad but young** (updated 10 Oct 2026): load, projected per-region recovery (ratings now see planned sessions, not just history — sources, item 12), rating with fixed precedence, the scheduler, swap alternatives, duration estimates, frequency suggestions, suggested intensity (sources, item 11), observations, generated guides, focus picking, "Not feeling 100%" modes, the goal setting wired into volume/effort/frequency — 102 tests. *Still open:* tune weights and parameters against real use.
2. **Recovery per body region has no reference implementation.** *Problem, partly open:* the model is a reasonable design and its half-lives now have grounding (`docs/engine-sources.md`, items 4–5), but they are still estimates, and the load profiles per activity type remain guesses. *Solution:* named parameters, check-in correction, tune after real use.
3. *Closed 7 Oct 2026.* The science is checked: `docs/engine-sources.md`. Two spec rules were changed by it (the 7-vs-28 ratio is descriptive only; the weekly-increase rule became a per-session jump guard).
4. *Closed 7 Oct 2026.* The `training-load` library is not used: the needed parts (session load, rolling windows) are a few lines each and are reimplemented with their own tests.
5. **Scoring weights are first guesses.** `params.ts` now defines them and the scenario tests pass, but only real use will show whether the plan feels right. *Solution:* tune against KL's judgement of the plans he sees.
6. **"Day may change" needs a rule.** The prototype just dashes everything beyond two weeks. *Solution:* firm for the next 14 days, tentative after; confirm with KL once he uses it.
7. **Risk of over-reaction and of a restless plan.** Users of similar apps complain about both. *Solution:* the stability cost, the frozen window and the "one bad day" cap. These need tests, not just intent.
8. **Reason precedence is undefined.** `rate()` returns a list of reason codes and the UI "turns the top reason into one sentence", but nothing says which reason is top. A day can break several rules at once. *Solution:* a fixed, documented priority order over reason codes in the engine, so the sentence is part of the deterministic output and not an accident of list order. Do this in stage 1 with the rating function.
9. **The engine must learn without becoming non-deterministic.** Check-in correction nudges per-user recovery parameters, but the hard rule is "same input, same output, always". *Solution:* learned parameters are stored data passed in as an input, never hidden state inside the engine. Stage 0 enforces the easy half with a lint rule: the engine package cannot read the clock, call `Math.random`, or import anything from the platform.
10. **The app claims more precision than the model has.** "Ready by tomorrow evening" is a clock-time prediction derived from half-lives that are, by gap 2, guesses. *Proposal:* until there is real data from KL's own check-ins, say how recovered a region is in steps (Ready / Nearly / Not yet) and give a time only when the model has been corrected by enough check-ins to earn it. Needs KL's decision; it changes the Body screen's wording.
11. **Replanning on "the first open of each day" may produce a change card every morning,** which is exactly the restless plan of gap 7. *Solution:* on daily open, replan only if an input actually changed since the last plan (a session completed or skipped, busy time added, a check-in). Opening the app is not by itself a reason to move anything.
12. **Health conditions.** A user may want exercises for a specific condition (a back problem, say). The app cannot choose condition-specific exercises. *Solution:* general back and core routines from the catalogue, plus any prescribed exercises entered by him as custom moves. Never present the app's picks as treatment.

## Design

13. **The first build did not look like the mockups.** The original handoff had only prototype sources that could not be opened, and called them a loose reference. *Solution:* reference images and standalone HTML now exist; follow `06-design-fidelity.md`. The mockups are drawn for one phone size (390 × 844); behaviour on other sizes is undefined beyond "stretch widths, keep sizes".
14. **Dark theme is drawn only for the Plan screen.** *Solution:* apply the token table; check each screen.
15. **Expand and collapse of the calendar is drawn as two states.** It should be one continuous motion with the handle travelling down. *Solution:* animate the card height; the timeline slides out underneath.
16. **Calendar bars are too small to tap individually.** A day is tappable; a single bar is not. *Open question:* is day-level tapping plus the timeline enough? Decide after real use.
17. **Selecting a card to reveal its actions is still a hidden step** for everything except today's first workout. *Solution in place:* that card starts selected and flexible cards carry a small arrow. Watch whether KL finds Move and Swap without being told.
18. **The before check-in is four questions every time.** KL wants it kept as is. *Leave it.* If it becomes a chore, offer "Feeling normal" as a one-tap shortcut later.
19. **The exercises tree has one child per group today,** so it looks heavier than needed. *Solution:* render flat until a group has more than one item.
20. **Not drawn at all** (several now built from existing components, 10 Oct 2026 — setup steps 1/2/4/5, About you, fixed-session creation, busy date/repeat pickers, the recovery marking in the calendar): still missing designs/builds for editing or deleting existing busy time and fixed series, the "ask me first" proposal view, reminders, the exact-time picker for locked items, Voice and sound, Connections, export and backup, error states. *Solution:* build from the existing components and the product spec; show KL each one.
21. **Prototype links are shortcuts.** Start on any workout leads to the back-routine guide; the after check-in always shows a run. Ignore the specific content when a link looks inconsistent.
22. **The plan-updated card can stack up** if several changes happen at once. *Solution:* merge into one card listing all changes; always reachable later in Learn.

## The guide

23. **Only two screens exist** (a timed move and a counted move). Pause, rest between sets, finishing, and resuming after leaving are not drawn.
24. **Lock-screen and notification controls, and voice, are undesigned.** Background audio on Android needs a foreground service and care with battery settings. *Problem:* behaviour varies by phone maker. Test on KL's phone early in stage 5.
25. **Run and climbing guides are ideas only:** spoken interval cues while Strava records; warm-up, rest timers between attempts, hang timers and cool-down for climbing. Do not build GPS tracking.
26. **Generated routines are generic** (rules written 10 Oct 2026: deterministic warm-up / main / cool-down templates per activity group, scaled by duration and effort — `guide.ts`). The moves are session structures, not exercise-by-exercise programmes; the routine designer edits and saves them. *Open:* richer per-move catalogues and illustrations.
26b. **Voice cues are a stored toggle, not yet speech.** The guide's speaker button persists the setting; actual text-to-speech, audio focus and the lock-screen controls are stage 5 work (gap 24).
26c. **"Search all moves, or write your own" in the routine designer is a placeholder.** It says so honestly on tap.

## Data and integrations

27. **Exercise catalogue images.** `github.com/yuhonas/free-exercise-db` is public-domain JSON with 800+ exercises, but there is an open issue asking whether its images are copyrighted. *Solution:* use the text data; treat images as unresolved before any public release. The guide shows a placeholder where the illustration goes.
28. **The catalogue is strength-focused.** Sports (climbing, running, cycling, swimming, PE) need a small hand-written list with load profiles. *Solution:* write about 15 to start.
29. **Health Connect gives only time, distance and calories from Strava.** No pace or heart rate. *Fine for stage 4.* Strava's own API is the later route and is limited to the owner until Strava reviews the app.
30. **Matching imports to planned sessions** (same day, similar type and duration) is unspecified. *Solution:* simple rules, and ask when unsure.
31. *Closed 7 Oct 2026.* Storage is an append-only event log in SQLite (`packages/store` holds the event types and the pure fold to state; the app holds the SQLite adapter), versioned per event for future migrations. Nothing is ever deleted: undo appends an `eventUndone` event. The log→state→plan round trip is property-tested.
31b. **"Use my phone calendar" is a stored switch, not yet a reader** (10 Oct 2026). The Add sheet and Settings store the preference; actually reading calendar events as busy time is stage 4 (Connections). The copy says "once connections arrive" so the app does not overpromise.
31c. **History's Export button is a promise, not a file yet.** Tapping it says so. The export itself is the next piece of stage 3 work (see gap 32).
32. **"Never delete user data" only holds as far as the phone does.** Everything lives in one SQLite file inside the app's private storage. Uninstalling the app, resetting the phone, or losing it takes the lot, and export does not arrive until stage 3. Stage 2 asks KL to live in the app for a week before that exists. *Solution:* bring a plain "export everything to a file" button forward into stage 2, and decide whether to let Android's own app backup include the database.
33. **wger** has a multilingual catalogue (useful for Danish later) but its code is AGPL and its data is Creative Commons share-alike. *Decide before using.*

## Project

34. **Sixteen screens were designed before any code.** Some will not survive contact with the real engine. Prefer changing a design to bending the engine.
35. **English only.** KL is Danish; a Danish version may be wanted. Keep all UI text in one place from the start.
36. **Publishing** has licence and store implications that have not been looked at (F-Droid, Play Store, the Play Store's own rules, third-party notices). *Partly closed:* the bundled font now ships with its SIL Open Font Licence in `licenses/`. The exercise catalogue and the runtime dependencies are still unlisted.
37. **The Android application id is `com.fjordmaage.fitplan`,** chosen in stage 0 without asking. It is baked into the installed app: changing it later means uninstalling, which by gap 32 destroys the data. *Needs KL's confirmation before stage 2 starts collecting anything real.*
38. **Swapping can add a catalogue exercise the user never configured.** Picking a catalogue alternative in the swap sheet adds it with a frequency of once a week; the user may not realise it will now recur. *Decide:* should a swap-in be one-off by default? Needs KL's feel after use.
39. **How releases are signed and built is not settled.** `docs/06-development.md` describes building a signed APK by hand on the development machine. Building in CI instead would mean putting the signing key in GitHub's secrets. Losing the key means future versions install as a separate app rather than updating. *Decide before the first APK KL installs without a cable.*
