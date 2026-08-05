# Figma guide

## Two import paths, and they need different files

This is the first thing to get right, and this document used to get it wrong. It said
"either path works" off the same folder. It does not.

| You are using | Import from | Why |
|---|---|---|
| **Tokens Studio** plugin | **`tokens-studio/`** | recommended — sets, themes and alias chains all arrive wired up |
| Figma **native** Variables import | `tokens/` | no plugin needed |

The two folders are generated from one resolved map by `build/build.mjs`, so they cannot
disagree about a value. They differ only in **format**, and the difference is not cosmetic:

- `tokens/` is DTCG-2024, where a colour's `$value` is an **object** —
  `{ colorSpace, components, alpha, hex }`. Figma's own importer reads this.
- `tokens-studio/` gives `$value` as a **string** — `"#FFFFFF"`, or a reference
  `"{solid.brand.60}"`. Tokens Studio reads this and **cannot** parse the object form.

Pointing Tokens Studio at `tokens/` produces colour tokens it cannot resolve. That is the
mistake the old wording invited.

---

## Path A — Tokens Studio (recommended)

```
Plugins → Tokens Studio → ⚙ → Import → choose the tokens-studio/ FOLDER
```

Import the folder, not the individual files. `$metadata.json` and `$themes.json` are what
make that work:

- **`$metadata.json`** carries `tokenSetOrder`. That is resolution order — the primitives
  have to load before anything referencing them, and this is what tells the plugin so.
- **`$themes.json`** defines four themes. Two of them share the group `Semantic`, which is
  how **HeyOz Light** and **HeyOz Dark** become two *modes of one collection* rather than
  two separate collections.

Then **Export to Figma variables**.

### Why this path is better

Every alias is a **real reference**, not a copied value. `fill/brand` is literally
`{solid.brand.60}`, and `spacing/spacing-6` is `{number-20}`. Retune `solid/brand/60` in
Figma and every fill, border and content token that depends on it moves with it.

**1045 tokens · 450 references.** The build asserts that every one of those references
resolves to a token in an earlier set — a dangling reference is otherwise completely
silent, because the plugin just never creates the variable and `dist/` stays correct the
whole time.

### The one exception

Ten elevation tokens are emitted as **literal** 8-digit hex rather than references, and
that is deliberate. Figma discards a variable's local value once it is bound to an alias,
and these carry alpha 0.08–0.90 — so a reference would import them **opaque**, turning the
modal scrim into a solid black rectangle. An alias that lies about alpha is worse than no
alias. The build asserts the agreement.

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

## Type: variables, not text styles

Weight is bound as its own variable, so all five weights are available on all
fifteen steps without 75 text styles. Bind four variables per text layer:

```
font family      →  Typography / font family / {display|heading|body|label|mono}
font style       →  Typography / font style / {regular|medium|semibold|bold|extrabold}
font size        →  Typography / font size / {step}
line height      →  Typography / line height / {step}
letter spacing   →  Typography / letter spacing / {step}
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

`font size` for display and the three largest headings are `clamp()` strings.
Figma will hold them as strings; set the frame-level size manually and treat the
token as the spec for the dev.

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
