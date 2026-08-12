# Figma guide

## Two import paths, and they need different files

This is the first thing to get right, and this document used to get it wrong. It said
"either path works" off the same folder. It does not.

| You are using | Import | |
|---|---|---|
| **Tokens Studio** plugin | **`tokens-studio/heyoz.tokens.json`** — one file | **recommended** |
| Figma **native** Variables import | `tokens/` — seven files, in numeric order | no plugin needed |

Both are generated from one resolved map by `build/build.mjs`, so they cannot disagree about a
value. They differ in **format**, and the difference is not cosmetic:

- `tokens/` is DTCG-2024, where a colour's `$value` is an **object** —
  `{ colorSpace, components, alpha, hex }`. Figma's own importer reads this.
- `tokens-studio/` uses a **string** — `"#FFFFFF"`, or a reference `"{solid.brand.60}"` — plus
  Tokens Studio's own type names (`fontSizes`, not `dimension`). It **cannot** parse the object
  form.

Pointing Tokens Studio at `tokens/` produces colour tokens it cannot resolve. That is the
mistake the old wording invited.

**Path A also gives you two things Path B cannot:** usable numeric font sizes instead of
`clamp()` strings, and Light/Dark as two modes of one collection without importing twice.

Neither path ships text styles — see *Type*.

---

## Path A — Tokens Studio (recommended)

**Everything is in one file: `tokens-studio/heyoz.tokens.json`.**

Full step-by-step — the export checkboxes, what to verify, and the two manual steps — is in
**`tokens-studio/README.md`**, next to the file. The short version:

```
Plugins → Tokens Studio → JSON toggle { } → paste the whole file → Save
Export  → Variables: Color ✓ Number ✓ String ✓ · Styles: ALL UNTICKED
          Update existing names ON · Remove unconnected variables OFF
Themes  → one theme at a time, TOP TO BOTTOM, six passes
```

**Two things that silently ruin the import, both learned the hard way:**

1. **A theme must be ACTIVE on every pass.** If the dropdown reads `Theme: None`, each set exports
   as its own collection — Light and Dark land as two *collections* instead of two modes, and
   nothing switches. The `group` field that merges sets is only read when a theme is active.
2. **Export order matters.** *Select All* is Pro-only, so free tier does six single passes, and a
   semantic set exported before its primitives gets raw hexes with no alias. Go top to bottom:
   primitives, numbers, type, then Light and Dark.

You get **5 collections**, with `Colors & Elevations Tokens` carrying **HeyOz Light** and
**HeyOz Dark** as two modes of one collection. **No text styles** — this system binds variables
to text layers, so Styles stays off. See *Type* below.

The full walkthrough — six passes, five verification checks, the four Effect Styles with their
geometry, and scoping-vs-publishing — is in **`tokens-studio/README.md`**.

### One file, not a folder — and that is deliberate

The plugin cannot open a folder. Its local paths are "load one JSON file" and "paste into the
JSON editor"; a directory of separate sets is only readable through a **sync provider**
(GitHub/GitLab/…), which is setup the designer may not have or may not be entitled to.

An earlier version of this document told you to "Import → choose the tokens-studio/ FOLDER".
That UI does not exist. The bundle now carries the sets as top-level keys with `$themes` and
`$metadata` inline, which needs nothing configured first.

### What Figma cannot hold, and what happened to it

Four things, each converted or deliberately dropped rather than shipped broken:

| | |
|---|---|
| **Fluid type** | A variable is one number, so `clamp(40px … 64px)` would import as a String and could not be applied to a text layer. Every fluid step ships its **desktop ceiling** — `display-lg` = 64. |
| **Unitless line height** | Authored as a ratio so it survives the clamp; Figma text styles need px. Converted: `display-lg` = 68, which is 1.0625 × 64. Letter spacing likewise em → px. |
| **Motion** | There is no duration or easing variable type in Figma. All 25 motion tokens are **absent** rather than shipped as meaningless strings. They live in `dist/tokens.css`. |
| **Composite styles** | Not shipped, and that is a choice rather than a limitation — see *Type*. A style bakes five properties into one object and stops step and weight being independent, which is what `spec.mjs` declines to do when it refuses to bake a weight into a type step. |

### What is guaranteed

- Every set matches its DTCG source **token for token**: 680 / 29 / 64 / 64 / 208 / 208. Figma
  lands 60 of the 64 typography tokens — the four `default-weight/*` are Tokens Studio type
  `other`, which has no Figma variable equivalent, so the plugin skips them. They are a note about
  suggested pairings, referenced by nothing; 60 is a pass.
- All **450 references** resolve. The build fails if one does not — a dangling reference is
  otherwise silent, because the plugin simply never creates that variable while `dist/` stays
  correct.
- Ten elevation tokens stay **literal** rather than aliased. Figma discards a variable's local
  value once bound to an alias, and these carry alpha 0.08–0.90, so a reference would import them
  opaque — the modal scrim as a solid black rectangle.

---

## Path B — native Variables import

Import in **numeric order**. Cross-collection aliases only resolve if the target collection
already exists, so importing `06` before `01` produces broken variables rather than an error.

```
01-colors-primitives.tokens.json   →  collection: _Colors Primitives
02-number-primitives.tokens.json   →  collection: _Number Primitives
03-foundations.tokens.json         →  collection: Foundations
04-motion.tokens.json              →  collection: Motion
05-typography.tokens.json          →  collection: Typography
06-heyoz-light.tokens.json         ┐  collection: HeyOz Semantic
07-heyoz-dark.tokens.json          ┘  two modes of ONE collection
```

