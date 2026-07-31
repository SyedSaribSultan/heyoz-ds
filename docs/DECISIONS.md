# Decisions

Every problem found across the audit, and where in this repo it is resolved. If
two parts of the system ever appear to disagree, this file is the tie-breaker.

`E` = mechanically enforced, the build fails if it regresses.
`S` = structural, the shape of the files makes it impossible.
`D` = a decision, held by convention and documented.

**`E` is a claim about the assertion list, not about the value.** Three entries in
§A were marked `E` and were nonetheless byte-identical in the emitted CSS on
2026-07-31, because the gate asserted a neighbouring pair and not the one the
entry describes. If you mark something `E`, name the assertion that backs it.
Section I is the full account.

---

## A. Bugs that were live in production

| # | Problem | Resolution | Where | |
|---|---|---|---|---|
| A1 | Dark `--card`, `--border`, `--input` all `20 7.69% 7.65%` — card and input edges invisible | `border/primary` = `neutral/95`, 2.27:1 against its own card | `spec.mjs` BORDER + `VISIBILITY_ASSERTIONS` | E |
| A2 | Light `--sidebar-border` (96.27%) brighter than `--sidebar` (93.14%) | sidebar rebuilt off the shared ramp | `spec.mjs` SIDEBAR + visibility gate | E |
| A3 | `.force-light` a hand-maintained third copy, already drifted, missing status/shadow/radius/font tokens | deleted; `.light` block generated from the same map as `:root` | `build.mjs` `emitTokensCss` | S |
| A4 | `--ring` identical to `--primary` — focus ring invisible on brand buttons | `border/focus` = `brand/75` light, `brand/45` dark, rungs nothing else occupies; `border/focus-inverse` for rings on filled brand surfaces; width and offset tokenised | `spec.mjs` BORDER_SINGLE, FOUNDATIONS.focus | E |
| A5 | ~~White on `#FF3D00` = 3.55:1, fails AA~~ **Withdrawn — this was not a bug.** See H1 | `content/on-*` is white on all five fills, both modes | `spec.mjs` CONTENT_ON + `APCA_ASSERTIONS` | E |
| A6 | `--accent` identical to `--muted` — hover indistinguishable from muted surface | bridge maps secondary/muted/accent to three different ramp steps | `spec.mjs` SHADCN_BRIDGE + `BRIDGE_COLLISIONS` | E |

> **A2 correction.** The resolution above used to end "border always darker than
> its surface." That is true in light (`neutral/30` on `neutral/20`) and false in
> dark, where `sidebar/border` is `neutral/120` on a `neutral/140` background —
> deliberately *lighter*, because the dark surface steps are compressed and a
> darker border disappears into them. The gate is a visibility floor, not a
> direction. Only the wording was wrong.
>
> **A1, A4 and A6 were still live on 2026-07-31.** All three are marked `E`,
> mechanically enforced, and all three were byte-identical in the emitted CSS:
> `--ring` === `--primary` at 1.00:1 in light, `--accent` === `--border` in dark,
> `--border` === `--muted` in light. They were not regressions in the values so
> much as gaps in the assertions — `BRIDGE_COLLISIONS` asserted `ring`-vs-`border`
> and never `ring`-vs-`primary`, so the values were free to collide again one ramp
> step later. See section I. **`E` means the build checks it. It has never meant
> the build checks the right thing.**

## B. Structural problems in globals.css

