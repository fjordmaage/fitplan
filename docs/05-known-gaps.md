# Known gaps

What is unsolved, unverified or only sketched. Each has either a proposed solution or a plain statement of the problem. Keep this file current: remove items when closed, add new ones as found.

## The engine

1. **None of the intelligence exists.** Every rating, reason, observation and knock-on change in the prototypes is example text or a toy rule. *Solution:* stage 1, before any screen.
2. **Recovery per body region has no reference implementation.** *Problem, partly open:* the model in the engine spec is a reasonable design, but its region weights and half-lives are guesses. *Solution:* source them (stage 1), expose them as named parameters, and let check-ins correct them per user. Expect to tune after real use.
3. **The science has not been checked against primary sources.** The designer could not open the review of the session-effort method, and the claims about the 7-vs-28-day ratio and the weekly-increase rule are from general knowledge. *Solution:* the source check at the start of stage 1.
4. **The `training-load` library is unproven** (no users we know of). *Solution:* verify its maths before depending on it, or reimplement the small part needed.
5. **Scoring weights are undefined.** The engine spec lists what to score, not how much each factor weighs. *Solution:* start with simple weights, tune them against the scenario tests and KL's judgement of the printed plans.
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
20. **Not drawn at all:** setup steps 1, 2, 4 and 5; empty states (no plan yet, nothing today, no history); creating and editing a repeating fixed session; editing or deleting busy time; the "ask me first" proposal view; reminders; the full catalogue browser; the exact-time picker; About you; Voice and sound; Connections; export and backup; error states. *Solution:* build from the existing components and the product spec; show KL each one.
21. **Prototype links are shortcuts.** Start on any workout leads to the back-routine guide; the after check-in always shows a run. Ignore the specific content when a link looks inconsistent.
22. **The plan-updated card can stack up** if several changes happen at once. *Solution:* merge into one card listing all changes; always reachable later in Learn.

## The guide

23. **Only two screens exist** (a timed move and a counted move). Pause, rest between sets, finishing, and resuming after leaving are not drawn.
24. **Lock-screen and notification controls, and voice, are undesigned.** Background audio on Android needs a foreground service and care with battery settings. *Problem:* behaviour varies by phone maker. Test on KL's phone early in stage 5.
25. **Run and climbing guides are ideas only:** spoken interval cues while Strava records; warm-up, rest timers between attempts, hang timers and cool-down for climbing. Do not build GPS tracking.
26. **Generated routines will be generic.** The rules for building them from the catalogue are not written. *Solution:* fixed tables by level; KL edits and saves.

## Data and integrations

27. **Exercise catalogue images.** `github.com/yuhonas/free-exercise-db` is public-domain JSON with 800+ exercises, but there is an open issue asking whether its images are copyrighted. *Solution:* use the text data; treat images as unresolved before any public release. The guide shows a placeholder where the illustration goes.
28. **The catalogue is strength-focused.** Sports (climbing, running, cycling, swimming, PE) need a small hand-written list with load profiles. *Solution:* write about 15 to start.
29. **Health Connect gives only time, distance and calories from Strava.** No pace or heart rate. *Fine for stage 4.* Strava's own API is the later route and is limited to the owner until Strava reviews the app.
30. **Matching imports to planned sessions** (same day, similar type and duration) is unspecified. *Solution:* simple rules, and ask when unsure.
31. **Storage schema is unspecified** beyond "append-only log plus derived tables". Design it in stage 2 with migrations from day one.
32. **"Never delete user data" only holds as far as the phone does.** Everything lives in one SQLite file inside the app's private storage. Uninstalling the app, resetting the phone, or losing it takes the lot, and export does not arrive until stage 3. Stage 2 asks KL to live in the app for a week before that exists. *Solution:* bring a plain "export everything to a file" button forward into stage 2, and decide whether to let Android's own app backup include the database.
33. **wger** has a multilingual catalogue (useful for Danish later) but its code is AGPL and its data is Creative Commons share-alike. *Decide before using.*

## Project

34. **Sixteen screens were designed before any code.** Some will not survive contact with the real engine. Prefer changing a design to bending the engine.
35. **English only.** KL is Danish; a Danish version may be wanted. Keep all UI text in one place from the start.
36. **Publishing** has licence and store implications that have not been looked at (F-Droid, Play Store, the Play Store's own rules, third-party notices). *Partly closed:* the bundled font now ships with its SIL Open Font Licence in `licenses/`. The exercise catalogue and the runtime dependencies are still unlisted.
37. **The Android application id is `com.fjordmaage.fitplan`,** chosen in stage 0 without asking. It is baked into the installed app: changing it later means uninstalling, which by gap 32 destroys the data. *Needs KL's confirmation before stage 2 starts collecting anything real.*
38. **How releases are signed and built is not settled.** `docs/06-development.md` describes building a signed APK by hand on the development machine. Building in CI instead would mean putting the signing key in GitHub's secrets. Losing the key means future versions install as a separate app rather than updating. *Decide before the first APK KL installs without a cable.*
