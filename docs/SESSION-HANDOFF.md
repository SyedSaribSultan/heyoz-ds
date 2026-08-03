# Session handoff

Context for an agent picking this work up mid-flight. Written 2026-08-02.

Read `CLAUDE.md` first — it is the house rules and it has been updated during this
session. This file is the narrative: what changed, why, and what is still open.

---

## Where the repo stands right now

```
node build/build.mjs            250/250 gates pass
cd showcase && npm run verify   6 suites pass
cd showcase && npm run visual   22 visual baselines pass
```

Showcase suites: `verify:primitives`, `verify:contrast` (98 component pairings),
`verify:motion`, `verify:borders`, `verify:coverage`, `verify:classes`.

`npm run visual` needs a BUILT server on :3000 (`npm run build && npm start`) and is
not part of `verify` for that reason.

Routes: `/` (index), `/c/[component]` (nine, SSG), `/verify` (audit).

Gate breakdown, all passing:

| suite | count | what it measures |
|---|---|---|
| contrast | 130 | WCAG 2.x ratio |
| APCA | 30 | Lc 60 floor on `content/on-*` pairs |
| visibility | 12 | |
| elevation | 8 | drop-shadow ΔL against the page |
| greyscale | 20 | chart series ΔL separation |
| **ladder** | **4** | **surface elevation monotonicity (new)** |
| **motion** | **22** | **spring overshoot + settle time (new)** |
| **layout** | **24** | **overflow safety (new)** |

**Nothing has been committed.** `showcase/` is still untracked. `git status` shows
modified `CLAUDE.md`, `build/build.mjs`, `build/spec.mjs`, `dist/*`, `docs/DECISIONS.md`,
`reports/audit.json`, `tokens/*`; deleted `test/index.html` and `build/harness.mjs`
(both moved to `archive/`); and new `build/motion.mjs`, `build/layout.mjs`,
`dist/layout.css`, `archive/`, `docs/SESSION-HANDOFF.md`, `showcase/`.

---

## Phase 1 — Product critique

The user asked what could be improved. I read the whole showcase and diagnosed it as
**two products sharing one page**: a *proof* (read once, be convinced) and a *tool*
(read daily, find a thing, copy it). Those want opposite information architectures,
which is why the Assembled screen — the most persuasive artifact — sat last, where a
tool puts its least-used content.

Findings that are still open are listed in **Still open** below.

Answers the user gave, which govern everything after:

- `showcase/components/ui/` is **intended to become the real component library**
- Audience is all four: app devs, designers, external evaluation, and the maintainer
- **Deployed publicly** (planned)
- Nothing hurts operationally — the goal is that it looks world-class

---

## Phase 2 — Visual pass (16 files)

Quantified the problem first:

| | before | after |
|---|---|---|
| `text-label-xs` | 50 | 13 |
| `text-body-xs` | 9 | 2 |
| largest type on the page | `display-sm` ×1 | `display-lg` ×1, `heading-xl` ×14 |
| border weights in use | 1 (all `primary`) | 3 (23/8/11) |

The page had **one** piece of large type and ~110 nodes at the smallest size and
lowest contrast. The type scale already had `display-lg` and `heading-xl`; the page
simply never reached for them. No token change was needed.

Direction chosen by the user from three options: **Editorial / Swiss**.

Changes:

- Hero → `display-lg`; the five stat figures → `display-sm`; all 14 section headings
  → `heading-xl` in Bricolage, so the display face carries every section instead of
  appearing three times
- `SubHead` (the most repeated style, ~50 instances) rebuilt off uppercase-mono-tertiary
  onto `label-md` medium at `content/secondary`; all 14 call sites recapitalised
- New `.oz-canvas` dot grid for specimen stages — keeps the constraint that a stage
  must be page-coloured while giving the region something to be
- Table row rules dropped from `border/primary` to `border/tertiary`; row padding opened
- Usage snippet now generates its `import` line from `meta.tag`
- Real inline SVG nav icons replacing `bg-current opacity-50` placeholder squares
- `Stage` gained an explicit `flush` prop — two callers were passing `className="p-0"`
  to fight the padding utility, which only resolved correctly by CSS source-order luck

