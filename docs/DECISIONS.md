# Decisions

Every problem found across the audit, and where in this repo it is resolved. If
two parts of the system ever appear to disagree, this file is the tie-breaker.

`E` = mechanically enforced, the build fails if it regresses.
`S` = structural, the shape of the files makes it impossible.
`D` = a decision, held by convention and documented.

---

## A. Bugs that were live in production

| # | Problem | Resolution | Where | |
|---|---|---|---|---|
| A1 | Dark `--card`, `--border`, `--input` all `20 7.69% 7.65%` — card and input edges invisible | `border/primary` = `neutral/100`, 1.85:1 against its own card | `spec.mjs` BORDER + `VISIBILITY_ASSERTIONS` | E |
| A2 | Light `--sidebar-border` (96.27%) brighter than `--sidebar` (93.14%) | sidebar rebuilt off the shared ramp; border always darker than its surface | `spec.mjs` SIDEBAR + visibility gate | E |
| A3 | `.force-light` a hand-maintained third copy, already drifted, missing status/shadow/radius/font tokens | deleted; `.light` block generated from the same map as `:root` | `build.mjs` `emitTokensCss` | S |
| A4 | `--ring` identical to `--primary` — focus ring invisible on brand buttons | `border/focus` is its own token; `border/focus-inverse` added for rings on filled brand surfaces; ring width and offset tokenised | `spec.mjs` BORDER_SINGLE, FOUNDATIONS.focus | E |
| A5 | ~~White on `#FF3D00` = 3.55:1, fails AA~~ **Withdrawn — this was not a bug.** See H1 | `content/on-*` is white on all five fills, both modes | `spec.mjs` CONTENT_ON + `APCA_ASSERTIONS` | E |
| A6 | `--accent` identical to `--muted` — hover indistinguishable from muted surface | bridge maps secondary/muted/accent to three different ramp steps | `spec.mjs` SHADCN_BRIDGE + `BRIDGE_COLLISIONS` | E |

## B. Structural problems in globals.css

