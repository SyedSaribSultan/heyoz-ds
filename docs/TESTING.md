# Testing

The goal of this phase is to walk into the review with evidence instead of
opinions. Nothing here needs a server, a build pipeline, or anyone else's time.

## Step 1 — run the build

```bash
node build/build.mjs
```

Expect `OK — no errors.` If anything fails it prints the exact token and the
exact ratio. Fix it in `build/spec.mjs` and re-run. Never edit `tokens/` or
`dist/` — they get overwritten.

## Step 2 — run the component checks, then the showcase

The build in step 1 gates the *tokens*. Seven more checks gate the layer above it —
the recipes that actually bind those tokens to components — and the build cannot
see any of them:

```bash
cd showcase
npm install
npm run verify
```

That runs typecheck, `verify:primitives`, `:contrast`, `:composite`, `:motion`,
`:borders`, `:coverage`, a production `next build`, and `:classes`, in that order,
stopping at the first failure. Expect every one to print `OK`. It takes a few
minutes, and the `next build` in the middle is not optional — `verify:classes`
reads the compiled stylesheet and the prerendered HTML.

Then look at it:

```bash
npm start          # the build you just made, on :3000
```

There is no standalone HTML rig any more. `test/index.html` used to open by
double-click with no server and no npm, which was genuinely useful and is the one
thing lost here; it is archived in `archive/` with instructions to restore it. It
went because it could only ever render the *token* gates, and by the end that was
under half the story.

Four routes, and each answers a different question:

| Route | What it is for |
|---|---|
| `/` | the reference — every primitive, every component, every state |
| `/verify` | the audit — every gate result, rendered from `reports/audit.json` |
| `/studio` | the product at rest, full-bleed, no showcase chrome |
| `/static-ads` | the product being used — nine nested controls on a gradient |

Every page has a light/dark/system control in the header, and the header warns you
if the build it is rendering is older than the sources it came from.

## Step 3 — the five things that decide it

**`/verify` → APCA.** The one change a scanner will complain about. `content/on-*`
on the real fill, gated on APCA Lc 60 rather than WCAG 4.5:1, across all fifteen
fill states rather than just the five bases. Read H1 in DECISIONS.md before the
meeting, because the question you will be asked is "why does axe flag our buttons"
and the answer is a paragraph, not a number.

**`/verify` → Surface ladder.** Perceptual lightness of every stacked surface and
the step between them. In dark mode this ladder *is* the elevation signal, so a
flat rung is the flatness problem made measurable.

**`/verify` → Component-layer checks.** The seven suites from step 2, with their
counts and their exemptions, beside the token gates. This is the section that shows
the checks are not marking their own homework: `composite` records eighteen known-bad
pairings it does *not* enforce, and says so.

**`/` → Charts & gradients.** The five series in colour, and immediately below, the
same five desaturated. If two are indistinguishable in the second row they are
inaccessible to a chunk of your users. This is also a build gate now — a ΔL floor
between every pair, both modes — but the rendered version is the one that convinces
a room.

**`/studio` and `/static-ads`.** Screenshot both, in both modes. A dashboard in a
bordered box on a page with competing chrome can only argue so much; these are
full-bleed and they are the most persuasive artifact you have.

For the risk question — "how much actually changes in production" — the answer is
not a screenshot. `build/shipped.mjs` holds the pre-migration values and
`dist/shadcn-bridge.css` holds what replaces them, variable for variable. Three of
those changes are silent bug fixes and the bridge header names them.

## Step 4 — check the palette against reality

Import `tokens/01-colors-primitives.tokens.json` and
`tokens/06-heyoz-light.tokens.json` into a scratch Figma file (see
`FIGMA-GUIDE.md`), then drop a few real HeyOz screens onto the new variables.
What to look for:

- Bricolage at **heading xs** (18px). It has tight apertures and may go muddy.
  If it does, move `heading sm` and `heading xs` to Geist semibold — that is a
  two-line change in `spec.mjs`.
- The `-variant` surface track. If you never reach for it, say so and I will cut
  it; it is ~24 tokens.
- Whether `extrabold` earns its place on display.

## Step 5 — dev smoke test, 10 minutes

Have your dev do this on a branch, not main:

```
1. copy dist/tokens.css and dist/shadcn-bridge.css into the app
2. import them at the top of globals.css, above @tailwind base
3. delete the :root, .dark and .force-light blocks from globals.css
4. leave everything else in globals.css alone for now
5. npm run dev
```

Nothing else changes. Every existing shadcn component keeps working because the
bridge still emits `--background`, `--card`, `--muted` and the rest as HSL
triplets. Then click through: pricing page, an `/ai-models` page, the sidebar,
a modal, a form with a validation error, and dark mode.

Three things the bridge silently fixes, so look for them working rather than
broken: card borders become visible in dark mode, focus rings become visible on
primary buttons, and hovered rows stop matching muted surfaces.

## Step 6 — what to bring to the review

- a deployed URL for the showcase, or `npm run build && npm start` on a laptop you
  can turn round. It is a static Next export with no backend — `showcase/vercel.json`
  already runs the token build before `next build`, so a deploy cannot serve a page
  that disagrees with the tokens under it
- screenshots of `/studio` and `/static-ads`, light and dark
- `/verify`, open, for the "is any of this actually checked" question
- `build/shipped.mjs` beside `dist/shadcn-bridge.css`, for the risk question
- `docs/DECISIONS.md`, for "why is this different from what we have"

## Known trade-offs, stated up front

Better to raise these yourself than have them raised at you.

| Trade-off | Why |
|---|---|
| `primary-foreground` stays **white**, and axe will flag it | WCAG 2.x has no polarity term, so it prefers black on every fill lighter than `#767676`. APCA reverses the verdict and is right. Gated at Lc 60 instead — DECISIONS.md H1 |
| Chart palette replaced entirely, and the light series are darker than you might expect | Shipped charts were identical in both modes and clustered in one lightness band. The light series then had to come down the ramp again because a series is a graphical object under 1.4.11 and two of them measured 2.0–2.5:1 on white |
| Disabled status buttons are grey, not faded orange | Fading fill and label independently left the label at 1.43:1. DECISIONS.md I5 |
| `warning` and `info` shift | CSS and Figma disagreed; the Figma set was chosen because all three status hues sit at one lightness |
| Dark borders are subtle — ΔL 5.5–7.5 off their surface | They were once invisible (`--border` === `--card`), then over-corrected to ΔL 12–15 and read as outlined boxes. H6 brought them to roughly light mode’s perceived weight. Equal ΔL across modes is NOT the goal — at dark’s lightness a light-parity border lands on a surface step. DECISIONS.md H6 |
| 524 of 680 primitives unused | The alpha grid is generated, not curated. Costs nothing and means every future token already has a target |
| Dark shadows are much stronger than before | They moved the page by ΔL 0.009–0.024 where light moved it 0.027–0.066, so the dark `large` shadow was weaker than the light `x-small` |
| `content/tertiary` is darker | It was gated against the page only, and failed 4.5:1 on all three card surfaces — 3.07:1 at worst |
| Ordinal spacing (`space-5` = 16px) | Matches both reference systems; the `--oz-` namespace prevents any Tailwind collision |

## If a gate fails

The message names the token and the ratio. Almost always the fix is moving one
alias in `build/spec.mjs` by one ramp step, then re-running. Do not relax the
gate — that is the thing keeping the system honest.
