# Handoff

What this is, how to run it, what is finished, and what is not. Written for the two people
picking it up: a **developer** wiring it into the app, and a **designer** importing it into
Figma.

If two documents ever disagree, `docs/DECISIONS.md` is the tie-breaker.

---

## Run it

```bash
node build/build.mjs                    # the token build. 256 gates. This is the test suite.
cd showcase && npm install
cd showcase && npm run verify           # the component layer. 9 suites.
cd showcase && npm run visual           # 75 visual tests. Needs a built server — see below.
```

`npm run visual` is **not** part of `verify`, because it needs a real server on :3000:

```bash
cd showcase && npm run build && node scripts/serve.mjs 3000
cd showcase && npx playwright test
```

Everything passes as of this handoff. If something fails, it is a regression and the failure
message names the token and the measured value.

---

## For the developer

Three files, and you only consume them:

| File | What it is |
|---|---|
| `dist/tokens.css` | Every token as a CSS custom property, `--oz-*`. Import once, at the root. |
| `dist/tailwind.tokens.js` | A Tailwind **v3** preset. `require()` it into `tailwind.config.js`. |
| `dist/layout.css` | Eight container-aware layout primitives. Optional but recommended. |

Read **`docs/DEV-GUIDE.md`** before wiring it up. The two things that catch people:

1. **There is no `<alpha-value>` slot.** Every colour is emitted as a bare `var(--oz-…)`, so
   Tailwind opacity modifiers like `bg-fill-brand/50` generate **nothing at all** — silently.
   Use the `-secondary` wash tokens instead. `verify:classes` gates this.
2. **`border-2` is 1px.** The stroke scale is 0.5 / 1 / 1.5 / 2 / 2.5 / 4, so the Tailwind key
   is an index, not a pixel count.

The React components in `showcase/components/ui/` are real and importable — 34 of them, each
compiled from a recipe in `showcase/lib/recipes/`. `dist/recipes.json` is the machine-readable
description of all 34 if you want to generate anything from them.

### Scaffolding that should be deleted

Both say so in their own headers:

- `build/shipped.mjs` — pre-migration values, kept only so the build can diff against them.
- `dist/shadcn-bridge.css` — maps the old shadcn variable names onto the new tokens. Delete
  once the app stops reading `--primary`, `--destructive`, `--sidebar` and friends.

---

## For the designer

**Two import paths, and they need different files.** This was previously documented as "either
path works from the same files", which was wrong — see `docs/FIGMA-GUIDE.md`.

| Path | Use | Files |
|---|---|---|
| **Tokens Studio** plugin | recommended | `tokens-studio/` |
| Figma **native** Variables import | no plugin needed | `tokens/` |

`tokens-studio/` is **one file**, `heyoz.tokens.json`, with the six sets as top-level keys and
`$themes` / `$metadata` inline — so the sets, their resolution order and the Light/Dark themes are
wired up on paste and you do not rebuild them by hand. The plugin cannot open a folder, which is
why this is a bundle rather than a directory. It expresses every alias as a real reference
(`{solid.brand.60}`), so changing a primitive flows through everything downstream.
**1228 tokens, 450 references.**

`tokens/` is DTCG-2024, where a colour's value is an object. Figma's native importer reads that;
Tokens Studio does not.

**Read `tokens-studio/README.md` before touching Figma.** Two things silently ruin the import — a
theme not being active, and exporting a semantic set before its primitives — and both look like
success. That file is written from an import that went wrong four times; it has the six export
passes, five verification checks, the four Effect Styles with exact geometry, and why scoping and
hide-from-publishing are not the same control.

Background and rationale in **`docs/FIGMA-GUIDE.md`**.

---

## What is finished

**The token layer.** 680 colour primitives, 202 semantic tokens per mode, both modes from one
declaration so they cannot drift. Colours authored in OKLCH and computed — no hex is ever
hand-typed above tier 1. Springs authored as `{ settle, bounce }` and computed into CSS
`linear()` curves. 256 gates.

**The component layer.** 34 components in seven families:

```
actions 3      Button · Button Link · Icon Button
forms 11       Checkbox · Dropzone · Field · Input · Listbox option · Radio
               Segmented control · Select · Slider · Switch · Textarea
overlays 4     Dialog · Menu · Popover · Tooltip
feedback 5     Alert · Empty state · Progress · Skeleton · Toast
navigation 3   Breadcrumb · Stepper · Tabs
containers 5   Accordion · Card · Pricing Card · Separator · Table
identity 3     Avatar · Badge · Chip
```

Every one declares its motion, its focus treatment and the job of any border it draws. The
suites that verify this layer are listed in `showcase/package.json`; run `npm run verify` for
the live set rather than trusting a count here. One of them exists for a gap the others
structurally cannot see: `verify:composite` (text over a translucent fill, and text on a
surface the component does not paint).

