# HeyOz Design System

One source of truth. JSON in, Figma and CSS out.

```
build/          the only files anyone edits
  palette.mjs   OKLCH colour engine + the authored ramps
  spec.mjs      every decision: foundations, type, motion, semantic map, bridge
  shipped.mjs   current globals.css values — for the diff only, delete after migration
  harness.mjs   test-rig template
  build.mjs     emitters + validation gates

tokens/         GENERATED — import these into Figma, in numeric order
dist/           GENERATED — the dev drops these into the app
reports/        GENERATED — audit data
test/index.html GENERATED — open in a browser, no server needed

docs/
  TESTING.md    ← start here for the test phase
  FIGMA-GUIDE.md
  DEV-GUIDE.md
  DECISIONS.md  every problem found → how it is resolved → where it is enforced
```

## Run it

```bash
node build/build.mjs
```

No dependencies. Node 18+. Takes under a second and rewrites `tokens/`, `dist/`,
`reports/` and `test/`.

The build **fails** if any contrast gate regresses, any alias is unresolvable,
any two tokens that must differ collide, or light and dark stop declaring the
same token names. That is the guarantee — the system cannot quietly rot.

Current state:

```
colour primitives   468   (OKLCH-computed, solid + 3 alpha groups)
semantic tokens     195 × 2 modes
type steps          15 × 5 weights
contrast gates      30/30 pass   WCAG 2.x ratio
APCA gates          10/10 pass   text on saturated fill, Lc 60 floor
visibility gates    12/12 pass
```

## The rules

1. **Zero literals above tier 1.** A semantic token containing a hex means the
   system is broken.
2. **Names describe role, never appearance.** `content/critical`, not `text-red`.
3. **Variation lives in modes only.** Never a duplicated block, never a
   `.force-light`.
4. **Nothing references upward.** primitives ← foundations ← semantic ← component.

Follow those and every future change is a token added, never a restructure.

## Flow

```
build/spec.mjs ──▶ node build/build.mjs ──┬──▶ tokens/*.json ──▶ Figma (Tokens Studio)
                                          ├──▶ dist/*        ──▶ the app
                                          └──▶ test/index.html ─▶ review + sign-off
```

## Text on filled colours is white

`--primary-foreground` and its four siblings are `#FFFFFF`, in both modes, on all
five filled colours. Brand stays `#FF3D00`. This is settled — see `docs/DECISIONS.md`
H1 for the full history, because an earlier revision of this repo got it wrong.

The short version: these pairs are gated on **APCA Lc 60**, not WCAG 2.x 4.5:1.
WCAG 2.x has no polarity term, so its black/white crossover sits at the mid-grey
`#767676` and it prefers black text on *every* fill lighter than that — which is
how a previous build ended up with a near-black label on the orange, and on the
red destructive button. APCA scores white on brand Lc 66.7 and near-black Lc 42.7,
which is the opposite ranking and the correct one.

Consequence, accepted knowingly: axe and Lighthouse will flag these five pairs at
3.1–4.4:1. So does every product shipping this hue (Reddit, SoundCloud, Etsy,
Ubuntu, Home Depot). If a VPAT ever forces the WCAG-2 number, darken the **fill**
to `#D62D00` (white → 4.96:1, Lc 78). Never darken the label.

> A contrast gate may veto a colour. It may never choose one.
