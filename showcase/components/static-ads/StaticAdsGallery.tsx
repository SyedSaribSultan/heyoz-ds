'use client';

import { ScrollRegion } from '@/components/showcase/ScrollRegion';

/* ---------------------------------------------------------------------------
 * Recents and Templates for you — the two card rows below the composer.
 *
 * THE THUMBNAILS ARE DRAWN, NOT PHOTOGRAPHED, AND THAT IS THE HONEST OPTION RATHER THAN A
 * SHORTCUT. Three facts forced it:
 *
 *   1. There is no data source. This repo has no backend, no auth and no AI — HANDOFF.md
 *      §3 says so and lists it as the one substantive gap. There is no Recents API to pull
 *      from, so the brief's "pull from whatever the Recents API/data source is" has no
 *      referent yet. `RECENTS` and `TEMPLATES` below are the seam: swap the arrays for a
 *      fetch and the components do not change.
 *   2. There are no image assets. `showcase/public/` is empty — its only contents were the
 *      nine `/ai-ugc` files, deleted with that route.
 *   3. The reference's creative is Nike's. Bold "HOLD YOUR GROUND" over a basketball, with
 *      the swoosh and the wordmark bottom-right. That is a real company's trademark and
 *      campaign art used as a stand-in in a mock, and committing a redrawing of it into
 *      this repo is not the same act as pasting it into a Figma frame. So the LAYOUT is
 *      reproduced — headline, product shape, small print, barcode, brand lockup — and the
 *      brand is the workspace the rail already names, Simplist skincare, whose ads these
 *      would plausibly be.
 *
 * So each thumbnail is a composed placeholder painted entirely from tokens: no hex, no
 * asset, no trademark. At 176px it reads as artwork, which is what the row needs to be
 * judged. Every one carries an `sr-only` line saying it is a placeholder, because a
 * convincing fake in a design system is exactly the thing somebody screenshots into a deck.
 *
 * WHY CHART COLOURS PAINT THE GROUNDS, which is a role crossing worth naming. `chart/1..5`
 * are declared for data series. They are used here because a template ground stands in for
 * an uploaded photograph, and the set has no role for "arbitrary imagery" — the alternative
 * was five hand-typed hexes, which rule 2 forbids outright. A borrowed token beats an
 * invented colour. If this page ever ships with real uploads, the grounds go away entirely
 * and the crossing goes with them.
 *
 * BOTH ROWS SCROLL HORIZONTALLY, per the brief. The reference's Templates block is actually
 * a masonry grid — its second column is visibly taller than its neighbours — but the brief
 * asks for "the same card component pattern … horizontal scroll if content overflows", and
 * a written instruction beats a cropped screenshot. Masonry is a layout change here and
 * nowhere else if it turns out to be wanted.
 *
 * ScrollRegion rather than a bare `overflow-x-auto`, for the two reasons its own header
 * gives: a scroll container with no focusable child cannot be scrolled without a pointer
 * (WCAG 2.1.1), and an overflow with no visible edge reads as content that simply ends.
 * ------------------------------------------------------------------------- */

/** A generated ad, as it would arrive from the Recents endpoint.
 *
 *  `ratio` is absent on purpose: Recents is square because the composer's aspect chip is
 *  set per generation and the row has to stay a row. A real payload would carry it, and the
 *  card would read it. */
type Recent = {
  id: string;
  /** The creative's headline. Two lines, broken where the ad breaks it. */
  headline: [string, string];
  /** Which brand rung paints the ground. */
  ground: 'brand' | 'brand-hover' | 'brand-active';
};

const RECENTS: Recent[] = [
  { id: 'r1', headline: ['Hold your', 'ground'], ground: 'brand' },
  { id: 'r2', headline: ['Glow all', 'day'], ground: 'brand-hover' },
  { id: 'r3', headline: ['Bare', 'minimum'], ground: 'brand' },
  { id: 'r4', headline: ['Clean', 'slate'], ground: 'brand-active' },
  { id: 'r5', headline: ['Skin', 'deep'], ground: 'brand' },
  { id: 'r6', headline: ['Hold your', 'ground'], ground: 'brand-hover' },
  { id: 'r7', headline: ['Glow all', 'day'], ground: 'brand' },
  { id: 'r8', headline: ['Bare', 'minimum'], ground: 'brand-active' },
  { id: 'r9', headline: ['Clean', 'slate'], ground: 'brand' },
];