| # | Problem | Resolution | Where | |
|---|---|---|---|---|
| B1 | No primitive layer — every semantic held a raw literal. `20 8.57% 93.14%` appeared 8 times | four tiers, one-way. 195 semantic tokens, zero literals | `spec.mjs` SEMANTIC | S |
| B2 | Neutral ramp used four hues (0 / 20 / 30 / 40) | one hue (50), one chroma taper, computed | `palette.mjs` | S |
| B3 | Hex-to-HSL precision artifacts (`30 16.67% 2.35%`) | authored in OKLCH, hex computed | `palette.mjs` | S |
| B4 | Ramp jumped L 80.9 → 58.0 → 29.5 with nothing between | `neutral/60,70,90,100` added — 15 steps | `palette.mjs` NEUTRAL_STEPS | S |
| B5 | Comments contradicted values ("no yellow tint" over hue 40, "cool-toned" over hues 20–40) | comments describe the computation, not a vibe | `palette.mjs` | D |
| B6 | Shadow scale: `2xs` === `xs`, all eight shared one layer, `2xl` flatter than `sm`, no dark override | 4 steps + scrim, per mode, warm-tinted in light and black in dark, with ready-made `box-shadow` composites | `spec.mjs` ELEVATION | S |
| B7 | Two naming conventions: `X`/`X-foreground` vs `X`/`X-soft`. No `--success-foreground`. `--destructive` had no `-soft` | one convention. `content/on-{role}` for text-on-fill, `fill/{role}-secondary` for translucent, `surface/{role}-flat` for opaque. All five roles symmetric | `spec.mjs` | S |
| B8 | Brand palette hardcoded as `rgb()` in `.onboarding-gradient`, `.brand-mesh-*`, `vtr-halo-pulse` — the last using a fifth undocumented orange | 9 gradient tokens; the mesh colours are now `brand/20,30,40` and `spectrum-purple/30` | `spec.mjs` GRADIENT | S |
| B9 | Tailwind v3 directives with v4 conventions; `--spacing` and `--tracking-normal` inert | v3 preset generated; v4 path noted in DEV-GUIDE | `build.mjs` `emitTailwind` | D |
| B10 | Unlayered CSS at file bottom outranked every Tailwind utility; `.text-2xs` in `@layer base` was outranked by utilities | all generated CSS in `@layer base`; type steps in `@layer utilities` | `build.mjs` `emitTokensCss` | S |
| B11 | `--chart-1..5` byte-identical in both modes; four of five in one lightness band; `chart-4` glared on dark | 5 series, per mode, spread ~32 L*, greyscale-tested | `spec.mjs` CHART + greyscale check | E |
| B12 | Sidebar was the only surface with component tokens, and its border was inverted | 8 sidebar tokens off the shared ramp | `spec.mjs` SIDEBAR | S |
| B13 | No type scale at all — one token, `.text-2xs` | 15 steps × 5 weights. `.text-2xs` survives exactly as `label xs` (10px) | `spec.mjs` TYPOGRAPHY | S |
| B14 | No motion tokens despite the spring curve appearing twice and 5 hardcoded durations | 6 durations + 4 easings. `ease/entrance` is byte-identical to the inline curve, so no motion changes | `spec.mjs` MOTION | S |
| B15 | No radius scale, z-index, overlay, disabled, focus geometry, or touch-target tokens | all present in Foundations | `spec.mjs` FOUNDATIONS | S |
| B16 | Light text hierarchy compressed (L 2.35 vs 17.45) while dark had a healthy gap | `content/primary|secondary|tertiary` on matched ramp positions in both modes | `spec.mjs` CONTENT_SINGLE | E |
| B17 | `.x-center` / `.y-center` / `.xy-center` identical; `.oz-scrollbar` / `.thin-scrollbar` near-identical | flagged for collapse | DEV-GUIDE | D |
| B18 | Light `--border: #DBDBDB` was the only zero-saturation value, outside the ramp | folded into the ramp as `neutral/30` | `palette.mjs` | S |

## C. Problems in the exported HeyOz Figma tokens

| # | Problem | Resolution | Where | |
|---|---|---|---|---|
| C1 | 34 base steps dropped from the export; 115 alias references unresolvable, because alpha was nested under the step it modified and a DTCG node cannot be both a token and a group | `solid/` and `opacity-15|30|50/` are sibling top-level groups | `build.mjs` `emitColorPrimitives` | E |
| C2 | `surface.*` and `fill.*` value-identical for primary/secondary/tertiary in both modes | `surface` = static, `fill` = interactive with its own hover/active/disabled | `spec.mjs` | S |
| C3 | Dark `secondary-hover` === `secondary-active`, and `tertiary` === `tertiary-hover` — out of ramp | steps 90 and 100 added; every state pair asserted distinct | `palette.mjs` + collision checks | E |
| C4 | Light had a 9-way collision on `#FFFFFF` | `bg` family dropped; one `color/background`, and `surface/*` carries the rest | `spec.mjs` | S |
| C5 | `fill.fixed-disable` typo in both modes | `fill/fixed-disabled` | `spec.mjs` | S |
| C6 | Status alpha families built on different base hexes than their own `/500` (`#00A161`, `#EBAB00`, `#5781E3`, `#E63C65`) | one ramp per family; alpha groups are that ramp at 15/30/50 | `palette.mjs` | S |
| C7 | Two alpha ladders (15/30/50 and 12/24/38/50) plus an `opacity` scale matching neither | one ladder: 15/30/50 | `palette.mjs` ALPHA_GROUPS | S |
| C8 | `spacing.N = N × 2px`, colliding with Tailwind's `N × 4px` | 4→120 ramp, ordinal names, `--oz-` namespace, emitted as `space-*` utilities so `p-space-5` is unambiguous | `spec.mjs` FOUNDATIONS + `emitTailwind` | D |
| C9 | `content/tertiary` mode-invariant | per-mode: `neutral/80` light, `neutral/70` dark | `spec.mjs` | E |
| C10 | `font.family.primary` = Bricolage, but Bricolage is the display face and Geist (the body face) had no token | `display`/`heading` = Bricolage, `body`/`label` = Geist, `mono` = Geist Mono | `spec.mjs` TYPOGRAPHY | S |
| C11 | `z-index` and `breakpoint` as Figma float variables scoped `EFFECT_FLOAT` — inert in Figma | kept as tokens because code needs them, authored as literals not aliases, with the reason recorded | `spec.mjs` LITERAL_GROUPS | D |
| C12 | Float32 noise (`0.03999999910593033`) | all values rounded at emit | `build.mjs` `round6` | S |

