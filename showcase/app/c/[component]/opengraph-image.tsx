import { ImageResponse } from 'next/og';
import { cssValue, resolve } from '@/lib/core/audit';
import { allRecipes } from '@/lib/recipes';
import { content } from '@/lib/content';
import type { Mode } from '@/lib/core/types';

/* ---------------------------------------------------------------------------
 * The link preview for one component page.
 *
 * A component page is the unit people send each other — "use the Button page" — and
 * without this every one of those links unfurled as the same bare URL, or, once a
 * root card existed, as the same card for fourteen different pages.
 *
 * The mode decision, the default font and the no-bold consequence are argued in full
 * in app/opengraph-image.tsx. Not restated here.
 *
 * The body text is the written definition where one exists and the recipe blurb
 * otherwise — the same fallback, in the same order, that generateMetadata in page.tsx
 * uses for the description, and for the same reason: a definition was authored to
 * survive being read alone, which is exactly what a link preview is. Reading it from
 * `content` rather than from a string written for the card also means the card cannot
 * describe the component differently from the page it links to.
 * ------------------------------------------------------------------------- */

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Static, and it therefore cannot name the component the card is about. Next reads
 *  `alt` once, when it imports this module to build the metadata tags — it is not
 *  called per param, so there is no id in scope. Making it per-component means
 *  `generateImageMetadata`, which exists to emit several images per route and would be
 *  a second params plumbing for one attribute. The og:title and og:description on the
 *  page do carry the component's own name and definition, which is where a reader with
 *  images off gets them. */
export const alt = 'A HeyOz design system component: its name and what it is for.';

/** See app/opengraph-image.tsx for why mixing modes on a card is a contrast bug with
 *  no gate behind it. */
const CARD_MODE: Mode = 'dark';

type Params = { component: string };

/** One card per recipe, built at build time — phrased that way rather than as a count
 *  for the reason ComponentPage.tsx gives: a numeral about a generated list is a fact
 *  with an expiry date and nothing in the build checks it.
 *
 *  page.tsx's own `generateStaticParams` and its `dynamicParams = false` do not reach
 *  this module: a metadata image route compiles to its own route handler under the
 *  same segment, carrying its own segment config. Without this export the route stays
 *  dynamic and every unfurl renders a PNG on demand — the same images, regenerated per
 *  crawler.
 *
 *  The ids come from `allRecipes`, which is the list page.tsx asks too, so the set of
 *  pages and the set of cards are the same set by construction rather than by two
 *  people remembering. */
export function generateStaticParams(): Params[] {
  return allRecipes.map((r) => ({ component: r.meta.id }));
}

export default async function Image({ params }: { params?: Params | Promise<Params> }) {
  /* Awaited, and the type accepts both shapes, because the two conventions disagree
   * and only one of them is checkable from here. A page in Next 15 receives `params`
   * as a Promise; a metadata image route does not — the generated route module in the
   * installed version (15.5.22) does `const params = await ctx.params` itself and then
   * calls `handler({ params: restParams, id })`, so what arrives here is a plain object
   * that has already been awaited. See
   * next/dist/build/webpack/loaders/next-metadata-route-loader.js, which is worth
   * reading before an upgrade rather than guessing from the page convention.
   *
   * `await` is the identity on a non-thenable, so this reads correctly under either
   * convention and keeps working if a later Next aligns image routes with pages. The
   * failure it avoids is silent rather than loud: `params.component` on a Promise is
   * `undefined` with no error, so every card in the catalogue would have rendered the
   * not-in-the-catalogue branch below and nothing but looking at the images would have
   * said so.
   *
   * Optional, too, because the same loader passes `restParams` as `undefined` for a
   * route with no dynamic segment at all. This route has one, so that cannot happen
   * here — but one question mark is cheaper than a destructure that throws inside
   * satori. */
  const resolved = await params;
  const recipe = allRecipes.find((r) => r.meta.id === resolved?.component);

  const page = cssValue(resolve('background', CARD_MODE));
  const brand = cssValue(resolve('fill-brand', CARD_MODE));
  const primary = cssValue(resolve('content-primary', CARD_MODE));
  const secondary = cssValue(resolve('content-secondary', CARD_MODE));
  const tertiary = cssValue(resolve('content-tertiary', CARD_MODE));

  /* An unknown id renders a card and does not throw. `dynamicParams = false` on the
   * page means a URL this route was not built for is answered as a 404 long before
   * anything asks for its image, so this branch should be unreachable — but an image
   * route that throws on a missing recipe turns a mistake in the catalogue into a
   * failed build with a stack trace from inside satori, and the honest card costs six
   * lines. Same argument as the one ComponentPage.tsx makes for using notFound()
   * rather than rendering a 200 that says the thing does not exist. */
  const title = recipe ? recipe.meta.title : 'Not in the catalogue';
  const body = recipe
    ? (content[recipe.meta.id]?.definition ?? recipe.meta.blurb)
    : `A component appears here by being registered, so a URL with no card behind it is a missing registration rather than a missing page. The catalogue holds ${allRecipes.length}.`;

  /* Position in the set, in the same two-digit form the page prints beside the
   * heading. It says the catalogue is finite and readable end to end, which is the
   * argument the prev/next chain at the foot of the page is built on. */
  const index = recipe ? allRecipes.indexOf(recipe) + 1 : 0;
  const footer = recipe
    ? `${String(index).padStart(2, '0')} of ${allRecipes.length} · ${recipe.variants.length} variants · ${recipe.sizes.length} sizes`
    : `${allRecipes.length} components`;

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: page }}>
        <div style={{ width: 16, height: '100%', background: brand }} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            justifyContent: 'space-between',
            padding: '64px 72px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 34, color: primary }}>HeyOz</span>
            <span
              style={{
                marginLeft: 18,
                fontSize: 20,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: tertiary,
              }}
            >
              design system
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 88, lineHeight: 1.05, color: primary }}>{title}</span>
            {/* 32px and no clamp, measured rather than guessed: the longest body in the
                catalogue today is under 200 characters, which is three lines here, and
                the column has room for five. A clamp would be insurance against a set
                this file can go and look at. If a definition is ever written long enough
                to want six lines, the card grows past its own column instead of
                clipping — so the thing to check after writing one is the card, not this
                number. */}
            <span style={{ marginTop: 20, fontSize: 32, lineHeight: 1.35, color: secondary }}>
              {body}
            </span>
          </div>

          <span style={{ fontSize: 22, color: tertiary }}>{footer}</span>
        </div>
      </div>
    ),
    size,
  );
}
