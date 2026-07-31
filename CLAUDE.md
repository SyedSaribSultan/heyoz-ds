# CLAUDE.md

Instructions for any AI assistant working in this repo. Read this before editing.

## What this is

A design-token system. Colours are authored in OKLCH and computed; nothing is
hand-picked. Two source files produce everything else.

```
build/palette.mjs   the OKLCH engine and the authored ramps      ← edit
build/spec.mjs      every decision: semantic map, gates, bridge  ← edit
build/build.mjs     emitters + validation                        ← edit (rarely)
build/harness.mjs   test-rig HTML template                       ← edit (rarely)
build/shipped.mjs   pre-migration values, for the diff only      ← do not edit

tokens/   GENERATED  DTCG JSON for Figma
dist/     GENERATED  CSS + Tailwind preset for the app
reports/  GENERATED  audit data
test/     GENERATED  standalone review rig
```

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

**`border/focus-inverse` is the same colour as the page.** It is an inset ring, for
use on a saturated fill only. There is no colour that is readable both on brand
orange and on the white page beside it, which is why there are two ring tokens.

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

Git history is in `git-history/`, not `.git` — see `GIT-SETUP.md` for the two
commands to activate it. It has not been done yet, so **changes are currently not
revertible**. Doing that rename is a reasonable first suggestion to the user.

`build/shipped.mjs` and `dist/shadcn-bridge.css` are migration scaffolding and get
deleted once the app stops reading the old variables. Both say so in their headers.

`test/index.html` needs the network for its two webfonts and nothing else; it shows
a banner if they fail to load.
