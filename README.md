# HeyOz Design System

One source of truth. JSON in, Figma and CSS out.

**New here?** Read **`docs/HANDOFF.md`** — how to run it, what is finished, and what is not.

```
build/          the only files anyone edits
  palette.mjs   OKLCH colour engine + the authored ramps
  motion.mjs    spring engine — settle + bounce to a linear() curve
  layout.mjs    the layout primitives
  spec.mjs      every decision: foundations, type, motion, semantic map, bridge
  shipped.mjs   pre-migration globals.css values — for the diff only, delete after
  build.mjs     emitters + validation gates

tokens/         GENERATED — Figma's NATIVE Variables import, in numeric order
tokens-studio/  GENERATED — the Tokens Studio plugin. Import the folder.
dist/           GENERATED — the dev drops these into the app
reports/        GENERATED — audit data, rendered by the showcase /verify route
showcase/       the living reference: 34 components, 9 verification suites

docs/
  HANDOFF.md    ← start here
  FIGMA-GUIDE.md  the two import paths, and why they need different files
  DEV-GUIDE.md    wiring it into an app; read the two footguns
  TESTING.md      how to review a change
  DECISIONS.md    every problem found → how it is resolved → where it is enforced
```

The two token folders come from one resolved map, so they cannot disagree about a
value. They differ in format: `tokens/` gives a colour's value as an object, which
Figma's native importer reads; `tokens-studio/` gives it as a string or a
reference, which the plugin reads and the object form breaks. See FIGMA-GUIDE.

## Run it

```bash
node build/build.mjs        # the token layer. No dependencies, Node 18+.
```

Rewrites `tokens/`, `tokens-studio/`, `dist/` and `reports/` in under a second.

```bash
cd showcase && npm run verify     # the component layer. 9 suites.
cd showcase && npm run visual     # 75 visual tests. Needs a built server on :3000.
```

The build **fails** if any gate regresses, any alias is unresolvable, any Tokens
Studio reference dangles, any two tokens that must differ collide, any semantic
token contains a literal, or light and dark stop declaring the same token names.
That is the guarantee — the system cannot quietly rot.

### Current state

Deliberately not printed here. `node build/build.mjs` ends with the live counts and
`cd showcase && npm run verify` ends with the component ones — read those.

This section used to carry a hardcoded table, and by the time anyone noticed it was
wrong in six places at once: 188 gates when the real figure was 246, 210 semantic
tokens when it was 202, 118 contrast gates when it was 128. It is the first thing a
reader sees and it was the least true thing in the repo. Same reason `CLAUDE.md`
refuses to restate the border count — a number in prose is a number nobody rebuilds.

## The rules

1. **Zero literals above tier 1.** A semantic token containing a hex means the
   system is broken. *Enforced* — the build fails on any colour-valued semantic
   token that names no primitive.
2. **Names describe role, never appearance.** `content/critical`, not `text-red`.
3. **Variation lives in modes only.** Never a hand-maintained second copy, never
   a `.force-light`. `dist/tokens.css` does emit the light block twice — once in
   `:root` and once in `.light` for scoped light islands — but both come from one
   map in one pass, so they cannot drift.
4. **Nothing references upward.** primitives ← foundations ← semantic ← component.

Follow those and every future change is a token added, never a restructure.

## Flow

```
build/spec.mjs ──▶ node build/build.mjs ──┬──▶ tokens/*.json ──▶ Figma (Tokens Studio)
                                          ├──▶ dist/*        ──▶ the app
                                          └──▶ reports/audit.json ─▶ showcase /verify ─▶ sign-off
```

## Text on filled colours is white

`--primary-foreground` and its four siblings are `#FFFFFF`, in both modes, on all
five filled colours. This is settled — see `docs/DECISIONS.md` H1 for the full
history, because an earlier revision of this repo got it wrong.

The short version: these pairs are gated on **APCA Lc 60**, not WCAG 2.x 4.5:1.
WCAG 2.x has no polarity term, so its black/white crossover sits at the mid-grey
`#767676` and it prefers black text on *every* fill lighter than that — which is
how a previous build ended up with a near-black label on the orange, and on the
red destructive button. APCA scores white on brand Lc 66.7 and near-black
Lc 42.7, which is the opposite ranking and the correct one.

All fifteen fill states are gated, not just the five base fills. Gating only the
base is how the white label shipped at Lc 58.8 on dark brand hover and Lc 49.9 on
dark brand active: the label never changes, the fill does.

Consequence, accepted knowingly: axe and Lighthouse will flag these pairs. On the
five resting fills they measure 3.55–4.38:1 by the WCAG 2.x formula; across all
fifteen gated states that formula ranges 2.90–8.40:1, while APCA holds the same
pairs in a tight Lc 60.4–93.3 band. The spread is the argument. Every product
shipping this hue is flagged the same way (Reddit, SoundCloud, Etsy, Ubuntu, Home
Depot). If a VPAT ever forces the WCAG-2 number, darken the **fill** to `#D62D00`
(white → 4.96:1, Lc 78). Never darken the label.

> A contrast gate may veto a colour. It may never choose one.

## The brand fill is `#FF3D01`

Not `#FF3D00`. The brand guide says `#FF3D00`; `brand/60` is authored in OKLCH as
`L 0.6535 / C 0.2348 / h 34.0`, and the round trip back to sRGB lands one 8-bit
unit away. No artifact in this repo has ever contained `#FF3D00`, and the
difference is imperceptible — white-on-brand moves from 3.547:1 to 3.548:1.

Do not "fix" it by hand-typing the hex. That would make brand the only colour in
the system outside the OKLCH engine, which is the mistake decision D6 is about. If
the exact byte ever matters, move `L`; never override the output.

## Reading the gates

Five families, because one metric cannot answer five questions:

| Family | Metric | Asks |
|---|---|---|
| contrast | WCAG 2.x ratio | is this text legible on that surface |
| APCA | Lc | is this label legible on that saturated fill |
| visibility | WCAG 2.x ratio | can a human see this decorative edge at all |
| elevation | OKLCH ΔL | does this shadow do anything |
| greyscale | OKLCH ΔL | are these chart series distinct without hue |

The last two use ΔL rather than a contrast ratio deliberately. Near black the
WCAG formula's `+0.05` flare term swamps the signal and reports ~1.01 for
everything — the same class of blind spot as its missing polarity term. Use an
instrument that can see the thing being measured.

**A gate only guards the pairs you name.** Three of the six production bugs
`DECISIONS.md` §A records as mechanically enforced were still byte-identical in
`dist/` on 2026-07-31, because the assertion lists were shorter than the claims.
If you add a bridge mapping or a semantic role, add its constraint in the same
commit.
