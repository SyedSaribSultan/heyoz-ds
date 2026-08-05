# HeyOz → Figma

Everything in one file: **`heyoz.tokens.json`**.

**GENERATED — DO NOT EDIT.** Re-run `node build/build.mjs` and re-import.

---

## Import it

**1. Open the plugin**

Figma → **Plugins → Tokens Studio for Figma**

**2. Load the file**

Top-right **JSON toggle** (`{ }`) → select all → paste the entire contents of
`heyoz.tokens.json` → **Save**.

You should now see **6 token sets** in the left panel and **6 themes** under the Themes tab.

> If pasting only loads one set, the file was truncated — paste the whole thing, including the
> `$themes` and `$metadata` blocks at the bottom.

**3. Set the export options**

Hit **Export** and match this exactly:

| | |
|---|---|
| **Variables** | Color ✓ · Number ✓ · String ✓ · Boolean — doesn't matter |
| **Styles** | **Typography ✓** · Color ✗ · Effects ✗ · Gradients ✗ |
| **Toggles** | *Update existing style and variable names* → **ON**. Everything else **OFF**. |

Typography ✓ is what turns the 75 composite tokens into Figma **Text Styles**. Without it you
get loose numbers and no styles.

Leave *Remove unconnected variables* **OFF** unless this file is the only thing in your Figma
file.

**4. Export**

**Themes** tab → **Select All** (all 6) → **Export to Figma**.

---

## What you should end up with

**5 collections:**

| Collection | Modes | Tokens |
|---|---|---|
| `_Colors Primitives` | Mode 1 | 655 |
| `_Number Primitives` | Mode 1 | 29 |
| `Numbers Tokens` | Mode 1 | 64 |
| `Typography Tokens` | Mode 1 | 64 |
| `Colors & Elevations Tokens` | **HeyOz Light**, **HeyOz Dark** | 208 each |

**75 Text Styles** — `text/<step>/<weight>`, every one of the 15 type steps × 5 weights.

### Check three things

1. A colour in `Colors & Elevations Tokens` shows an **alias** — `fill/brand → solid/brand/60`
   — not a raw hex. Same for `Numbers Tokens` → `_Number Primitives`.
2. `Colors & Elevations Tokens` has **two modes**, not two collections.
3. Open a text style. `text/display-lg/extrabold` should read **64px / 68 line height /
   −1.28 letter spacing**, Bricolage Grotesque ExtraBold.

---

## Two manual steps

These can't come from the file. Both take a couple of minutes.

### Shadows → Effect Styles

Figma effect styles can't hold modes, so instead of baking them you bind their colour to the
mode-aware shadow variable. For each of `shadow/small`, `shadow/medium`, `shadow/large`: create
an Effect Style with **two Drop Shadow** layers, X = 0, Spread = 0, and bind **each layer's
colour** to the matching variable in `Colors & Elevations Tokens → elevation/drop-shadow/*`.

The Y and Blur values are in `dist/tokens.css` — search `--oz-shadow-`.

### Hide the primitives

So nobody binds a raw ramp value by accident:

Variables editor → open **`_Colors Primitives`** → select all → right-click → **Hide from
publishing**. Repeat for **`_Number Primitives`**. Re-publish the library.

Aliases still resolve — the primitives just stop appearing in the picker.

**Bind to `Colors & Elevations Tokens`, never to `_Colors Primitives` directly.**

---

## Honest caveats

**Re-exporting reverts the two manual steps.** *Hide from publishing* and the Effect Styles live
only in Figma, not in this file. After a future re-export, redo them.

**Four things are deliberately not here**, because Figma cannot hold them:

| | Why |
|---|---|
| **Motion** — durations, easings, springs | Figma variables are Color / Number / String / Boolean. There is no duration type and no easing type. They'd import as meaningless strings. Values are in `dist/tokens.css`. |
| **Fluid type** | A variable is one number. Display and heading ship their **desktop ceiling** in px — `display-lg` is 64, not `clamp(40px … 64px)`. Small-frame mockups need manual down-scaling. |
| **`container/measure`** (`65ch`) | `ch` has no Figma equivalent. Code only. |
| **Unitless line height** | The code authors leading as a ratio so it survives the fluid clamp; Figma text styles need px. Converted here — `display-lg` is 68px, which is 1.0625 × 64. |

---

## Why one file and not a folder

The plugin can't open a folder. Its local options are "load one JSON file" and "paste into the
JSON editor" — a directory of separate token sets is only readable through a **sync provider**
(GitHub/GitLab/…), which is setup you may not have.

So this is one document with the sets as top-level keys and `$themes` / `$metadata` inline.
Paste, export, done.

If you *do* wire up GitHub sync later, this same file works unchanged.

## Why this is not `tokens/`

Same values, different format. `tokens/` is DTCG-2024 for Figma's **native** Variables importer,
where a colour's value is an object. Tokens Studio needs a string and its own type names, and
**cannot parse the object form** — pointing it at `tokens/` gives you colours it can't resolve.

Both folders are generated from one resolved map by `build/build.mjs`, so they can't disagree
about a value. The build also asserts that all **825 references** in this file resolve, because a
dangling one is silent: the plugin just never creates that variable.

## The one exception to the alias chain

Ten elevation tokens are literal 8-digit hex, not references, on purpose. Figma discards a
variable's local value once it's bound to an alias, and these carry alpha 0.08–0.90 — so a
reference would import them **opaque**, turning the modal scrim into a solid black rectangle.