**Rule observed:** no `tracking-*` or `leading-*` utility was added anywhere. Type
steps carry their own, and six such classes were deleted from this folder previously.

---

## Phase 3 — Motion and layout systems

The user asked for expressive motion in every component and layout that never breaks.
They explicitly did **not** want motion neutered by default.

### Research

- **Emil Kowalski / animations.dev** — only animate transform and opacity; ease-out for
  enter/exit; UI under 300ms; built-in CSS easings are too weak
- **Material 3 Expressive** — replaced duration+curve with springs. The **spatial /
  effects split** is the load-bearing idea and Apple arrived at it independently
- **Every Layout** (Pickering/Bell) — algorithmic, self-governing, no breakpoints
- **CSS `linear()`** — expresses real spring physics, all major browsers since Dec 2023.
  Needs 25–50 stops; values outside 0–1 are legal, which is what makes overshoot possible
- **Container queries** — `cqi`/`cqb` over `cqw`/`cqh`; component autonomy

### `build/motion.mjs` — the spring engine

Counterpart to `palette.mjs`. Same bargain: authored perceptually, computed technically.
Simulates a damped harmonic oscillator and emits a `linear()` curve, the settle time,
and the measured peak overshoot.

**A design correction worth knowing about.** I first used SwiftUI's `(duration, bounce)`
parameterisation and it was wrong for a design system: a spring declared at "250ms"
is still visibly moving at **368ms**, because settle is ~1.5× the period even at zero
bounce. The number in the spec was not the number on screen. Since the step response
depends only on `ω₀·t`, the file now solves for frequency from a declared **settle
time**, exactly, with no search.

Seven springs in `spec.mjs` → `MOTION.spring`:

```
effects-fast     120ms  bounce 0     hover, press, focus — must NOT overshoot
effects-default  180ms  bounce 0
effects-slow     280ms  bounce 0
spatial-fast     190ms  bounce 0.12  switch thumb, checkbox tick — must overshoot
spatial-default  340ms  bounce 0.18  cards, rows, popovers
spatial-slow     480ms  bounce 0.22  sheets, drawers
expressive       520ms  bounce 0.38  hero moments, one per screen
```

The 22 gates **measure the emitted curve**, not the declaration. They caught a real
miscalibration: `spatial-fast` was declared at 220ms, but it drives switch thumbs and
checkbox ticks, which fire on click and are therefore feedback. Moved to 190ms per
rule 3 (move the value, not the floor).

### Reduced motion — now graded, and now shipped

The old policy was a blanket `* { animation-duration: 0.01ms !important }` living only
in `showcase/app/globals.css`. Two problems: it removed colour fades that carry no
vestibular risk, and it **did not ship** — every app installing `dist/tokens.css` per
DEV-GUIDE got the tokens and none of the policy.

Now emitted in `dist/tokens.css`:

1. `--oz-motion-spatial-scale` → `0`, so every translate written as
   `calc(6px * var(--oz-motion-spatial-scale))` collapses while opacity keeps running
2. Spatial springs repoint to their effects equivalents (overshoot goes, speed stays)
3. `.oz-ambient` stops
4. Smooth scroll off

The blanket block was **removed**, not left redundant — `postcss-import` inlines
`tokens.css` first, so a downstream `!important` block wins the cascade.

### `build/layout.mjs` → `dist/layout.css`

8 container-aware primitives (Stack, Cluster, Switcher, Grid, Sidebar, Center, Frame,
Reel) + 4 overflow guards (truncate, break, balance, pretty). **Zero media queries.**

The 24 gates target the two failure modes behind essentially every horizontal overflow:
every `minmax()` must clamp with `min(…, 100%)`, and every flex/grid child must get
`min-width: 0`.

Two bugs the gates caught in my own work, both silent:

- `:nth-last-child(n + var(--switcher-limit))` — `var()` is illegal in `An+B`; the
  browser drops the whole rule and the quantity query never fires
