/**
 * verify-composite.ts — contrast against a ground that is not a token.
 *
 * THE GAP THIS EXISTS FOR. `verify-contrast.ts` measures a foreground token against a
 * background TOKEN. That is the right check and it catches most things, but two shapes of
 * background are not tokens and both are in daily use:
 *
 *   1. A SURFACE THE COMPONENT DOES NOT PAINT. A Field's error message, a status line, a
 *      link — all of them are text on whatever surface they were dropped onto. There is no
 *      `bg` in the binding, so the sweep skips the pairing entirely (see the `!merged.bg`
 *      guard). The token layer gates these against the page and, for some tokens, against
 *      some of the ladder. Nobody ever gated the accents against the top two rungs.
 *
 *   2. A TRANSLUCENT FILL. `fill/selected` is brand at 15% alpha. Its resolved colour is a
 *      function of what is underneath it, so "text on fill/selected" has as many answers as
 *      there are surfaces it can sit on. verify-contrast flattens it over the PAGE, which
 *      is one of those answers and the most flattering one.
 *
 * `verify-glow.ts` was written for the third member of this family — text over a gradient —
 * and its header makes the same argument. This is that argument applied to the two cases a
 * gradient is not.
 *
 * WHY IT RECORDS RATHER THAN FAILS, for now. It found twelve real failures on its first
 * run: all six accent content tokens are under 4.5:1 on `surface/elevated` and
 * `surface/overlay` in dark, 3.89–4.08:1. Fixing them means moving six tokens one ramp step
 * in `spec.mjs`, which repaints every accent in dark — including `content/brand`, which is
 * the accent word in the `/ai-ugc` headline and the tightest margin in `verify-glow` at
 * 5.01:1. That is a deliberate design decision with a real blast radius, not a drive-by, and
 * it is recorded in DECISIONS.md §G.
 *
 * So `ENFORCING = false` and the twelve known failures are listed in `KNOWN` with their
 * measured values. The gate still fails on:
 *
 *   - a NEW pairing dropping below the floor (anything not in KNOWN)
 *   - a KNOWN pairing getting WORSE than its recorded value
 *   - a KNOWN pairing that now PASSES, because a fixed entry left in the list is how a list
 *     rots into fiction
 *
 * That last one is what makes this a ratchet instead of a to-do. When `spec.mjs` moves,
 * this gate says so — and the last of the twelve to clear is the signal to set ENFORCING
 * to true and delete KNOWN.
 *
 * Usage:  npx tsx scripts/verify-composite.ts
 */

import { readFileSync } from 'node:fs';
import { report } from './report';

/** Flip to true once KNOWN is empty. See the header. */
const ENFORCING = false;

const audit = JSON.parse(readFileSync('../reports/audit.json', 'utf8')) as {
  light: Record<string, { hex: string; alpha?: number } | string>;
  dark: Record<string, { hex: string; alpha?: number } | string>;
};

type Mode = 'light' | 'dark';

/* -- metrics --------------------------------------------------------------- */