## D. Problems in the Chatly / Imagine reference

Adopted its structure; did not adopt its mistakes.

| # | Problem there | What we do | |
|---|---|---|---|
| D1 | Typography aliased nothing — 0 of 68 tokens, while spacing and radius were properly chained | type sizes and line heights are authored values; spacing, radius and stroke alias `_Number Primitives` | S |
| D2 | Letter spacing unitless with no unit anywhere (`body md = 2` — 2px or 2%?) | unitless decimals, emitted as `em` | S |
| D3 | Labels ran to 20px, colliding with `heading xs` and `body xl` at identical size *and* line height | labels cap at 14px | D |
| D4 | Typos shipped into token names (`haeding` ×4, `sroke width` ×6, `seconday-inverse`, `tertiary-vairant-hover`) | names generated from one spec; no hand-typed duplicates | S |
| D5 | White on brand 3.52:1, critical 3.35:1, warning 3.33:1 — best-in-class is not the same as accessible | contrast gates in the build | E |
| D6 | Shadows were the only non-aliased tokens, and the shadow colour was not a primitive | still authored, but per-mode and with the reason stated | D |
| D7 | 163 of 253 primitives unused | 344 of 468 unused, and that is fine — the grid is generated, so it costs nothing and guarantees every future semantic token has a target | D |

## E. Decisions made in conversation

| Decision | Resolution |
|---|---|
| Five weights, not four | `regular 400 / medium 500 / semibold 600 / bold 700 / extrabold 800`. 800 is display-only; Bricolage runs to 800 and that is where it is at its best |
| All weights on all steps | weight is an independent axis, never a matrix. 15 + 5 tokens, not 75 |
| Weights usable in Figma too | two groups: `font weight` numeric for CSS, `font style` string for Figma's weight field. Neither end can use the other's representation |
| Line heights as ratios, not px | survives `clamp()`; on the fixed body and label sizes the ratio still lands on the 4px grid (16×1.5=24, 14×1.4286=20, 12×1.3333=16) |
| `clamp()` on display and the three largest headings | body and label never resize |
| Keep the `-variant` track | it is a second surface at the same semantic level, not a brand thing. It is what prevents a future restructure |
| Keep the full alpha cross-product | generated + one-shot import = zero maintenance |
| Ordinal spacing names | matches both reference systems; namespace removes the collision risk |
| Single brand, two modes | no primitive is named "orange" above tier 1. Adding a brand, a high-contrast mode, or a density mode later is adding a mode, not touching a component |
| shadcn bridge rather than renaming components | HSL triplets, so nothing changes on day one; delete the file when migration finishes |
| Charts stay in the semantic collection | they vary by mode; the tier is carried by the `chart/` prefix rather than a seventh collection |

## F. Deliberately not done

