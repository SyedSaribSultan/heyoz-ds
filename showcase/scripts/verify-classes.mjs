/* Missing-style detector.
 *
 * The recipes compose Tailwind class names at runtime — `bg-${binding.bg}` — which
 * means Tailwind's content scanner cannot see them and they only exist because of
 * the safelist patterns in tailwind.config.js. If a pattern or a variant is missing
 * from that list, the class is emitted into the HTML, matches no CSS rule, and the
 * component renders unstyled in exactly one state. That is a silent failure: the
 * build passes, the types pass, and the bug is only visible if someone happens to
 * hover the right variant.
 *
 * This closes that gap. It reads the prerendered HTML, collects every class actually
 * used, reads the compiled stylesheet, collects every class actually defined, and
 * reports the difference.
 *
 * There are two passes, because that first one has a blind spot it cannot fix: it can
 * only see markup that exists in a prerender. Anything that appears after a click —
 * a dialog, a menu, a toast — is absent from the HTML, so a dead class in it is
 * invisible to a diff of that HTML. Pass 2 is a static scan for the one dead-class
 * shape that needs no interaction to detect, and it exists because that blind spot hid
 * a real bug for a whole release: the Dialog's scrim.
 *
 * Usage, after `npm run build`:
 *   node scripts/verify-classes.mjs
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CSS_DIR = '.next/static/css';
const HTML = '.next/server/app/index.html';
const PRESET = '../dist/tailwind.tokens.js';
const SOURCE_DIRS = ['app', 'components', 'lib'];

/* Classes that legitimately have no CSS rule. Each needs a reason. */
const EXPECTED_UNSTYLED = new Set([
  'group', // Tailwind marker class, generates no rule of its own
  'peer', // ditto
  'dark', // mode hook, only ever a selector prefix
]);

function css() {
  const files = readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'));
  return files.map((f) => readFileSync(join(CSS_DIR, f), 'utf8')).join('\n');
}

/** Every class name that appears as a selector in the stylesheet. Escaped
 *  characters (`\:`, `\[`, `\/`) are unescaped so the set is comparable with what
 *  the HTML contains. */
function definedClasses(sheet) {
  const out = new Set();
  const re = /\.((?:[\w-]|\\.)+)/g;
  let m;
  while ((m = re.exec(sheet)) !== null) {
    out.add(m[1].replace(/\\(.)/g, '$1'));
  }
  return out;
}

/** Undo HTML entity encoding in an attribute value.
 *
 *  Load-bearing, and it was missing. A class attribute is serialised HTML, so an
 *  arbitrary variant like `[&>svg]:size-4` reaches the file as
 *  `[&amp;&gt;svg]:size-4` — while the stylesheet, correctly, contains
 *  `.\[\&\>svg\]\:size-4`. Comparing the two without decoding reports every such
 *  class as "used but never generated", which is a false failure that says the exact
 *  opposite of the truth: the rule is there and the check cannot see it.
 *
 *  That mattered as soon as a component sized a slotted icon — `[&>svg]:size-*` on
 *  Button, IconButton and ButtonLink — and it would have kept mattering for any
 *  `[&_p]:` or `[&:has(…)]:` variant. `&` is decoded last, so a literal `&amp;lt;`
 *  in the source does not get unwrapped twice. */
