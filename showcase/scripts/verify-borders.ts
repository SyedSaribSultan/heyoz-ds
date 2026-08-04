/**
 * verify-borders.ts — the stroke policy, enforced.
 *
 * A border does exactly one of four jobs and only two of them need a stroke. See
 * `BorderJob` in lib/core/types.ts for the full argument; the short version is that
 * separation has a cheaper answer (a surface step, or space) and elevation has a
 * better one (shadow in light, surface lightness in dark).
 *
 * WHY THIS IS A SWEEP AND NOT A TYPE. `borderJob` cannot be a required field on
 * VariantBinding, because a border may be bound on any of five state objects and
 * TypeScript has no way to say "required if any of these five sub-objects has a
 * `border` key". So the type makes it available and this makes it mandatory —
 * exactly the arrangement `focus` would have if it were conditional, and the same
 * one `verify-motion.ts` uses for literal transforms.
 *
 * WHAT IT PREVENTS. At the start of this work the showcase had 39 border
 * declarations, every one at `border/primary`, and the page read as boxes inside
 * boxes inside boxes. The bindings alone were 34. Almost all of them were
 * separation — a card outlined against a page it already differed from, a badge
 * outlined on top of its own status tint, an alert doing the same. Nothing stopped
 * any of them, because a border is the easiest thing in CSS to add and the hardest
 * to argue against one at a time.
 *
 * The count is now 21 and this file is why it stays there.
 *
 * It was 19 for a few hours, and the difference is instructive: card/interactive was
 * stripped along with the other three variants and had to be given back. Its border is
 * affordance — the whole card is one target and the boundary is what says so, the same
 * argument button/secondary wins — and in light mode fill/elevated-hover and
 * surface/primary are byte-identical, so removing it took one of the only three signals
 * the hover has. This gate counted the bindings correctly both times; what it cannot
 * check is whether the job named is the right one.
 */

import { allRecipes } from '../lib/recipes';
import { report } from './report';
import type { BorderJob, StateName, TokenBinding, VariantBinding } from '../lib/core/types';

const FAIL: string[] = [];

/** The only two jobs that may reach for a stroke. */
const LEGAL: BorderJob[] = ['affordance', 'state'];

const ADVICE: Record<BorderJob, string> = {
  affordance: '',
  state: '',
  separation:
    'use a surface step or space — surface/primary already differs from the page by ΔL 2.9 in light and 6.6 in dark',
  elevation:
    'use shadow in light and surface lightness in dark — the ladder carries elevation since DECISIONS B18, which is what freed these borders',
};

const STATES: StateName[] = ['base', 'hover', 'active', 'disabled', 'selected'];

type Row = { component: string; variant: string; job: string; tokens: string[] };
const rows: Row[] = [];
let totalBindings = 0;

for (const recipe of allRecipes) {
  const id = recipe.meta.id;

  for (const variant of recipe.variants) {
    /* `bindings` is protected, which is correct — nothing outside the recipe should
     * be composing appearance from it. A verification sweep is the one legitimate
     * reader, and it reads rather than writes. */
    const b = (recipe as unknown as { bindings: Record<string, VariantBinding> }).bindings[variant];
    if (!b) continue;

    const bound: string[] = [];
    for (const state of STATES) {
      /* Through `unknown`, because VariantBinding also carries `focus`, `intent` and
       * `borderJob`, so it does not structurally overlap a map of TokenBindings and
       * TypeScript is right to say so. The index is safe: `state` comes from STATES,
       * every member of which is a real optional key on the type. */
      const binding: TokenBinding | undefined =
        state === 'base'
          ? b.base
          : (b as unknown as Record<string, TokenBinding | undefined>)[state];
      if (binding?.border) bound.push(`${state}:${binding.border}`);
    }

    if (bound.length === 0) {
      /* A variant with no border must not claim a job. A stale declaration is the
       * same failure mode as a stale exemption in STATE_TRANSFORMS: it reads as
       * justified where nothing is happening, and it survives the change that made
       * it meaningless. */
      if (b.borderJob) {
        FAIL.push(
          `${id}/${variant}: declares borderJob '${b.borderJob}' but binds no border — delete the declaration`,
        );
      }
      continue;
    }

    totalBindings += bound.length;

    if (!b.borderJob) {
      FAIL.push(
        `${id}/${variant}: binds a border (${bound.join(', ')}) and declares no borderJob. ` +
          `Say what the stroke is for — only 'affordance' and 'state' are legal.`,
      );
      continue;
    }

    if (!LEGAL.includes(b.borderJob)) {
      FAIL.push(
        `${id}/${variant}: borderJob '${b.borderJob}' is not a reason to draw a stroke — ${ADVICE[b.borderJob]}`,
      );
      continue;
    }

    rows.push({ component: id, variant, job: b.borderJob, tokens: bound });
  }
}

/* ---- report ---- */

const w = (s: string, n: number) => s.padEnd(n);
console.log(`\n${rows.length} variants carry a border · ${totalBindings} bindings in total\n`);
console.log(`  ${w('component', 12)}${w('variant', 16)}${w('job', 13)}bindings`);
for (const r of rows) {
  console.log(`  ${w(r.component, 12)}${w(r.variant, 16)}${w(r.job, 13)}${r.tokens.length}`);
}

const byJob = rows.reduce<Record<string, number>>((a, r) => {
  a[r.job] = (a[r.job] ?? 0) + r.tokens.length;
  return a;
}, {});
console.log(
  `\n  ${Object.entries(byJob)
    .map(([k, v]) => `${v} ${k}`)
    .join(' · ')} — and nothing for separation or elevation`,
);

report({
  suite: 'borders',
  blurb:
    'Every stroke declares the job it does, and that job is affordance or state. ' +
    'Separation and elevation are build errors, not style choices.',
  passed: rows.length - FAIL.length,
  total: rows.length,
  detail: [
    `${rows.length} variants carry a border · ${totalBindings} bindings in total`,
    `${Object.entries(byJob)
      .map(([k, v]) => `${v} ${k}`)
      .join(' · ')} — nothing for separation or elevation`,
  ],
  ok: FAIL.length === 0,
});

if (FAIL.length) {
  console.error(`\nFAILED — ${FAIL.length} stroke problem${FAIL.length === 1 ? '' : 's'}:\n`);
  for (const f of FAIL) console.error(`  x ${f}`);
  console.error('');
  process.exit(1);
}

console.log('\nOK — every stroke in the system is an affordance or a state.\n');
