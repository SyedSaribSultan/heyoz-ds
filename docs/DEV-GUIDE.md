# Developer guide

## Install

Copy `dist/` into the app, then in `globals.css`:

```css
@import './design-system/tokens.css';
@import './design-system/shadcn-bridge.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

Then delete from `globals.css`:

- the whole `:root { ... }` block
- the whole `.dark { ... }` block
- the whole `.force-light { ... }` block

Keep everything else for now — the body font rule, the scrollbar utilities, the
animation keyframes. Those get migrated later, not today.

`tailwind.config.js`:

```js
const tokens = require('./src/design-system/tailwind.tokens.js');
module.exports = { presets: [tokens], darkMode: 'class', content: [...] };
```

That is the whole install. Nothing else has to change and nothing should break —
the bridge keeps emitting `--background`, `--card`, `--muted` and the other 39
variables your components already read, as HSL channel triplets, so
`hsl(var(--background))` still resolves.

## What the bridge silently fixes

No code change required for any of these:

| Variable | Was | Now |
|---|---|---|
| `--border` | same value as `--card` in dark — invisible edges | `border/primary` |
| `--ring` | same value as `--primary` — invisible focus ring | `border/focus` |
| `--accent` | same value as `--muted` — hover state lost | `fill/tertiary-hover` |
| `--popover` | same value as `--secondary` in dark — no popover edge | `surface/overlay` |
| `--input` | same value as `--accent` in light | `border/secondary` |

Four variables are new: `--destructive-soft`, `--success-foreground`,
`--warning-foreground`, `--info-foreground`. The last three fill a real gap — the
old file had `--success` with no matching text colour, so components hardcoded
`text-white`.

**`--primary-foreground` is not on that list, and was never a bug.** This table
used to claim the bridge lifted it from "white on orange, 3.55:1, fails AA" to
`content/on-brand` at 5.71:1, and `--destructive-foreground` from 3.35:1 to
5.01:1. Both numbers were invented: `content/on-brand` *is* `#FFFFFF`, so it
measures exactly the same 3.55:1 it always did (destructive 4.04:1). The claim also
contradicted `DECISIONS.md` A5/H1, which formally **withdrew** white-on-orange as a
bug and records why the WCAG-2 number is the wrong instrument for those pairs.
Nothing about those five variables changed; only the reasoning did. See
DECISIONS.md H1 before you "improve" them.

**These fixes are only real because the build asserts them.** Three of the five
rows above were byte-identical again in `dist/` as of 2026-07-31 — the values had
drifted back onto the same ramp step and `BRIDGE_COLLISIONS` did not name the pair.
Every row now has a corresponding entry in that list.

## Writing new code

Read `--oz-*` directly. Full colour values, so no `hsl()` wrapper:

```css
background: var(--oz-color-surface-primary);
color:      var(--oz-color-content-secondary);
border:     var(--oz-stroke-2) solid var(--oz-color-border-primary);
border-radius: var(--oz-radius-6);
padding:    var(--oz-space-5);
box-shadow: var(--oz-elevation-small);
transition: background var(--oz-duration-fast) var(--oz-ease-standard);
```

Or through Tailwind:

```jsx
<div className="bg-surface-primary text-content-secondary border-border-primary
                rounded-6 p-space-5 shadow-small">
```

Type — the step sets size, line-height and tracking; weight stays independent:

```jsx
<h2 className="text-heading-lg font-heading font-semibold">
<p  className="text-body-md  font-body">
<span className="oz-text-label-sm font-medium">   {/* plain-CSS equivalent */}
```

Buttons — always pair a fill with its `on-` colour:

```jsx
<button className="bg-fill-brand text-content-on-brand
                   hover:bg-fill-brand-hover active:bg-fill-brand-active
                   disabled:bg-fill-brand-disabled disabled:text-content-on-brand-disabled">
```

## Spacing: the one gotcha

Token spacing is namespaced. `p-space-5` is 16px and comes from the design
system. `p-4` is also 16px but is Tailwind's own scale and is **not** a token.
They are not aliases and they diverge above 16px:

| token | px | Tailwind equivalent |
|---|---|---|
| `space-1` | 4 | `1` |
| `space-3` | 8 | `2` |
| `space-5` | 16 | `4` |
| `space-7` | 24 | `6` |
| `space-9` | 32 | `8` |
| `space-12` | 48 | `12` |

Use `space-*` for anything a designer specified. The namespace exists precisely
so this can never be ambiguous.