| # | Problem | Resolution | Where | |
|---|---|---|---|---|
| B1 | No primitive layer — every semantic held a raw literal. `20 8.57% 93.14%` appeared 8 times | four tiers, one-way. 205 semantic tokens, zero literals, enforced | `spec.mjs` SEMANTIC | S |
| B2 | Neutral ramp used four hues (0 / 20 / 30 / 40) | one hue (50), one chroma taper, computed | `palette.mjs` | S |
| B3 | Hex-to-HSL precision artifacts (`30 16.67% 2.35%`) | authored in OKLCH, hex computed | `palette.mjs` | S |
| B4 | Ramp jumped L 80.9 → 58.0 → 29.5 with nothing between | `neutral/60,70,90,100` added, then the 25/35/45/95/115/135 half-steps for the bridge ladder — 21 steps | `palette.mjs` NEUTRAL_STEPS | S |
| B5 | Comments contradicted values ("no yellow tint" over hue 40, "cool-toned" over hues 20–40) | comments describe the computation, not a vibe | `palette.mjs` | D |
| B6 | Shadow scale: `2xs` === `xs`, all eight shared one layer, `2xl` flatter than `sm`, no dark override | 4 steps + scrim, per mode, warm-tinted in light and black in dark, with ready-made `box-shadow` composites | `spec.mjs` ELEVATION | S |
| B7 | Two naming conventions: `X`/`X-foreground` vs `X`/`X-soft`. No `--success-foreground`. `--destructive` had no `-soft` | one convention. `content/on-{role}` for text-on-fill, `fill/{role}-secondary` for translucent, `surface/{role}-flat` for opaque. All five roles symmetric | `spec.mjs` | S |
| B8 | Brand palette hardcoded as `rgb()` in `.onboarding-gradient`, `.brand-mesh-*`, `vtr-halo-pulse` — the last using a fifth undocumented orange | 9 gradient tokens; the mesh colours are now `brand/20,30,40` and `spectrum-purple/30` | `spec.mjs` GRADIENT | S |
| B9 | Tailwind v3 directives with v4 conventions; `--spacing` and `--tracking-normal` inert | v3 preset generated; v4 path noted in DEV-GUIDE | `build.mjs` `emitTailwind` | D |
| B10 | Unlayered CSS at file bottom outranked every Tailwind utility; `.text-2xs` in `@layer base` was outranked by utilities | all generated CSS in `@layer base`; type steps in `@layer utilities` | `build.mjs` `emitTokensCss` | S |
| B11 | `--chart-1..5` byte-identical in both modes; four of five in one lightness band; `chart-4` glared on dark | 5 series, per mode, spread 29 L* light and 31 dark, greyscale gated at ΔL 0.05 | `spec.mjs` CHART + greyscale check | E |
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
| C1 | 34 base steps dropped from the export; 115 alias references unresolvable, because alpha was nested under the step it modified and a DTCG node cannot be both a token and a group | `solid/` and `opacity-8|15|30|50/` are sibling top-level groups | `build.mjs` `emitColorPrimitives` | E |
| C2 | `surface.*` and `fill.*` value-identical for primary/secondary/tertiary in both modes | `surface` = static, `fill` = interactive with its own hover/active/disabled | `spec.mjs` | S |
| C3 | Dark `secondary-hover` === `secondary-active`, and `tertiary` === `tertiary-hover` — out of ramp | steps 90 and 100 added; base↔hover, hover↔active **and** base↔disabled asserted distinct | `palette.mjs` + collision checks | E |
| C4 | Light had a 9-way collision on `#FFFFFF` | `bg` family dropped; one `color/background`, and `surface/*` carries the rest | `spec.mjs` | S |
| C5 | `fill.fixed-disable` typo in both modes | `fill/fixed-disabled` | `spec.mjs` | S |
| C6 | Status alpha families built on different base hexes than their own `/500` (`#00A161`, `#EBAB00`, `#5781E3`, `#E63C65`) | one ramp per family; alpha groups are that ramp at 8/15/30/50 | `palette.mjs` | S |
| C7 | Two alpha ladders (15/30/50 and 12/24/38/50) plus an `opacity` scale matching neither | one ladder: 8/15/30/50 — the 8 rung added so a translucent fill can have a disabled state, see I4 | `palette.mjs` ALPHA_GROUPS | S |
| C8 | `spacing.N = N × 2px`, colliding with Tailwind's `N × 4px` | 4→120 ramp, ordinal names, `--oz-` namespace, emitted as `space-*` utilities so `p-space-5` is unambiguous | `spec.mjs` FOUNDATIONS + `emitTailwind` | D |
| C9 | `content/tertiary` mode-invariant | per-mode: `neutral/90` light, `neutral/60` dark — moved from 80/70 by I7, which found it failing 4.5:1 on all three card surfaces | `spec.mjs` | E |
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
| D6 | Shadows were the only non-aliased tokens, and the shadow colour was not a primitive | **Derived from primitives, deliberately not aliased.** Targets are primitive paths, so no hex is hand-authored and rule 1 holds as enforced. The emitted Figma tokens carry no `aliasData`, because Figma discards a variable's local value once bound and these carry alpha 0.08–0.90 — an alias would import them opaque. See I3 and I11a | S |
| D7 | 163 of 253 primitives unused | 504 of 655 unused, and that is fine — the grid is generated, so it costs nothing and guarantees every future semantic token has a target | D |