const GROUND_CLASS: Record<Recent['ground'], string> = {
  brand: 'bg-fill-brand',
  'brand-hover': 'bg-fill-brand-hover',
  'brand-active': 'bg-fill-brand-active',
};

export function Recents() {
  return (
    <Section heading="Recents">
      <ScrollRegion label="Recent generations" className="pb-space-2">
        <ul className="flex gap-space-3">
          {RECENTS.map((recent) => (
            <li key={recent.id}>
              <RecentCard recent={recent} />
            </li>
          ))}
        </ul>
      </ScrollRegion>
    </Section>
  );
}

/** One square creative.
 *
 *  Everything inside is `text-content-on-brand`, the gated pair for text on a brand fill —
 *  which is white, and which WCAG 2.x scores at 3.55:1 and APCA passes. CLAUDE.md's second
 *  "looks like a bug" entry is about exactly this pairing; do not "fix" it to near-black. */
function RecentCard({ recent }: { recent: Recent }) {
  const [line1, line2] = recent.headline;

  return (
    <article
      className={`relative aspect-square w-[176px] shrink-0 overflow-hidden rounded-6 text-content-on-brand ${GROUND_CLASS[recent.ground]}`}
    >
      <span className="sr-only">
        Placeholder creative — {line1} {line2}. Not a real generated ad.
      </span>

      {/* The product. A disc rather than a bottle silhouette: at 176px a recognisable object
          needs detail that would be invented, and a disc reads as "something is there"
          without claiming to be a specific thing. Cropped by the bottom edge, which is how
          the reference crops its ball.

          IT IS A TINTED SHADOW, NOT A BRAND RUNG, and the first version got this wrong in a
          way the row made obvious. `bg-fill-brand-active` looked right on the `brand` cards
          and vanished entirely on the two cards whose GROUND is brand-active — same token on
          both sides of the pairing. `content/fixed-primary` at low opacity is near-black in
          both modes, so it darkens whatever it sits on and cannot collide with its own
          ground however the ramp moves. */}
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-[44%] h-[124px] w-[124px] -translate-x-1/2 rounded-full bg-content-fixed-primary opacity-[0.22]"
      />
      {/* The highlight that makes the disc read as lit rather than as a hole. */}
      <span
        aria-hidden="true"
        className="absolute left-[34%] top-[50%] h-[34px] w-[34px] rounded-full bg-content-on-brand opacity-[0.18]"
      />

      <div aria-hidden="true" className="relative flex h-full flex-col justify-between p-space-3">
        {/* leading-none because two stacked display lines at their own leading open a gap the
            reference does not have — an ad headline is set tight. heading-lg, which is large
            for a 176px card and deliberately so: in the reference the headline is the
            loudest thing in the thumbnail, and at heading-sm it read as a caption. */}
        <p className="font-display text-heading-lg font-extrabold uppercase leading-none">
          {line1}
          <br />
          {line2}
        </p>

        <div className="flex items-end justify-between gap-space-3">
          {/* Small print and a barcode. Bars rather than text: real small print at 4px is
              unreadable noise, and lorem at 8px is a sentence nobody wrote. */}
          <span className="oz-stack oz-stack-1">
            <span className="flex gap-[2px]">
              {[3, 1, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1].map((w, i) => (
                <span
                  key={i}
                  className="block h-space-4 bg-content-on-brand"
                  style={{ width: `${w}px` }}
                />
              ))}
            </span>
            <span className="block h-[2px] w-[54px] bg-content-on-brand" />
            <span className="block h-[2px] w-[38px] bg-content-on-brand" />
          </span>

          <span className="font-display text-label-xs font-bold uppercase tracking-[0.1em]">
            Simplist
          </span>
        </div>
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------------------
 * Templates.
 * ------------------------------------------------------------------------- */

type Template = {
  id: string;
  name: string;
  /** Which chart rung paints the ground. See the header on why these are chart tokens. */
  ground: 1 | 2 | 3 | 4 | 5;
};

const TEMPLATES: Template[] = [
  { id: 't1', name: 'Studio product', ground: 1 },
  { id: 't2', name: 'Editorial portrait', ground: 4 },
  { id: 't3', name: 'Flat lay', ground: 5 },
  { id: 't4', name: 'Bold statement', ground: 2 },
  { id: 't5', name: 'Soft focus', ground: 3 },
  { id: 't6', name: 'Split frame', ground: 4 },
  { id: 't7', name: 'Close crop', ground: 1 },
];

export function TemplatesForYou() {
  return (
    <Section heading="Templates for you">
      <ScrollRegion label="Suggested templates" className="pb-space-2">
        <ul className="flex gap-space-4">
          {TEMPLATES.map((template) => (
            <li key={template.id}>
              <TemplateCard template={template} />
            </li>
          ))}
        </ul>
      </ScrollRegion>
    </Section>
  );
}

/** One portrait template.
 *
 *  A button, not an article: a template is something you apply, and the whole card is the
 *  target. The composer's TEMPLATE tile is the other way into the same choice.
 */
function TemplateCard({ template }: { template: Template }) {
  return (
    <button
      type="button"
      className="group relative block aspect-[3/4] w-[268px] shrink-0 overflow-hidden rounded-6 text-left transition-[transform,box-shadow] duration-effects-default ease-effects-default hover:shadow-large focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
      /* The ground is a two-stop wash of one chart rung rather than a flat fill, so seven
         cards in a row do not read as seven swatches. Inline because the preset emits
         colours with no `<alpha-value>` slot, so a gradient utility cannot fade one — the
         same constraint the hero's glow works around. */
      style={{
        /* The third stop keeps the rung flat for the top half and only then falls towards
           mesh-base. Two stops put the fade across the whole card, which read as every
           template dissolving into the page — the grounds are standing in for photographs,
           and a photograph does not fade out at the bottom. */
        backgroundImage: `linear-gradient(158deg, var(--oz-color-chart-${template.ground}) 0%, var(--oz-color-chart-${template.ground}) 52%, var(--oz-color-gradient-mesh-base) 205%)`,
      }}
    >
      <span className="sr-only">Placeholder template thumbnail. Not a real image.</span>

      {/* A large arc cropped by the frame, a solid disc, and a bottom-anchored product form.
          Three shapes at three scales, which is the least that reads as a composition rather
          than a swatch — the first version used two at half these opacities and the row came
          out looking like a gradient palette. */}
      <span
        aria-hidden="true"
        className="absolute -right-[20%] top-[7%] h-[58%] w-[84%] rounded-full border-[16px] border-content-on-brand opacity-[0.26]"
      />
      <span
        aria-hidden="true"
        className="absolute -left-[14%] top-[30%] h-[34%] w-[48%] rounded-full bg-content-on-brand opacity-[0.16]"
      />

      {/* The product, bottom-anchored — where a product sits in most of these layouts, and
          the thing a real thumbnail would show. Two tones so it reads as an object with a
          lit face rather than as a flat arch. */}
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 h-[40%] w-[36%] -translate-x-1/2 rounded-t-full bg-content-fixed-primary opacity-[0.24]"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-[46%] h-[36%] w-[12%] -translate-x-1/2 rounded-t-full bg-content-on-brand opacity-[0.22]"
      />

      {/* The name, on a scrim. Not a bare label: the grounds run from a pale gold to a deep
          blue, and white text is legible on one and marginal on the other — a scrim is the
          only thing that makes one token correct on all five. */}
      <span
        className="absolute inset-x-0 bottom-0 p-space-3 pt-space-8 text-label-sm font-medium text-content-fixed-inverse"
        style={{
          backgroundImage:
            'linear-gradient(to top, var(--oz-color-content-fixed-primary) 0%, transparent 100%)',
        }}
      >
        {template.name}
      </span>
    </button>
  );
}

/* ---------------------------------------------------------------------------
 * The shared wrapper.
 * ------------------------------------------------------------------------- */

/** Heading plus row. Both sections use it, which is what makes them "the same card
 *  component pattern" the brief asks for — the pattern is the section, not just the card. */
function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="pt-space-12">
      <h2 className="px-space-6 pb-space-5 text-heading-sm font-semibold text-content-primary">
        {heading}
      </h2>
      {/* The row is padded on the left only. A right pad would put a gutter between the
          last card and the viewport edge, and the whole point of a scroller is that the
          content runs off the edge — a gap there reads as "this is all of it". */}
      <div className="pl-space-6">{children}</div>
    </section>
  );
}
