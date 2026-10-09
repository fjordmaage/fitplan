# fitplan

A personal Android training planner that reschedules itself. You set the sessions
that happen at fixed times and the things you want to fit in; the app places the
flexible ones around recovery and busy time, explains every decision, and
replans when life changes.

Everything stays on the phone. No account, no server, no analytics, and no
language model anywhere in the app: the planning and every sentence it says are
deterministic.

**Status: stage 0.** Foundations only. There is no plan screen and no engine
yet — see [docs/04-build-plan.md](docs/04-build-plan.md).

## The documents

Read them in this order:

1. [docs/01-product-spec.md](docs/01-product-spec.md) — what the app is and how every screen behaves
2. [docs/02-engine-spec.md](docs/02-engine-spec.md) — the planning engine
3. [docs/03-design-system.md](docs/03-design-system.md) — exact visual values; prototypes in `docs/design/`
4. [docs/04-build-plan.md](docs/04-build-plan.md) — stages, built in order
5. [docs/05-known-gaps.md](docs/05-known-gaps.md) — what is unsolved or unverified

## Layout

| Path              | What it is                                                            |
| ----------------- | --------------------------------------------------------------------- |
| `packages/engine` | The planning engine. Pure TypeScript: no UI, no storage, no platform. |
| `apps/mobile`     | The Expo (React Native) app, Android first.                           |
| `docs/`           | The specs and the design prototypes.                                  |
| `tools/env.sh`    | Sets `PATH`, `JAVA_HOME` and `ANDROID_HOME` for a local build.        |

## Working on it

Install once (see [docs/06-development.md](docs/06-development.md) for the long
version), then:

```bash
source tools/env.sh
npm install
npm run check          # format, lint, types, tests
```

Run on a phone plugged in over USB:

```bash
source tools/env.sh
npm run mobile android
```

## Licence

GPL-3.0-or-later. See [LICENSE](LICENSE).

Schibsted Grotesk is bundled under the SIL Open Font Licence 1.1.
