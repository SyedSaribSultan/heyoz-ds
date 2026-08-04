# CLAUDE.md

Instructions for any AI assistant working in this repo. Read this before editing.

## What this is

A design-token system. Colours are authored in OKLCH and computed; nothing is
hand-picked. Two source files produce everything else.

```
build/palette.mjs   the OKLCH engine and the authored ramps      ← edit
build/motion.mjs    the spring engine                            ← edit
build/layout.mjs    the layout primitives                        ← edit
build/spec.mjs      every decision: semantic map, gates, bridge  ← edit
build/build.mjs     emitters + validation                        ← edit (rarely)
build/shipped.mjs   pre-migration values, for the diff only      ← do not edit

tokens/   GENERATED  DTCG JSON for Figma
dist/     GENERATED  CSS + Tailwind preset + layout.css
reports/  GENERATED  audit data, rendered by showcase /verify
archive/  retired, wired to nothing — read archive/README.md first
showcase/ the living reference. Two routes: / and /verify
```

`test/index.html` is gone. It rendered the same `reports/audit.json` the `/verify`
route now renders, and it could only ever show the *token* gates — the six checks
that live at the component layer (`verify:primitives`, `:contrast`, `:motion`,
`:borders`, `:coverage`, `:classes`) were invisible to it. The last copy and its
template are in `archive/`, with the full argument and the instructions to restore
it.

There are three engines and they all work the same way: a perceptual declaration in
`spec.mjs`, a computed result. Colours are authored in OKLCH and computed
(`palette.mjs`). Springs are authored as a settle time and a bounce and computed
into CSS `linear()` curves (`motion.mjs`). Neither a hex nor a cubic-bezier is ever
hand-typed. `layout.mjs` is the odd one out — it computes nothing, but it is the
single place layout behaviour is described.

## The one command

```bash
node build/build.mjs      # or: npm test
```

Run it after every change. It is the test suite. It exits non-zero and prints the
offending token and measured value on any failure. No dependencies, Node 18+.

## Hard rules

**1. Never edit `tokens/`, `dist/`, `reports/` or `test/`.** They are overwritten
on every build. A change there looks like it worked and vanishes. If you want a
different value in `dist/tokens.css`, change `build/spec.mjs` and rebuild.

**1b. Never hand-type an easing curve either.** Springs are declared in
`spec.mjs` as `{ settle, bounce }` and computed by `build/motion.mjs` into a
`linear()` stop list. A pasted curve from a generator is a magic number — nobody can
say why the fourth stop is 1.0837, so nobody can change it. If motion feels wrong,
move `bounce` or `settle`. Two families and the split is load-bearing: `effects-*`
for colour and opacity and it **must not** overshoot; `spatial-*` for transform and
size and it **must**. Overshoot on an opacity clips at 1 and stalls, so it buys a
pause and no bounce; getting this backwards is what "the whole app feels bouncy and
cheap" actually is. The build measures the emitted curve rather than trusting the
declaration.

**1c. Never add a border without saying what it is for.** A stroke does one of four
jobs and only two of them need one: `affordance` (the boundary *is* the control — an
input, a secondary button, an unchecked box) and `state` (a focus ring, a selected
row). `separation` and `elevation` are build errors — separation is a surface step or
space, elevation is shadow in light and surface lightness in dark. Declare
`borderJob` on the variant; `verify:borders` sweeps every recipe and fails on an
undeclared border, an illegal job, and a stale declaration on a variant that no
longer binds one. This is why the count fell from 34 bindings to 21: almost all of
them were separation, and separation had a cheaper answer the whole time. Do not
restate the live count here — run `verify:borders`, which prints it. This sentence
read "to 19" for months; 19 was a figure `docs/DECISIONS.md` B20 had already
retracted, and the retraction never made it across.

