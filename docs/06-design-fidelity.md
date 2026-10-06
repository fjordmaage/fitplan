# Design fidelity

**The mockups are the design. Treat them as final, not as inspiration.** KL has approved them and expects the app on his phone to look like them. A screen is not done until it matches its reference image.

This file overrides anything looser elsewhere in the docs (for example "fix by eye" in the design system or "placeholder screen" in the build plan).

## What you have

- `docs/design/png/` — a reference image of every screen and every important state, rendered at 390 × 844 points (780 × 1688 pixels). **Look at these.** They are the source of truth for appearance.
- `docs/design/html/` — the same screens as standalone HTML with the font embedded. Open one in a browser and inspect any element to read its exact size, spacing, colour, radius and font. Every style is inline on its element.
- `docs/design/*.dc.html` — the original prototype sources. `Main.dc.html` holds the interaction logic for the Plan screen.
- `docs/03-design-system.md` — the same values as tables.

| Image | Screen or state |
|---|---|
| `01-plan` | Plan, light: calendar, today's advice, selected workout with Start / Move / Swap |
| `02-plan-dark` | Plan, dark |
| `03-plan-move-sheet` | Move sheet with rated days |
| `04-plan-swap-sheet` | Swap sheet with rated alternatives |
| `05-plan-updated-card` | After a move: the "Plan updated" card with Undo |
| `06-plan-calendar-expanded` | Calendar expanded to six weeks |
| `07-plan-dark-move-sheet` | Move sheet, dark |
| `08-add` | Add sheet |
| `09-exercises` | Exercises |
| `10-exercise-details` | Exercise details |
| `11-routine-designer` | Routine designer |
| `12-checkin-before` | Check-in before |
| `13-guide-timed` | Guide, timed move |
| `14-guide-counted` | Guide, counted move |
| `15-checkin-after` | Check-in after |
| `16-body` | Body |
| `17-history` | History |
| `18-learn` | Learn |
| `19-not-feeling-100` | Not feeling 100% |
| `20-settings` | Goals and settings |
| `21-setup` | First-time setup, step 3 |

## How to build UI in this project

1. **No UI kit.** Do not use Material, React Native Paper or any component library with its own look. Build every component from plain views, text and pressables, styled from the tokens. Platform defaults (elevation shadows, ripple colours, default fonts, default button and switch styles, default header bars) must not show through.
2. **Tokens first.** One file holds every colour (light and dark), font size, weight, radius and spacing value from `03-design-system.md`. No literal colours or sizes in screen code.
3. **Font.** Bundle Schibsted Grotesk (weights 400, 500, 600, 700) with the app and wait for it to load before rendering. Text must never appear in the system font. Map each weight to its own font file; on Android, `fontWeight` alone does not select a custom font's weight.
4. **Shared components before screens.** Build these once, match them to the images, then compose screens from them: screen title block, card, section heading, primary / secondary / choice button, pill chip, round icon button, switch, bottom bar with centre Add button, bottom sheet with handle, rating chip (Good / OK / Avoid), advice box, calendar grid (day column, slot bars for fixed / flexible / tentative / busy / empty, selection ring, week gutter), timeline row and card (fixed / flexible / tentative / busy), plan-updated card, list row with divider, stepper.
5. **A gallery screen.** Keep a hidden screen that shows every shared component in every state, in both themes. Check it against the images before building any screen.
6. **Units.** The mockups are 390 points wide. Use the same numbers as density-independent units. On wider or narrower phones let cards and grids stretch; keep paddings, radii, font sizes and control heights fixed.
7. **Icons.** The mockups use simple 2 px line icons drawn inline as SVG. Reuse those exact paths (they are in the HTML) through an SVG component. Do not substitute an icon set.
8. **Copy.** Use the wording in the mockups exactly.

## The check, for every screen and state

1. Build it.
2. Take a screenshot from the phone or emulator.
3. Put it next to the reference image and compare, in this order: layout and proportions; spacing and alignment; type (family, size, weight); colours; radii and borders; icons.
4. Fix every difference you can see. Then show KL both images side by side, and say plainly what still differs and why.

Do not show KL a screen you have not compared yourself. If something cannot be matched on Android (a hatch pattern, a dashed rounded border, a ring with a gap), say so and propose the closest equivalent before building it. Known tricky spots: the diagonal hatch for busy time (draw it with SVG), dashed rounded borders for tentative items (React Native's dashed borders are unreliable; use SVG), and the selection ring with a gap (two nested borders).

## Order

Redo the visual layer before continuing with features: tokens, font, shared components, gallery, then the Plan screen against `01`, `02`, `03`, `05` and `06`. Wire it to real data only after it matches.