Files 06 and 07 carry `com.figma.modeName` of `HeyOz Light` and `HeyOz Dark`, so they land
as two modes inside one collection. Import 06, then import 07 into the same collection as a
second mode — do not create a second collection.

## What you get

| Collection | Modes | Tokens |
|---|---|---|
| _Colors Primitives | Value | 680 |
| _Number Primitives | Value | 29 |
| Foundations | Value | 64 |
| Motion | Value | 25 |
| Typography | Value | 64 |
| HeyOz Semantic | Light, Dark | 208 each |

Counted from the emitted files, not from intent. This table has now been wrong three times:
it once read 468 / 66 / 69 / 195, then carried `Motion 10` and `Semantic 216` after the spring
tokens and the sidebar deletion had both moved the real figures, and then held `Colors 655`
after ten ramp half-steps were added. Recount rather than trust it — `node build/build.mjs`
prints the live numbers, and `npm run verify:docs` now fails if this table drifts from them
again.

`HeyOz Semantic` is 202 colour tokens plus 6 elevation tokens. There is **no `sidebar`
group** — it was eight tokens, four of them byte-identical aliases of existing roles, and it
was deleted. See `DECISIONS.md` B12.

## Design with the semantic layer only

`_Colors Primitives` exists so the semantic layer has something to point at. You
should almost never apply a primitive to a layer directly. If you find yourself
wanting to, that is a signal a semantic token is missing — tell me and I will add
it rather than you reaching past the layer.

Which family to reach for:

| You are painting | Family |
|---|---|
| the page itself | `color/background` |
| a card, panel, popover, sheet | `color/surface/*` |
| anything clickable — button, row, chip, toggle | `color/fill/*` |
| a stroke, divider, ring | `color/border/*` |
| text or an icon | `color/content/*` |
| text sitting **on** a coloured fill | `color/content/on-*` |
| a hyperlink | `color/content/link`, `-hover`, `-visited` |
| input placeholder text | `color/content/placeholder` |
| a selected row, tab, segment, option | `color/fill/selected`, `color/border/selected`, `color/content/selected` |

`surface` and `fill` deliberately share ramp steps. The distinction is not the
value, it is whether the thing reacts to a pointer. Static → `surface`.
Interactive → `fill`, and then `-hover` / `-active` / `-disabled` exist.

## Type

**Variables, not text styles — on both paths.** Weight is bound as its own variable, so all five
weights are available on all fifteen steps without 75 styles to maintain.

A style would bake family, weight, size, leading and tracking into one object, which makes step
and weight stop being independent: `text/body-md/medium` and `text/body-md/bold` would share
nothing retunable in one place. That is the same reason `spec.mjs` refuses to bake a weight into
a type step — CLAUDE.md: "Weight is deliberately NOT baked in — every step accepts every weight."

So **Styles → Typography stays unticked** on the export screen, and there are no composite
`typography` tokens in the bundle for it to build.

Bind five variables per text layer:

```
font family      →  Typography / font-family / {display|heading|body|label|mono}
font style       →  Typography / font-style / {regular|medium|semibold|bold|extrabold}
font size        →  Typography / font-size / {step}
line height      →  Typography / line-height / {step}
letter spacing   →  Typography / letter-spacing / {step}
```

Two weight groups exist on purpose. `font weight` is numeric (400–800) and is
what the CSS consumes. `font style` is a string (`SemiBold`) and is what Figma's
weight field actually binds to. Same five weights, two representations, because
neither end can use the other's.

`font style` is **Figma-only** and is deliberately not emitted to CSS — it was, and
produced five variables like `--oz-style-regular: Regular`, which is not a legal
value for any CSS property. `font family` is also Figma-only in this exact form:
Figma binds a bare family name, while CSS gets the full fallback stack from
`FONT_STACKS` in `spec.mjs`. If you need the stack, read `dist/tokens.css`.

Default pairing — guidance, not a lock:
`display → extrabold`, `heading → semibold`, `body → regular`, `label → medium`.

**Fluid sizes differ between the two paths, and this used to be a real defect.**

Six steps — display lg/md/sm and heading xl/lg/md — are `clamp()` in CSS. Figma has no fluid
type, so:

- **Path A** ships the **desktop ceiling as a number**: `display-lg` is `64`. Usable, bindable,
  applied by a text style. Small-frame mockups need manual down-scaling.
- **Path B** holds the raw `clamp(...)` **string**, which Figma cannot apply to a text layer's
  size at all. Set the size manually there and treat the token as the spec for the dev.

That difference is the single strongest reason to use Path A.

## Naming

```
{family}/{role}[-variant][-state]
```

States are only ever `hover`, `active`, `disabled`, `focus`, `selected`. If you
need a sixth, it goes in `spec.mjs` — not invented on a layer.

Note that `disabled` on the five status fills is **not** a faded version of the
fill. It is an opaque neutral, in both modes, identical across all five roles. A
control you cannot act on has no reason to keep its role colour, and fading the
fill and its label independently is what previously left a disabled primary button
label at 1.43:1. See DECISIONS.md I5.

## When you need a new token

Do not add it in Figma. Add the line to `build/spec.mjs`, re-run the build,
re-import. Otherwise Figma and code drift, which is the exact failure this whole
structure exists to prevent.
