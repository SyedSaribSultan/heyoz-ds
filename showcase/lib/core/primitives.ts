/* Tier 1 — the authored colour palette.
 *
 * 655 primitives: 5 alpha tiers × 11 hue families × 10–24 steps. Read from
 * tokens/01-colors-primitives.tokens.json, the DTCG file the build emits for Figma,
 * so the palette on the page is the palette Figma imports. There is no second copy.
 *
 * Two things worth understanding before reading further.
 *
 * The alpha tiers are not separate colours. `opacity-15/brand/60` carries the same
 * hex as `solid/brand/60` with alpha 0.15 — 524 of the 655 exist because the grid is
 * generated across every family and step rather than curated (docs/DECISIONS.md D7).
 * That is why most of them have no consumer, and why "504 unused" is a description of
 * the generator rather than a backlog.
 *
 * Primitives are mode-independent. Unlike everything above tier 1, there is one
 * palette; light and dark differ in which step each semantic role points at. So this
 * module takes no Mode.
 */

import primitivesJson from '../../../tokens/01-colors-primitives.tokens.json';
import { audit } from './audit';

/* -- shapes --------------------------------------------------------------- */

type DtcgColor = {
  colorSpace: string;
  components: number[];
  alpha: number;
  hex: string;
};

type DtcgNode = { $value?: DtcgColor } & Record<string, unknown>;

export type PrimitiveStep = {
  /** Full DTCG path, e.g. 'opacity-15/brand/60'. The name a semantic token uses. */
  path: string;
  tier: string;
  family: string;
  /** Step key: '10'…'150', or 'white' / 'black' on the neutral ramp. */
  step: string;
  hex: string;
  alpha: number;
  /** CSS value with the alpha channel folded in. */
  value: string;
  /** OKLCH lightness, 0–100. Computed here rather than read, because the DTCG file
   *  carries sRGB components only. */
  lightness: number;
  /** Semantic tokens that reference this primitive, as 'path (mode)' strings. */
  consumers: string[];
};

export type PrimitiveFamily = {
  tier: string;
  family: string;
  steps: PrimitiveStep[];
  usedCount: number;
};

export type PrimitiveTier = {
  tier: string;
  /** Nominal alpha of the tier, 1 for solid. */
  alpha: number;
  families: PrimitiveFamily[];
  count: number;
  usedCount: number;
};

/* -- OKLCH lightness ------------------------------------------------------ */

const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

/** L* from a hex, matching hexToOklch() in build/palette.mjs. Used to sort ramps and
 *  to show that a step's position in the ramp is a measured value, not a guess. */
function oklchLightness(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return (0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s) * 100;
}

function withAlpha(hex: string, alpha: number): string {
  if (alpha >= 1) return hex;
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
  return `${hex}${a}`;
}

/* -- reverse index -------------------------------------------------------- */

/** primitive path → the semantic tokens that resolve to it.
 *
 *  Built from every entry in both modes that carries a `target`, INCLUDING the
 *  elevation tokens. The build's own `unusedPrimitives` counter reads only its
 *  colour-semantic map, which is why it reports `solid/neutral/black` as unused when
 *  that primitive is the shadow and scrim colour in dark mode. Counting it as used
 *  here is the correct answer; see the note in the Primitives section. */
function buildConsumerIndex(): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const mode of ['light', 'dark'] as const) {
    for (const [tokenPath, resolved] of Object.entries(audit[mode])) {
      const target = resolved.target;
      if (!target) continue;
      const list = index.get(target) ?? [];
      list.push(`${tokenPath} (${mode})`);
      index.set(target, list);
    }
  }
  return index;
}

/* -- parse ---------------------------------------------------------------- */

const isMeta = (key: string) => key.startsWith('$');

/** Nominal alpha per tier, taken from the first leaf rather than parsed out of the
 *  tier name — the name is a label and the value is the truth. */
function tierAlpha(node: Record<string, DtcgNode>): number {
  for (const family of Object.keys(node).filter((k) => !isMeta(k))) {
    const steps = node[family] as unknown as Record<string, DtcgNode>;
    for (const step of Object.keys(steps).filter((k) => !isMeta(k))) {
      const v = steps[step].$value;
      if (v) return v.alpha;
    }
  }
  return 1;
}

function parse(): PrimitiveTier[] {
  const consumers = buildConsumerIndex();
  const root = primitivesJson as unknown as Record<string, Record<string, DtcgNode>>;
  const tiers: PrimitiveTier[] = [];

  for (const tier of Object.keys(root).filter((k) => !isMeta(k))) {
    const tierNode = root[tier];
    const families: PrimitiveFamily[] = [];

    for (const family of Object.keys(tierNode).filter((k) => !isMeta(k))) {
      const stepsNode = tierNode[family] as unknown as Record<string, DtcgNode>;
      const steps: PrimitiveStep[] = [];

      for (const step of Object.keys(stepsNode).filter((k) => !isMeta(k))) {
        const v = stepsNode[step].$value;
        if (!v) continue;
        const path = `${tier}/${family}/${step}`;
        steps.push({
          path,
          tier,
          family,
          step,
          hex: v.hex,
          alpha: v.alpha,
          value: withAlpha(v.hex, v.alpha),
          lightness: oklchLightness(v.hex),
          consumers: consumers.get(path) ?? [],
        });
      }

      families.push({
        tier,
        family,
        steps,
        usedCount: steps.filter((s) => s.consumers.length > 0).length,
      });
    }

    const count = families.reduce((n, f) => n + f.steps.length, 0);
    tiers.push({
      tier,
      alpha: tierAlpha(tierNode),
      families,
      count,
      usedCount: families.reduce((n, f) => n + f.usedCount, 0),
    });
  }

  return tiers;
}

export const primitiveTiers: PrimitiveTier[] = parse();

/** Every step, flat. */
export const allPrimitives: PrimitiveStep[] = primitiveTiers.flatMap((t) =>
  t.families.flatMap((f) => f.steps),
);

/** Derived, never restated. CLAUDE.md rule 5: the figures on the page are computed
 *  from the palette at render time, so they cannot go stale and cannot disagree with
 *  what is rendered beside them. */
export const primitiveSummary = {
  total: allPrimitives.length,
  used: allPrimitives.filter((p) => p.consumers.length > 0).length,
  get unused() {
    return this.total - this.used;
  },
  tiers: primitiveTiers.length,
  families: primitiveTiers[0]?.families.length ?? 0,
  /** What the build reports, kept alongside so the gap is visible rather than
   *  quietly resolved in one direction. */
  auditUnused: audit.counts.unusedPrimitives,
  auditTotal: audit.counts.colorPrimitives,
};

/** Families in a stable, meaningful order: neutral first, then the status hues that
 *  semantic roles are built from, then the spectrum hues that only charts and
 *  gradients reach for. */
export const FAMILY_ORDER = [
  'neutral',
  'brand',
  'error',
  'success',
  'warning',
  'info',
  'spectrum-purple',
  'spectrum-blue',
  'spectrum-teal',
  'spectrum-yellow',
  'spectrum-pink',
];

export function orderedFamilies(tier: PrimitiveTier): PrimitiveFamily[] {
  const rank = (name: string) => {
    const i = FAMILY_ORDER.indexOf(name);
    return i === -1 ? FAMILY_ORDER.length : i;
  };
  return [...tier.families].sort((a, b) => rank(a.family) - rank(b.family));
}