function decodeEntities(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function usedClasses(html) {
  const out = new Set();
  /* Both quoting styles: Next serialises class="…" but a hand-written island in the
   * app directory may use single quotes, and a class the check never reads is a class
   * the check cannot fail on. */
  const re = /class=(?:"([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    for (const c of decodeEntities(m[1] ?? m[2]).split(/\s+/)) {
      if (c) out.add(c);
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- *
 * Pass 2 — opacity modifiers on token colours.
 *
 * `bg-surface-page/70` and every class shaped like it generate NOTHING. Tailwind can
 * only apply an opacity modifier to a colour it can either parse or call: a function
 * taking `opacityValue`, or a string with an `<alpha-value>` slot. Every colour in the
 * preset is a bare `var(--oz-…)`, which is neither, so `withAlphaValue` returns the
 * default and the utility is never emitted. No warning, no error, no rule — and the
 * class sits in the markup looking correct.
 *
 * It is a source scan rather than a markup diff on purpose. That is the whole point:
 * the Dialog's scrim was `bg-content-fixed-primary/70` for a release, and pass 1 could
 * not see it because a modal is closed in a prerender. A grep of the source does not
 * care whether the state is reachable without a click.
 *
 * Comments are stripped before scanning, and that is load-bearing rather than tidy:
 * the one pre-existing mention of this pattern in the repo is the comment in Chrome.tsx
 * explaining why the header is opaque instead. A scanner that failed on the note
 * documenting the hazard would be worse than no scanner.
 * -------------------------------------------------------------------------- */

/** The token namespaces. Every one of these is generated into the preset as a bare
 *  `var(--oz-…)`, which is what makes the modifier dead — so the list is exact, not a
 *  heuristic, and pass 2 has no false positives to suppress. */
const TOKEN_NAMESPACE = '(?:content|surface|fill|border|sidebar|background|gradient)';
const UTILITY =
  '(?:bg|text|border|outline|ring|divide|from|via|to|placeholder|caret|accent|decoration|shadow)';
const DEAD_MODIFIER = new RegExp(
  String.raw`\b${UTILITY}-${TOKEN_NAMESPACE}[a-z0-9-]*\/\d{1,3}\b`,
  'g',
);

/** Comments blanked, line numbers preserved.
 *
 *  Block comments become spaces rather than being deleted so a reported line number
 *  still points at the right line. The line-comment pattern requires the `//` not to
 *  follow a `:` or a `/`, which is what keeps it off `https://`. A `//` inside a string
 *  literal can still be blanked; the cost of that is a missed match in code that is
 *  already unusual, never a false failure. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:\\/])\/\/[^\n]*/gm, (_m, before) => before);
}

function sources(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) sources(p, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(p);
  }
  return out;
}

function deadModifiers() {
  const hits = [];
  for (const file of SOURCE_DIRS.flatMap((d) => sources(d))) {
    stripComments(readFileSync(file, 'utf8'))
      .split('\n')
      .forEach((line, i) => {
        for (const m of line.matchAll(DEAD_MODIFIER)) {
          hits.push({ file: file.replace(/\\/g, '/'), line: i + 1, cls: m[0] });
        }
      });
  }
  return hits;
}

/* Self-invalidating. If the preset ever gains `<alpha-value>` slots, the modifiers
 * start working and this pass becomes a liar rather than a check — so it says so and
 * stops asserting, instead of quietly failing correct code. A stale check is worse
 * than no check. */
const presetSupportsAlpha = readFileSync(PRESET, 'utf8').includes('<alpha-value>');

/* -------------------------------------------------------------------------- *
 * Pass 3 — does the reduced-motion block actually win?
 *
 * dist/tokens.css sets `--oz-motion-spatial-scale: 1` and then overrides it to 0
 * inside `@media (prefers-reduced-motion: reduce)`. Whether that override applies is
 * decided entirely by the compiled sheet: same property, same specificity, no real
 * cascade layers in the output — Tailwind consumes `@layer base` as its own directive
 * and emits no `@layer` at-rule — so it comes down to which one appears later.
 *
 * It appeared earlier. The override sat at byte 95 and the base value at byte 8849,
 * because the block was authored outside `@layer base` and Tailwind hoisted everything
 * layered past it. The measurable result was a multiplier of 1 with the preference
 * enabled: every entrance kept its full travel and every spatial spring kept its
 * overshoot, for exactly the users who had asked for neither.
 *
 * Nothing could catch that upstream. The token build emits correct CSS in a correct
 * order; the breakage happens when a second tool rearranges it. Only the compiled
 * artefact knows, so the assertion has to live here, next to the only other check that
 * reads it.
 * -------------------------------------------------------------------------- */

/** The declarations the reduced-motion block overrides, and which therefore have to
 *  appear later than every unconditional declaration of the same property. */
const REDUCED_MOTION_OVERRIDES = [
  '--oz-motion-spatial-scale',
  '--oz-spring-spatial-fast',
  '--oz-spring-spatial-default',
  '--oz-spring-spatial-slow',
  '--oz-spring-expressive',
];

/** The `@media (prefers-reduced-motion: reduce)` block's extent, by brace matching.
 *  Returns null when the block is absent, which is itself a failure. */
