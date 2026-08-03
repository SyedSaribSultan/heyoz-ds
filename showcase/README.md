# showcase

A living reference for the HeyOz design system, and the reference implementation of
how a component consumes it.

```bash
cd showcase
npm install
npm run dev          # http://localhost:3000
```

The token build has no dependencies and stays that way. This folder has its own
`package.json` and its own `node_modules`; nothing in `build/`, `dist/`, `tokens/`,
`reports/` or `test/` knows it exists.

## The one idea

Every component has exactly one description of its appearance: a **recipe class**.
The React component compiles its `className` from that class. So does every variant
grid, state matrix, binding table and usage snippet on the page.

```
lib/recipes/button.recipe.ts     ButtonRecipe extends ComponentRecipe
        │                        variants, states, token bindings, copy
        ├──────────────► components/ui/Button.tsx          what ships
        └──────────────► the Button section of the page     what is documented
```

There is no second description of a button, which means the documentation cannot
drift from the component — it is not a copy of the component, it is a rendering of
the object the component is built from. A state grid written by hand goes stale the
first time someone changes a hover colour and forgets the docs. This one cannot.

The mechanism is one method with two modes:

```ts
recipe.classes({ variant: 'primary' })
// → 'bg-fill-brand hover:bg-fill-brand-hover active:bg-fill-brand-active …'

recipe.classes({ variant: 'primary', force: 'hover' })
// → 'bg-fill-brand-hover text-content-on-brand …'
```

The first is what ships: real `:hover`, `:active`, `:disabled`, `:focus-visible`. The
second lets the page *display* a hover state in a grid without lying about it. Both
compile from the same binding table, so the cell labelled `hover` is guaranteed to be
the colour you get when you hover.

## Layout

```
lib/core/
  types.ts        the vocabulary: roles, states, focus modes, bindings
  Recipe.ts       ComponentRecipe — the base class every component extends
  Registry.ts     the component list the page reads instead of hard-coding one
  audit.ts        resolved token values, read from reports/audit.json
  primitives.ts   tier 1 in full, read from tokens/01-colors-primitives.tokens.json
  cx.ts           class joiner

lib/recipes/      one file per component. The only place appearance is described.
components/ui/    one thin React consumer per recipe. No colour lives here.
components/showcase/
  catalog.tsx     recipe ↔ live demo. The only file that knows the full list.
  Showcase.tsx    the page. Reads registry.all — contains no component list.
components/sections/  primitives, colour, typography, elevation & motion, assembled
scripts/          the three checks that tsc and next build cannot do
```

Adding a component is three steps and does not touch the page:

1. `lib/recipes/thing.recipe.ts` — extend `ComponentRecipe`
2. `components/ui/Thing.tsx` — render from it
3. one `registry.register({ recipe, Live, Cell })` in `catalog.tsx`

It then appears in the nav with a section, a live row, a state matrix, a binding
table, a token inventory and a usage snippet. Section numbers renumber themselves.

## Verifying

```bash
npm run verify     # typecheck → contrast sweep → build → class check
```

Two of those are specific to this layer and worth understanding, because both caught
real bugs on the first run.

**`verify:contrast`** measures every foreground/background pairing every recipe
creates, in both modes. The token build gates 188 pairs, but it gates *tokens*, not
*pairings* — deciding to put `content/primary` on `surface/critical` happens here, and
`build/spec.mjs` cannot know it happened. It applies the same two metrics the token
build does, including gating `content/on-*` pairs on APCA Lc 60 rather than the WCAG
ratio, per `docs/DECISIONS.md` H1.

> It found `button/ghost` at `active`: the label inherited `content-secondary`, which
> measures 3.61:1 on `fill-tertiary-active` in dark mode. Invisible in a mouse test,
> because `:active` and `:hover` both match on a press — but a keyboard Enter or a
> touch tap fires `:active` alone. Exactly the shape `CLAUDE.md` rule 4 describes: the
> gated state passed and the unnamed sibling was broken.

**`verify:primitives`** asserts the four things the Primitives section assumes about
tier 1: that all five alpha tiers carry identical families and step keys in identical
order (the section renders one shared step-label row for all five strips and lets
column alignment do the labelling — a tier gaining a step would silently mislabel
every swatch), that `FAMILY_ORDER` is neither missing a family nor naming one that
does not exist, that every numbered ramp descends in lightness monotonically, and
that no semantic token names a primitive absent from the palette.

> It also prints each family's lightness span and referenced count, and flags any
> disagreement with the build's own primitive count. That check is how the miscount
> described below was found.

**`verify:classes`** reads the compiled stylesheet and the prerendered HTML and reports
any class used but never generated. Recipes compose utility names at runtime
(`bg-${binding.bg}`), so Tailwind's scanner cannot see them and they exist only
because of the `safelist` patterns in `tailwind.config.js`. A gap there is silent: the
build passes, the types pass, and one state renders unstyled.

