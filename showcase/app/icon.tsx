import { ImageResponse } from 'next/og';
import { cssValue, resolve } from '@/lib/core/audit';

/* ---------------------------------------------------------------------------
 * The tab mark.
 *
 * Until this file existed the showcase shipped Next's default favicon — the one
 * element of a public design-system URL that was nobody's design, sitting in the
 * tab strip beside the page arguing that no value in this system is hand-picked.
 *
 * GENERATED RATHER THAN A CHECKED-IN .SVG, and that is the whole reason it is a
 * .tsx file. An .svg or .ico asset cannot read `dist/tokens.css`: its fill would be
 * a hex somebody typed, and it would be the only hand-typed colour in the repo —
 * exactly what CLAUDE.md rule 2 forbids above tier 1. Resolving the colour through
 * lib/core/audit.ts instead means the mark comes out of `reports/audit.json` like
 * every other colour on the page. Move `brand/60`'s L in `palette.mjs`, rebuild, and
 * the tab mark moves with the buttons; it cannot be left behind, because there is no
 * second copy of the value to forget.
 *
 * NO LETTERFORM, and that is a decision about the renderer rather than about taste.
 * ImageResponse has exactly one embedded face —
 * `next/dist/compiled/@vercel/og/noto-sans-v27-latin-regular.ttf`, regular weight
 * only — and it is not the display face this system's wordmark is set in. The
 * webfonts app/layout.tsx loads by <link> are unreachable from here: satori resolves
 * fonts from what the module hands it, not from a stylesheet. So an "H" here would be
 * a thin 400-weight Noto glyph, downscaled by the browser to the ~16px a tab strip
 * actually paints, claiming to be Bricolage Grotesque. Geometry is the same shape at
 * every size and in every face, so the mark is a ring.
 *
 * The ring is two concentric filled discs rather than a bordered box, so the entire
 * mark depends on `background-color` and `border-radius` and nothing else — the two
 * properties satori renders identically at 32px and at 512px.
 *
 * The corners are left transparent rather than painted with `color/background`. A
 * favicon sits on browser chrome, not on this system's page, and the tab strip
 * follows the OS: filling the corners with the light page colour would put a white
 * tile on a dark tab strip, and picking the dark page colour would do the reverse.
 * The two colours that ARE here are `fill/brand` and `content/on-brand` — the pair a
 * primary button's label makes, which the build gates on APCA Lc 60 in both modes
 * rather than on the WCAG 2.x ratio (CLAUDE.md; DECISIONS H1).
 * ------------------------------------------------------------------------- */

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/* Fractions of the box, not px, so the mark stays itself if `size` changes — and not
 * radius tokens either: the radius ramp is authored for CSS px on real controls at
 * reading distance, and a 32px canvas is not one of those. At the shipped size these
 * are a 22px disc holding a 12px one, so the ring's stroke is 5px, which the browser
 * paints at about 2.5px once it scales 32 down to the 16 it wants. Thinner than that
 * closes up and the ring reads as a dot. */
const CORNER = 0.25;
const RING = 0.6875;
const CORE = 0.375;

export default function Icon() {
  /* Both tokens resolve to the same value in light and in dark — `fill/brand` is
   * `solid/brand/60` in both and `content/on-brand` is `solid/neutral/white` in both
   * — so the mode passed here is a formality that `resolve()` has no way to omit. It
   * is 'light' rather than 'dark' only because something had to be written down; if
   * either token ever becomes mode-specific this icon follows light, which is a
   * cosmetic consequence in a 32px square rather than a contrast one. */
  const brand = cssValue(resolve('fill-brand', 'light'));
  const counter = cssValue(resolve('content-on-brand', 'light'));
  const box = size.width;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: brand,
          borderRadius: box * CORNER,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: box * RING,
            height: box * RING,
            borderRadius: (box * RING) / 2,
            background: counter,
          }}
        >
          <div
            style={{
              width: box * CORE,
              height: box * CORE,
              borderRadius: (box * CORE) / 2,
              background: brand,
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
