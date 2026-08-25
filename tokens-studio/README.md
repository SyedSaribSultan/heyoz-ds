# HeyOz → Figma

Everything in one file: **`heyoz.tokens.json`**.

**GENERATED — DO NOT EDIT.** Re-run `node build/build.mjs` and re-import.

This walkthrough is written from an actual free-tier import that went wrong four times. Every
warning below is a mistake somebody already made, not a hypothetical.

---

## The one thing that breaks everything

**A theme must be ACTIVE when you hit Export.**

If the Themes dropdown reads **`Theme: None`**, Tokens Studio exports each token set as **its own
collection** — you get six collections, `HeyOz Light` and `HeyOz Dark` as two *separate*
collections instead of two modes of one, and nothing is mode-switchable. The import looks like it
worked. It is wrong in the one way that matters.

The `group` field in `$themes` is what merges sets into a collection, and it is only read when a
theme is active. **Check the dropdown before every single export pass.**

---

## Import it

### 1. Open the plugin

Figma → **Plugins → Tokens Studio for Figma**

### 2. Load the file

Top-right **JSON toggle** (`{ }`) → select all in the editor → paste the **entire** contents of
`heyoz.tokens.json` → **Save**.

You should now see **6 token sets** in the left panel and **6 themes** under the Themes tab.

> Only one set appeared? The paste was truncated. The file must include the `$themes` and
> `$metadata` blocks at the very bottom — those are what create the themes.

### 3. Set the export options

Hit **Export** and match this exactly:

Every toggle on that screen is listed. There is no "everything else" row, because two of
these have to be ON and a catch-all row is how one of them got missed.

| | |
|---|---|
| **Variables** | Color ✓ · Number ✓ · String ✓ · Boolean — doesn't matter |
| **Styles** | Typography — see below · Color ✗ · Effects ✗ · Gradients ✗ |
| *Ignore first part of token name for styles* | **OFF** |
| *Prefix styles with active theme name* | **OFF** |
| *Create styles with variable references* | **ON** |
| *Update existing style and variable names* | **ON** |
| *Remove styles and variables without connection to a token* | **OFF** |

**Styles → Typography: tick it if your Text styles panel comes up empty, otherwise leave it.**
The bundle carries 75 `typography` composite tokens under `text/*` — 15 steps × 5 weights — and
those are what become Figma Text Styles.

Whether the checkbox is *required* is not settled. This repo's own note used to state that it is,
and that was written when there were no composites to test it with. Reported experience on a file
that did carry composites is that the styles landed **without** ticking anything — plausible,
since some plugin versions create a style whenever a `typography` token exists, treating the box
as opt-out rather than opt-in. Neither claim has been verified against a specific plugin version,
so the instruction is written as a fallback rather than a step.

What IS settled: **no composites, no styles, whatever the checkbox says.** That was the actual
cause of the empty panel.

Leave every other Styles checkbox off — there are no composite colour, shadow or border tokens,
so those would build nothing.

Each style's five fields are **references** to the atomic tokens, not copies. So a style is a
shortcut to the variables rather than a duplicate of them, and retuning `font size/body-md`
moves all five body-md styles with it. Both the styles and the variables are usable — apply a
style for the common pairings, bind the five variables for anything the grid does not cover.

**Why *Create styles with variable references* is ON.** It is what makes the 75 text styles
worth having. Each composite's five fields are references — `fontSize: {font-size.body-md}` —
and with this OFF Figma bakes the resolved number into the style, so `16` is copied in and the
link is gone. A style that has stopped tracking its token is the value-duplicating version the
whole composite argument was written to avoid; the toggle is what keeps it a shortcut to the
variables rather than a snapshot of them.

**Why *Prefix styles with active theme name* is OFF.** Six passes with six theme names would
give six copies of every style, prefixed. The type styles come from one set and want one name.

**Why *Ignore first part of token name for styles* is OFF.** It would strip the `text` segment,
so `text/body-md/semibold` lands as `body-md/semibold` — losing the grouping that keeps 75
styles navigable in the picker.

**Why *Remove styles and variables without connection to a token* stays off.** This is the one
that silently destroys an import, and it is worth being precise about what it means.

"Without connection to a token" means *not connected to a token in the set being exported right
now* — NOT "unused by a layer on the canvas". So an empty scratch file gives no protection: the
question is never what your frames reference, it is what the current pass covers.

Each of the six themes enables exactly one set and marks the other four or five `disabled` or
`source`. So with this ON:

```
pass 1  Colors Primitives   creates 680 colour variables
pass 2  Number Primitives   Colors is disabled -> those 680 are unconnected -> DELETED
pass 3  Numbers Tokens      deletes pass 2
pass 4  Typography Tokens   deletes pass 3, and later passes delete the text styles
pass 5  HeyOz Light         deletes pass 4
pass 6  HeyOz Dark          deletes pass 5
```

You finish with the last pass only, and it reads as "the import half-worked" rather than as a
wrong setting — which is what makes it expensive.