> It found 12, including a missing `aria-selected` variant (selected table rows had no
> background), `hover:shadow-medium` (the interactive card never lifted),
> `bg-background/95` (the preset emits plain `var(--oz-…)` with no `<alpha-value>`
> slot, so the opacity modifier generated nothing), and six `tracking-*`/`leading-*`
> classes that do not exist because the type steps already carry line height and
> tracking.

It now runs three passes, because that first one has a blind spot it cannot fix: it
only sees markup that exists in a prerender. A dialog, a menu, a toast — anything that
appears after a click — is absent from the HTML, so a dead class inside it is invisible
to a diff of that HTML. Both extra passes exist because that blind spot hid real bugs.

**Pass 2** scans source for the one dead-class shape that needs no interaction to
detect: an opacity modifier on a token colour. Tailwind can only apply one to a colour
it can parse or call, and every colour in the preset is a bare `var(--oz-…)`, so there
are **zero** `/nn` rules in the whole stylesheet.

> Dialog's backdrop was `bg-content-fixed-primary/70` for a release. It generated no
> rule, so a full-viewport `fixed inset-0` element painted nothing and the panel
> appeared to sit on the page. Pass 1 could not see it, because a closed dialog renders
> `null`. Comments are stripped before the scan, which is load-bearing rather than
> tidy — the one pre-existing mention of this pattern in the repo is the comment in
> `Chrome.tsx` explaining why the header is opaque instead, and a scanner that failed
> on the note documenting the hazard would be worse than no scanner.

**Pass 3** asserts a property of the compiled output that no check on the input can
reach: that the `prefers-reduced-motion` block still wins. It brace-matches the block
in the stylesheet and requires each of its five overrides to appear later than the last
unconditional declaration of the same property.

> It did not win. `dist/tokens.css` emitted the block after the closing brace of
> `@layer base`, on the reasoning that unlayered CSS outranks layered CSS — true of
> real cascade layers, false here. Tailwind consumes `@layer base` as its own directive,
> hoists the contents to the `@tailwind base` position, and emits no `@layer` at-rule at
> all, so the override sat at byte 95, `--oz-motion-spatial-scale: 1` sat at byte 8849,
> and later won. Measured in a browser with the preference on, the multiplier read `1`:
> every entrance kept its full travel and every spatial spring kept its overshoot. The
> fix is in `reducedMotionBlock()`; see `docs/DECISIONS.md` I13.

## The one change made outside this folder

Building this section surfaced a miscount in the token build, and it has been fixed:
`build/build.mjs` reported **504** unused colour primitives where the correct figure is
**503**.

The counter built its `used` set from the colour-semantic map only, so a primitive
reached exclusively through an elevation token was invisible to it. Exactly one was.
`solid/neutral/black` is the drop-shadow colour at all four elevation steps in dark
mode and the scrim colour as well, and it was reported dead.

Nothing was gated on that number, so no emitted value was ever wrong — `git diff`
after the rebuild shows `dist/` and `tokens/` byte-identical, which is the proof. But
the figure is read by a human deciding what is dead, it appeared on the verdict card in
`test/index.html`, and `solid/neutral/black` landing on a prune list is how every
dark-mode shadow gets deleted by someone tidying up.

The fix counts from `resolved`, which carries every token in both modes, rather than
adding a second loop for elevation — so a future token family cannot reintroduce the
same undercount. Rule 4: count the group, not one member of it.

The Primitives section still cross-checks its own figure against
`reports/audit.json` on every render. They agree, so it displays nothing; if they ever
diverge again it prints a footnote saying where to look.

## How the tokens get in

Four files are read from the repo root rather than vendored, so `node build/build.mjs`
is the only way a value here can change:

| File | Read by | For |
|---|---|---|
| `dist/tokens.css` | `app/globals.css` | the CSS custom properties |
| `dist/tailwind.tokens.js` | `tailwind.config.js` | the utility classes |
| `reports/audit.json` | `lib/core/audit.ts` | resolved hex values in the tables |
| `tokens/01-colors-primitives.tokens.json` | `lib/core/primitives.ts` | the tier-1 palette |

That last one is the same DTCG file Figma imports, so the palette on the page is the
palette designers pull. `L*` per step is computed in `primitives.ts` rather than read,
because the DTCG file carries sRGB components only — `brand/60` comes out at 65.4,
matching the authored OKLCH `L 0.6535`.

`postcss-import` must run before `tailwindcss` and is not optional.
`dist/tokens.css` declares a real CSS cascade layer — `@layer base { :root { … } }` —
and Tailwind's plugin, handed that file alone, reads the at-rule as its own and fails.
Inlining the import first puts those declarations in the same file as
`@tailwind base`, which is the arrangement `docs/DEV-GUIDE.md` already prescribes.

`shadcn-bridge.css` is deliberately **not** imported. It is migration scaffolding for
the app's existing components; new code reads `--oz-*` directly, and this folder is
new code.

