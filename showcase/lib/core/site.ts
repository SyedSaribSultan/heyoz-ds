/**
 * site.ts — the deployed origin, derived rather than typed.
 *
 * This lived in app/sitemap.ts and was exported from there for app/robots.ts. Its own
 * comment named the condition for moving it: *"If a third consumer appears —
 * `metadataBase` in app/layout.tsx is the obvious one, and would fix the relative-URL
 * warnings on the OG cards — this belongs in lib/core/ instead."* That consumer
 * appeared, so here it is. A route module is a bad home for a value two other route
 * modules need: it makes one page's file the de facto library, and the import that
 * proves it (`import { baseUrl } from './sitemap'` inside robots.ts) reads as a mistake
 * even when it is not.
 *
 * A hardcoded `https://…` in a repo whose entire thesis is that no value lives in two
 * places would be exactly the wrong thing: the domain already exists — in the Vercel
 * project — and a copy of it here is a second place for it to be wrong, discoverable
 * only by a crawler months later. So the platform is asked.
 *
 * `VERCEL_PROJECT_PRODUCTION_URL` is the project's production host, and it is
 * deliberately not `VERCEL_URL`. VERCEL_URL is the per-deployment host, so a preview
 * build would publish a sitemap full of `…-git-branch-abc123.vercel.app` URLs that stop
 * existing when the deployment is superseded — and anything that indexed one would keep
 * a dead preview in its index. The production URL is the same on every deployment,
 * which is the property both a sitemap and an og:image need.
 *
 * Neither variable carries a scheme, and a bare host is not a valid `<loc>`, so the
 * scheme is added when it is missing and any trailing slash is dropped before paths are
 * appended — `https://host//verify` is a different URL to a crawler than
 * `https://host/verify`, and duplicate URLs are the one thing a sitemap exists to
 * prevent.
 *
 * The last fallback is localhost, and that is a deliberate choice of failure. A guessed
 * production domain would be plausible, indexable and wrong; `http://localhost:3000` is
 * obviously wrong to anyone who opens the file, which is what you want from a value
 * that means "nobody told me".
 *
 * NOT `server-only`, unlike staleness.ts beside it. There is nothing privileged here —
 * it reads two build-time environment variables and returns a string — and
 * `metadataBase` is consumed by app/layout.tsx, which is also the module the client
 * tree renders inside. staleness.ts needs the marker because it touches node:fs; this
 * does not, and adding the marker anyway would be cargo.
 */
export const baseUrl: string = ((): string => {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000';
  const withScheme = /^https?:\/\//i.test(host) ? host : `https://${host}`;
  return withScheme.replace(/\/+$/, '');
})();

/** The same origin as a URL, which is the shape `metadataBase` wants.
 *
 *  Next resolves every relative `openGraph.images` entry against this. Without it the
 *  build warns once per metadata image route and silently emits
 *  `http://localhost:3000/opengraph-image` into production HTML — the cards are
 *  generated, correct, and unfurl as broken images, which is the failure mode where
 *  everything looks fine locally and nothing looks fine anywhere else. */
export const metadataBase: URL = new URL(baseUrl);
