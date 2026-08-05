/**
 * verify-coverage.ts — every semantic token group must be demonstrated somewhere.
 *
 * The gap this closes was found by reading the token list against the page and
 * noticing that fourteen shipped tokens are drawn nowhere: `chart-1` through
 * `chart-5`, and nine `gradient-*`. The build gates them — the five chart series
 * carry twenty greyscale assertions on lightness separation so they survive
 * greyscale printing and red-green deficiency — and then nothing renders them, so
 * the one thing those gates are protecting has never been looked at.
 *
 * That is a specific failure and not a tidy-up. A token nobody draws is a token
 * whose gate is unfalsifiable in practice: it passes, and no reviewer can say
 * whether passing means what it should. It is also how the greyscale argument gets
 * lost — the next person to add a sixth chart series has no page to check it on.
 *
 * The rule is deliberately weak: a group must appear SOMEWHERE in the rendered
 * source, not that every member is used by a component. `gradient/onboarding-*` is
 * for an onboarding flow this system does not contain, so demanding a consumer would
 * demand inventing one. Demanding a specimen is fair.
 *
 * Companion to verify-classes.mjs, which asks the opposite question — that every
 * class the page uses has a rule. This asks that every token the build ships has a
 * page.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { report } from './report';
import { allRecipes } from '../lib/recipes';
import { GROUP_ORDER } from '../lib/core/Recipe';

const audit = JSON.parse(readFileSync('../reports/audit.json', 'utf8')) as {
  light: Record<string, unknown>;
};

/** Every semantic colour group the build emits, from the audit rather than from a
 *  list here — a group added to spec.mjs is covered by this check on its next run,
 *  which is the property a hand-maintained list would lose. */
const groups = new Set<string>();
for (const path of Object.keys(audit.light)) {
  const m = /^color\/([a-z-]+)\//.exec(path);
  if (m) groups.add(m[1]);
  else if (/^color\/[a-z-]+$/.test(path)) groups.add(path.replace('color/', ''));
}

/** Groups exempt from needing a specimen, each with the reason.
 *
 *  An exemption written down beats a hole — the same principle COLLISION_ASSERTIONS
 *  and STATE_TRANSFORMS run on. A group listed here that later becomes covered is
 *  itself a failure, so the list cannot rot. */
const EXEMPT: Record<string, string> = {
  background: 'the page itself — every screenshot is a specimen of it',
  sidebar: 'demonstrated by the Assembled screen, which is a real sidebar rather than a swatch',
};

const SOURCE_DIRS = ['components', 'app', 'lib'];

/** Written guidance is excluded, and that exclusion is the difference between this
 *  check working and not.
 *
 *  `lib/content/pages/*.json` is prose ABOUT the system. Badge's page argues about
 *  the chart series' greyscale gate and quotes `color/chart/` doing it — so with the
 *  content included, `chart` reported as demonstrated while nothing on any page drew
 *  a single series. Discussing a token is the opposite of demonstrating it: it is
 *  precisely the state this gate exists to catch, so counting it as coverage made
 *  the check certify the bug. */
const EXCLUDE = /[/\\]content[/\\]pages[/\\]/;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(tsx?|css|json)$/.test(name) && !EXCLUDE.test(p)) out.push(p);
  }
  return out;
}

const source = SOURCE_DIRS.flatMap(walk)
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

const FAIL: string[] = [];
const covered: string[] = [];
const exempted: string[] = [];

for (const group of [...groups].sort()) {
  if (EXEMPT[group]) {
    exempted.push(group);
    continue;
  }
  /* A USAGE, not a mention. The first version of this check tested for the bare
   * word and passed everything — `chart` and `gradient` both appear in prose
   * ("spectrum-* is the chart and gradient palette") while nothing on the page draws
   * either, so the gate reported six of six covered and the two groups it was
   * written to catch sailed through it. A check that cannot fail is worse than no
   * check, because it is also a claim.
   *
   * Three things count, and all three are the token actually reaching the DOM:
   *   bg-chart-1 / text-chart-1 / from-gradient-mesh-1   a Tailwind utility
   *   var(--oz-color-chart-1)                            a custom property
   *   color/chart/1                                      a path resolved at runtime
   */
  const UTILITY = new RegExp(
    `\\b(?:bg|text|border|fill|stroke|shadow|from|via|to|ring|outline|decoration|accent)-${group}-`,
  );
  const CSS_VAR = new RegExp(`--oz-color-${group}-`);
  const TOKEN_PATH = new RegExp(`['"\`]color/${group}/`);

  const hit = UTILITY.test(source) || CSS_VAR.test(source) || TOKEN_PATH.test(source);

  if (hit) covered.push(group);
  else FAIL.push(`color/${group}/* ships and is drawn nowhere in the showcase`);
}