**`visual/scroll-lock.spec.ts` runs in its own browser.** Chromium headless passes
`--hide-scrollbars`, so a classic scrollbar never exists and the one condition that spec
measures — a scrollbar being taken away when an overlay locks the page — cannot occur.
Under the default launch it would pass while testing nothing. The `scroll-lock` project
drops that single default argument to get a real 15px scrollbar, and it is scoped there
because switching it on globally would change the layout width of every page and
invalidate all 34 baselines to gain one check.

> That check exists because opening a dialog used to shift the whole page 15px sideways:
> the lock was `body.style.overflow = 'hidden'`, and a classic scrollbar is real layout
> width. The fix is `scrollbar-gutter: stable` on `:root` plus `.oz-scroll-lock`, both in
> the token layer so every future overlay inherits them — see `docs/DECISIONS.md` I14.
> `useScrollLock` in `lib/core/` is the reference consumer.

## Deliberate choices that look like omissions

**Webfonts come from a `<link>`, not `next/font`.** The token values name the families
literally — `'Bricolage Grotesque', ui-sans-serif, …` — and `next/font` self-hosts
under a generated family name that those literals would never match. Keeping the
`<link>` leaves the tokens authoritative for typography. The Typography section warns
when the fonts fail to load, for the same reason `test/index.html` does: otherwise a
reviewer judges the fallback stack.

**No `tailwind-merge`.** Recipes emit a closed, non-overlapping set of utilities, and a
caller's `className` is meant to be additive. If it has to fight the recipe for the
same property, the recipe is missing a variant, and silently resolving that collision
would hide it.

**`border-2` is 1px.** The preset maps `borderWidth` onto the stroke scale, so
`border-2` is `--oz-stroke-2` = 1px and `border-4` is 2px. Every component sets
`border-transparent` in its shared shape so a bordered and an unbordered variant are
the same height in the same row.

**Two focus rings, and every variant must pick one.** `focus: 'outline'` is the outward
ring in `border/focus`, for anything on a neutral surface; `focus: 'inset'` is the
inset ring in `border/focus-inverse`, for saturated fills only. This is the one focus
rule the token build cannot gate — it can measure both tokens but cannot see which one
a component reached for — so it is a required field on every variant instead. A new
variant cannot be added without answering the question.

**Input has no `sm` size.** Both sizes are 16px or larger. Below 16px, iOS Safari zooms
the viewport on focus. A smaller input is a token problem, not a component variant.

**The mode toggle does nothing to the primitive swatches.** Tier 1 is mode-independent:
there is one palette, and light and dark differ only in which step each semantic role
points at. It does change the consumer lists under each swatch, because that is
precisely what differs between the modes.

**A primitive ramp is one tab stop, not 24.** Each hue family is a single composite grid
widget with a roving `tabIndex` — arrows move within it, left/right along the ramp and
up/down across the alpha tiers, Enter inspects. 655 individually focusable swatches
would be technically accessible and practically unusable.

## The two contracts

`node build/build.mjs` proves the **token** contract: 252 contrast, APCA, visibility,
elevation, greyscale, ladder, motion and layout gates. It answers "are the tokens
correct", and it exits non-zero if they are not.

This folder proves the **component** contract: that the tokens compose into working
UI, with every state reachable and every pairing measured. It answers "do the tokens
work".

Both are rendered by the `/verify` route, which reads `reports/audit.json` for the
token gates. The standalone `test/index.html` that used to carry the token half is
retired — it could only ever show the token gates, and the checks that live at the
component layer were invisible to it. The last copy is in `archive/`, with the full
argument and the instructions to restore it.

## Deployment

Hosted on Vercel at **heyoz-ds.vercel.app**, connected to `main` — a push deploys.

Three settings make a subdirectory app that reads from the repo root work, and none
of them are guessable from the files alone, which is why they are written down here:

| Setting | Value | Why |
|---|---|---|
| Root Directory | `showcase` | Vercel detects Next.js from the `package.json` at the root directory. The repo root's is the token package and has no `next` in it. |
| Include files outside root | on | `app/layout.tsx`, `tailwind.config.js` and `lib/core/audit.ts` import `../dist/tokens.css`, `../dist/tailwind.tokens.js` and `../reports/audit.json`. |
| Build Command | `node ../build/build.mjs && next build` | Regenerates the token layer from `build/spec.mjs` on the deployed commit rather than trusting whatever was last committed to `dist/`. Since the token build fails closed, a deploy cannot ship a token set that fails its own gates. |

The build command lives in `showcase/vercel.json` — read from the root directory, so
not at the repo root. That file takes no comments: unlike `package.json`, where this
repo uses `"//key"` entries freely, `vercel.json` is validated against a strict schema
and rejects any property it does not recognise. Hence this table.

`.vercelignore` at the repo root keeps the ~6 MB of Playwright baselines and the
retired `archive/` out of the upload. Neither is read by a build.