> **D6 was adopted, then unadopted.** "Still authored, with the reason stated" is
> how ten hand-typed hexes stayed in the semantic layer, which made README rule 1
> false and left 6 of 211 tokens per mode with no Figma alias. Two of the three
> hexes were primitives spelled longhand (`#070605` is `neutral/150`, `#000000` is
> `neutral/black`). The third, `#9F9E9C`, was hue 84.6 against a `NEUTRAL_HUE` of
> 50 — the only colour in the entire system outside the OKLCH engine, sitting in a
> group named `neutral`. Documenting an exception is not the same as earning it.

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
| The light chart series are now noticeably darker (L\* 38–68 rather than 46–78), because 1.4.11 does not allow a pale series on a white page. Is that acceptable, or should charts get a tinted plot background so the series can go lighter again? | `test/index.html` §10 |
| Six of 22 tier-3 tokens resolve to the same primitive pair as a tier-2 token (e.g. `sidebar/content` and `content/primary`). Architecturally they should alias the tier-2 token, but this system has every semantic token alias tier 1 directly. Worth a tier-2→tier-3 chain, or is the flat model fine at this size? | design review |

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
| near-black on `#FF3D01` | 5.71:1 pass | Lc 42.7 | below the floor for any text size |
| near-black on `#A36E07` (warning) | 4.62:1 pass | **Lc 33.9** | what the old gate shipped |

> The near-black row read **4.91:1** here, in `spec.mjs` and in `palette.mjs`
> until 2026-07-31. Recomputed independently: `#070605` on the brand fill is
> **5.71:1** and pure `#000000` is **5.92:1**. 4.91 appears to be
> white-on-`#D53100` — the light hover fill, 4.92:1 — transcribed into the wrong
> row. The argument is unaffected and in fact *stronger* on the WCAG side, which
> is exactly why the error mattered: 4.91 is the figure a procurement reviewer
> would have been handed out of this file.

The near-black set scored Lc 33.9–42.7, all beneath the Lc 45 minimum for even
large bold text — while the build reported "40/40 contrast gates pass." Saturated
warm hues read brighter than their measured luminance (Helmholtz–Kohlrausch), so
near-black on them goes muddy.

**Also: the convention exists for a reason.** Every product shipping this hue uses
white and "fails" WCAG 2 — Reddit `#FF4500` 3.44:1, SoundCloud `#FF5500` 3.21:1,
Ubuntu `#E95420` 3.65:1, Home Depot `#F96302` 3.08:1, Etsy `#F1641E` 3.19:1.
A rule that indicts all of them is measuring the wrong thing.

**Resolution.** `content/on-*` = `solid/neutral/white`, both modes, all five fills.
The pairs moved out of `CONTRAST_ASSERTIONS` into `APCA_ASSERTIONS` at Lc 60 (the
body-text threshold). Brand is `#FF3D01` — see the note below.

**All fifteen fill states are gated, not the five bases.** The original fix gated
`content/on-brand` against `fill/brand` and stopped there. Because the label never
changes and the fill does, that told us nothing about hover or active: the dark
ladder ran `60 → 50 → 40` and white measured **Lc 58.8** on brand hover and
**Lc 49.9** on brand active — under this system's own floor, on the state a user
looks at most. The ladder is now `60 → 55 → 50` and white holds Lc 60.4–66.7 across
all three dark states, 66.7–88.1 across all three light states. Fixing the metric
and then applying it to one state out of three is half a fix.

**Accepted consequence.** axe, Lighthouse and any WCAG-2-based checker will flag
these pairs. On the five resting fills they measure **3.55–4.38:1**; across all
fifteen gated states the WCAG range is 2.90–8.40:1, with dark active lowest at 2.90
and light active highest at 8.40. That spread is itself the argument — by APCA the
same fifteen pairs sit in a tight Lc 60.4–93.3 band, because APCA accounts for
polarity and WCAG 2.x does not. A known divergence, taken deliberately. If a
procurement VPAT ever forces the WCAG-2 number, **the lever is the fill, not the
label** — `brand` → `#D62D00` puts white at 4.96:1 and Lc 78. Never darken the text.

**On `#FF3D00`.** This section used to close "Brand stays `#FF3D00`" while the
table three rows above it said `#FF3D01`. The emitted value is and always has been
`#FF3D01`: `brand/60` is authored as OKLCH `L 0.6535 / C 0.2348 / h 34.0` and the
round trip to sRGB lands one 8-bit unit off the brand-guide hex. `#FF3D00` appears
in zero artifacts. The difference is 3.547:1 versus 3.548:1 — imperceptible, and
not worth hand-typing a hex to erase, because that would put brand outside the
OKLCH engine and re-create exactly the problem D6 describes.

