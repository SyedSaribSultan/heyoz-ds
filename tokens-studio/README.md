# tokens-studio/

**GENERATED — DO NOT EDIT.** Overwritten by `node build/build.mjs`. Change
`build/spec.mjs` or `build/palette.mjs` and rebuild.

This note is a file rather than a `$generated` key inside the JSON, because two of these
documents are read against a schema this repo does not control. `$themes.json` is an
**array**, and prepending a key to it turns it into an object with keys `"0"`, `"1"`,
`"2"` — which Tokens Studio rejects outright. That happened once, in the commit that added
this folder, and the marker meant to prevent hand-editing was what broke it.

## How to import

```
Plugins → Tokens Studio → ⚙ → Import → choose this FOLDER
```

Then **Export to Figma variables**.

Import the folder, not the individual files — `$metadata.json` and `$themes.json` are what
give you the set order and the Light/Dark themes without rebuilding them by hand.

## What is in here

| File | |
|---|---|
| `$metadata.json` | `tokenSetOrder` — resolution order. Primitives first, or references dangle. |
| `$themes.json` | Four themes. Light and Dark share the group `Semantic`, so they import as two **modes of one collection**. |
| `primitives-colors.json` | 655 literal colours. The root of every reference chain. |
| `primitives-numbers.json` | 29 raw numbers. |
| `foundations.json` | Spacing, radius, stroke, sizing — each a reference to a number primitive. |
| `motion.json` | Durations, easings and the computed spring curves. |
| `typography.json` | 15 steps × families, weights, sizes, leading, tracking. |
| `semantic-light.json` | The semantic layer, every colour a reference. |
| `semantic-dark.json` | The same names, resolved for dark. |

## Why this is not `tokens/`

Same resolved map, different format, and the difference is not cosmetic:

- `tokens/` is DTCG-2024 — a colour's `$value` is an **object**
  (`{ colorSpace, components, alpha, hex }`). Figma's **native** Variables import reads that.
- Here, `$value` is a **string**: a literal (`"#FFFFFF"`, `"#FC664526"`) or a reference
  (`"{solid.brand.60}"`). Tokens Studio reads that and **cannot** parse the object form.

Pointing Tokens Studio at `tokens/` gives you colours it cannot resolve.

These files are derived from the emitted `tokens/` documents rather than re-walked from
`spec.mjs`, so the two sets cannot drift apart on a value.

## The advantage, and the one exception

Every alias here is a **real reference**. `fill/brand` is `{solid.brand.60}`;
`spacing/spacing-6` is `{number-20}`. Retune a primitive in Figma and everything depending
on it moves. The build asserts that all 450 references resolve to a token in an earlier set
— a dangling one is otherwise silent, because the plugin just never creates the variable
while `dist/` stays correct.

**Ten elevation tokens are literal 8-digit hex, not references, and that is deliberate.**
Figma discards a variable's local value once it is bound to an alias, and these carry alpha
0.08–0.90 — so a reference would import them opaque, turning the modal scrim into a solid
black rectangle. An alias that lies about alpha is worse than no alias.
