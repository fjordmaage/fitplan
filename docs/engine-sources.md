# Engine sources

The source check required by the engine spec, done 7 October 2026. Each rule
the engine uses is listed with what the research actually supports, and what
the engine therefore does. Where a rule in the original spec did not hold up,
the spec has been changed in the same commit and the change is noted here.

Verdicts: **supported** (keep), **heuristic** (use, but present as estimate and
let check-ins correct it), **not supported** (the spec was wrong; changed).

## 1. Session load = duration × effort — supported

Foster's session-RPE method: the session's rating of perceived exertion (1–10)
multiplied by its duration in minutes. Validated against heart-rate-based load
across many sports, sexes, ages and skill levels, including in a dedicated
review.

- Foster et al., *A new approach to monitoring exercise training*, J Strength
  Cond Res 15(1), 2001.
- Haddad et al., *Session-RPE Method for Training Load Monitoring: Validity,
  Ecological Usefulness, and Influencing Factors*, Front Neurosci 11:612, 2017.
  <https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5673663/>

Engine: `sessionLoad = minutes × effort`, with the user's "usual effort" for
planned sessions and the reported effort for completed ones. Unchanged.

## 2. The 7-day vs 28-day ratio — not supported as a warning

The acute:chronic workload ratio's claimed "sweet spot" and injury prediction
have been dismantled: the famous figure came from bucketed data, the time
windows have no physiological justification, and reanalyses find no predictive
value.

- Impellizzeri et al., *Acute:Chronic Workload Ratio: Conceptual Issues and
  Fundamental Pitfalls*, Int J Sports Physiol Perform 15(6), 2020.
  <https://journals.humankinetics.com/view/journals/ijspp/15/6/article-p907.xml>
- Impellizzeri & Woodcock, *The acute-chronic workload ratio-injury figure and
  its 'sweet spot' are flawed*, BJSM letter, 2019.

**Spec changed.** The engine still compares the last 7 days with the user's own
28-day typical level, but only as a plain description ("more than your usual"),
never as an injury warning, never with a threshold presented as safe or unsafe.
The Body screen wording must not imply the app can predict injury.

## 3. "No more than ~10% more per week" — not supported

A randomised trial found the same injury rate with 10% and 24% weekly
increases in novice runners; cohort analyses find no weekly-increase threshold.
What does show an association is a **single session** much longer than anything
recent (one run >10% longer than the longest in the last 30 days).

- Buist et al., *No effect of a graded training program on the number of
  running-related injuries in novice runners*, Am J Sports Med 36(1), 2008.
- Nielsen et al., 2014, and the systematic review of training parameters:
  <https://pmc.ncbi.nlm.nih.gov/articles/PMC9528699/>

**Spec changed.** "Build" raises the weekly target gradually as a pacing
choice, not a safety rule, and the engine's real guard is per-session: it rates
a planned session "OK" (not "Good") when its dose would far exceed anything in
the recent history, with reason code `BIG_JUMP`.

## 4. Recovery time per muscle group — heuristic, grounded

No per-region reference model exists (as the spec says). The starting numbers
come from the recovery literature: muscle function is largely back within
24–48 h after ordinary sessions and up to 72 h after hard multi-joint work;
soreness peaks at 24–48 h and resolves by about 72–96 h.

- *Time Course of Recovery From Resistance Exercise With Different Set
  Configurations*, J Strength Cond Res, 2018.
  <https://pubmed.ncbi.nlm.nih.gov/30036284/>
- Korak et al., *Resistance Training Recovery: Considerations for Single vs.
  Multi-joint Movements and Upper vs. Lower Body Muscles*, Int J Exerc Sci,
  2015.

Engine: exponential decay per region with half-lives chosen so that an
ordinary session's fatigue is mostly gone in 48 h for large muscle groups
(half-life ≈ 16 h) and in ~72–96 h for slower tissue (below). All half-lives
are named parameters in `params.ts`, marked as estimates, and nudged by
check-ins.

## 5. Fingers and forearms recover slower — supported in direction, heuristic in size

Tendon and pulley tissue is poorly perfused; collagen turnover after loading
runs on a 48–96 h timescale, and climbers' pulley adaptations take years.
Exact per-day numbers do not exist.

- Schweizer, climbing finger-pulley imaging and load literature; connective
  tissue adaptation in sport climbers:
  <https://www.sciencedirect.com/science/article/pii/S1466853X21001528>
- Immobilisation study showing collagen turnover is much slower than muscle:
  <https://journals.physiology.org/doi/full/10.1152/japplphysiol.90445.2008>

Engine: the fingers-and-forearms region gets a half-life roughly twice the
large-muscle one (≈ 30 h), so a hard climbing day reads "ready" for fingers a
day later than legs would. Estimate; corrected by check-ins.

## 6. Hard days should not pile up — supported

Foster's monotony (mean ÷ SD of daily load over a week) and strain (weekly
load × monotony): high monotony with high load is associated with illness and
overtraining symptoms. Alternating hard and easy days lowers both.

- Foster, *Monitoring training in athletes with reference to overtraining
  syndrome*, Med Sci Sports Exerc 30(7), 1998.

Engine: the scheduler scores an even spread of the same exercise and penalises
two hard sessions back to back; the week's variety is the mechanism, no
monotony number is shown to the user.

## 7. Strength and endurance in one day — supported with a condition

Meta-analyses: concurrent training does not blunt strength or muscle growth
overall; interference appears for explosive strength when the two kinds are in
the same session or less than ~3 h apart. Order barely matters.

- Schumann et al., *Compatibility of Concurrent Aerobic and Strength Training
  for Skeletal Muscle Size and Function: An Updated Systematic Review and
  Meta-Analysis*, Sports Med 52, 2022.
- Petré et al., Frontiers 2021 (same-session vs separated ≥3 h).

Engine: a hard run and a hard strength/climbing session on the same day is a
soft penalty (`SAME_DAY_HARD`), not a hard rule; an easy paired routine right
after a run (KL's back routine) is explicitly fine.

## 8. Fitness–fatigue models (Banister) — reference only

The impulse-response family (fitness and fatigue as two exponentials, time
constants ≈ 40–50 d and 15 d) models **performance**, not day-to-day regional
readiness, and needs months of data to fit per person. Noted as the long-term
route for "your usual" trends; not used for scheduling.

- Banister et al. 1975; Calvert et al. 1976; limitations review:
  <https://pmc.ncbi.nlm.nih.gov/articles/PMC1974899/>

The `training-load` npm library implements this family plus session-RPE and
monotony/strain. Decision after reading it: the parts the engine needs
(session load, rolling sums, EWMA) are a few lines each; reimplemented with
tests rather than depended on (gap 4 closed).

## What this means for the model, in one place

| Parameter | Value | Basis |
|---|---|---|
| Session load | minutes × effort (1–10) | supported (1) |
| Half-life: legs | 16 h | heuristic from (4) |
| Half-life: back and core | 16 h | heuristic from (4) |
| Half-life: arms and shoulders | 16 h | heuristic from (4) |
| Half-life: fingers and forearms | 30 h | heuristic from (5) |
| Half-life: general (whole body) | 20 h | heuristic from (4) |
| "Your usual" baseline | mean daily load over 28 days | descriptive only (2) |
| Big-jump guard | session dose > 1.3 × max of last 30 days → `BIG_JUMP`, rated OK | (3) |
| Hard day definition | session load > 1.25 × user's median session load | internal, tunable |

Every number is in `packages/engine/src/params.ts` with a comment pointing
back at this file.
