# Product spec

## The idea

Most planners make you pick days. This one asks what you do at fixed times and what you want to fit in, then does the planning itself. It tracks how recovered each part of your body is, places flexible workouts where they fit best, moves them when something changes, and tells you why. The user should be able to trust it like a sensible personal trainer: it does its own work, and takes you along.

Audience: everyday people training for health. Not competitive athletes. First user: KL, who climbs at a gym on fixed evenings, runs about 6 km twice a week, does a back routine, and has occasional PE classes.

## Vocabulary (use these words in code and UI)

| Concept | UI word | Meaning |
|---|---|---|
| Anchor | Fixed | A session at a set time the app never moves (climbing Mon and Wed 17:00, a PE class). One-off or repeating. Can be cancelled, which triggers a replan. |
| Floater | Flexible | Something the user wants done at some frequency. The app places and moves it. The user can move it, swap it, or lock it. |
| Locked floater | Flexible with a lock | A floater the user pinned. The app plans around it like an anchor until unlocked. |
| Tentative | "Day may change" | A floater more than about a week out. Shown dashed. The app expects to do it around then but has not committed. |
| Block | Busy | Time the user is unavailable: one-off, a date range, or repeating. Can come from the phone calendar. |
| Logged | Something I did | Unplanned activity added afterwards. Counts toward load and recovery. |
| Check-in | Check-in | Soreness and energy before a workout; effort and pain after. |
| Rating | Good / OK / Avoid | How well an option (a day, a swap, a move, a frequency) fits body and schedule. Always shown with the word and a one-line reason. |

Time of day is coarse: morning, afternoon, evening. A flexible workout sits in one of those and has an order within it. The user may give it an exact time. Fixed sessions always have an exact time. Every workout shows an estimated duration.

## Screens

Prototypes for all of these are in `docs/design/` (see `docs/03-design-system.md`). Five bottom tabs: Plan, Exercises, Add (centre button), Body, Learn.

### Plan (home)

Two zones.

**Calendar (top, fixed).** Monday-based grid, two weeks, week numbers in a left gutter. Each day has three slots (am, pm, eve). A slot shows a bar per activity in it: solid dark = fixed, accent fill = flexible, dashed outline = tentative, hatched = busy. Two activities in one slot show as two bars side by side. Today's date is a filled circle; past days are dimmed.

- A handle under the grid ("Look further ahead") expands the calendar in place to six weeks, pushing the handle to the bottom of the screen ("Show less"). This should animate as one continuous motion.
- Tapping a day, in either state, collapses the calendar to the two weeks containing that day, selects it, and scrolls the timeline to it.
- When collapsed, the calendar shows the two weeks containing the selected day.

**Timeline (below, scrolls indefinitely).** One group per day starting today: a day heading, then one row per activity with its time (or "Morning" etc.) on the left and a card on the right. Rest days show a thin "Rest day" line. Today's group carries one line of advice from the engine.

- Tapping a card selects it: it gets a ring, its bar in the calendar gets a ring, and its actions appear under it. Today's next workout starts selected so the actions are visible on first open.
- Actions for a flexible workout: **Start** (today only), **Move**, **Swap**. For a fixed one: **Cancel this one**.
- Selection is two-way: selecting in the timeline highlights the calendar, tapping in the calendar scrolls the timeline.

**Move sheet.** Slides up over the plan. Shows a two-week day grid mirroring the calendar, each day rated Good / OK / Avoid for this workout, with a one-line reason for the selected day. Then time of day (three choices), "Set an exact time", and "Lock in place". The save button names what it will do ("Move to Thu 8, afternoon"). Also "I already did it" and "Keep as it is". Ratings update when the time of day changes.

**Swap sheet.** "Do something else": alternatives to this workout, each rated with a reason. Tapping one replaces the workout. Also "Design my own" (opens the routine designer) and "Keep as it is".

**Plan updated card.** After any change, by the user or the app: first "Replanning…", then "Plan updated" with what changed and why, including knock-on changes ("Your back routine moved with it, because it works best right after a run"), with **Undo** and **Looks good**. This is the main trust mechanism. It must always be truthful: list every activity that moved.

### Add (centre button)

A sheet with: Something I did (log), Something I want to do (new flexible), A fixed session (one-off or repeating), and I'm busy with one-tap presets (This evening, Tomorrow, This weekend, Pick dates, Repeating). A switch for "Use my phone calendar". Adding busy time must be at most two taps or the user will not do it.

### Exercises

Three sections, in this order: **Doing now**, **Could pick up**, **Done before**.

- Doing now: grouped by type (Running, Climbing, Strength and mobility, School…), each group listing the concrete exercises under it with their marker (fixed or flexible), frequency and duration. Design as a tree, but it may render flat while the list is short.
- Could pick up: suggestions from the catalogue, grouped the same way, with Add. Plus "Browse the full catalogue".
- Done before: archived exercises with when they were last done and Resume.

