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
 * Usage, after `npm run build`:
 *   node scripts/verify-classes.mjs
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CSS_DIR = '.next/static/css';
const HTML = '.next/server/app/index.html';

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

const sheet = css();
const defined = definedClasses(sheet);
const used = usedClasses(readFileSync(HTML, 'utf8'));

const missing = [...used]
  .filter((c) => !defined.has(c))
  .filter((c) => !EXPECTED_UNSTYLED.has(c))
  .sort();

console.log(`stylesheet: ${(sheet.length / 1024).toFixed(0)} kB, ${defined.size} classes defined`);
console.log(`prerendered HTML: ${used.size} classes used`);

if (missing.length === 0) {
  console.log('\nOK — every class used in the prerender has a matching rule.');
  process.exit(0);
}

console.error(`\n${missing.length} class(es) used but never generated:\n`);
for (const c of missing) console.error(`  ${c}`);
console.error(
  '\nMost likely a safelist gap in tailwind.config.js. Add the pattern or the variant\n' +
    'rather than hard-coding the class somewhere for the scanner to find — the recipe is\n' +
    'still the thing composing it.',
);
process.exit(1);
