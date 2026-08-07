/**
 * verify-routes.mjs — every route that exists is reachable and indexed.
 *
 * WHY. `/studio` and `/static-ads` shipped, were prerendered on every build, and were
 * reachable only by typing the URL. Nothing linked them and `app/sitemap.ts` did not
 * list them — while its own header comment read "Every route, listed once". So the two
 * screens that make the strongest case for the system were the two a reviewer could not
 * find, and the sitemap asserted the opposite in a comment nobody re-reads.
 *
 * The component pages cannot drift this way: `generateStaticParams` and the sitemap both
 * map over `allRecipes`, so the set of URLs and the set of pages are one set by
 * construction. The FIXED routes have no such list — a directory with a page.tsx in it is
 * the only record that they exist. This script makes that directory the source of truth
 * and fails when the sitemap disagrees with it.
 *
 * Run: node scripts/verify-routes.mjs   (from showcase/)
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const APP = 'app';

/** Directories under app/ holding a page.tsx, excluding dynamic segments and groups. */
const fixedRoutes = ['/'];
const walk = (dir, prefix) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    /* [param] is generated from a list and is covered by that list; (group) and _private
     * do not produce a URL segment at all. */
    if (entry.startsWith('[') || entry.startsWith('(') || entry.startsWith('_')) continue;
    const route = `${prefix}${entry}`;
    if (readdirSync(full).includes('page.tsx')) fixedRoutes.push(route);
    walk(full, `${route}/`);
  }
};
walk(APP, '/');

const sitemapSrc = readFileSync(join(APP, 'sitemap.ts'), 'utf8');

/* The literal `${baseUrl}/x` entries. The recipe pages are a .map() and are deliberately
 * not matched here — this gate is about the hand-written half, which is the half that
 * can rot. */
const listed = new Set(
  [...sitemapSrc.matchAll(/\$\{baseUrl\}(\/[a-z0-9-]*)`/g)].map((m) =>
    m[1] === '/' ? '/' : m[1],
  ),
);

const FAIL = [];

for (const r of fixedRoutes) {
  if (!listed.has(r)) {
    FAIL.push(
      `${r} has an app${r === '/' ? '' : r}/page.tsx but is not in app/sitemap.ts. ` +
        `A route nobody can find is a route nobody reviews.`,
    );
  }
}

for (const r of listed) {
  if (!fixedRoutes.includes(r)) {
    FAIL.push(
      `app/sitemap.ts lists ${r}, which has no page.tsx. A sitemap entry that 404s is ` +
        `worse than a missing one.`,
    );
  }
}

/* Reachability. A route in the sitemap that nothing links to is indexed but undiscoverable
 * by a human clicking through, which is how these two got lost in the first place. The
 * header toggle covers / and /verify; the rest have to be linked from somewhere in the
 * rendered tree. */
const LINK_SOURCES = ['components', 'app'];
const collect = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collect(full, out);
    else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) out.push(full);
  }
  return out;
};
const sources = LINK_SOURCES.flatMap((d) => collect(d)).map((f) => readFileSync(f, 'utf8'));

for (const r of fixedRoutes) {
  if (r === '/') continue;
  const linked = sources.some(
    (s) => s.includes(`href="${r}"`) || s.includes(`href: '${r}'`) || s.includes(`href='${r}'`),
  );
  if (!linked) {
    FAIL.push(
      `${r} is in the sitemap but nothing links to it. Add a link, or delete the route — ` +
        `an unreachable page still costs a build and still has to be kept correct.`,
    );
  }
}

console.log(`\n${fixedRoutes.length} fixed routes · ${listed.size} listed in the sitemap\n`);
for (const r of fixedRoutes.sort()) console.log(`  ${r}`);

if (FAIL.length) {
  console.error(`\n${FAIL.length} problem(s):\n`);
  for (const f of FAIL) console.error(`  ✗ ${f}\n`);
  process.exit(1);
}

console.log(
  '\nOK — every fixed route exists, is listed once in the sitemap, and is linked from\n' +
    '     somewhere a reader can reach.\n',
);