- My own `no-fixed-width` regex was unsound: `\s*` backtracks to zero, so a negative
  lookahead tests the wrong position and always passes

### Motion in the recipe layer

`MotionSpec` is **abstract** on `ComponentRecipe` — the same device already used for
`focus`. A component cannot be added without declaring how it moves. All 9 recipes
declare it; `verify:motion` sweeps them.

This replaced real drift: `duration-fast ease-standard` hardcoded in six recipes,
`duration-base` in a seventh, and Skeleton using a local keyframe that **kept pulsing
under reduced motion** because it never carried the `.oz-ambient` marker.

---

## Phase 4 — Content workflow (14 agents, 70 min)

Research (Material/Apple, Polaris/Carbon/Primer, Wise/Atlassian/Spectrum) → house style
→ 9 component pages → adversarial critic.

The **house style** defines 11 sections, a voice (indicative mood, `should` banned
outright, a greppable banned-string list), and anti-patterns. It is at
`<scratchpad>/house.json`.

The **critic** recomputed ~35 cited contrast ratios against `dist/tokens.css` using the
repo's own `contrast()`/`composite()` and confirmed they hold — then found:

- 45 silently omitted sections (12 specced, 8 shipped)
- `anatomy` shipped on all 9 pages and **banned by name** in the house style's own
  anti-patterns. My error: I hardcoded it as required in the schema, and the schema
  fought the house style
- Two global policies restated 9× each — 18 copies that will drift
- Arithmetic contradicting the emitted artifact: `border-2` called "2px" (it is **1px**),
  and a fabricated "12px box interior" that is really 14px
- **A real bug in my code** — see below

A corrective workflow is **running now** with six mandated fixes.

---

## Phase 5 — The press-scale bug, and the stroke root cause

### B19 — reduced motion, again

`ComponentRecipe.motionClasses` emitted `active:scale-[0.98]` — a literal transform
that never read the multiplier. A button kept springing for a reduced-motion user while
everything else collapsed. Introduced **in the same change that wrote the rule into
CLAUDE.md**, and it survived four gate suites because no gate could see a literal
transform inside a class string.

Fixed, plus a source sweep in `verify:motion`. The sweep immediately found two more in
`switch.recipe.ts` — **and those are correct.** A thumb's position encodes *state*, not
decoration; zero it and on/off become visually identical. So the rule gained a carve-out
and `STATE_TRANSFORMS` gained two entries with reasons. The sweep fails on an unlisted
literal **and** on a stale exemption.

### B18 — the dark surface ladder

The user asked why everything is outlined. It is not taste — it is mechanical.

```
BEFORE (dark)                  AFTER (dark)
tertiary    29.5  lightest     elevated/overlay  33.8  lightest
overlay     26.6               tertiary          29.5
elevated    24.1  ┐ identical  secondary         24.1
secondary   24.1  ┘            primary           18.9
primary     18.9               background        12.3
background  12.3
```

`surface/elevated` was **byte-identical** to `surface/secondary`, and both floating
surfaces sat *below* the muted panel. A popover had no boundary except its stroke —
which is exactly what `card.recipe.ts` already documented and what the border was
silently paying for.

**It took five attempts.** Each failure was a gate:

1. `elevated` → `neutral/105` collided with all five `fill/*-disabled`
2. Floating pair → `95`/`100` failed `content/tertiary` at 3.40 and 4.17
3. Completing the `content/*` family exposed a pair below the 4.5 floor at the
   then-current values (`overlay` on `neutral/95`)
4. `neutral/100` for disabled collided with nine enabled fills
5. `neutral/115` — free, and correct for the right reason

**The ceiling is text, not taste.** `content/tertiary` clears 4.5:1 only up to
L\* 36.3, and `surface/tertiary` sits at 29.5, so the entire window for a floating dark
surface is one rung wide. `elevated` and `overlay` therefore share `neutral/105`, as
they already share white in light, for the identical reason.