## Name mapping, old → new

| shadcn | `--oz-*` |
|---|---|
| `--background` | `--oz-color-background` |
| `--foreground` | `--oz-color-content-primary` |
| `--card` | `--oz-color-surface-primary` |
| `--popover` | `--oz-color-surface-elevated` |
| `--primary` | `--oz-color-fill-brand` |
| `--primary-foreground` | `--oz-color-content-on-brand` |
| `--secondary` | `--oz-color-fill-secondary` |
| `--muted` | `--oz-color-surface-tertiary` |
| `--muted-foreground` | `--oz-color-content-secondary` |
| `--accent` | `--oz-color-fill-tertiary-hover` |
| `--destructive` | `--oz-color-fill-critical` |
| `--border` | `--oz-color-border-primary` |
| `--input` | `--oz-color-border-secondary` |
| `--ring` | `--oz-color-border-focus` |
| `--radius` | `--oz-radius-5` |

Migrate a file at a time. When no component reads a bridged variable any more,
delete `shadcn-bridge.css`.

## Tokens with no shadcn equivalent

These have no bridged variable, so they are only reachable as `--oz-*` or through
the Tailwind preset. Reach for them instead of hardcoding:

| Role | Token |
|---|---|
| hyperlink | `--oz-color-content-link`, `-link-hover`, `-link-visited` |
| input placeholder | `--oz-color-content-placeholder` |
| selected row / tab / segment | `--oz-color-fill-selected`, `-selected-hover`, `-selected-active` |
| its edge and label | `--oz-color-border-selected`, `--oz-color-content-selected` |
| focus ring on a brand fill | `--oz-color-border-focus-inverse` |
| modal scrim | `--oz-color-elevation-overlay-dimness` |

## Variables consumed directly, not via Tailwind

Thirty `--oz-*` variables are intentionally absent from the Tailwind preset
because Tailwind has no matching theme key. They are not dead — read them in CSS:

`--oz-icon-{sm,md,lg,xl}`, `--oz-icon-stroke`, `--oz-container-{sm,md,lg,xl}`,
`--oz-container-gutter`, `--oz-container-measure`, `--oz-weight-*`,
`--oz-default-weight-*`, `--oz-overlay-{dimness,blur}`, `--oz-shadow-*`.

Two caveats:

- `--oz-bp-{sm,md,lg,xl}` exist for JS (`matchMedia`) and for documentation. A CSS
  custom property **cannot** be used in a `@media` query — use the Tailwind
  `screens` keys, which are emitted as plain px.
- `--oz-shadow-*` are the shadow *colours*. For `box-shadow` you almost always
  want the ready-made composites, `--oz-elevation-{x-small,small,medium,large}`.

## Still to migrate out of globals.css

Not urgent, but these are now tokenised and the hardcoded versions can go:

- `.onboarding-gradient` → `--oz-color-gradient-onboarding-1|2|3`
- `.brand-mesh-border`, `.brand-mesh-thumb` → `--oz-color-gradient-mesh-1..4`, `-mesh-base`
- `vtr-halo-pulse` → `--oz-color-gradient-halo` (it used a fifth, undocumented orange)
- `.fade-in-spring`, `.cycling-text-char` → `--oz-duration-*`, `--oz-ease-entrance`
  (the entrance curve is byte-identical to what is already inline, so this is a
  pure find-and-replace)
- `.x-center` / `.y-center` / `.xy-center` are three names for the same
  declaration — collapse to one
- `.oz-scrollbar` / `.thin-scrollbar` differ only in track colour — collapse to one
- `.text-2xs` is now `oz-text-label-xs` / `text-label-xs`, same 10px
- the unlayered rules at the bottom of the file outrank every Tailwind utility;
  wrap them in `@layer components` when you touch them

## Regenerating

```bash
node build/build.mjs
```

CI-friendly: exits non-zero on any gate regression, unresolvable alias, token
collision, or literal above tier 1. Worth wiring into the pipeline so a colour
change cannot ship a contrast failure.

188 gates across five families — contrast 118, APCA 30, visibility 12, elevation 8,
greyscale 20. `reports/audit.json` carries every individual result with its
computed value, so CI can diff them rather than just checking the exit code.

The one thing the build cannot check is whether a role that *should* have a gate
has one. Every bug found in the 2026-07-31 audit was of that shape: the gates that
existed all passed, and the pairs nobody had named were the broken ones. When you
add a token, add its assertion in the same commit.