/* ---------------------------------------------------------------------------
 * Raw layout where a primitive already exists.
 *
 * `dist/layout.css` ships eight container-aware primitives, each carrying the guard
 * that stops the failure it exists for — most importantly `min-width: 0` on flex and
 * grid children, which is the most common overflow in CSS and the one nobody
 * remembers.
 *
 * They sat almost unused for a while, and the reason turned out to be ergonomics
 * rather than doubt. Setting the gap meant an inline custom property, which is more
 * to type than `flex flex-col gap-space-4` — so people wrote the Tailwind, and lost
 * the guard every time. A safety feature that costs more to type than the unsafe
 * version is a safety feature nobody uses. The `.oz-stack-4` step modifiers closed
 * that gap; this stops the habit returning.
 *
 * Scoped to shapes a primitive genuinely replaces. `flex items-center` with no gap is
 * alignment rather than a stack and is left alone — a gate that flags things with no
 * replacement is a gate people learn to ignore.
 * ------------------------------------------------------------------------- */
const RAW_LAYOUT: Array<{ pattern: RegExp; use: string }> = [
  { pattern: /\bflex flex-col gap-space-\d+/g, use: 'oz-stack oz-stack-N' },
  { pattern: /\bflex flex-wrap items-center gap-space-\d+/g, use: 'oz-cluster oz-cluster-N' },
];

for (const file of SOURCE_DIRS.flatMap(walk)) {
  if (!file.endsWith('.tsx')) continue;
  const text = readFileSync(file, 'utf8');
  for (const { pattern, use } of RAW_LAYOUT) {
    for (const m of text.matchAll(pattern)) {
      FAIL.push(`${file}: \`${m[0]}\` — use \`${use}\`, which also sets min-width:0 on the children`);
    }
  }
}

/* An exemption that stopped being needed should be deleted rather than left. */
for (const [group, reason] of Object.entries(EXEMPT)) {
  if (!groups.has(group)) {
    FAIL.push(`EXEMPT lists '${group}' (${reason}) but no such token group exists any more`);
  }
}

/* ---------------------------------------------------------------------------
 * Component families: every group in GROUP_ORDER has at least one member.
 *
 * `registry.byGroup` drops an empty group rather than rendering a heading with nothing under
 * it, which is right for the page and is exactly what makes the rot invisible: a family that
 * has been renamed, or emptied by its last component moving elsewhere, leaves a live entry in
 * GROUP_ORDER that nobody ever sees and so nobody deletes.
 *
 * Checked here against the RECIPES rather than the registry, for the same reason
 * verify-contrast iterates `allRecipes`: pointing a Node script at the registry would drag the
 * JSX demos into it, and would only check families whose components somebody remembered to
 * register. The typed `ComponentGroup` union already guarantees the other direction — a
 * component cannot carry a family that does not exist, because it would not compile.
 *
 * Same self-cleaning shape as STATE_TRANSFORMS in verify-motion, TALL_SPECIMENS in the visual
 * suite, and KNOWN in verify-composite. A stale entry is a failure, not dead weight.
 * ------------------------------------------------------------------------- */
const declared = GROUP_ORDER.map((g) => g.id);
const claimed = new Set(allRecipes.map((r) => r.meta.group));

for (const id of declared) {
  if (!claimed.has(id)) {
    FAIL.push(
      `GROUP_ORDER declares the '${id}' family and no component belongs to it — ` +
        `byGroup drops it silently, so delete the entry or give it a member`,
    );
  }
}

const families = declared
  .map((id) => `${id} ${allRecipes.filter((r) => r.meta.group === id).length}`)
  .join(' · ');
console.log(`\n${declared.length} component families · ${allRecipes.length} components\n`);
console.log(`  ${families}`);

console.log(`\n${groups.size} semantic colour groups · ${covered.length} demonstrated\n`);
console.log(`  ${covered.join(', ')}`);
if (exempted.length) {
  console.log(`\n  exempt: ${exempted.map((g) => `${g} — ${EXEMPT[g]}`).join('\n          ')}`);
}

report({
  suite: 'coverage',
  blurb:
    'Every semantic colour group the build ships is drawn somewhere, every layout primitive is ' +
    'used where one exists, and every declared component family has a member. A gated token ' +
    'nobody renders is a gate nobody can falsify.',
  passed: covered.length,
  total: groups.size,
  detail: [
    `${groups.size} semantic colour groups · ${covered.length} demonstrated`,
    `${declared.length} component families · ${allRecipes.length} components`,
    exempted.length ? `exempt: ${exempted.join(', ')}` : 'no exemptions',
  ],
  ok: FAIL.length === 0,
});

if (FAIL.length) {
  /* Deliberately generic. This suite checks three unrelated things now — token specimens,
   * raw layout, and empty component families — and they share one FAIL array. The summary
   * used to read "N groups with no specimen" and print token advice underneath, which was
   * confidently wrong the first time a families failure came through it: the message named
   * the wrong problem and prescribed a fix that did not apply. Each entry already carries its
   * own remedy, so the header should count problems and get out of the way. */
  console.error(`\nFAILED — ${FAIL.length} problem${FAIL.length === 1 ? '' : 's'}:\n`);
  for (const f of FAIL) console.error(`  x ${f}`);
  console.error('');
  process.exit(1);
}

console.log(
  '\nOK — every semantic group is demonstrated, every primitive-shaped layout uses its\n' +
    '     primitive, and every declared component family has a member.\n',
);
