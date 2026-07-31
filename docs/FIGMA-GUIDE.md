# Figma guide

## Import order matters

Import in numeric order. Cross-collection aliases only resolve if the target
collection already exists, so importing `06` before `01` produces broken
variables rather than an error.

```
01-colors-primitives.tokens.json   →  collection: _Colors Primitives
02-number-primitives.tokens.json   →  collection: _Number Primitives
03-foundations.tokens.json         →  collection: Foundations
04-motion.tokens.json              →  collection: Motion
05-typography.tokens.json          →  collection: Typography
06-heyoz-light.tokens.json         ┐  collection: HeyOz Semantic
07-heyoz-dark.tokens.json          ┘  two modes of ONE collection
```

Files 06 and 07 carry `com.figma.modeName` of `HeyOz Light` and `HeyOz Dark`, so
they land as two modes inside one collection. Import 06, then import 07 into the
same collection as a second mode — do not create a second collection.

Either path works: Tokens Studio (Import → the JSON files → Export to Figma
variables), or Figma's native Variables import. The format is the same DTCG shape
that imported cleanly before.

## What you get

| Collection | Modes | Tokens |
|---|---|---|
| _Colors Primitives | Value | 468 |
| _Number Primitives | Value | 29 |
| Foundations | Value | 66 |
| Motion | Value | 10 |
| Typography | Value | 69 |
| HeyOz Semantic | Light, Dark | 195 each |

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

Default pairing — guidance, not a lock:
`display → extrabold`, `heading → semibold`, `body → regular`, `label → medium`.

`font size` for display and the three largest headings are `clamp()` strings.
Figma will hold them as strings; set the frame-level size manually and treat the
token as the spec for the dev.

## Naming

```
{family}/{role}[-variant][-state]
```

States are only ever `hover`, `active`, `disabled`, `focus`. If you need a fifth
state, it goes in `spec.mjs` — not invented on a layer.

## When you need a new token

Do not add it in Figma. Add the line to `build/spec.mjs`, re-run the build,
re-import. Otherwise Figma and code drift, which is the exact failure this whole
structure exists to prevent.
