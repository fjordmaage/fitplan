# fitplan

A personal Android training planner that reschedules itself. The owner (KL) sets fixed sessions and things he wants to fit in; the app places the flexible ones around recovery and busy time, explains every decision, and replans when life changes.

## Read first

1. `docs/01-product-spec.md` — what the app is and how every screen behaves
2. `docs/02-engine-spec.md` — the planning engine (the hard part)
3. `docs/03-design-system.md` — exact visual values; prototypes in `docs/design/`
4. `docs/04-build-plan.md` — stages; build them in order
5. `docs/05-known-gaps.md` — what is unsolved or unverified. Read before each stage.
6. `docs/06-design-fidelity.md` — **how to make the app look like the mockups. Read before writing any UI.** Reference images are in `docs/design/png/`.

## Who you are working with

- KL directs and tests; he does not write code. Explain choices in plain language, and give him exact steps when he has to do something himself (install, plug in the phone, press a button).
- He tests on his own Android phone over USB. Every stage must end with something he can open and use.
- He wants to be told when something in the spec turns out to be wrong or hard. Say so, propose an alternative, and update the docs.

## Hard rules

- **No LLM in the app.** Planning and all user-facing explanations are deterministic. Explanations are sentence templates filled from the engine's own reason codes, so the app can only say what it actually decided.
- **The engine is a pure TypeScript package** with no UI, storage or platform imports. It is tested on its own (see engine spec for required tests). Same input, same output, always.
- **Never change the plan silently.** Every change is recorded with its reason, shown to the user, and can be undone.
- **Never delete user data.** Everything entered or completed is kept permanently and can be exported (see product spec, "Data and statistics").
- **Local only.** No account, no server, no analytics. Network use only for integrations the user turns on.
- **Not medical advice.** The app schedules and guides exercises; it never diagnoses. Exercises a doctor or physio prescribed are entered by the user as his own.
- **The mockups are final.** Every screen must match its reference image in `docs/design/png/`. No UI kit, no platform-default styling. Compare a screenshot against the reference yourself before showing KL (see `docs/06-design-fidelity.md`).
- **Colour is never the only signal.** Ratings always carry a word (Good, OK, Avoid).

## Stack (recommended; verify current versions before starting)

- Expo (React Native) + TypeScript, Android only for now. Keep code cross-platform where it costs nothing.
- Local SQLite for storage.
- Engine in `packages/engine`, tested with a fast unit-test runner; app in `apps/mobile`.
- Health Connect for imported activities (Strava writes to it), the phone's calendar for busy time, on-device text-to-speech for voice cues.
- Health Connect and background audio need a development build, not Expo Go. Plan for that from stage 0.

## Workflow

- Licence: GPL-3.0-or-later. Add `LICENSE` and a short `README.md` in stage 0.
- Small commits with clear messages; a branch and pull request per stage; CI runs lint, type-check and tests on every push.
- Keep `docs/` current: when behaviour changes, change the spec in the same pull request. When a gap is closed or a new one is found, edit `docs/05-known-gaps.md`.
- Ask KL before: adding a dependency with a non-GPL-compatible licence, adding anything that sends data off the phone, or dropping a feature from a stage.