**Rule going forward.** Text on a saturated brand or status fill is white, in both
modes, and is never re-derived by a contrast maximiser. A gate may veto a colour;
it may never choose one.

---

## I. The 2026-07-31 audit

The repo was audited end to end: the build re-run, every claim in these docs
recomputed from the emitted artifacts by an independent implementation. The
engineering held up — all 52 gates that existed genuinely passed, mode parity was
exact at 211/211, every one of 390 aliases resolved, and the APCA implementation
matched APCA-W3 0.1.9 constant for constant.

Seventeen findings. What they had in common is the thing worth remembering: **the
gates that existed all passed. Every bug was in a pair nobody had named.**

### I1 — The build did not run

`build.mjs` imported `./harness.mjs` and `./shipped.mjs`; neither existed.
`node build/build.mjs` died at module resolution, so nothing in `tokens/` or
`dist/` was reproducible and `tokens/02`–`05` and `reports/` were absent entirely
— while FIGMA-GUIDE instructed designers to import seven files in numeric order
and warned that importing `06` before `01` silently produces broken variables.

Recovered from the payload and template inlined in the previously generated
`test/index.html`, which was the only surviving copy of either. Verified by
round-tripping that file byte-for-byte, then by confirming all six pre-existing
artifacts regenerate byte-identical. `E`

### I2 — Six token pairs collided at 1.00:1, three of them documented as fixed

`--ring` === `--primary` (light), `--accent` === `--border` (dark), `--border` ===
`--muted` (light), `--input` === `--accent` (light), `--popover` === `--secondary`
(dark), `sidebar-accent` === `sidebar-border` (both). See the note under §A.

Root cause was ramp crowding: the bridge seats ten structurally distinct roles and
light mode had only `white/10/20/30/40` to seat them in. Six neutral half-steps
added (25, 35, 45, 95, 115, 135) at the midpoints of their neighbours — the same
move as 60/70/90/100 for dark hover headroom, and no existing step shifts.
`BRIDGE_COLLISIONS` 7 → 18 entries, one per claim the bridge comment makes.
`COLLISION_ASSERTIONS` 4 → 13. Collision pairs may now be scoped to a single mode,
so a legitimate shared value is recorded as an exemption instead of left as a hole.
`E`

### I3 — Ten literals above tier 1, and rule 1 was unenforced

See D6. Rule 1 is now a build failure rather than a sentence in the README: any
colour-valued semantic token naming no primitive fails. It was false for the entire
life of the repo and nothing detected it, because nothing looked. `E`

### I4 — The soft-fill disabled state was a no-op

`build.mjs` derived it by rewriting the alpha prefix to `opacity-15` on tokens that
were already `opacity-15`. Ten tokens shipped a disabled state byte-identical to
their enabled one, in both modes. `ALPHA_GROUPS` gained an `8` rung — half of 15,
matching how solid fills use `opacity-50` of an opaque base — and `base↔disabled`
joined the collision assertions. `E`

### I5 — Disabled labels were illegible

`content/on-*-disabled` was `opacity-50` white over an `opacity-50` fill, so both
layers faded toward the same page and the label converged on its own background:
**1.43:1** in light. Fading two stacked layers independently does not behave like
fading the composited element, which is what `opacity: .5` on a button does and
what those tokens were reaching for.

Disabled controls are exempt from 1.4.3, so this was never a conformance failure —
it was simply unusable, and ungated. Now an opaque neutral label on an opaque
neutral fill: 3.47:1 light, 3.82:1 dark, identical across all five roles, because a
control you cannot act on has no reason to keep its role colour. `E`

### I6 — Ten roles had no token at all

`content/link`, `-hover`, `-visited`, `content/placeholder`, `content/selected`,
`fill/selected` + `-hover`/`-active`/`-disabled`, `border/selected`. Links are the
most-used interactive text role in any product UI; selection existed only as
`sidebar/item-selected`, so a selected table row, tab, list item or combobox option
had to reach into the sidebar's tier-3 namespace or hardcode. `S`

### I7 — Quiet text and chart series failed contrast where nobody was looking

`content/tertiary` was gated at 3:1 against the page **only**, and measured
3.93 / 3.66 / 3.07:1 on the three card surfaces in light — failing 4.5:1 everywhere
an app actually draws text, while its single gate passed. Now gated against all
four surfaces.

