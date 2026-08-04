import { ImageResponse } from 'next/og';
import { auditSummary, cssValue, resolve } from '@/lib/core/audit';
import { allRecipes } from '@/lib/recipes';
import type { Mode } from '@/lib/core/types';

/* ---------------------------------------------------------------------------
 * The link preview for `/`.
 *
 * A URL pasted into Slack, Notion, a PR description or a calendar invite renders as
 * whatever og:image it finds, and this repo had none — so every link to the system
 * that reviewers, procurement and the app team send each other arrived as a bare
 * blue string. This file, app/verify/opengraph-image.tsx and
 * app/c/[component]/opengraph-image.tsx are the three cards. They deliberately do
 * NOT share a frame component: everything worth keeping in one place — the colours,
 * the counts, the mode decision below — is read from the same audit by all three, and
 * what is left is inline px for a 1200×630 canvas, which is not a value that can be
 * "wrong" somewhere else.
 *
 * THE MODE IS NAMED ONCE, HERE, AND THAT IS THE LOAD-BEARING PART. A card is a single
 * flat PNG: it has no `.dark` class to switch, no reader preference to read, and
 * Slack composites it into a light or a dark channel without asking. So one mode has
 * to be chosen — and the reason it is chosen *by name* rather than by whichever
 * `resolve()` call happened to be typed first is that every pair on this card is a
 * pair the build gates in a specific mode. `content/tertiary` on `background` is
 * gated at 4.5:1 in light and in dark, but `content/tertiary` from light on
 * `background` from dark is a pairing that exists nowhere in the system and nothing
 * measures it. Mixing modes on a card is how you ship an unmeasured contrast pair
 * with no gate to catch it.
 *
 * Dark, because a saturated brand mark on near-black reads as an object in a feed
 * rather than as a screenshot of a document — and because this system's dark ladder
 * is the half that had to be argued for (DECISIONS B18), so it is the half worth
 * showing.
 *
 * THE DEFAULT FONT, and it is worth being explicit about why. ImageResponse ships one
 * face, `noto-sans-v27-latin-regular`, and cannot see the webfonts app/layout.tsx
 * loads by <link>. Self-hosting Bricolage Grotesque just for these three cards would
 * put a second copy of this system's typography next to the token layer that already
 * declares it — a font file whose weights nothing gates. A colour-correct card in a
 * plain face is honest; a card claiming to be Bricolage and rendering Noto is not.
 * Two consequences, both accepted: there is no bold anywhere on these cards, because
 * the one embedded face is regular and `fontWeight: 700` would silently render at
 * 400; hierarchy is therefore size and colour, which is what the type ramp mostly is
 * anyway.
 *
 * EVERY NUMBER IS DERIVED. Nothing on this card is a figure somebody typed:
 * `allRecipes.length` is the catalogue, the rest comes out of `reports/audit.json`.
 * That matters more here than on the page itself, because Slack and Notion cache an
 * unfurled card for weeks and nobody ever looks at one twice — a stale count on a
 * link preview is the most durable wrong number a repo can ship. This repo has the
 * receipts for the alternative: CLAUDE.md 1c carried a border count that "read '19'
 * for months" after DECISIONS had retracted it, and the gate subtotals in README.md
 * predate the motion and layout families entirely. Both are prose. Nothing here is.
 * ------------------------------------------------------------------------- */

export const alt = `HeyOz design system — ${allRecipes.length} components, ${auditSummary.semanticPerMode} semantic tokens per mode, ${auditSummary.passing} of ${auditSummary.gates} build gates passing.`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** See the argument above. Every `resolve()` in this file takes this and no other. */
const CARD_MODE: Mode = 'dark';

/** README.md's opening line, verbatim, rather than a pitch written for a card — a card
 *  that argued for the system in its own words would be a second thesis nobody
 *  reviews.
 *
 *  It IS a copy, and the honest note is that the two can drift. The alternative was
 *  reading the README at build time and pulling the first line out of it, which buys
 *  one string and hands the build a way to fail on somebody rewording a paragraph.
 *  These two lines are the only prose on any of the three cards that is not derived; if
 *  the pitch changes, the README is the one to change first. */
const HEADLINE = 'One source of truth.';
const SUBHEAD = 'JSON in, Figma and CSS out.';

export default function Image() {
  const page = cssValue(resolve('background', CARD_MODE));
  const brand = cssValue(resolve('fill-brand', CARD_MODE));
  const primary = cssValue(resolve('content-primary', CARD_MODE));
  const secondary = cssValue(resolve('content-secondary', CARD_MODE));
  const tertiary = cssValue(resolve('content-tertiary', CARD_MODE));

  const stats = [
    { value: String(allRecipes.length), label: 'components' },
    { value: String(auditSummary.semanticPerMode), label: 'semantic tokens per mode' },
    { value: String(auditSummary.colorPrimitives), label: 'colour primitives' },
    { value: `${auditSummary.passing}/${auditSummary.gates}`, label: 'gates pass' },
  ];

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: page }}>
        {/* The brand fill as an edge, not as a logo. A 1200px card is seen at about
            300px in a feed, where a mark that small is a smudge and a full-height bar
            of the brand fill is recognisable at any scale. It is also the only
            saturated thing on the card, which is the same restraint the page chrome
            keeps — an accent used four times has stopped being a signal. */}
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
            <span style={{ fontSize: 78, lineHeight: 1.05, color: primary }}>{HEADLINE}</span>
            <span style={{ marginTop: 18, fontSize: 38, color: secondary }}>{SUBHEAD}</span>
          </div>

          {/* No rule above this row. A hairline here would be doing separation, and
              separation in this system is space or a surface step, never a stroke
              (CLAUDE.md 1c) — the reason most of the component layer's border bindings
              went away. Space does the job on a card too. */}
          <div style={{ display: 'flex', gap: 56 }}>
            {stats.map((s) => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 40, color: primary }}>{s.value}</span>
                <span style={{ marginTop: 6, fontSize: 20, color: tertiary }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