function reducedMotionExtent(sheet) {
  const open = sheet.search(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{/);
  if (open === -1) return null;
  let i = sheet.indexOf('{', open);
  let depth = 0;
  for (; i < sheet.length; i++) {
    if (sheet[i] === '{') depth++;
    else if (sheet[i] === '}' && --depth === 0) return { start: open, end: i };
  }
  return null;
}

function cascadeFailures(sheet) {
  const extent = reducedMotionExtent(sheet);
  if (!extent) {
    return [
      'the @media (prefers-reduced-motion: reduce) block is not in the compiled sheet at all',
    ];
  }
  const out = [];
  for (const prop of REDUCED_MOTION_OVERRIDES) {
    const re = new RegExp(`${prop}\\s*:`, 'g');
    const inside = [];
    const outside = [];
    for (const m of sheet.matchAll(re)) {
      (m.index > extent.start && m.index < extent.end ? inside : outside).push(m.index);
    }
    if (inside.length === 0) {
      out.push(`${prop} is never overridden inside the reduced-motion block`);
      continue;
    }
    /* Every unconditional declaration must come first. `.dark` and `.light` each
     * declare these too, so there are several, and the override has to beat the last
     * of them rather than the first. */
    const lastOutside = Math.max(...outside);
    const firstInside = Math.min(...inside);
    if (firstInside < lastOutside) {
      out.push(
        `${prop}: override at byte ${firstInside} precedes an unconditional ` +
          `declaration at byte ${lastOutside}, so the reduced-motion value loses`,
      );
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */

const sheet = css();
const defined = definedClasses(sheet);
const used = usedClasses(readFileSync(HTML, 'utf8'));

const missing = [...used]
  .filter((c) => !defined.has(c))
  .filter((c) => !EXPECTED_UNSTYLED.has(c))
  .sort();

const dead = presetSupportsAlpha ? [] : deadModifiers();
const cascade = cascadeFailures(sheet);

console.log(`stylesheet: ${(sheet.length / 1024).toFixed(0)} kB, ${defined.size} classes defined`);
console.log(`prerendered HTML: ${used.size} classes used`);
console.log(
  presetSupportsAlpha
    ? 'source scan: SKIPPED — the preset now carries <alpha-value>, so opacity modifiers\n' +
        '  resolve. Delete pass 2 from this script; it is asserting something untrue.'
    : `source scan: ${SOURCE_DIRS.join(', ')} — ${dead.length} dead opacity modifier(s)`,
);
console.log(
  `cascade: ${REDUCED_MOTION_OVERRIDES.length} reduced-motion override(s) checked — ` +
    `${cascade.length} losing to an unconditional declaration`,
);

if (missing.length > 0) {
  console.error(`\n${missing.length} class(es) used but never generated:\n`);
  for (const c of missing) console.error(`  ${c}`);
  console.error(
    '\nMost likely a safelist gap in tailwind.config.js. Add the pattern or the variant\n' +
      'rather than hard-coding the class somewhere for the scanner to find — the recipe is\n' +
      'still the thing composing it.',
  );
}

if (dead.length > 0) {
  console.error(`\n${dead.length} opacity modifier(s) on a token colour, which emit no CSS:\n`);
  for (const d of dead) console.error(`  ${d.file}:${d.line}  ${d.cls}`);
  console.error(
    '\nThe preset emits colours as bare var(--oz-…) with no <alpha-value> slot, so Tailwind\n' +
      'drops these silently. Use a token that is already the colour you want at the alpha\n' +
      'you want — the alpha grid has 8/15/30/50% of every family, and overlay/dimness is the\n' +
      'scrim — or an inline style reading the var directly. Do not add an <alpha-value> slot\n' +
      'to the preset to make one call site work: that changes every colour in the system.',
  );
}

if (cascade.length > 0) {
  console.error(`\n${cascade.length} reduced-motion override(s) that do not apply:\n`);
  for (const c of cascade) console.error(`  ${c}`);
  console.error(
    '\nThe compiled sheet has no cascade layers — Tailwind consumes `@layer base` as its\n' +
      'own directive and emits no @layer at-rule — so these declarations are decided by\n' +
      'source order alone. reducedMotionBlock() in build/build.mjs must stay INSIDE\n' +
      '`@layer base` and after the mode blocks. Outside it, Tailwind hoists every layered\n' +
      'rule past it and the preference silently stops doing anything.',
  );
}

if (missing.length === 0 && dead.length === 0 && cascade.length === 0) {
  console.log(
    '\nOK — every class used in the prerender has a matching rule, no source file asks\n' +
      'for an opacity modifier the preset cannot deliver, and every reduced-motion\n' +
      'override still wins in the compiled sheet.',
  );
  process.exit(0);
}
process.exit(1);