| Not done | Why |
|---|---|
| Responsive / grid mode dimension | breakpoint and container tokens cover it; a mode dimension doubles the token count for almost nothing |
| Bricolage's width axis (75–100) | where its personality lives, but one or two headline treatments do not justify a whole axis. Use it ad hoc |
| Weights 100–300 and 900 | Bricolage stops at 200 and 800, so the pair would diverge; light strokes also collapse on the dark theme |
| A component-token collection | four families needed a home and they fit in the semantic collection by prefix. Adding the tier for its own sake is over-engineering at this size |
| Six chart series | five matches the shipped count, and the sixth forced yellow to a lightness where it reads as mud |

## G. Open — needs a human

| Question | Where to decide |
|---|---|
| Does Bricolage hold at `heading xs` (18px)? If not, move `heading sm`/`xs` to Geist semibold — two lines in `spec.mjs` | `test/index.html` §06 |
| Is the `-variant` surface track earning its ~24 tokens? | after a week in Figma |
| Does `extrabold` earn its place on display? | `test/index.html` §06 |

*Resolved and moved out of this section: `primary-foreground`. See H1.*

## H. Reversals

### H1 — Text on filled colours is white. The near-black was my error.

**What shipped, briefly:** `content/on-*` = `neutral/150` (`#070605`) on all five
filled colours, in both modes. A near-black label on the brand orange, and on the
red destructive button.

**Why it happened.** `CONTRAST_ASSERTIONS` gated these pairs at WCAG 2.x 4.5:1 and
the build failed if they regressed. `fill/brand` is fixed by the brand, so the only
free variable was the text colour — the generator satisfied the gate the only way
it could. A validator was allowed to make a brand decision, and nothing in the
pipeline ever asked whether the result looked acceptable.

**Why the gate was wrong, not the colour.** WCAG 2.x contrast is a pure luminance
ratio with no polarity term, so its black/white crossover sits at Y = 0.179 — the
grey `#767676`. *Every* fill lighter than that mid-grey scores higher with black
text. That is a structural bias, not a property of this palette, and it is why
automated tooling reliably puts black text on saturated oranges, yellows, greens
and cyans. APCA — the model going into WCAG 3, added as `apca()` in `palette.mjs`
— inverts the verdict, and matches what the eye reports:

| pair | WCAG 2.x | APCA | |
|---|---|---|---|
| white on `#FF3D01` (brand) | 3.55:1 fail | **Lc 66.7** | readable |
| near-black on `#FF3D01` | 4.91:1 pass | Lc 42.7 | below the floor for any text size |
| near-black on `#A36E07` (warning) | 4.62:1 pass | **Lc 33.9** | what the old gate shipped |

The near-black set scored Lc 33.9–42.7, all beneath the Lc 45 minimum for even
large bold text — while the build reported "40/40 contrast gates pass." Saturated
warm hues read brighter than their measured luminance (Helmholtz–Kohlrausch), so
near-black on them goes muddy.

**Also: the convention exists for a reason.** Every product shipping this hue uses
white and "fails" WCAG 2 — Reddit `#FF4500` 3.44:1, SoundCloud `#FF5500` 3.21:1,
Ubuntu `#E95420` 3.65:1, Home Depot `#F96302` 3.08:1, Etsy `#F1641E` 3.19:1.
A rule that indicts all of them is measuring the wrong thing.

**Resolution.** `content/on-*` = `solid/neutral/white`, both modes, all five fills.
The five pairs moved out of `CONTRAST_ASSERTIONS` into `APCA_ASSERTIONS` at Lc 60
(the body-text threshold); they land 66.7–75.6. Brand stays `#FF3D00`.

**Accepted consequence.** axe, Lighthouse and any WCAG-2-based checker will flag
these five pairs. That is a known divergence, taken deliberately. If a procurement
VPAT ever forces the WCAG-2 number, **the lever is the fill, not the label** —
`brand` → `#D62D00` puts white at 4.96:1 and Lc 78. Never darken the text again.

**Rule going forward.** Text on a saturated brand or status fill is white, in both
modes, and is never re-derived by a contrast maximiser. A gate may veto a colour;
it may never choose one.
