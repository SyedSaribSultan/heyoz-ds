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

## Step 2 — open the rig

Open `test/index.html` by double-clicking it. Twelve sections, a light/dark
toggle, and two stress switches. It renders the real generated CSS, so what you
see is what ships.

The two stress toggles are the ones that find real problems:

- **No borders** strips every border and shadow. If the layout falls apart, the
  design is border-dependent rather than fill-dependent. That was the core
  finding on the current dark theme — page, sidebar and card sat within 4.4 L*
  of each other and a single 1px line was carrying the whole layout.
- **Greyscale** removes hue. Any two chart series that become indistinguishable
  are inaccessible to a chunk of your users. This is now also a build gate — a
  ΔL floor of 0.05 between every pair of series, in both modes, 20 pairs. It used
  to be a warning conditioned on `ΔL < 0.03 AND contrast < 1.08`, two thresholds
  ANDed so tightly that the pairs which were genuinely too close could not trip
  it. Trust the toggle, but the build should catch it first now.

## Step 3 — the four sections that decide it

**05 Text on coloured fill.** The one change your CTO will notice — or rather, the
one they will be told about by a scanner. Shipped white on the left, `content/on-*`
on the right, at 14px on the real fill. Both are white; the change is that these
pairs are now gated on APCA Lc 60 rather than WCAG 4.5:1, and that all fifteen
fill states are gated rather than just the five bases. Read H1 in DECISIONS.md
before this meeting, because the question you will be asked is "why does axe flag
our buttons" and the answer is a paragraph, not a number.

**02 What actually changes in production.** Every shadcn variable, shipped hex
next to generated hex, with OKLab ΔE. Anything under ~2.0 is invisible to the
eye. This is the table that answers "how risky is this."

**03 Surface ladder.** Perceptual lightness of every stacked surface and the step
between them. Steps under 1.5 L* are flagged — that is the flatness problem.

**11 Assembled product.** A real slice of HeyOz — sidebar, cards, prompt box,
alerts, table, skeleton, empty state. Screenshot this in both modes. It is the
single most persuasive artifact for a design review.

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

- `test/index.html` (it is self-contained — email it)
- screenshots of section 11, light and dark
- section 02, for the risk question
- `docs/DECISIONS.md`, for "why is this different from what we have"

## Known trade-offs, stated up front

Better to raise these yourself than have them raised at you.

| Trade-off | Why |
|---|---|
| `primary-foreground` stays **white**, and axe will flag it | WCAG 2.x has no polarity term, so it prefers black on every fill lighter than `#767676`. APCA reverses the verdict and is right. Gated at Lc 60 instead — DECISIONS.md H1 |
| Chart palette replaced entirely, and the light series are darker than you might expect | Shipped charts were identical in both modes and clustered in one lightness band. The light series then had to come down the ramp again because a series is a graphical object under 1.4.11 and two of them measured 2.0–2.5:1 on white |
| Disabled status buttons are grey, not faded orange | Fading fill and label independently left the label at 1.43:1. DECISIONS.md I5 |
| `warning` and `info` shift | CSS and Figma disagreed; the Figma set was chosen because all three status hues sit at one lightness |
| Dark borders get noticeably lighter | They were invisible — `--border` and `--card` were the same value |
| 504 of 655 primitives unused | The alpha grid is generated, not curated. Costs nothing and means every future token already has a target |
| Dark shadows are much stronger than before | They moved the page by ΔL 0.009–0.024 where light moved it 0.027–0.066, so the dark `large` shadow was weaker than the light `x-small` |
| `content/tertiary` is darker | It was gated against the page only, and failed 4.5:1 on all three card surfaces — 3.07:1 at worst |
| Ordinal spacing (`space-5` = 16px) | Matches both reference systems; the `--oz-` namespace prevents any Tailwind collision |

## If a gate fails

The message names the token and the ratio. Almost always the fix is moving one
alias in `build/spec.mjs` by one ramp step, then re-running. Do not relax the
gate — that is the thing keeping the system honest.
