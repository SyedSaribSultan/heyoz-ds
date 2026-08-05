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

**Path A also gives you three things Path B cannot:** 75 Text Styles, usable numeric font sizes
instead of `clamp()` strings, and Light/Dark as two modes of one collection without importing
twice.

---

## Path A — Tokens Studio (recommended)

**Everything is in one file: `tokens-studio/heyoz.tokens.json`.**

Full step-by-step — the export checkboxes, what to verify, and the two manual steps — is in
**`tokens-studio/README.md`**, next to the file. The short version:

```
Plugins → Tokens Studio → JSON toggle { } → paste the whole file → Save
Export  → Variables: Color ✓ Number ✓ String ✓ · Styles: Typography ✓ (others ✗)
Themes  → Select All (6) → Export to Figma
```

You get **5 collections** and **75 Text Styles**, with `Colors & Elevations Tokens` carrying
**HeyOz Light** and **HeyOz Dark** as two modes of one collection.

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
| **Composite styles** | Atomic size/leading/tracking variables leave a designer setting four numbers by hand. So the bundle also carries **75 `typography` tokens** — 15 steps × 5 weights — which become 75 Figma **Text Styles**. |

### What is guaranteed

- Every non-typography set matches its DTCG source **token for token**: 655 / 29 / 64 / 208 / 208.
- All **825 references** resolve. The build fails if one does not — a dangling reference is
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
| _Colors Primitives | Value | 655 |
| _Number Primitives | Value | 29 |
| Foundations | Value | 64 |
| Motion | Value | 25 |
| Typography | Value | 64 |
| HeyOz Semantic | Light, Dark | 208 each |

Counted from the emitted files, not from intent. This table has been wrong twice: it once
read 468 / 66 / 69 / 195, and then carried `Motion 10` and `Semantic 216` after the spring
tokens and the sidebar deletion had both moved the real figures. Recount rather than trust
it — `node build/build.mjs` prints the live numbers.

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

**Path A gives you 75 Text Styles** — `text/<step>/<weight>`, every one of the fifteen steps ×
five weights. Apply the style. That is the whole workflow, and it is why Typography ✓ is checked
on the export screen.

This section used to argue the opposite — "all five weights available on all fifteen steps
**without** 75 text styles" — and told you to bind five variables by hand per text layer. That
was the atomic-tokens-only era. The atomic variables still exist and still work; the composite
styles are simply better, because setting five properties correctly on every text layer is a
thing nobody does consistently.

**Path B (native import) has no text styles** — Figma's native Variables importer creates
variables, not styles. There, bind the five per layer:

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