**2. Never hand-type a colour above tier 1.** Every semantic token names a
primitive path like `solid/brand/60` or `opacity-15/neutral/20`. The build fails on
any colour-valued semantic token that names no primitive. If you need a colour that
does not exist, add a step to the ramp in `palette.mjs` — that is normal and cheap,
and there is precedent for it (the 25/35/45/95/105/115/135 half-steps all exist
because a ladder ran out of room).

**3. Never relax a gate to make the build pass.** The gate is the point. If
`content/foo on surface/bar = 4.31:1, need 4.5` then move `content/foo` one ramp
step, do not lower the 4.5. The only legitimate reasons to change a floor are a
documented standard change or a mode-scoping fix, and both belong in
`docs/DECISIONS.md`.

**4. When you add a token, add its gate — and write the gate by family.** This is
the single most important rule here, and it is learned the hard way. Every contrast
bug this repo has had came from gating one member of a group:

- `content/tertiary` was gated against the page but not the three card surfaces
- `content/on-brand` was gated against the base fill but not hover and active
- `content/brand` was gated while its four status siblings were not
- `fill/*-disabled` was asserted against two surfaces and collided with six fills

If you gate one token, ask what else is in its family and gate those too. Where the
set is large, generate the assertions in `build.mjs` rather than listing them — see
the disabled-fill sweep in `validate()`, which exists because a hand-written list
failed three times in a row.

**5. Verify numbers, do not restate them.** If you write a ratio in a comment or a
doc, compute it first. Several previously-shipped figures were wrong, including one
in the section a procurement reviewer would read. `reports/audit.json` has every
computed gate result; read it rather than trusting prose.

## Things that look like bugs and are not

Do not "fix" these. Each is a deliberate, documented decision, and each has been
"fixed" wrongly before.

**The brand fill is `#FF3D01`, not `#FF3D00`.** The brand guide says `#FF3D00`;
`brand/60` is OKLCH `L 0.6535 / C 0.2348 / h 34.0` and the round trip lands one
8-bit unit away. Hand-typing the hex would put brand outside the engine. If the
exact byte matters, move `L`.

**White text on the orange and red fills "fails" WCAG 2.x at 3.55:1.** Intentional.
WCAG 2.x has no polarity term so it prefers black on every fill lighter than
`#767676`; APCA reverses the verdict and is correct. These pairs are gated on APCA
Lc 60, not the WCAG ratio. axe and Lighthouse will flag them. An earlier revision
"fixed" this and shipped a near-black label on the destructive button. Read
`docs/DECISIONS.md` H1 in full before touching `CONTENT_ON`.

**In dark mode, elevation is lightness — not shadow, and not a border.** A drop
shadow on a near-black page barely reads, so depth is built upward instead: every
rung of the surface ladder is lighter than the one below it, ΔL 4.3–6.6 apart, and
`SURFACE_LADDER` in `spec.mjs` gates the ordering. This is why `surface/elevated`
and `surface/overlay` both sit at `neutral/105` in dark and both at `neutral/white`
in light — at the top of the usable ramp a popover separates by elevation, not by
hue, and there is only one rung available. The ceiling is set by text: `content/tertiary`
clears 4.5:1 only up to L\* 36.3, so no dark surface may be lighter than that.

**`fill/*-disabled` is darker than every surface in dark, and that is the point.**
Lighter reads as more prominent, so a disabled fill above the surfaces would look
more actionable than the live controls beside it. `neutral/95` was free and was
rejected for exactly that reason. Nothing here is constrained by a contrast floor —
WCAG 1.4.3 exempts disabled controls — only by collision, and it has now collided
five separate times. Read the comment on `FILL_DISABLED_OVERRIDE` before moving it.

**`border/focus-inverse` is the same colour as the page.** It is an inset ring, for
use on a saturated fill only. There is no colour that is readable both on brand
orange and on the white page beside it, which is why there are two ring tokens.

