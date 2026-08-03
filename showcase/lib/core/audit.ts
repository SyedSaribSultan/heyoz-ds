/* Resolved token values, read from the build's own audit output.
 *
 * reports/audit.json is written by `node build/build.mjs` and carries, for both
 * modes, every semantic token's computed hex, its alpha, and the tier-1 primitive
 * it resolved from. The showcase displays those numbers rather than recomputing
 * them, for the reason CLAUDE.md rule 5 gives: restated figures go stale, and
 * several already-shipped ones were wrong. If a value shown on the page is wrong,
 * the build is wrong, and that is a much more useful bug to have. */

import auditJson from '../../../reports/audit.json';
import type { Mode } from './types';

type ResolvedToken = {
  hex: string;
  alpha: number;
  target?: string;
  aliased?: boolean;
  /** Present on number-valued tokens such as elevation/overlay/blur. */
  number?: number;
};

type Audit = {
  generatedAt: string;
  namespace: string;
  counts: {
    colorPrimitives: number;
    numberPrimitives: number;
    semanticPerMode: number;
    typeSteps: number;
    unusedPrimitives: number;
  };
  contrast: Array<{
    kind: string;
    metric: string;
    mode: Mode;
    fg: string;
    bg: string;
    ratio: number;
    min: number;
    pass: boolean;
  }>;
  light: Record<string, ResolvedToken>;
  dark: Record<string, ResolvedToken>;
  typography: {
    steps: string[];
    size: Record<string, string | number>;
    lineHeight: Record<string, number>;
    letterSpacing: Record<string, string | number>;
    family: Record<string, string>;
    defaultWeight: Record<string, string>;
  };
  errors: unknown[];
  warnings: unknown[];
};

export const audit = auditJson as unknown as Audit;

/** Tailwind colour key → DTCG path. 'fill-brand-hover' → 'color/fill/brand-hover'.
 *
 * The preset nests colours one level deep (colors.fill['brand-hover']), so the
 * first hyphen-delimited segment is the group and the remainder is the leaf. The
 * two flat groups have no leaf at all. */
export function tokenPath(key: string): string {
  if (key === 'background' || key === 'transparent' || key === 'current') {
    return key === 'background' ? 'color/background' : key;
  }
  const cut = key.indexOf('-');
  if (cut === -1) return `color/${key}`;
  return `color/${key.slice(0, cut)}/${key.slice(cut + 1)}`;
}

/** Resolve a Tailwind colour key in one mode. Returns null for non-token keys
 *  such as `transparent`, which are Tailwind core and have no DTCG entry. */
export function resolve(key: string, mode: Mode): ResolvedToken | null {
  /* Six hex digits, not eight. cssValue() appends the alpha channel itself, and an
   * already-8-digit hex came back out as a 10-digit string that no browser parses. */
  if (key === 'transparent') return { hex: '#000000', alpha: 0 };
  return audit[mode][tokenPath(key)] ?? null;
}

/** Role-aware resolution.
 *
 *  Shadow tokens are named by elevation step — 'x-small', 'medium' — and live under
 *  `elevation/drop shadow/*`, not under `color/*`. Resolving them through the colour
 *  path silently returned null, which showed up as a dash in the Card binding table
 *  and as a phantom "token does not resolve" in the contrast sweep. Roles have to be
 *  carried through rather than inferred from the name. */
export function resolveRole(role: string, key: string, mode: Mode): ResolvedToken | null {
  if (role === 'shadow') return audit[mode][`elevation/drop shadow/${key}`] ?? null;
  return resolve(key, mode);
}

/** The DTCG path a role/key pair is known by. Mirrors resolveRole. */
export function rolePath(role: string, key: string): string {
  return role === 'shadow' ? `elevation/drop shadow/${key}` : tokenPath(key);
}

/** CSS colour string for a resolved token, alpha folded in. */
export function cssValue(t: ResolvedToken | null): string {
  if (!t) return 'transparent';
  if (t.alpha >= 1) return t.hex;
  const a = Math.round(t.alpha * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
  return `${t.hex}${a}`;
}

/** Every semantic token path in a mode whose group matches, in declaration order.
 *  Used by the Foundations section so the swatch lists are generated from the
 *  build rather than transcribed — the count on the page is always the real count. */
export function tokensInGroup(group: string, mode: Mode): string[] {
  const prefix = `color/${group}/`;
  return Object.keys(audit[mode]).filter((p) => p.startsWith(prefix));
}

/** Contrast results for one foreground/background pair, if the build gates it.
 *  Returned so a component's docs can show its own measured numbers instead of
 *  a claim about them. */
export function gatesFor(fgPath: string, mode: Mode) {
  return audit.contrast.filter((g) => g.mode === mode && g.fg === fgPath);
}



export const auditSummary = {
  generatedAt: audit.generatedAt,
  gates: audit.contrast.length,
  passing: audit.contrast.filter((g) => g.pass).length,
  errors: audit.errors.length,
  semanticPerMode: audit.counts.semanticPerMode,
  colorPrimitives: audit.counts.colorPrimitives,
  typeSteps: audit.counts.typeSteps,
  /** The mtimes the build recorded for its authored sources. Comparing them against
   *  disk is `lib/core/staleness.ts`, which is server-only — this module is imported
   *  by client components and `node:fs` cannot be bundled for a browser. An earlier
   *  version did the check here behind a `typeof window` guard, which is a runtime
   *  test against a build-time problem: webpack resolves the import either way, and
   *  the whole build failed with UnhandledSchemeError on "node:fs". */
  sources: (audit as { sources?: Record<string, number | null> }).sources ?? {},
};