Chart series were ungated against their own background. Series 3 measured 2.54:1
and series 5 measured 2.01:1 in light; a series is a graphical object under 1.4.11.
No hue in this palette clears 3:1 above step 60 on a white page, so the light band
came down to L\* 38–68. `E`

### I8 — Dark shadows were about a third the strength of light

ΔL 0.009–0.024 against their page where light moved it 0.027–0.066 — the dark
`large` shadow was weaker than the light `x-small`, and elevation had no gate.

Measured by WCAG ratio they scored 1.007–1.017, which reads as "inert" and
overstates it: near black, that formula's `+0.05` flare term swamps the signal, the
same way its missing polarity term misjudges white-on-orange in H1. **ΔL is the
honest instrument at that end of the ramp**, so the new gate uses ΔL. Same for the
chart greyscale gate, which replaced a warning conditioned on `ΔL < 0.03 AND
contrast < 1.08` — two thresholds ANDed so tightly that the pairs which were
genuinely too close could not trip it. `E`

### I9 — Documented arithmetic and counts were wrong

The near-black-on-brand figures (H1), the axe-flag range (3.1–3.7 → 3.55–4.38),
nine of twenty anchor comments in `palette.mjs` (off by one 8-bit unit), the
FIGMA-GUIDE collection counts (66/69/195 → 64/64/211), `numberName`'s doc example,
A2's "always darker", C3's "every state pair", and a DEV-GUIDE table asserting the
bridge lifted `--primary-foreground` to 5.71:1 and `--destructive-foreground` to
5.01:1 — both invented, and both contradicting A5/H1, which withdrew that as a bug.

Anchor comments now state the **computed** value, with the brand-guide hex
alongside where they differ. `D`

### I10 — Dead and invalid output

`FOUNDATIONS.layer` declared all eight layers as `1000` and was never read —
`build.mjs` discards it for `LAYER_LITERALS` — so the file stated eight values it
did not ship while the eight it did ship lived elsewhere. Now one object,
referenced. `--oz-style-*` (five vars, values like `Regular`) and
`--oz-default-weight-*` (`extrabold`) were emitted as CSS despite being illegal in
any CSS property; the first is Figma-only and no longer reaches CSS, the second
emits `800/600/400/500`. `--oz-font-*` had no fallback stack on any of the five
families, so one failed webfont request took the product to the default serif.
`color-scheme: dark` was missing from the `.dark` block while `.light` declared it.
`S`

### I11 — What the fixes themselves broke

The fixes above were then re-audited by a second independent pass, which found
nine problems in them. That result is more useful than the original audit, so it
is recorded rather than quietly patched.