**`prefers-reduced-motion` does not switch motion off.** It removes *movement* and
keeps fades. `--oz-motion-spatial-scale` goes to 0, so every spatial translate —
authored as `calc(<distance> * var(--oz-motion-spatial-scale))` — collapses while the
opacity transition on the same element still runs; spatial springs repoint to their
effects equivalents so the overshoot goes too; `.oz-ambient` stops. The blanket
`* { transition: none !important }` reset that used to live in the showcase is
**wrong** and was removed: a background fading between two greys carries no
vestibular risk, so killing it costs those users a snapping interface and buys
nothing. Do not reintroduce it — and note it cannot merely coexist, because a
blanket `!important` block downstream of `tokens.css` wins the cascade and defeats
the graded version.

**A spatial translate must be written through the multiplier — unless the transform
*is* the state.** `translateY(6px)` is a bug; `translateY(calc(6px *
var(--oz-motion-spatial-scale)))` is the same motion that also knows how to stop.
This is why entrance animations ship as `.oz-enter-*` classes from the token layer
rather than as Tailwind keyframes — a keyframe defined in the app layer is a keyframe
defined outside the thing that knows when not to run.

The exception is narrow and real: the multiplier removes travel that exists to be
*noticed*, not travel that encodes *where something is*. A switch thumb multiplied to
zero sits in the same place whether the switch is on or off, so the component stops
communicating — a worse outcome for that user than the movement was. Those transforms
keep their distance and lose their overshoot instead, because their transition still
runs on a spatial spring that reduced motion repoints to an effects one. State
transforms are listed with a reason in `STATE_TRANSFORMS` in
`showcase/scripts/verify-motion.ts`, which fails both on an unlisted literal
transform and on a listed one that no longer matches — an exemption written down
beats a hole, and a stale exemption is worse than neither.

**`dist/layout.css` has no media queries and that is not an omission.** All eight
primitives read their own container, not the viewport, because the same card sits in
a 200px sidebar and a 900px column at one viewport width and a media query cannot
tell those apart. `minmax()` always wraps its minimum in `min(…, 100%)`; flex and
grid children always get `min-width: 0`. Both are gated — they are the two failure
modes that produce every horizontal overflow.

**Ten elevation tokens carry no Figma `aliasData`.** Deliberate. Figma discards a
variable's local value when it is bound to an alias, and these carry alpha
0.08–0.90, so an alias would import them opaque. An alias that lies about alpha is
worse than no alias. The build asserts the agreement.

**492+ of the colour primitives are unused.** The alpha grid is generated, not
curated. Decision D7.

**`dist/tokens.css` emits the light block twice.** Once in `:root`, once in
`.light` for scoped light islands. Both come from one map in one pass, so they
cannot drift.

## Conventions

- Names describe **role**, never appearance. `content/critical`, not `text-red`.
  Appearance words are permitted only at tier 1 (`spectrum-purple`, `neutral/white`).
- States are `hover`, `active`, `disabled`, `focus`, `selected`. A sixth goes in
  `spec.mjs`, never invented at a call site.
- Light and dark are declared on the same line — `role: [light, dark]` — so the
  modes cannot drift. Never add a mode-specific block.
- Dependency direction is one-way: primitives ← foundations ← semantic ← component.
- CSS variables are namespaced `--oz-`.

## Where to look

| Question | File |
|---|---|
| why is this value what it is | `docs/DECISIONS.md` — the tie-breaker if two things disagree |
| what broke before, and how | `docs/DECISIONS.md` §I, §I11, §I12 |
| how a dev consumes this | `docs/DEV-GUIDE.md` |
| how a designer imports it | `docs/FIGMA-GUIDE.md` |
| how to review a change | `docs/TESTING.md` |
| every computed gate result | `reports/audit.json` |

## Repo state

`.git` is live and changes are revertible. History was activated in `8b85a1a`, which
also retired the `git-history/` copy and `GIT-SETUP.md` — neither exists now, and
nothing needs renaming.

`build/shipped.mjs` and `dist/shadcn-bridge.css` are migration scaffolding and get
deleted once the app stops reading the old variables. Both say so in their headers.
