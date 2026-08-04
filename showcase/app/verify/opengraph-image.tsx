import { ImageResponse } from 'next/og';
import { cssValue, resolve } from '@/lib/core/audit';
import { GATE_FAMILIES, gates } from '@/lib/core/gates';
import type { Mode } from '@/lib/core/types';

/* ---------------------------------------------------------------------------
 * The link preview for `/verify`.
 *
 * This is the card a link to the audit should unfurl as, and the reason the route has
 * its own is that the two routes make different claims: `/` says what the system is,
 * `/verify` says that it holds. A sign-off link pasted into a review thread should say
 * the second thing before anyone clicks it.
 *
 * The mode decision, the default font and the no-bold consequence are argued in full
 * in app/opengraph-image.tsx and are not restated here — see that file. Same mode for
 * the same reason: every foreground on this card is gated against `color/background`
 * in this mode, and a card that mixed modes would be showing a pair nothing measures.
 *
 * The headline is the only claim on the card and it is entirely derived, from
 * `gates.passing` and `gates.total`.
 *
 * THE FAILING BRANCH IS REACHABLE, which is the reason it is written. build.mjs writes
 * `reports/audit.json` and only then exits non-zero, so an audit that records a failed
 * gate does exist on disk — showcase/vercel.json's `&&` stops that one from becoming a
 * deploy, but nothing stops a local `next build` from rendering this card out of it. So
 * the number turns, and the stripe turns with it. A verification card that renders
 * green whatever the count says would be the worst artifact in the repo: it is the one
 * image somebody forwards instead of reading the page.
 * ------------------------------------------------------------------------- */

const allPass = gates.passing === gates.total;

export const alt = `HeyOz design system verification — ${gates.passing} of ${gates.total} build gates ${allPass ? 'pass' : `pass, ${gates.total - gates.passing} fail`}.`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Named once. See app/opengraph-image.tsx for why mixing modes on a card is a
 *  contrast bug with no gate behind it. */
const CARD_MODE: Mode = 'dark';

/** What the gates are, taken from the families gates.ts already declares for the
 *  section headers on the route. Typed out here it would be a list to keep in step
 *  with that one; derived, a ninth family appears on the card by existing. */
const FAMILIES = GATE_FAMILIES.map((f) => f.title).join(' · ');

export default function Image() {
  const page = cssValue(resolve('background', CARD_MODE));
  const primary = cssValue(resolve('content-primary', CARD_MODE));
  const secondary = cssValue(resolve('content-secondary', CARD_MODE));
  const tertiary = cssValue(resolve('content-tertiary', CARD_MODE));

  /* The verdict colour, and the stripe that carries it. `content/*` for the text and
   * `fill/*` for the bar rather than one token doing both jobs: a content token used
   * as a fill is a role violation this system spends its naming rules preventing, and
   * both pairs are gated — content/success and content/critical against `background`
   * at 4.5:1 in both modes. */
  const verdict = cssValue(resolve(allPass ? 'content-success' : 'content-critical', CARD_MODE));
  const stripe = cssValue(resolve(allPass ? 'fill-success' : 'fill-critical', CARD_MODE));

  /* The build this card was made from, so a cached unfurl says which audit it is
   * quoting rather than implying it is current. Guarded because an unparseable stamp
   * must not take a build down over an advisory line on an image: toISOString() throws
   * on an invalid Date, and a card with no date is a smaller problem than no build. */
  const stamped = new Date(gates.generatedAt);
  const built = Number.isFinite(stamped.getTime()) ? stamped.toISOString().slice(0, 10) : null;

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: page }}>
        <div style={{ width: 16, height: '100%', background: stripe }} />

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
              verification
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 96, lineHeight: 1.05, color: verdict }}>
              {gates.passing} of {gates.total}
            </span>
            <span style={{ marginTop: 12, fontSize: 38, color: secondary }}>
              {allPass
                ? 'gates pass — measured, not asserted.'
                : `gates pass. ${gates.total - gates.passing} do not.`}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 22, color: tertiary }}>{FAMILIES}</span>
            <span style={{ marginTop: 10, fontSize: 22, color: tertiary }}>
              {gates.errors === 0 ? 'no build errors' : `${gates.errors} build errors`}
              {built ? ` · built ${built}` : ''}
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