`source` is the part that catches people who reason it through and still get bitten: exporting
`HeyOz Light` marks `_Colors Primitives` as `source`, which means "resolve references against
this, do not create variables for it". The primitives every semantic token depends on are
therefore not connected during that pass either, so they are swept as well.

The toggle is for cleanup after a rename, on an established file. The safe way to use it then is
ONE pass with every set enabled — never the six-pass sequence.

### 4. Export — six passes, in this order

**Free tier has no *Select All*.** That is a Pro feature. You export **one theme at a time, six
times.** This is normal and takes about a minute.

Work **top to bottom** down the Themes list. The order is not cosmetic — a colour in
`Colors & Elevations` aliases a primitive, and Figma can only create that alias if the primitive
collection **already exists**. Export a semantic set before its primitives and you get raw hexes
with no alias, silently.

| # | Theme | Collection it lands in |
|---|---|---|
| 1 | `_Colors Primitives` | `_Colors Primitives` |
| 2 | `_Number Primitives` | `_Number Primitives` |
| 3 | `Numbers Tokens` | `Numbers Tokens` |
| 4 | `Typography Tokens` | `Typography Tokens` |
| 5 | `HeyOz Light` | `Colors & Elevations Tokens` — mode 1 |
| 6 | `HeyOz Dark` | `Colors & Elevations Tokens` — mode 2 |

For each pass: **select the theme so it is active** → **Export to Figma**. Re-check the dropdown
every time; it can reset between passes.

Passes 5 and 6 both carry `group: "Colors & Elevations Tokens"`, which is what makes them two
modes of one collection rather than two collections.

---

## Verify it — five checks

Do these in the Variables editor. If any fails, the fix is below it.

**1. Exactly 5 collections, not 6.**

| Collection | Modes | Tokens |
|---|---|---|
| `_Colors Primitives` | Mode 1 | 680 |
| `_Number Primitives` | Mode 1 | 29 |
| `Numbers Tokens` | Mode 1 | 64 |
| `Typography Tokens` | Mode 1 | **60** (64 in the file — see below) |
| `Colors & Elevations Tokens` | **HeyOz Light**, **HeyOz Dark** | 208 each |

*Got 6, with Light and Dark separate?* A theme wasn't active. Delete both, re-do passes 5 and 6
with the theme selected.

**`Typography Tokens` reads 60, not 64 — that is correct and not a failed import.** Four tokens
in that set are `default-weight/{display|heading|body|label}`, which Tokens Studio types as
`other`. Figma has no variable type for `other`, so the plugin skips them. They were only ever a
note recording the suggested step→weight pairing; nothing references them and no component binds
one. The 10 real weights in `fontWeights` all import. **60 is a pass.**

**2. `Colors & Elevations Tokens` has two modes — and no third one called `Mode 1`.**

A stray `Mode 1` in that collection is the fossil of an export that ran with no theme active.
**Delete `Mode 1`, keep `HeyOz Light` and `HeyOz Dark`.** Tell them apart by clicking each: the
real ones have 208 values, the fossil is empty or partial. If Figma warns that layers are bound to
the mode you're deleting, you deleted the wrong one — cancel and check again.

**3. Semantics show aliases, not hexes.**

Click `fill/brand` — it should read **`solid/brand/60`**, not `#FF3D01`. Same for
`Numbers Tokens` → `_Number Primitives`.

*Reads a raw hex?* The primitives didn't exist yet at export time. Re-run passes 5 and 6.

**4. Type is numbers, not strings.**

`Typography Tokens → font-size → display-lg` = **64**. `line-height → display-lg` = **68**.

*Reads `clamp(40px, …, 64px)` or `1.0625`?* You're on a stale file — rebuild and re-paste.

**5. Shadows kept their transparency.**

`elevation/drop-shadow/large` in **HeyOz Dark** should be near-black at **90% alpha**, not 100%.
These four are deliberately raw hex rather than aliases — see *The one exception* below.

---

## Styling text

Bind five variables per text layer, all from `Typography Tokens`:

| Figma field | Variable |
|---|---|
| Font | `font-family/{display\|heading\|body\|label\|mono}` |
| Weight / style | `font-style/{regular\|medium\|semibold\|bold\|extrabold}` |
| Size | `font-size/{step}` |
| Line height | `line-height/{step}` |
| Letter spacing | `letter-spacing/{step}` |

15 steps: `display-lg/md/sm`, `heading-xl/lg/md/sm/xs`, `body-lg/md/sm/xs`, `label-md/sm/xs`.

Suggested pairings — guidance, not a rule: `display → extrabold`, `heading → semibold`,
`body → regular`, `label → medium`. Those are in `default-weight/*` if you want them bound.

**Two weight groups exist on purpose.** `font-weight` is numeric (400–800) and is what the CSS
consumes. `font-style` is a string (`SemiBold`) and is what Figma's weight field actually binds
to. Same five weights, two representations, because neither end can use the other's.

---

## Two manual steps

Neither can come from the file.

### A. Shadows → four Effect Styles

Figma effect styles can't hold modes — but an effect's **colour can bind to a variable**, and the
shadow variables are mode-aware. So **one style per tier covers both light and dark.** That is the
entire reason those four tokens exist as variables.

