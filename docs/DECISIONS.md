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
| B15 | B14's ten tokens had zero gates, and prose ("never `linear` on a transition") is not a gate. Six components had hardcoded `duration-fast ease-standard`, a seventh `duration-base`, and the durations had already drifted | Springs, computed from `{settle, bounce}` by `motion.mjs` into CSS `linear()`. Two families: `effects-*` must not overshoot, `spatial-*` must. 22 gates measure the emitted curve, not the declaration. `MotionSpec` is a required field on every recipe, so a component cannot be added without answering how it moves | `spec.mjs` MOTION.spring, `motion.mjs`, `Recipe.ts` | M |
| B16 | The `prefers-reduced-motion` policy lived only in `showcase/app/globals.css`, so the demo honoured it and every app installing `dist/tokens.css` per DEV-GUIDE did not. It was also a blanket `*` reset, which removes colour fades that carry no vestibular risk | Graded tier, emitted in `dist/tokens.css`: `--oz-motion-spatial-scale` → 0 collapses all travel, spatial springs repoint to effects equivalents, `.oz-ambient` stops, smooth scroll off. Fades untouched. The blanket block was removed rather than left redundant — downstream of the import it wins the cascade | `build.mjs` `reducedMotionBlock()` | M |
| B17 | "Responsive" meant viewport breakpoints, which cannot distinguish a card in a 200px sidebar from the same card in a 900px column at one viewport width — so one of them is always wrong and the fix is a one-off override | 8 container-aware layout primitives + 4 overflow guards in `dist/layout.css`, no media queries. 24 gates, including that every `minmax()` clamps its minimum with `min(…, 100%)` and every flex/grid child gets `min-width: 0` | `layout.mjs` | M |
| B18 | The dark surface ladder did not express elevation, so borders were paying for it. `surface/elevated` was byte-identical to `surface/secondary` (both `neutral/120`, `#211F1D`) and both floating surfaces sat *below* `surface/tertiary` — a popover read as less elevated than a muted panel and had no boundary against an input background except its stroke. Ungated: `COLLISION_ASSERTIONS` held `elevated` against `overlay` and never against `secondary`, and the elevation gates only measure drop shadows | Both floating surfaces move to `neutral/105` (`#393735`, L\* 33.8), above `tertiary`. Ladder is now monotonic in dark at ΔL 4.3–6.6 per rung, which is enough for the surface alone to carry the boundary. New `SURFACE_LADDER` monotonicity gate, plus the four collision pairs the list was missing | `spec.mjs` SURFACE, `build.mjs` ladder gate | **M** |
| B18a | The ceiling is set by text, not taste. `content/tertiary` clears 4.5:1 only up to L\* 36.3, and `surface/tertiary` sits at 29.5 — so the entire window for a floating surface in dark is `29.5 < L* ≤ 36.3`, which contains exactly one rung. `elevated` and `overlay` therefore share it, as they already share `neutral/white` in light and for the identical reason. The pairwise assertion between them was removed: it was standing in for the real defect (both colliding with `secondary`), which is now asserted directly | `spec.mjs` COLLISION_ASSERTIONS | S |
| B18b | Completing B18 surfaced a second rule-4 hole: `content/*` was gated against the page and three surfaces but never against `surface/elevated` or `surface/overlay` — the two surfaces a popover and a dialog are made of were the only places text could be set with no floor at all. It passed unnoticed while both were dark enough to clear 4.5 by luck | Six assertions added, completing the family. Contrast gates 118 → 130. As shipped all six pass in dark: `content/primary` 10.16:1, `content/secondary` 6.54:1, `content/tertiary` 4.95:1 — the last is the tightest pair the addition created and the one that set the ladder's ceiling. **Do not cite 4.49:1 here.** That figure was real during the third of five ladder attempts, when `overlay` sat at `neutral/95`, and it stopped being true the moment the floating pair moved to `neutral/105`. It survived into an earlier revision of this row and into the content pipeline, where a component page reported a passing gate as failing — rule 5 in miniature, committed while documenting a rule-4 fix | `spec.mjs` CONTRAST_ASSERTIONS | **M** |
| B18c | Taking `neutral/105` for a surface evicted `FILL_DISABLED_OVERRIDE`, which had spent three attempts finding a rung no enabled surface or fill occupied. Attempts four and five: `neutral/105` collided with the new floating surfaces, `neutral/100` with nine enabled fills — the "dead control reads as a live control" failure, twice more | Disabled fills move to `neutral/115` (`#272524`). Darker than every surface deliberately: in dark mode lighter reads as more prominent, so a disabled fill above the surfaces would look *more* actionable than the live controls beside it. `neutral/95` was free and was rejected for that reason. WCAG 1.4.3 exempts disabled controls from any contrast floor, so only collision constrains it | `spec.mjs` FILL_DISABLED_OVERRIDE | S |
| B20 | 39 border declarations, all at one weight, and the page read as boxes inside boxes. 34 were recipe bindings and almost all were separation — a card outlined against a page it already differed from, a badge outlined on top of its own status tint, an alert doing the same. Nothing stopped any of them, because a border is the easiest thing in CSS to add and the hardest to argue against one at a time | `BorderJob` declared per variant. Only `affordance` and `state` may draw a stroke; `separation` and `elevation` are build errors. **34 bindings → 21** across 7 variants, all `affordance`. Badge lost all 6, Alert all 4, Card 3 of 4 variants. Enforced by `verify:borders`, which also fails on a stale declaration. **This row read "19: 18 affordance, 1 state" for several hours and was wrong** — `card/interactive` was stripped with the rest and had to be given back, as `affordance` rather than the `state` first recorded here. Its boundary is what says the whole card is one target, the same argument `button/secondary` wins; and in light `fill/elevated-hover` and `surface/primary` are byte-identical (#F7F5F4), so the hover is carried by the border step, the shadow step and the 2px lift, and removing one left two on the one variant whose purpose is looking clickable. Dark moves #151312 → #2E2C2B and would have hidden it | `types.ts`, `verify-borders.ts` | **M** |
| B21 | The showcase was two products on one page — a *proof* (read once, be convinced) and a *tool* (read daily, find a thing, copy it), which want opposite information architectures. The symptom: a 40-row hex binding table sat between the specimen and the usage snippet on the page someone opens to look at a button, and the Assembled screen — the most persuasive artifact in the repo — was last | Split by *question*, not by section: `/` answers "what is this and how do I use it", `/verify` answers "how do I know it is correct". Binding tables, all 250 gate results and the resolved values moved to `/verify`; each component section keeps a deep link to its own evidence. `/` fell from 39.1 kB to 12.4 kB. Density is correct on `/verify` and stays there | `app/verify/`, `lib/core/gates.ts` | **M** |
| B22 | `test/index.html` and `/verify` rendered the same `reports/audit.json`, and the rig could only ever show the *token* gates — `verify:contrast` (the 98 pairings recipes CREATE, invisible to `spec.mjs`), `verify:motion`, `verify:borders` and `verify:classes` all measure a layer it could not see. A verification artifact that structurally cannot show half the verification is worse than none, because it looks complete | Rig retired, not emitted. Last copy and `harness.mjs` in `archive/` with restore instructions. **Cost, weighed and accepted:** the rig opened by double-click with no server and no npm; `/verify` needs `npm run build && npm start` | `archive/README.md` | S |
| B23 | The page reported `250/250 gates · no build errors · built <date>` whether or not the build still described the code. Edit `spec.mjs`, forget to rebuild, and a confident stale figure sits where a reviewer is most likely to trust it | `build.mjs` records each authored source's mtime into `audit.sources`; `lib/core/staleness.ts` compares them against disk and the trust line reports staleness instead of the count. Server-only — the first attempt did the check in `audit.ts` behind a `typeof window` guard and broke the whole build with `UnhandledSchemeError: node:fs`, because webpack resolves the import regardless of a runtime guard. Routes compute it; the result travels into the client tree as a plain array | `staleness.ts` | S |
| B24 | Eight layout primitives were built, gated with 24 assertions, and then used **five times**. 36 hand-written `flex flex-col gap-space-N` remained, each one missing the `min-width: 0` the primitive exists to supply. The cause was not doubt — it was that `<div className="oz-stack" style={{'--stack-space':'var(--oz-space-4)'}}>` is worse to type than `flex flex-col gap-space-4`. **A safety feature that costs more to type than the unsafe version is a safety feature nobody uses** | Spacing-step modifiers — `.oz-stack-4` is as terse as the Tailwind and keeps the guard. 45 sites converted; all 22 visual baselines unchanged, which is the result that matters: the guard was added and nothing moved. A sweep in `verify:coverage` fails on any raw stack or cluster that a primitive covers | `layout.mjs` `renderSteps()` | **M** |
| B25 | The recipe layer — a complete machine-readable description of every component — could only be read from inside this one React app. The repo's whole thesis is "generate everything from one source", and this was the one place it stopped halfway | `dist/recipes.json`: 9 components, 30 variants, 139 bindings, each resolved in both modes so a consumer never reimplements the resolver and drifts from the build. Enables a Figma plugin, an ESLint rule banning hand-written `bg-fill-*`, an agent reading real bindings, and `git diff dist/recipes.json` as a readable answer to "what changed about the components" | `emit-recipes.ts` | S |
| B26 | The nav rail's current item was `bg-fill-selected` — brand at 15% alpha — with `content/selected` on it: a salmon tile in a column of grey text, and the loudest element on an otherwise restrained page. `useActiveSection`'s own comment argues that an accent used four times has stopped being a signal, and this was the fourth use | Accent on the label, no block. Colour plus weight is unmistakable for a current page and takes no visual budget; `aria-current` carries it for anyone not reading colour. **Revertible in one line** — put `bg-fill-selected` back. The tokens are unchanged and still used by Table's selected row and Card's selected state, where a filled block is right because the thing selected is a region rather than a label | `Chrome.tsx` | D |
| B19 | `ComponentRecipe.motionClasses` emitted `active:scale-[0.98]` — a literal transform that never read `--oz-motion-spatial-scale`, so a button kept springing under the pointer for a user who had asked for reduced motion while every other spatial movement collapsed. Introduced in the same change that wrote the rule into CLAUDE.md, and survived four gate suites because no gate could see a literal transform inside a class string | Routed through the multiplier. New source sweep in `verify-motion.ts` over `Recipe.ts` and every recipe. It immediately found two more in `switch.recipe.ts` — which are *correct*, because a thumb's position encodes state rather than decoration, so the rule gained a documented carve-out and `STATE_TRANSFORMS` gained the two entries with reasons. The sweep fails on an unlisted literal **and** on a stale exemption | `Recipe.ts`, `verify-motion.ts`, CLAUDE.md | **M** |
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

### I13 — Two silent no-ops: a scrim that painted nothing, a preference that did nothing

Found by opening a dialog and noticing the panel appeared to sit *on* the page rather
than above it. Neither of these changed a token value; both were declarations that
looked correct, were never measured, and did nothing at all.

| | Problem |
|---|---|
| a | Dialog's backdrop was `bg-content-fixed-primary/70`. The preset emits every colour as a bare `var(--oz-…)` with no `<alpha-value>` slot, so Tailwind can neither parse nor call it, `withAlphaValue` returns the default, and **no rule is emitted** — measured: 0 occurrences of any `/nn` opacity-modifier rule in the whole 310 kB stylesheet. The element rendered `fixed inset-0` and fully transparent, so `surface/overlay` sat on `surface/page` with only its shadow between them. The tokens for the job, `overlay/dimness` and `overlay/blur`, already existed and were consumed only by the Elevation section's own demo — whose caption reads "The dim layer is a token, not an opacity guess." |
| b | The entire `prefers-reduced-motion` block was inert. It was emitted *after* the closing brace of `@layer base`, on the reasoning that unlayered CSS outranks layered CSS. True of real cascade layers; false here — Tailwind consumes `@layer base` as its own directive, hoists the contents to the `@tailwind base` position, and emits no `@layer` at-rule at all. Measured in the compiled sheet: the override at **byte 95**, the `:root` that sets the multiplier to 1 at **byte 8849**, identical specificity, no layers. Later won. With the preference enabled the multiplier measured `1`, so every `.oz-enter-*` kept its full travel and every press-scale kept its squash, and the four spring remaps never applied either, so spatial curves kept their overshoot. |
| c | Dialog declared `enter: 'rise'` and applied it nowhere, so the panel appeared instantly under a scrim that was itself invisible. Five other recipes also declare an entrance and leave it to the caller, which is correct for them — a card animating on every grid render is noise. A dialog is created *by* the interaction, so it owns its own mount and there is no caller to defer to. |

**Resolutions.** The scrim is `dialogRecipe.scrimStyle`, reading both overlay tokens
directly — a style object because they are not `color/*` tokens and are deliberately
absent from the preset. Verified in a browser: `rgba(7, 6, 5, 0.4)` light and
`rgba(0, 0, 0, 0.6)` dark, matching `overlay/dimness` in each mode, with
`blur(4px)` from `overlay/blur`. The reduced-motion block moved inside `@layer base`,
after the mode blocks; the multiplier now measures `0`, the panel's transform stays
`matrix(1, 0, 0, 1, 0, 0)` throughout, and its spring resolves to the effects curve —
movement gone, fade kept, which is the policy the block always claimed. `enterClass`
is applied by Dialog, with the exception stated on the call site.

**Why nothing caught either.** This is I11's lesson in its purest form — a metric
applied where it cannot see.

- `verify:classes` diffs *prerendered HTML* against the stylesheet. A closed dialog
  renders `null`, so its markup was absent from the only input the check reads. It
  had already found this exact bug shape once, at `bg-background/95` in the header,
  where the markup does prerender.
- Nothing could have caught (b) upstream at all. `build/build.mjs` emits correct CSS
  in a correct order; the breakage is introduced by a second tool rearranging it. Only
  the compiled artefact knows.

Three checks were added, and each one was confirmed to fail before it was trusted.
`verify:classes` gained a **source scan** for opacity modifiers on token colours,
which does not care whether a state is reachable without a click, and a **cascade
check** that brace-matches the reduced-motion block in the compiled sheet and asserts
every one of its five overrides appears later than the last unconditional declaration
of the same property — reintroducing (b) fails it with all five byte offsets. The
visual suite gained an **open-dialog baseline** in both modes, which resolves both
overlay tokens through a throwaway probe element and compares the scrim's computed
value against them, so it pins the scrim to the tokens rather than to a hex; the
panel itself had no baseline in either mode before this, because Dialog's specimen is
its Live row of buttons.

The cascade check is the one worth keeping in mind. It asserts a property of *output*
that no assertion about *input* can reach, which is a category this repo did not
previously test at all.

### I14 — Opening a modal moved the whole page 15px sideways

Reported from the screen, not found by a gate: the scrollbar disappears when a dialog
opens and the page slides right to fill its track. Deliberately treated as a foundation
problem rather than a Dialog one — Dialog was simply the only overlay that existed yet,
and a sheet or a command palette would have arrived with the same bug already in it.

| | Problem |
|---|---|
| a | The lock was `document.body.style.overflow = 'hidden'`, three lines inside one component. A classic scrollbar is 15px of real layout width, so turning it off hands those 15px back to the document. Measured: layout width 1265 → 1280, the sticky header's right edge and the sidebar's left edge both travelling 14.86px, on every open. |
| b | Nothing named the behaviour, so the next overlay would have copied those three lines along with the bug. Related: the save/restore-a-string approach cannot express two overlays at once — a dialog opened from a sheet unlocks the page when the inner one closes. |
| c | Introduced by the fix for (a), and caught before shipping: a reserved gutter is outside the initial containing block, so the scrim's `inset: 0` stops 15px short of the window edge and left an undimmed page-coloured band down the right of a dimmed page. |

**Resolutions.** `scrollbar-gutter: stable` on `:root` in the token layer, next to
`color-scheme` — that property already decides what the native scrollbar *looks* like,
and this decides whether it takes up room. Reserving the track up front means removing
the scrollbar costs no width. Isolated by measurement: with `stable` the sidebar moves
`0.00px`, with `auto` it moves `15.00px`.

The lock is now `.oz-scroll-lock` in the same file, applied to the root element rather
than to `<body>`, so the element carrying the gutter is the element being locked and
propagation drops out of the reasoning. `useScrollLock` in the showcase is the reference
consumer and holds the depth counter that fixes (b). The gutter is painted while locked
as `overlay/dimness` over `color/background`, which is exactly what the scrim is —
verified per mode: light `rgb(255,255,255)` + `rgba(7,6,5,0.4)`, dark `rgb(7,6,5)` +
`rgba(0,0,0,0.6)`, both matching the scrim's own computed value (c).

Two layers rather than one translucent colour, because a semi-transparent background on
the root composites against the browser's default canvas instead of against the page,
which comes out grey in dark mode.

**The gate, and why it needed its own browser.** `visual/scroll-lock.spec.ts` asserts
that opening a dialog moves neither a fixed nor an in-flow element, preserves the scroll
position, actually blocks the wheel, and releases cleanly. It runs in a second Playwright
project because Chromium headless passes `--hide-scrollbars`, which means the condition
being tested — a classic scrollbar being taken away — cannot occur, and the spec would
have passed while measuring nothing. Dropping that one default argument produces a real
15px scrollbar. It is scoped to that project because a 15px scrollbar changes the layout
width of every page.

Confirmed to fail before being trusted, at both layers: deleting the token line fails it
on `scrollbar-gutter` computing to `auto`, and suppressing that assertion fails it on the
layout width at exactly 15px.

**Three things this cost, all worth recording.**

- `documentElement.clientWidth` is the wrong instrument and the first draft asserted on
  it. It is the padding box *minus the scrollbar*, so a reserved-but-empty gutter counts
  toward it: locking sends it 1265 → 1280 while the gutter is still reserved and nothing
  has moved. `body`'s width is the honest reading, because the gutter sits outside the
  content box its children lay out in.
- The same draft reported a scroll-position reset that was entirely its own doing.
  Playwright scrolls a target into view before clicking, so a trigger that had gone
  off-screen meant the *click* moved the page between the two measurements. Four
  candidate locks were measured directly before the real cause was found; all four
  preserved scroll perfectly.
- All 34 visual baselines changed, and the new ones are more faithful than the old.
  `--hide-scrollbars` hides the scrollbar without reserving its space, so headless had
  been rendering every page at 1440 while every real user with a scrollbar sees 1425.
  The gutter reservation reclaims that 15px, which is what a real browser always did.

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
