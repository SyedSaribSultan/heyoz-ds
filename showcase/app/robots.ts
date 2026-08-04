import type { MetadataRoute } from 'next';
import { baseUrl } from '@/lib/core/site';

/* ---------------------------------------------------------------------------
 * robots.txt, and the pointer to the sitemap that is the only reason it exists.
 *
 * A crawler finds `/sitemap.xml` either because a human submitted it or because
 * robots.txt named it. The second is the one that keeps working after everybody who
 * did the first has left, which is the whole argument for this file.
 *
 * ORIGIN IMPORTED, NOT DERIVED AGAIN. `Sitemap:` has to be an absolute URL — it is the
 * one line in robots.txt that a relative path is invalid in — so this needs the same
 * origin the sitemap computes. Two derivations that agree today is precisely the shape
 * of drift this repo is built to eliminate, so there is one. It now lives in
 * lib/core/site.ts rather than being imported out of app/sitemap.ts: three route
 * modules need it, and `import { baseUrl } from './sitemap'` inside robots.txt's own
 * module reads as a mistake even when it is not. The full argument for how the origin is
 * discovered, and why a hardcoded domain would be the wrong thing here of all repos, is
 * in the comment on `baseUrl`.
 *
 * A consequence worth naming: a preview deployment serves this same file, and the
 * origin it names is the PRODUCTION one. So a crawler reading a preview's robots.txt
 * is pointed at the real sitemap rather than invited to enumerate a host that stops
 * existing on the next push.
 *
 * ALLOW EVERYTHING, and the rule that matters is the one not written. There is nothing
 * on either route that is not published by the deploy: both are generated from
 * `reports/audit.json` and the recipes, and the point of a design system reference is
 * that it can be found and quoted. Disallowing the metadata image routes would be the
 * tempting tidy-up and would be a bug — Slack, Notion and every other unfurler fetch
 * an og:image as a crawler and honour robots.txt, so a `Disallow` covering
 * `/opengraph-image` would leave the three cards generated, correct, and never once
 * displayed.
 * ------------------------------------------------------------------------- */

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