There used to be a second such gate, `verify:glow`, for text over a gradient. It is retired —
both of its grounds modelled `/ai-ugc`, and that route is gone. The retirement note in
`showcase/package.json` says how to recover it and what would justify it.

**The showcase.** `/` is the reference, `/verify` is the evidence, `/c/[component]` is a page
per component. `/studio` and `/static-ads` are product screens built from the system.

---

## What is NOT finished

Three things. **None of them blocks shipping** — the system is complete and green without them.

### 1. Guidance pages — 25 of 34 missing

The written "reach for this when / reach for something else when" page per component. Nine
exist: button, badge, input, card, alert, table, skeleton, switch, checkbox.

**Impact: cosmetic.** A component page without one still renders its specimen, its state
matrix, its token bindings and its usage snippet — the guidance section is simply absent, which
`lib/content/index.ts` documents as intended behaviour while a page is being written.

**Why it is safe to defer:** every reason is already written into `recipe.notes[]` on each
recipe. Expanding those into the 12-section format is transcription, not invention.

### 2. Eighteen contrast pairings recorded in `DECISIONS.md` §G

Accent text — red, orange, green, blue, link — measures 3.9–4.1:1 on the top two rungs of the
**dark** surface ladder, against a 4.5 floor. Those two rungs are Dialog and Card/`overlay`.

**Impact: none today.** Every component routes around it using the one-step-brighter `-hover`
token, and `CLAUDE.md` rule 4b states the rule. `verify:composite` tracks all 18 as a ratchet:
it fails on a new failure, on a regression, and on an entry that has been fixed but left listed.

**It would bite** if someone hand-writes `text-content-critical` inside a dialog rather than
`text-content-critical-hover`.

**Cost to fix properly:** move six tokens one ramp step in dark. That repaints every accent in
dark mode, including the `/static-ads` headline accent line, which sits on a composited
gradient ground no gate now measures — so every dark baseline has to be re-approved by eye.
That is a design review, not a bug fix. One of the 18 is also a **light-mode** failure that
this move would not touch — see §G.

To enforce instead of record: set `ENFORCING = true` in `showcase/scripts/verify-composite.ts`.

### 3. The generation flow behind `/static-ads` — not started

`/static-ads` today is the **entry point**: a rail, a headline and a composer. Press Generate
and nothing happens. The flow behind it — brief → product/template selection → generation →
variant grid → refine → export/signup gate — has not been built.

This section used to describe the same gap behind `/ai-ugc`, which was a marketing page with a
CTA rather than a composer. That route is deleted and `/static-ads` replaced it; the gap did not
change, only which screen leads into it. The composer's five pickers, stepper and two
attachment tiles are the flow's inputs and they already hold state — nothing reads it yet.

**This is the only substantive gap.** It was the original request; the component layer was the
prerequisite and is now done. Nothing is missing to build it:

| The flow needs | Component |
|---|---|
| Upload | Dropzone |
| Progress during analysis | Progress (determinate and indeterminate) |
| Position in the sequence | Stepper (including a `failed` state) |
| Confirmations | Toast |
| The four kinds of "nothing here" | EmptyState |
| Everything else | the form layer |

Note the constraint: this repo has no backend, no auth and no AI. The flow can be built as a
high-fidelity prototype — the way `/studio` is — but "authenticated free user", "credit cost"
and "estimated generation time" can only be *represented*, not implemented. Do not invent
figures for them. The retired `/ai-ugc` page kept a `content.ts` that marked every string LIVE,
NEW or PLACEHOLDER for exactly this reason, and that convention is worth restoring the moment
this flow carries a number anybody could mistake for real.

---

## Also open, smaller

- **Figma MCP is not authenticated.** `plugin:figma:figma` needs OAuth — run `/mcp` in an
  interactive Claude Code session. It unlocks one thing nothing else covers: comparing the
  Figma variables against `tokens/*.json`. Every gate in this repo verifies the code against
  itself; nothing verifies the code against Figma.
- **`fill/selected` and `fill/brand-secondary` are byte-identical**, deliberately. The name is
  the semantics — a selected row reaching for `fill/brand-secondary` would say the wrong thing
  about why it is tinted. Not a redundancy to clean up.
- **The `-variant` surface and fill track** is ~24 tokens each one step off its non-variant
  sibling. `DECISIONS.md` §G asks whether it earns its place. Unanswered.

---

## Before you change anything

Read `CLAUDE.md`. It is short, and it is the accumulated cost of getting these things wrong:

- Never edit `tokens/`, `tokens-studio/`, `dist/` or `reports/` — all generated, all overwritten.
- Never hand-type a colour above tier 1, or an easing curve, ever.
- Never relax a gate to make the build pass.
- When you add a token, add its gate — **and write the gate by family.** Every contrast bug this
  repo has had came from gating one member of a group and not its siblings.
- Verify numbers before writing them in a comment. Several shipped figures have been wrong.