| | Introduced by | Problem |
|---|---|---|
| a | I3, the literal fix | All ten elevation tokens gained `aliasData` pointing at **opaque** primitives while carrying alpha 0.08–0.90. Figma discards a variable's local value once it is bound to an alias, so every shadow would have imported as a solid slab and the modal scrim as an opaque black rectangle. `dist/` was correct throughout, so this would only have broken the designer's file — the half of the pipeline nobody would re-check. |
| b | A4, the focus fix | Light `border/focus` moved `brand/60 → brand/70` to clear `--primary`, and landed byte-identical to `border/brand-hover`, `border/selected` and `content/brand`. **The same bug, one layer down**: no visible ring on a selected or hovered brand-bordered control. |
| c | I2, the ramp fix | `surface/tertiary` moving to the neutral/35 half-step pushed `content/warning` and `content/info` below 4.5:1 on it (4.38, 4.36), and made the other three status text colours worse. All five were gated against `color/background` only — **the identical gap I7 had just fixed for `content/tertiary`**, unfixed for its five siblings because the gate list named one token instead of a category. |
| d | I5, the disabled fix | The flat neutral disabled fill was `neutral/120` in dark, byte-identical to `surface/elevated` and `surface/secondary`. A disabled button stopped reading as a control and read as a card. |
| e | I2 | Dark `gradient/mesh-3` == `gradient/onboarding-1`, flattening the mesh. |
| f–i | various | Three shipped comments made factually wrong claims (the bridge header's "neutral 20 / 30 / 40", the APCA floor's "63–70", `tokens/01`'s `opacity-15|30|50`); `content/placeholder` equals `content/tertiary`; five gates now pass within 8% of their floor. |

**Resolutions.** aliasData is emitted only when the alias agrees on alpha as well
as hue, and a new invariant asserts it (a). `border/focus` owns a dedicated ramp
step per mode — `brand/75` light, `brand/45` dark — occupied by nothing else, plus
five collision assertions, because a ring is the one token that must not equal
anything it can be drawn against (b). The light status text ramp moved 70/80/90 →
80/90/100 and all five roles are gated on the surfaces, not just the page (c). Dark
disabled fill is `neutral/110`, asserted against `surface/elevated` (d). `mesh-3`
dark is `brand/90`, asserted (e). Comments corrected (f–i). `content/placeholder`
stays equal to `content/tertiary` deliberately: tertiary already sits on the 4.70:1
floor, so there is no room to make placeholder lighter without failing 1.4.3. The
thin margins are documented at the point of definition rather than widened, because
widening them means moving the brand.

Gates 152 → 172.

### I12 — Third pass: what I11 broke, and the one place the lesson stuck

I11 was re-audited in turn. **No third generation of value regressions** — all 172
gates reproduced independently, alias integrity and mode parity were exact, and the
round removed 39 collision pairs while adding only lateral or benign ones. But it
reproduced the *documentation* failure at the exact site it edited, and its new
gate named two members where a category was meant. Both are the rules at the end of
I11, written and then not applied.

| | Problem |
|---|---|
| a | `spec.mjs` and I5 both still claimed the disabled label measured "3.84:1 dark". That was the figure for a fill replaced two edits earlier; actual was 3.25:1. A wrong `E`-marked number, eight lines above the object that changed it. |
| b | Dark `fill/*-disabled` = `neutral/110` cleared the two surfaces the new assertion named and collided with `surface/tertiary` plus **six enabled interactive fills**. A dead control reading as a *live* control — worse than the card collision I5 set out to fix. The light side had the same problem (`neutral/30` == `fill/tertiary`) and went unreported because only dark had been examined. |
| c | Light `content/{role}` moving 70 → 80 to clear `surface/tertiary` dropped all five roles from 3.3–4.1:1 to 2.4–2.9:1 against `surface/inverse`, taking brand **below** the 3:1 floor it used to clear. Ungated. The real gap: no `content/{role}-inverse` existed, so a status label on an inverted panel had nothing correct to reach for. |
| d–f | `A4` still named `brand/70`/`brand/40`; `C9` still named the pre-I7 `content/tertiary`; `D6` claimed "now fully aliased" when I11a had deliberately un-aliased ten tokens. |
| g | Pre-existing, not caused by any round: the test rig iterated chart series **1–6** while five exist, so `flat('color/chart/6')` returned the `#FF00FF` fallback and §10 rendered a phantom magenta bar whose L\* polluted the reported greyscale gap. Present in the baseline. |

**Resolutions.** `neutral/105` added; disabled fills are `neutral/25` light and
`neutral/105` dark, the two rungs nothing else occupies, and the constraint is now
**generated** — every disabled fill is asserted against every enabled surface and
every enabled fill, 46 pairs per role, because a hand-written list has now failed
this three times (b). `CONTENT_ROLE_INVERSE` adds five tokens with the modes
deliberately swapped, gated on both inverted surfaces (c). Disabled label is
`neutral/80` light and `neutral/70` dark with recomputed figures (a). Contrast
gates gained the same mode-scoping the collision gates had — which immediately paid
for itself: the new `focus-inverse` on `surface/fixed` assertion failed on its first
run at 1.00:1, because `surface/fixed` is white in *both* modes and the inverse ring
is white in light. The ordinary brand ring is correct there, and both are now
asserted per mode. The rig's phantom series is gone (g).

Gates 172 → 188.

### What this section is really for

Every finding here is the same shape, including the ones in I11. The values were
defensible, the reasoning in this file was mostly excellent, and the gates were
real. What failed was **coverage**: assertion lists shorter than the claims they
backed, one state gated out of three, one surface out of four, one token named
where a category was meant, a metric applied where it cannot see.

I11 is the sharper lesson. Three of those nine were caused by a fix — moving a
value to satisfy a new gate pushed a different, ungated pair over its own edge.
I11c is the clearest case: the fix for `content/tertiary` was written as one
token's problem when it was every quiet-text token's problem, so it recurred
within the same commit that "solved" it.

So there are two rules, not one:

> A claim in this file is a liability until a gate names the specific pair.
> If you write `E`, point at the assertion. If you cannot, write `D`.

> When you move a value to satisfy a gate, sweep the family it belongs to. A fix
> that names one token where a category was meant will recur, usually immediately,
> and usually somewhere nobody is measuring.
