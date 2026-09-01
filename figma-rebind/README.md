# HeyOz Token Rebind

A private Figma plugin that fixes the paste-between-files problem: a screen
copied from one file into another keeps its variable bindings pointed at the
**source file's** variables, because Figma binds by variable ID, not by name.
The destination file holds identically-named variables from the same
`tokens-studio/heyoz.tokens.json` import, but the IDs differ, so nothing
connects — the layers show correct values that silently stopped tracking any
token.

This plugin walks the page (or the current selection), finds every binding
that points at a variable **not local to the open file**, and repoints it at
the local variable with the same name and type. Bindings that are already
local are left alone, so running it twice is harmless.

## Install (one time, per person)

The plugin is not published — it runs as a development plugin.

1. Figma desktop app → menu → **Plugins → Development → Import plugin from manifest…**
2. Pick `figma-rebind/manifest.json` from this repo.

It then appears under **Plugins → Development → HeyOz Token Rebind** in every
file you open.

## Use

1. Open the file whose pasted screens are disconnected (workspace or final —
   the file that ALREADY HAS the tokens imported; the plugin matches against
   the open file's local variables, so an un-imported file has nothing to
   match against).
2. Select the pasted frames — or select nothing to sweep the whole page.
3. Run the plugin. It reports what it rebound and lists anything it could not.

## What it covers

- **Fills and strokes** — the solid-paint colour binding on every layer,
  including layers inside instances.
- **Effects** — shadow colour and any bound radius/spread/offset.
- **Numbers** — corner radii, padding, item spacing, width/height, stroke
  weight, and every other single-alias field on a node.
- **Text properties** — font size, line height, letter spacing, family and
  style bindings (fonts are loaded first; a text layer with a missing font is
  reported instead of touched).

## What it deliberately does not touch

- **A name with no local match** is reported, never guessed. The usual cause
  is a destination file on an older import — rebuild
  (`node build/build.mjs`), re-import per `tokens-studio/README.md`, run again.
- **A name that exists in two local collections** is reported as ambiguous.
  The usual cause is a duplicate collection left by an export that ran with
  `Theme: None` — delete the stray collection, run again.
- **Per-character text-range fills** (one text layer, multiple colours) —
  Figma's API exposes those differently; rebind the segment by hand.
- **Text styles and effect styles.** Styles are not variables; a pasted layer
  using a style from the old file keeps a remote style reference. The four
  Effect Styles and any text-style swaps stay manual — see
  `tokens-studio/README.md`.
- **Tokens Studio annotations.** If a screen was themed through Tokens Studio
  *token application* rather than Figma variable bindings, the mapping lives
  in plugin data, not in `boundVariables`, and this plugin cannot see it. Fix
  those inside Tokens Studio: same token file loaded, select the layers,
  re-apply the tokens.

## Why not fix it at the source

The clean architecture is one design-system file **published as a team
library**, with the workspace and final files consuming its variables — then a
paste between subscriber files keeps every binding, and this plugin becomes
unnecessary. Publishing libraries is a paid-plan feature; this plugin is the
free-tier answer.