const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const chan = (hex: string, i: number) => parseInt(hex.slice(i, i + 2), 16) / 255;

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => lin(chan(hex, i)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function wcag(a: string, b: string): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function tok(mode: Mode, path: string): { hex: string; alpha: number } | null {
  const t = audit[mode][`color/${path}`];
  if (!t) return null;
  if (typeof t === 'string') return { hex: t, alpha: 1 };
  return { hex: t.hex, alpha: t.alpha ?? 1 };
}

/** Composite `fg` over an already-opaque `bg`. The whole point of this file. */
function over(fg: { hex: string; alpha: number }, bg: string): string {
  if (fg.alpha >= 1) return fg.hex;
  const out = [1, 3, 5].map((i) =>
    Math.round(
      parseInt(fg.hex.slice(i, i + 2), 16) * fg.alpha +
        parseInt(bg.slice(i, i + 2), 16) * (1 - fg.alpha),
    ),
  );
  return '#' + out.map((c) => c.toString(16).padStart(2, '0').toUpperCase()).join('');
}

/* -- the matrix ------------------------------------------------------------ */

/**
 * Every rung a component can legally be dropped onto.
 *
 * `surface/elevated` and `surface/overlay` are the same value in both modes and both are
 * listed anyway, because they are different *decisions* — Dialog reaches for overlay and
 * Card/overlay reaches for elevated — and a reader looking for "is a dialog safe" should
 * find the row rather than have to know they are byte-identical.
 */
const SURFACES = [
  'background',
  'surface/primary',
  'surface/secondary',
  'surface/tertiary',
  'surface/elevated',
  'surface/overlay',
] as const;

/**
 * Foregrounds that appear on a surface the component does not paint.
 *
 * Not every content token — only the ones a component legitimately puts on an unknown
 * ground. `content/on-brand` is absent because it exists solely to sit on a known fill, and
 * measuring it against the page would be asserting something nobody claims.
 */
const FLOATING_TEXT = [
  'content/primary',
  'content/secondary',
  'content/tertiary',
  'content/brand',
  'content/brand-hover',
  'content/success',
  'content/success-hover',
  'content/warning',
  'content/warning-hover',
  'content/critical',
  'content/critical-hover',
  'content/info',
  'content/info-hover',
  'content/link',
] as const;

/**
 * Translucent fills, and the text that lands on them.
 *
 * These are the pairings verify-contrast measures over the page and that change value on
 * every other rung. `fill/selected` is the one that bit: 6.08:1 over the page and 3.55:1
 * over a panel, for the token pair named for each other.
 */
const ALPHA_FILLS: Array<{ fill: string; on: readonly string[] }> = [
  {
    fill: 'fill/selected',
    /* content/tertiary belongs here and was missing from the first draft of this list — so
     * the KNOWN entry for it measured nothing, and the self-cleaning check below is what
     * said so. A description line on a selected row is the commonest use of tertiary on a
     * wash, which makes it the one that most needed measuring. */
    on: [
      'content/primary',
      'content/secondary',
      'content/tertiary',
      'content/selected',
      'content/brand-hover',
    ],
  },
  { fill: 'fill/elevated-hover', on: ['content/primary', 'content/secondary', 'content/tertiary'] },
  /* All five status washes, each carrying the matching `-hover` content step.
   *
   * These are Avatar's five initials grounds and Menu's destructive hover row, and they are
   * the tightest family in the system: over `surface/elevated` in dark they land at 4.51 to
   * 4.88, so four of the five sit within 0.4 of the floor. None of that is visible to
   * `verify:contrast`, which flattens the wash over the page and reports 6–8:1.
   *
   * `content/critical-active` is listed alongside `critical-hover` because Menu's hover row
   * needs the extra step — `critical-hover` there is 4.51:1, over the floor by 0.01, which is
   * a coincidence and not a margin. Listing both keeps the tight one on the report. */
  { fill: 'fill/brand-secondary', on: ['content/brand-hover', 'content/primary'] },
  { fill: 'fill/success-secondary', on: ['content/success-hover', 'content/primary'] },
  { fill: 'fill/warning-secondary', on: ['content/warning-hover', 'content/primary'] },
  { fill: 'fill/info-secondary', on: ['content/info-hover', 'content/primary'] },
  {
    fill: 'fill/critical-secondary',
    on: ['content/critical-hover', 'content/critical-active', 'content/primary'],
  },
];

const FLOOR = 4.5;

type Finding = {
  key: string;
  kind: 'floating-text' | 'alpha-fill';
  mode: Mode;
  fg: string;
  ground: string;
  resolvedGround: string;
  ratio: number;
  pass: boolean;
};

/**
 * The twelve pairings that are below the floor today, with their measured values.
 *
 * Every entry is a real defect and every one is recorded in DECISIONS.md §G. The value is
 * the floor for THIS pair until the tokens move: worse than this fails, better than this
 * fails as a stale entry. Recomputed against `reports/audit.json`, not typed from memory.
 */
const KNOWN: Record<string, number> = {
  'dark content/brand on surface/elevated': 4.02,
  'dark content/brand on surface/overlay': 4.02,
  'dark content/success on surface/elevated': 4.08,
  'dark content/success on surface/overlay': 4.08,
  'dark content/warning on surface/elevated': 3.93,
  'dark content/warning on surface/overlay': 3.93,
  'dark content/critical on surface/elevated': 3.89,
  'dark content/critical on surface/overlay': 3.89,
  'dark content/info on surface/elevated': 3.89,
  'dark content/info on surface/overlay': 3.89,
  'dark content/link on surface/elevated': 4.02,
  'dark content/link on surface/overlay': 4.02,

  /* The alpha-fill case, and the reason this file measures composites at all.
   *
   * Note `surface/tertiary` in the list. The wash fails on a HOVER ROW too, not only on a
   * dialog — a case the hand sweep that started this work missed entirely, because it only
   * looked at the top two rungs. This gate found it on its first run, which is the argument
   * for the gate existing rather than for a note in a recipe. */
  'dark content/selected on fill/selected over surface/tertiary': 4.07,
  'dark content/selected on fill/selected over surface/elevated': 3.55,
  'dark content/selected on fill/selected over surface/overlay': 3.55,
  'dark content/tertiary on fill/selected over surface/elevated': 4.36,
  'dark content/tertiary on fill/selected over surface/overlay': 4.36,

  /* THE ONLY ENTRY THAT IS NOT DARK-ONLY, and it deserves the attention that makes it.
   *
   * Every other failure in this list is a dark-mode problem caused by the top of the surface
   * ladder being light. This one is the mirror image: in LIGHT, `fill/selected` over
   * `surface/tertiary` composites to #E1C9C3 — a mid pink — and `content/tertiary` is a mid
   * grey, so the two meet in the middle at 4.16:1. Neither is near a boundary; they simply
   * have nowhere to be far apart.
   *
   * It matters because it kills the tempting one-line fix for everything above. "Move the
   * accents one step in dark" does nothing here: this is neither an accent nor dark. A
   * selected row with a description on it needs `content/secondary` in both modes, which is
   * what listbox.recipe.ts already binds — for the dark reason, before this was known. */
  'light content/tertiary on fill/selected over surface/tertiary': 4.16,
};

/* Four entries were in the first draft of KNOWN and are not here, and both kinds of mistake
 * are worth recording because the gate caught both rather than a reviewer:
 *
 *   content/brand-hover on fill/selected (elevated, overlay) — measures 4.54:1 and PASSES.
 *     Typed in from a sweep that had measured something else. A passing pair in a known-bad
 *     list is a permanent false alarm.
 *   content/tertiary on fill/selected (elevated, overlay) — measured NOTHING, because
 *     content/tertiary was missing from that fill's `on` list. A known-bad entry pointing at
 *     a pairing nobody measures is the worst of the two: it reads as coverage.
 *
 * Both are why the self-cleaning half of this gate is not decoration. */

const findings: Finding[] = [];
const unresolved: string[] = [];

for (const mode of ['light', 'dark'] as Mode[]) {
  const page = tok(mode, 'background')!.hex;

  /* -- case 1: text on a surface the component does not paint -------------- */
  for (const fg of FLOATING_TEXT) {
    const f = tok(mode, fg);
    if (!f) {
      unresolved.push(`${fg} (${mode})`);
      continue;
    }
    for (const s of SURFACES) {
      const bgT = tok(mode, s);
      if (!bgT) {
        unresolved.push(`${s} (${mode})`);
        continue;
      }
      const ground = over(bgT, page);
      const ratio = wcag(over(f, ground), ground);
      findings.push({
        key: `${mode} ${fg} on ${s}`,
        kind: 'floating-text',
        mode,
        fg,
        ground: s,
        resolvedGround: ground,
        ratio,
        pass: ratio >= FLOOR,
      });
    }
  }

  /* -- case 2: text on a translucent fill, over each legal surface --------- */
  for (const { fill, on } of ALPHA_FILLS) {
    const fillT = tok(mode, fill);
    if (!fillT) {
      unresolved.push(`${fill} (${mode})`);
      continue;
    }
    for (const s of SURFACES) {
      const surfT = tok(mode, s);
      if (!surfT) continue;
      /* Two composites, in order: the surface over the page, then the fill over that. A
       * translucent fill on a translucent surface is the case a single flatten gets wrong. */
      const surface = over(surfT, page);
      const ground = over(fillT, surface);

      for (const fg of on) {
        const f = tok(mode, fg);
        if (!f) {
          unresolved.push(`${fg} (${mode})`);
          continue;
        }
        const ratio = wcag(over(f, ground), ground);
        findings.push({
          key: `${mode} ${fg} on ${fill} over ${s}`,
          kind: 'alpha-fill',
          mode,
          fg,
          ground: `${fill} over ${s}`,
          resolvedGround: ground,
          ratio,
          pass: ratio >= FLOOR,
        });
      }
    }
  }
}

/* -- the ratchet ----------------------------------------------------------- */

const FAIL: string[] = [];
const below = findings.filter((f) => !f.pass);

for (const f of below) {
  const known = KNOWN[f.key];
  if (known === undefined) {
    FAIL.push(
      `NEW failure — ${f.key} = ${f.ratio.toFixed(2)}:1 on ${f.resolvedGround}, floor ${FLOOR}. ` +
        `Move the content token one ramp step; do not lower the floor and do not add it to KNOWN.`,
    );
    continue;
  }
  /* 0.01 of tolerance, because these are recorded to two decimals. */
  if (f.ratio < known - 0.01) {
    FAIL.push(
      `REGRESSED — ${f.key} was ${known.toFixed(2)}:1 and is now ${f.ratio.toFixed(2)}:1. ` +
        `A known-bad pairing is allowed to stay bad; it is not allowed to get worse.`,
    );
  }
}

/* A KNOWN entry that now passes is a fixed bug, and leaving it listed turns the list into
 * fiction. Same self-cleaning check STATE_TRANSFORMS and TALL_SPECIMENS carry. */
for (const key of Object.keys(KNOWN)) {
  const hit = findings.find((f) => f.key === key);
  if (!hit) {
    FAIL.push(`KNOWN lists '${key}' but nothing measures it any more — delete the entry`);
  } else if (hit.pass) {
    FAIL.push(
      `FIXED — ${key} now measures ${hit.ratio.toFixed(2)}:1 and clears the floor. ` +
        `Delete it from KNOWN. When KNOWN is empty, set ENFORCING = true.`,
    );
  }
}

if (ENFORCING) {
  for (const f of below) {
    if (KNOWN[f.key] !== undefined) {
      FAIL.push(`${f.key} = ${f.ratio.toFixed(2)}:1, floor ${FLOOR} (ENFORCING)`);
    }
  }
}

/* -- report ---------------------------------------------------------------- */

const passed = findings.filter((f) => f.pass).length;
const w = (s: string, n: number) => s.padEnd(n);

console.log(
  `\n${findings.length} composited pairings measured · ${passed} clear ${FLOOR}:1 · ${below.length} below\n`,
);

if (below.length) {
  console.log(`  ${w('pairing', 62)}${w('ground', 10)}${w('ratio', 8)}status`);
  for (const f of below.sort((a, b) => a.ratio - b.ratio)) {
    const known = KNOWN[f.key];
    console.log(
      `  ${w(f.key, 62)}${w(f.resolvedGround, 10)}${w(f.ratio.toFixed(2), 8)}${
        known === undefined ? 'NEW' : 'known — DECISIONS §G'
      }`,
    );
  }
}

/* The tightest PASSING pairs, for the same reason verify-contrast prints them: a pair at
 * 4.52:1 is a pair that fails the next time a ramp step moves. */
const tight = findings
  .filter((f) => f.pass)
  .sort((a, b) => a.ratio - b.ratio)
  .slice(0, 5);
console.log('\n  closest to the floor and still passing:');
for (const f of tight) console.log(`    ${w(f.key, 62)}${f.ratio.toFixed(2)}:1`);

if (unresolved.length) {
  console.error(`\n${unresolved.length} token(s) do not resolve:`);
  for (const u of [...new Set(unresolved)]) console.error(`  ${u}`);
}

report({
  suite: 'composite',
  blurb:
    'Contrast against grounds that are not tokens: text on a surface the component does not ' +
    'paint, and text on a translucent fill composited over every surface it can legally sit ' +
    'on. Records the 18 known-bad pairings from DECISIONS §G and fails on any new one, any ' +
    'regression, and any that is fixed but still listed.',
  passed,
  total: findings.length,
  detail: [
    `${findings.length} composited pairings · ${passed} clear ${FLOOR}:1`,
    ENFORCING
      ? 'enforcing'
      : `${Object.keys(KNOWN).length} known-bad, recorded not enforced — see DECISIONS §G`,
    tight.length ? `tightest passing: ${tight[0].key} at ${tight[0].ratio.toFixed(2)}:1` : '',
  ].filter(Boolean),
  ok: FAIL.length === 0,
});

if (FAIL.length) {
  console.error(`\nFAILED — ${FAIL.length} problem(s):\n`);
  for (const f of FAIL) console.error(`  x ${f}`);
  console.error('');
  process.exit(1);
}

console.log(
  `\nOK — no new composited failure, no regression, and every KNOWN entry still bad.` +
    (ENFORCING ? '' : `\n     ${Object.keys(KNOWN).length} recorded failures remain. See DECISIONS.md §G.\n`),
);