**Exercise details.** How often (a stepper, "N times a week", with a rating for the chosen number and "Let the app decide how often"), distance or dose, usual effort, estimated duration (learned from history), best time of day, "do right after it" (pairs, e.g. back routine after a run), "let it grow over time" (progression on or off), how much help during it (None / Checklist / Full guide), totals so far, Pause for a while, Stop doing this.

**Routine designer** (for exercises made of several moves). Three ways in, from least to most effort:
1. **Let the app design it**: the app picks and refreshes moves to suit goal, level and recovery.
2. **Ready-made versions**: short, standard, long.
3. **By hand**: reorder moves, set sets / reps / hold time / rest per move, swap or remove a move, add from a rated list, search the catalogue, or write your own move.

### Workout flow

1. **Check-in before** (keep as designed; the owner likes having a say): Legs, Back, Arms and fingers each Fresh / A bit sore / Sore, and Energy Low / Normal / High. Then a verdict line and three exits: Start with the guide, I'll do it on my own, Not feeling 100%?
2. **Guide** (optional): one move at a time. Timed moves show a large countdown with previous / pause / next. Counted moves show the dose ("10 each side"), set N of M, and a large "Done with this set", plus Back / Skip move / Too hard. Both show progress across moves, what is next, a voice toggle, and "Finish now".
   - Works with the screen off through spoken cues and tones, lowering music while speaking. Needs lock-screen / notification controls.
   - If a routine has no step-by-step yet, generate one on the spot from the catalogue by fixed rules (warm-up, main moves, cool-down; sets and rests scaled to level). The user can edit and save it.
   - Warm-up and cool-down are attached automatically to sessions that need them and counted in the duration.
3. **Check-in after**: effort 1 to 10 with a one-line description of the chosen number, "Did anything hurt?" chips, an optional note, and a line saying what this means for the plan.

Three levels of involvement, chosen per exercise: tick it done afterwards; a checklist; the full guide. The app must be fully usable without ever opening the guide.

### Body

Recovery right now per body region (a bar and words: "Ready", "Ready by tomorrow evening"), marked as an estimate, with what it is based on and a "Correct this" button. Training load for the last 7 days against the user's usual. Plain-language observations ("your 6 km runs are getting easier"). Recent sessions, linking to History. A "Not feeling 100%" button.

### History

Every session, check-in, note, skip and plan change, newest first, grouped by month, filterable by type, with totals and Export.

### Learn

"Why your plan looks like this" (today's decisions explained), "What the app changed" (the change log with reasons), and short reads relevant to the user's current training, including "How the app estimates recovery".

### Not feeling 100%

What's going on (Ill / Aches or pain / Busy period / Just tired), what should change (Only easy sessions / Shorter sessions / A full break / Keep fixed sessions, drop the rest), for how long (3 days / 1 week / Until I say), coming back (Slowly / Balanced / Quickly). Applies as a temporary mode over the plan. Always shows the line about seeing a doctor or physio for sharp or lasting pain.

### Goals and settings

- How much to train: Recover / Lighter / Steady / Build / Push, with a sentence saying what the current choice means in sessions and load.
- Goal (set by the user; general fitness by default).
- When the plan needs to change: Ask me first / Change it, then tell me why (default) / Only tell me about big changes. Plus "Keep the next 2 days steady".
- Look: same as phone / light / dark; accent colour (presets, any colour, or match wallpaper).
- About you (age, height, weight, sex, training background), Voice and sound, Reminders, Connections (Health Connect, calendar), Your data (export, back up).

### First-time setup

Five short steps, each skippable and changeable later: about you; your fixed sessions; what you want to fit in; when you're busy (offer the phone calendar); your goal and how much to train. Only step 3 is drawn. End by showing the first generated plan with its reasons.

## Data and statistics

Everything the user enters and everything that happens is stored permanently on the phone and can be retrieved later:

- every planned, completed, skipped, moved, swapped and cancelled session, with times, duration, distance and effort
- every check-in (before and after), pain report and note
- every plan change, who made it (user or app) and the reason
- settings and profile changes over time (weight, goal, training amount)
- imported activities, tagged with their source

Store this as an append-only event log plus derived tables, so history can never be lost by a later edit. Export the whole log as a file (JSON, and CSV for sessions). Provide backup and restore.

## Integrations

- **Health Connect (first).** Strava on Android writes time, distance and calories for GPS activities to Health Connect. Read those to log runs automatically. Match imports to planned sessions; ask only for effort afterwards.
- **Phone calendar.** Read events as busy time. Never write to it unless the user asks.
- **Strava's own API (later, optional).** Richer data (pace, heart rate). A new Strava app can only connect its owner; more than 10 users needs Strava's review. Not needed for personal use.
- **Manual logging** stays three fields: what, how long (or how far), how hard.

## Out of scope

Diet tracking and recommendations (dropped). Social features. Accounts or cloud sync. Coaching for competitive athletes. iPhone, for now.