**Four styles, seven layers.** Not three, and the spreads are mostly **negative** — a
spread of 0 throughout gives you a uniform blur that reads as fog instead of lift.

| Effect Style | Layer | X | Y | Blur | Spread | Bind colour to |
|---|---|---|---|---|---|---|
| `Elevation/x-small` | 1 of 1 | 0 | 1 | 2 | **0** | `elevation/drop-shadow/x-small` |
| `Elevation/small` | 1 of 2 | 0 | 1 | 3 | **0** | `elevation/drop-shadow/small` |
| | 2 of 2 | 0 | 1 | 2 | **−1** | `elevation/drop-shadow/small` |
| `Elevation/medium` | 1 of 2 | 0 | 4 | 6 | **−1** | `elevation/drop-shadow/medium` |
| | 2 of 2 | 0 | 2 | 4 | **−2** | `elevation/drop-shadow/medium` |
| `Elevation/large` | 1 of 2 | 0 | 10 | 15 | **−3** | `elevation/drop-shadow/large` |
| | 2 of 2 | 0 | 4 | 6 | **−4** | `elevation/drop-shadow/large` |

All values px. Every layer is a **Drop Shadow**. Both layers of a tier bind to the **same**
variable — the two layers differ in geometry, never in colour.

To bind: create the effect → click the colour swatch → the **variable icon** (four dots) →
`Colors & Elevations Tokens` → `elevation/drop-shadow/…`. Do not type the hex; a typed hex won't
follow the mode.

Ground truth is `dist/tokens.css` — search `--oz-elevation-` for the composed CSS these mirror.

**Also there: the modal scrim.** `elevation/overlay/dimness` is the scrim fill and
`elevation/overlay/blur` is **4** (background blur). Not an effect style — apply to the overlay
layer directly.

### B. Get the primitives out of the pickers

709 primitives — 680 colours + 29 numbers — will otherwise clutter every picker and invite
somebody to bind a raw ramp value.

**Two different controls, and they do different things. You need scoping, not publishing.**

| Control | What it actually does |
|---|---|
| **Hide from publishing** | Stops the variable reaching *other* files through the library. **Still fully visible in this file.** |
| **Scoping** | Stops the variable appearing in a *property picker*. This is the one you want. |

This is why the primitives were still showing after the first attempt: only publishing had been
turned off.

**To scope them off:** Variables editor → `_Colors Primitives` → click the first row → scroll to
the last → **Shift-click** to select all 680 → right-click → **Scoping** (or the scope column) →
uncheck **Show in all supported properties** and leave every individual scope unchecked. Repeat
for `_Number Primitives`.

Then also **Hide from publishing** on both, so consuming files don't see them either. Both, not
either.

Aliases keep resolving — a scoped-out variable still feeds every semantic token that references
it. It just stops being pickable.

**Bind to `Colors & Elevations Tokens`, never to `_Colors Primitives` directly.**

---

## Re-importing after a rebuild

Token *values* change without token *names* changing — that is the normal case, and it is easy.

With **Update existing style and variable names ON**, a re-export matches by name and updates
values in place. **Every existing binding survives.** You do not rebind anything.

1. Rebuild: `node build/build.mjs`
2. Re-paste the whole file into the JSON editor → Save
3. Run all six passes again, in order, theme active each time

**What a re-export does NOT restore:** the two manual steps. Scoping and the Effect Styles live
only in Figma. Check them after every re-export.

---

## Deliberately not here

Five things. Four because Figma cannot hold them, one because you do not want it.

| | Why |
|---|---|
| **Motion** — durations, easings, springs | Figma variables are Color / Number / String / Boolean. No duration type, no easing type. They'd import as meaningless strings. Values are in `dist/tokens.css`. |
| **Fluid type** | A variable is one number. Display and heading ship their **desktop ceiling** in px — `display-lg` is 64, not `clamp(40px … 64px)`. Small-frame mockups need manual down-scaling. |
| **`container/measure`** (`65ch`) | `ch` has no Figma equivalent. Code only. |
| **Text Styles** | **Shipped** — 75 of them, 15 steps × 5 weights. They were absent for a while on the argument that a style bakes five properties into one object and stops step and weight being independent, which is what `spec.mjs` refuses to do. They are back because every field is a *reference* to an atomic token rather than a copy, so retuning one size still moves all five of its styles — the independence that argument was protecting survives. Both styles and variables are usable. |
| **Unitless line height** | The code authors leading as a ratio so it survives the fluid clamp; a Figma variable bound to a line-height field needs px. Converted here — `display-lg` is 68px, which is 1.0625 × 64. |

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
about a value. The build also asserts that all **450 references** in this file resolve, because a
dangling one is silent: the plugin just never creates that variable.

## The one exception to the alias chain

Ten elevation tokens — five per mode — are literal 8-digit hex rather than references, on purpose.
Figma discards a variable's local value once it's bound to an alias, and these carry alpha
**0.08–0.90**, so a reference would import them **opaque**: every shadow a solid slab and the
modal scrim a black rectangle. The build asserts an alias is only ever emitted when the alpha
matches too, so this cannot be reintroduced.
