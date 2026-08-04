import type { MetadataRoute } from 'next';
import { auditSummary } from '@/lib/core/audit';
import { allRecipes } from '@/lib/recipes';
/* The origin moved to lib/core/site.ts the moment a third consumer appeared, which is
 * the condition its own comment set. app/layout.tsx now needs it for `metadataBase` —
 * without that every relative og:image resolved to localhost in production. */
import { baseUrl } from '@/lib/core/site';

/* ---------------------------------------------------------------------------
 * Every route, listed once, derived from the same list that creates them.
 *
 * There are two fixed routes and one per recipe, and the count is not written down
 * here for the reason ComponentPage.tsx gives at length: a numeral in a comment about
 * a generated list is a fact with an expiry date and nothing in the build checks it.
 * `allRecipes` is what app/c/[component]/page.tsx passes to `generateStaticParams`, so
 * the set of URLs below and the set of pages that exist are the same set by
 * construction. A hand-written list here would 404 on a stale entry and silently omit
 * a new one, and a sitemap is exactly the artifact nobody re-reads.
 *
 * Generated at build time. showcase/vercel.json runs
 * `node ../build/build.mjs && next build`, so the audit these numbers come from is
 * rewritten immediately before this module is evaluated — the sitemap cannot describe
 * a different build than the pages do.
 *
 * NO `priority` AND NO `changeFrequency`. Both are optional hints that Google has
 * said for years it ignores, and both would have to be invented: there is no defence
 * for 0.8 on a component page and 1.0 on the index beyond it feeling about right,
 * which is the definition of a magic number. CLAUDE.md rule 5 applies to a sitemap as
 * much as to a contrast ratio — if a figure cannot be computed, it should not be
 * emitted.
 * ------------------------------------------------------------------------- */

export default function sitemap(): MetadataRoute.Sitemap {
  /* The build stamp, not `new Date()`. Every page here is rendered from
   * reports/audit.json and the recipes, so the honest answer to "when did this last
   * change" is when the build that produced them ran — and unlike a call to the clock
   * it is the same answer for every URL in the file, which is true: they are all one
   * artifact.
   *
   * Guarded, because `lastModified` is advisory and a malformed stamp must not take a
   * deploy down: Next serialises this field through toISOString(), which throws on an
   * invalid Date. A sitemap with no dates is still a sitemap. */
  const stamped = new Date(auditSummary.generatedAt);
  const lastModified = Number.isFinite(stamped.getTime()) ? stamped : undefined;

  return [
    { url: `${baseUrl}/`, lastModified },
    { url: `${baseUrl}/verify`, lastModified },
    ...allRecipes.map((recipe) => ({
      url: `${baseUrl}/c/${recipe.meta.id}`,
      lastModified,
    })),
  ];
}