**A second rule-4 hole surfaced.** `content/*` was gated against the page and three
surfaces but never against `elevated` or `overlay` — the two surfaces a popover and a
dialog are made of had **no floor at all**. Contrast gates 118 → 130.

**Disabled fills are deliberately darker than every surface.** In dark mode lighter
reads as more prominent, so a disabled fill above the surfaces would look *more*
actionable than the live controls beside it. `neutral/95` was free and rejected for
that reason. WCAG 1.4.3 exempts disabled controls from contrast floors, so only
collision constrains them.

Recorded as DECISIONS B18, B18a, B18b, B18c, B19.

---

## In flight right now

Corrective content workflow (`wf_6fe844fc-03c`), 9 rewrite agents + a re-critique.
Six mandated fixes: ship all 12 sections, drop anatomy, delete the 18 duplicated policy
restatements, fix the `border-2` arithmetic, de-duplicate within pages, and re-cite
every figure against the **new** ladder rather than carrying stale numbers over.

Prior results are split into `<scratchpad>/house.json`, `critique.json`, and
`content-<id>.json`.

---

## Phase 6 — Strokes, routes, content (all done)

**B20 — the stroke policy.** `BorderJob` declared per variant; only `affordance`
(the boundary *is* the control) and `state` (focus ring, selected) may draw one.
`separation` and `elevation` are build errors. **34 bindings → 19**, across 7
variants: 18 affordance, 1 state. Badge lost 6, Alert 4, Card 4 of 5. `verify:borders`
holds it, and fails on a stale declaration too. The dark ladder fix was the
precondition — before B18, Card's `overlay` border was genuinely load-bearing.

**B21 — the route split.** `/` answers *what is this and how do I use it*;
`/verify` answers *how do I know it is correct*. Split by question rather than by
section, because every section had both. Binding tables, all 250 gate results and
the resolved values moved to `/verify`; each component section keeps a deep link to
its evidence. `/` fell from 39.1 kB to 12.4 kB before content landed.

**B22 — `test/index.html` retired.** It rendered the same `reports/audit.json` that
`/verify` renders, and could only ever show the token gates — `verify:contrast`,
`verify:motion`, `verify:borders` and `verify:classes` all measure a layer it could
not see. Last copy and `harness.mjs` in `archive/` with restore instructions. The
cost, weighed: the rig opened by double-click with no server.

**The content.** Three passes and two adversarial reviews. Nine pages, twelve
sections each, in `showcase/lib/content/pages/*.json`, rendered by
`ContentSections.tsx`. Zero banned hedge strings. The reviewer recomputed ~95 cited
figures against `dist/tokens.css` and confirmed them.

Two defects worth remembering, both caught by recomputation rather than reading:
a fabricated "12px box interior" that is really 14px, and a 4.49:1 ratio that
**came from me** — true during ladder attempt three, dead two attempts later, and
repeated in my own `DECISIONS.md` entry. Rule 5 violated while documenting a rule-4
fix.

## Still open

Carried over from the Phase 1 critique, not yet agreed:

- **The layout primitives are built, emitted and gated but not consumed.** The 9
  components still use their own Tailwind flex/grid classes.
- **14 orphaned tokens** — `chart-1..5` and 9 `gradient-*` ship and are drawn nowhere.
  Best fixed as a computed gate ("semantic token groups with no consumer: N") rather
  than a one-off section.
- **This layer's own verification is invisible on the page.** The header trust line
  shows the *token* build's numbers; the four showcase suites appear nowhere.
- **No staleness signal** — edit `spec.mjs`, forget to rebuild, and the page shows a
  confident old date.
- **No DEV-GUIDE sections** for motion or layout consumption.
- **Recipes could emit.** They are already a machine-readable contract and nothing
  exports them. `recipes.json` would let a Figma plugin, an ESLint rule, and an MCP
  server consume the same source.

---

## Gotchas for whoever picks this up

- **`border-2` is 1px.** The preset maps `borderWidth` onto the stroke scale.
  `--oz-stroke-2: 1px`. Two content agents got this wrong.
