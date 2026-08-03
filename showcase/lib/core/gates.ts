/**
 * gates.ts — every gate result the build measured, read from reports/audit.json.
 *
 * This is what the Verification route is built from, and it is the reason
 * `test/index.html` can be archived: the generated rig existed to render exactly
 * this data, and rendering it here means one artifact rather than two that have to
 * be kept in step.
 *
 * Same contract as audit.ts beside it — nothing is computed here. A number on the
 * Verification route is a number the build measured, joined to a label. If a gate
 * result is wrong, `node build/build.mjs` is where it is wrong, and the build would
 * have exited non-zero before this file ever saw it.
 */

import audit from '../../../reports/audit.json';

export type GateKind =
  | 'contrast'
  | 'apca'
  | 'visibility'
  | 'elevation'
  | 'greyscale'
  | 'ladder'
  | 'motion'
  | 'layout';

export type GateRow = {
  kind: GateKind;
  metric: string;
  mode?: 'light' | 'dark';
  /** Colour gates carry fg/bg; motion and layout gates carry `token`. */
  fg?: string;
  bg?: string;
  token?: string;
  ratio: number;
  min: number;
  pass: boolean;
};

const rows = audit.contrast as unknown as GateRow[];

/** What each family is actually asserting, in one line, for the section header.
 *  Written here rather than in the component because these are claims about the
 *  build and they belong next to the data they describe. */
export const GATE_FAMILIES: Array<{
  kind: GateKind;
  title: string;
  blurb: string;
  unit: (r: GateRow) => string;
}> = [
  {
    kind: 'contrast',
    title: 'Contrast',
    blurb:
      'WCAG 2.x ratio for every text-on-surface pairing the semantic map creates, in both modes. Translucent tokens are composited against what they sit on before measuring, so the number is what reaches the eye rather than what the token declares.',
    unit: (r) => `${r.ratio.toFixed(2)}:1`,
  },
  {
    kind: 'apca',
    title: 'APCA',
    blurb:
      'Lc 60 floor on every content/on-* pair. These are the pairs WCAG 2.x gets wrong: it has no polarity term, so it prefers near-black on any fill lighter than #767676 and would put a dark label on the brand orange. DECISIONS H1 — an earlier revision did exactly that and shipped it.',
    unit: (r) => `Lc ${r.ratio.toFixed(1)}`,
  },
  {
    kind: 'visibility',
    title: 'Visibility',
    blurb:
      'Non-text pairs that still have to be seen: borders against the surfaces they are drawn on, focus rings against the fills they ring.',
    unit: (r) => `${r.ratio.toFixed(2)}:1`,
  },
  {
    kind: 'elevation',
    title: 'Elevation',
    blurb:
      'Each drop shadow must move the page lightness by a measurable amount once composited at its own alpha. A shadow that does not is decoration.',
    unit: (r) => `ΔL ${r.ratio.toFixed(4)}`,
  },
  {
    kind: 'greyscale',
    title: 'Greyscale',
    blurb:
      'The five chart series, pairwise, on lightness alone — so they survive greyscale printing and red-green deficiency. Hue is not allowed to be the only difference between two series.',
    unit: (r) => `ΔL ${r.ratio.toFixed(4)}`,
  },
  {
    kind: 'ladder',
    title: 'Surface ladder',
    blurb:
      'Every rung sits further from the page than the one below it. Dark-only: in dark mode lightness IS the elevation signal, and this ladder was inverted at the top until DECISIONS B18 — surface/elevated was byte-identical to surface/secondary, which is why floating things needed a border.',
    unit: (r) => `ΔL ${r.ratio.toFixed(4)}`,
  },
  {
    kind: 'motion',
    title: 'Motion',
    blurb:
      'Measured on the emitted linear() curve, not on the declaration. An effects spring must not overshoot — an opacity that does clips at 1 and stalls; a spatial spring must, or it is a bezier with extra steps. Plus a settle-time ceiling, tightest on the springs that run on every hover.',
    unit: (r) => (r.metric === 'settle' ? `${r.ratio}ms` : r.metric === 'overshoot' ? `${(r.ratio * 100).toFixed(2)}%` : String(r.ratio)),
  },
  {
    kind: 'layout',
    title: 'Layout',
    blurb:
      'Static checks on dist/layout.css. Every minmax() clamps its minimum with min(…, 100%), every flex and grid child can shrink, no primitive hardcodes a width, and no selector hides a var() where the parser needs a literal.',
    unit: (r) => (r.pass ? 'ok' : 'fail'),
  },
];

export const gates = {
  all: rows,
  byKind: (kind: GateKind) => rows.filter((r) => r.kind === kind),
  total: rows.length,
  passing: rows.filter((r) => r.pass).length,
  failing: rows.filter((r) => !r.pass),
  generatedAt: audit.generatedAt as string,
  errors: (audit.errors as unknown[]).length,
  warnings: (audit.warnings as unknown[]).length,
  counts: audit.counts as {
    colorPrimitives: number;
    numberPrimitives: number;
    semanticPerMode: number;
    typeSteps: number;
    unusedPrimitives: number;
  },
};

/** The tightest passing result in a family — the one that would break first.
 *  More useful on a verification page than the worst overall, because everything
 *  passes; what a reviewer wants is the margin. */
export function closest(kind: GateKind, n = 5): GateRow[] {
  return gates
    .byKind(kind)
    .filter((r) => r.pass && r.min > 0)
    .map((r) => ({ r, margin: r.ratio / r.min }))
    .sort((a, b) => a.margin - b.margin)
    .slice(0, n)
    .map((x) => x.r);
}

/** Human label for a gate row, whichever shape it is. */
export function subject(r: GateRow): string {
  if (r.token) return r.token;
  if (r.fg && r.bg) return `${r.fg.replace(/^color\//, '')} on ${r.bg.replace(/^color\//, '')}`;
  return r.fg ?? r.bg ?? '—';
}
