/* Gate check for the component layer.
 *
 * The token build gates 188 pairs, but it gates *tokens*, not *pairings*. A recipe
 * creates new pairings: putting content/primary on surface/critical is a decision
 * this layer makes, and build/spec.mjs has no way to know it happened. CLAUDE.md
 * rule 4 is about exactly this failure — "every contrast bug this repo has had came
 * from gating one member of a group" — so the components need their own sweep rather
 * than an assumption that the token gates cover them.
 *
 * What it does: for every variant and state of every registered recipe, take the
 * bound foreground and background, resolve both in both modes, and measure.
 *
 * Two metrics, applied the way DECISIONS.md H1 requires:
 *
 *   - Normal pairs are gated on WCAG 2.x, 4.5:1 for text.
 *   - Pairs whose foreground is a content/on-* token are gated on APCA Lc 60 and
 *     NOT on the WCAG ratio. White on the orange fill measures 3.55:1 and is
 *     correct: WCAG 2.x has no polarity term so it prefers near-black on any fill
 *     lighter than #767676, and an earlier revision of this repo "fixed" that and
 *     shipped a near-black label on the destructive button. Do not change this
 *     without reading H1 in full.
 *
 * Usage:  npx tsx scripts/verify-contrast.ts
 */

import { allRecipes } from '../lib/recipes';
import { resolve, resolveRole } from '../lib/core/audit';
import type { Mode, StateName, TokenBinding } from '../lib/core/types';
import { report } from './report';

/* -- metrics -------------------------------------------------------------- */

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

/** APCA W3 0.1.9, matching apca() in build/palette.mjs. */
function apcaLc(txt: string, bg: string): number {
  const y = (hex: string) => {
    const c = [1, 3, 5].map((i) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.4));
    return 0.2126729 * c[0] + 0.7151522 * c[1] + 0.072175 * c[2];
  };
  const clamp = (Y: number) => (Y > 0.022 ? Y : Y + Math.pow(0.022 - Y, 1.414));
  const Yt = clamp(y(txt));
  const Yb = clamp(y(bg));
  let C: number;
  if (Yb > Yt) {
    const S = (Math.pow(Yb, 0.56) - Math.pow(Yt, 0.57)) * 1.14;
    C = S < 0.1 ? 0 : S - 0.027;
  } else {
    const S = (Math.pow(Yb, 0.65) - Math.pow(Yt, 0.62)) * 1.14;
    C = S > -0.1 ? 0 : S + 0.027;
  }
  return Math.abs(C * 100);
}

/** Flatten a translucent token over the page, the way it actually composites. */
function flatten(token: { hex: string; alpha: number }, page: string): string {
  if (token.alpha >= 1) return token.hex;
  const out = [1, 3, 5].map((i) =>
    Math.round(
      parseInt(token.hex.slice(i, i + 2), 16) * token.alpha +
        parseInt(page.slice(i, i + 2), 16) * (1 - token.alpha),
    ),
  );
  return '#' + out.map((c) => c.toString(16).padStart(2, '0').toUpperCase()).join('');
}

/* -- sweep ---------------------------------------------------------------- */

type Finding = {
  component: string;
  variant: string;
  state: StateName;
  mode: Mode;
  fg: string;
  bg: string;
  metric: 'wcag' | 'apca';
  measured: number;
  min: number;
  pass: boolean;
};

const findings: Finding[] = [];
const unresolved: string[] = [];

