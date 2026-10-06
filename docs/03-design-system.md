# Design system

The prototypes in `docs/design/` are the reference for layout, wording and behaviour. They are HTML files written for a design canvas (`*.dc.html`): read them for structure, exact copy, sizes and colours. They are not app code and cannot be run as-is. `Main.dc.html` contains a working script (state, move, swap, undo, expand) that shows the intended interactions; its ratings and messages are toy rules, not the engine.

KL has seen and approved the overall look. The designer never saw them rendered, so expect small layout faults; fix by eye on a real phone.

## Principles

- Calm and sparse. One idea per card. If a screen feels like "info, info, info", remove something.
- The calendar and the app's advice are the centre of the product.
- Sections are separate rounded cards on a tinted ground, with clear gaps between them.
- Shape and fill carry meaning before colour does (below).
- Every control at least 44 px tall. Real buttons and links, labelled for screen readers.
- Text sizes: nothing below 12 px except the am / pm / eve gutter labels (11 px); consider raising those.

## The encoding (same everywhere: calendar, timeline, lists, legends)

| Thing | Calendar bar | Timeline card |
|---|---|---|
| Fixed | Solid ink | Ink card, light text, lock icon |
| Flexible | Accent fill at about 45% (light) / 50% (dark) with a 1.5 px accent border | Surface card with a 1.5 px accent border, small down arrow |
| Tentative ("day may change") | Transparent with a 1.5 px dashed accent border | Same card with a dashed border |
| Busy | Diagonal hatch | Hatched card |
| Empty slot | Faint neutral | "Rest day" line |
| Selected | 2 px surface gap then 2 px ink ring | Same ring |

## Ratings

| Level | Word | Light background / text | Dark background / text |
|---|---|---|---|
| Good | Good | `#DDF0E4` / `#17603A` | `#173626` / `#8FDDB0` |
| OK | OK | `#FBEBC4` / `#7A5200` | `#3D3212` / `#F0CE74` |
| Avoid | Avoid | `#F9D9D3` / `#9B2C1C` | `#46201A` / `#F5A99B` |

Always show the word. Check these pairs for contrast and for colour-blind separation on a real screen.

## Colour tokens

| Token | Light | Dark |
|---|---|---|
| Ground | `#EBEFED` | `#0D1412` |
| Surface (cards, sheets, nav) | `#FFFFFF` | `#18211E` |
| Ink (text, fixed sessions) | `#14201C` | `#EEF3F1` |
| Muted text | `#4D5A55` | `#A7B3AE` |
| Hairline | `#D5DCD8` / `#E3E8E5` inside cards | `#2A3531` |
| Control border | `#C9D2CE` | `#3A4641` |
| Empty slot / quiet fill | `#EDF1EF` | `#232D2A` |
| Text on ink | `#FFFFFF` | `#0D1412` |
| Muted text on ink | `#D5DDD9` | `#3C4843` |
| Accent (default) | `#0F6B5C` | `#5FD0B8` |
| Text on accent | `#FFFFFF` | `#0D1412` |
| Accent tint (advice boxes) | accent at about 13% | accent at about 18% |
| Busy hatch (bars) | 135° stripes `#7A8580` on `#DDE3E0` | `#8A9691` on `#2A3531` |
| Busy hatch (cards) | `#E3E8E5` / `#D3DAD6` | `#1F2926` / `#2C3834` |
| Busy text | `#3C4843` | `#C5CFCA` |

**Accent is user-changeable.** Presets in light: `#0F6B5C`, `#1D4ED8`, `#B4530B`, `#7C3AED`; in dark: `#5FD0B8`, `#8AB4FF`, `#F2A65A`, `#C4A7FF`. Also a free colour picker and "match my wallpaper" (Android dynamic colour). For an arbitrary colour, derive a light-theme and a dark-theme variant so text on it and it on the surface both stay readable; do not use the raw pick in both themes.

Theme: same as phone (default), light, dark. Only the Plan screen has a drawn dark version; apply the token table to the rest.

## Type

Schibsted Grotesk (open licence, on Google Fonts), weights 400–700. Bundle it with the app.

| Use | Size / line | Weight |
|---|---|---|
| Screen title | 26 / 30 | 700 |
| Sheet title, big value | 22 / 28 | 700 |
| Guide move name | 28 / 34 | 700 |
| Guide countdown | 72 / 76, tabular numerals | 700 |
| Card title | 16 / 22 | 700 |
| Section heading | 15 | 700 |
| Body, row label | 15 | 600 |
| Advice, explanations | 14 / 20 | 400 |
| Secondary text | 13 / 18 | 400–600 |
| Small label | 12 | 500–700 |

Overline labels ("TODAY"): 13 px, 600, uppercase, slight letter-spacing, muted.

## Shape and spacing

- Screen side padding 16 (20 on full-screen flows). Gap between cards 18–22. Inside cards 14–16.
- Radii: cards 20; sheets 24 on top corners; inner panels 12–14; buttons 12; pills and round buttons fully round; calendar bars 6.
- Primary button: 48 high, accent fill. Secondary: 44–46 high, 1 px control border on surface. Selected choice in a set: 2 px ink border and bold text.
- Bottom bar 68 high; centre Add button 52 round, ink fill.
- Calendar: day column about 44 wide; date circle 26; three bars 18 high with 4 gaps; 26 px left gutter with week number and am / pm / eve.
- Phone frame used in the prototypes: 390 × 844.

## Voice

Plain, short, second person. Say what happened and why in one or two sentences. No exclamation marks, no praise for its own sake, no jargon ("load" is fine; ratios and model names are not). Buttons say what they do ("Move to Thu 8, afternoon"). Estimates are called estimates.

## Screen files

`Main` (Plan, light; includes move sheet, swap sheet, plan-updated card, expanded calendar), `Dark` (Plan in dark, same component), `Add`, `Library` (Exercises), `Exercise` (details), `Routine` (designer), `Before`, `Guide` (timed), `GuideReps` (counted), `After`, `Body`, `History`, `Learn`, `Unwell`, `Settings`, `Setup` (step 3 of 5).