- **Never add `tracking-*` or `leading-*`.** Type steps carry their own.
- **Never hand-type an easing curve.** Move `settle` or `bounce` in `spec.mjs`.
- **Spatial transforms route through `--oz-motion-spatial-scale`** unless the transform
  encodes state, in which case it goes in `STATE_TRANSFORMS` with a reason.
- **Tailwind's scanner splits arbitrary values on commas**, so
  `[transition-property:a,b,c]` never generates. Emit a real class instead.
- **`var()` is illegal in `:nth-child()`** and fails silently.
- **PowerShell 5.1 has no `&&`.** Use `;` or separate calls. The shell's CWD persists
  between tool calls and has drifted into `showcase/` more than once — use
  `Set-Location` explicitly before `node build/build.mjs`.
- **I have never seen any of this rendered.** No browser tool was available this
  session. Everything is verified by the gates and by grepping the prerendered HTML.
  The two judgement calls most worth a human eye: the `.oz-canvas` dot weight in dark,
  and whether `expressive` at 9.5% overshoot feels right.


---

## Phase 7 — Routes, coverage, and eyes on the thing

**Per-component routes.** `/c/button` … `/c/checkbox`, nine static pages from
`generateStaticParams` over `allRecipes`. `/` became hero + foundations + a component
index + Assembled, and fell from **69.8 kB to 12.7 kB**. The written guidance had
made a component section ~16,000px tall, so the single scroll was ~150,000px — good
content is what broke the page, which is a strange thing to have to fix.

**`verify:coverage`** — every semantic colour group must be *drawn* somewhere, not
just shipped. It caught `chart-1..5` and nine `gradient-*`: fourteen tokens that
shipped in every build, carried twenty greyscale gates between them, and appeared on
no page. A gated token nobody renders is a gate nobody can falsify.

Two false passes on the way, both mine and both instructive. First it tested for the
bare word, so `chart` and `gradient` matched *prose* and it reported six of six
covered. Tightened to require a utility, a CSS var or a token path. Then it still
passed, because `lib/content/pages/*.json` was in the scan and Badge's page
*discusses* the chart gate — so the guidance about the bug was counted as coverage of
it. Content is excluded now.

The new **Charts & gradients** section draws all fourteen, and renders the five
series a second time desaturated: the greyscale gate made visible, so a sixth series
added on hue alone becomes two identical grey bars before it becomes a failing build.

**Component-layer checks on `/verify`.** The six suites printed to a terminal and
vanished while the page showed the token build's 250 as though it were the whole
story. They write to `reports/showcase-verify.json` (gitignored, timestamped) and
render on the audit route.

**Visual regression — 22 baselines**, one per component per mode plus both route
shells. This is the only check in the repo that can see the page, and it exists
because the border/content divergence cost two review passes to find while every gate
stayed green.

It did not work the first time. The locator was `main section > div > div`, which
captured the entire 8,000px component page instead of the specimen — so a
deliberately removed border was far under the diff threshold and the suite passed a
real regression. Stage now carries a `data-specimen` attribute, and the test asserts
the captured box is under 1200px tall so it cannot silently widen again.

Re-tested by removing `input/default`'s base border: **caught in dark, passed in
light.** `border/secondary` is ΔL 4.5 on the dark field and ΔL 1.1 on the light one.
Both modes are shot for that reason, and the note is in the spec file.

## Gotchas added this phase

- **Installing an npm package invalidates `.next`.** Both Playwright installs left
  the build serving `Cannot find module './833.js'`. `rm -rf .next && npm run build`.
- **`pkill -f "next start"` does not work here**, and job control does not persist
  between tool calls. Kill by port:
  `Get-NetTCPConnection -LocalPort 3000 -State Listen | Stop-Process -Id $_.OwningProcess -Force`.
  Two separate debugging detours came from a zombie server on :3000 serving a stale
  build — including one where the visual suite "passed" against week-old HTML.
- **Custom properties in inline `style` need `as React.CSSProperties`.**