for (const recipe of allRecipes) {

  /* Rule 2 at the component layer: every token a recipe names must exist. A typo
   * here would otherwise surface as one silently unstyled state. Resolution is
   * role-aware — a shadow token is named by elevation step and lives outside the
   * colour namespace. */
  for (const { role, token } of recipe.bindingRoles) {
    for (const mode of ['light', 'dark'] as Mode[]) {
      if (token === 'transparent') continue;
      if (!resolveRole(role, token, mode)) {
        unresolved.push(`${recipe.id}: ${role}=${token} (${mode})`);
      }
    }
  }

  /* eslint-disable @typescript-eslint/no-explicit-any -- bindings are protected by
     design; the sweep is the one legitimate reader of the raw table. */
  const bindings = (recipe as any).bindings as Record<string, Record<string, unknown>>;

  for (const variant of recipe.variants) {
    const b = bindings[variant];
    for (const state of recipe.statesFor(variant)) {
      const own = (state === 'base' ? b.base : b[state]) as TokenBinding | undefined;
      if (!own) continue;
      const merged: TokenBinding = { ...(b.base as TokenBinding), ...own };
      if (!merged.fg || !merged.bg) continue;

      for (const mode of ['light', 'dark'] as Mode[]) {
        const page = resolve('background', mode)!.hex;
        const fgT = resolve(merged.fg, mode);
        const bgT = merged.bg === 'transparent' ? { hex: page, alpha: 1 } : resolve(merged.bg, mode);
        if (!fgT || !bgT) continue;

        const fg = flatten(fgT, page);
        const bg = flatten(bgT, page);

        /* Disabled text is exempt from the 4.5 floor by WCAG 1.4.3, and this system
         * expresses disabled as a 50%-alpha token, so measuring it against the same
         * floor would fail every disabled state by construction. Recorded, not gated. */
        const exempt = state === 'disabled';
        const onFill = merged.fg.startsWith('content-on-');

        if (onFill) {
          const lc = apcaLc(fg, bg);
          findings.push({
            component: recipe.id,
            variant,
            state,
            mode,
            fg: merged.fg,
            bg: merged.bg,
            metric: 'apca',
            measured: lc,
            min: 60,
            pass: exempt || lc >= 60,
          });
        } else {
          const ratio = wcag(fg, bg);
          findings.push({
            component: recipe.id,
            variant,
            state,
            mode,
            fg: merged.fg,
            bg: merged.bg,
            metric: 'wcag',
            measured: ratio,
            min: 4.5,
            pass: exempt || ratio >= 4.5,
          });
        }
      }
    }
  }
}

/* -- report --------------------------------------------------------------- */

const failed = findings.filter((f) => !f.pass);
const fmt = (f: Finding) =>
  `${f.component}/${f.variant} ${f.state} (${f.mode}): ${f.fg} on ${f.bg} = ` +
  (f.metric === 'apca' ? `Lc ${f.measured.toFixed(1)}, need Lc ${f.min}` : `${f.measured.toFixed(2)}:1, need ${f.min}`);

console.log(`${allRecipes.length} components · ${findings.length} foreground/background pairings measured`);
console.log(
  `  wcag ${findings.filter((f) => f.metric === 'wcag').length} · ` +
    `apca ${findings.filter((f) => f.metric === 'apca').length}`,
);

if (unresolved.length) {
  console.error(`\n${unresolved.length} token name(s) do not resolve:\n`);
  for (const u of unresolved) console.error(`  ${u}`);
}

if (failed.length) {
  console.error(`\n${failed.length} pairing(s) below their floor:\n`);
  for (const f of failed) console.error(`  ${fmt(f)}`);
  console.error(
    '\nMove the content token one ramp step in the recipe. Do not lower the floor and do\n' +
      'not switch an on-fill pair to near-black — see DECISIONS.md H1.',
  );
}

/* The tightest passing pairs, because a pair at 4.52:1 is a pair that will fail the
 * next time a ramp step moves. Worth seeing even on a green run. */
const tight = findings
  .filter((f) => f.pass && f.state !== 'disabled')
  .sort((a, b) => a.measured / a.min - b.measured / b.min)
  .slice(0, 5);

console.log('\nclosest to their floor:');
for (const f of tight) console.log(`  ${fmt(f).replace(', need', ' · floor')}`);

report({
  suite: 'contrast',
  blurb:
    'Every foreground/background pairing the recipes create, resolved in both modes and ' +
    'measured — WCAG 4.5:1 for normal pairs, APCA Lc 60 for on-fill pairs per DECISIONS H1.',
  passed: findings.filter((f) => f.pass).length,
  total: findings.length,
  detail: [
    `${allRecipes.length} components · ${findings.length} pairings measured in both modes`,
    tight.length ? `tightest passing: ${fmt(tight[0]).replace(', need', ' · floor')}` : 'no passing pairs to rank',
  ],
  ok: unresolved.length === 0 && failed.length === 0,
});

if (unresolved.length || failed.length) process.exit(1);
console.log('\nOK — every pairing the recipes create clears its floor.');
