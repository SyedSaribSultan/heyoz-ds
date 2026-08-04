'use client';

import { Badge } from '@/components/ui';
import { ArrowRightIcon, ArrowUpIcon, AvatarIcon, PlusIcon, ProductIcon } from './icons';

/* ---------------------------------------------------------------------------
 * The two content rows below the hero: three promo cards, then the Ad Studio strip.
 *
 * ONE THING HERE IS NOT THE MOCK, AND IT IS DELIBERATE.
 *
 * Six of these nine tiles are photographs and video stills in the reference — a
 * serum bottle, a UGC talking head, a paddle-ball still life, two skincare shots, a
 * robot. Those are assets, not styling, and this repo has none of them. So every tile
 * takes an optional `image`, and without one it renders a labelled well saying what
 * belongs there rather than a shape that pretends to be a photograph.
 *
 * That is the same call ComponentIndex.tsx made and for the same stated reason: it
 * refuses to substitute a stand-in for a missing preview, because "an entry with no
 * preview says so in the one place somebody will see it". A grey rectangle that looks
 * like it might be finished is worse than a well that admits it is not — drop the real
 * files in and the geometry, the radii, the scrim and the type are already correct.
 *
 * Text over artwork uses the content/fixed-* family, which CLAUDE.md calls the only
 * two steps that mean the same thing in both modes. That is exactly the requirement
 * here: a caption sitting on a photograph is white whether the page around it is light
 * or dark, because the photograph does not change.
 * ------------------------------------------------------------------------- */

/** The scrim under a caption. Fixed-black to transparent, so a caption stays legible
 *  on artwork this file cannot see. Written inline for the reason StudioHero gives:
 *  the preset's colours carry no alpha slot, so no gradient utility can fade one out. */
const SCRIM: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(to top, var(--oz-color-content-fixed-primary) 0%, transparent 72%)',
};

type Artwork = {
  /** Drop a real asset in and the well disappears. */
  image?: string;
  /** What the well says while there is no asset. Names the shot, not "image". */
  placeholder: string;
};

/** The well. Deliberately plain and deliberately labelled — see the file header. */
function Well({ image, placeholder, alt }: Artwork & { alt: string }) {
  if (image) {
    return <img src={image} alt={alt} className="h-full w-full object-cover" />;
  }
  return (
    <div className="grid h-full w-full place-items-center bg-surface-secondary px-space-4">
      <span className="text-center font-mono text-label-sm text-content-tertiary">
        {placeholder}
      </span>
    </div>
  );
}

/* ── Promo row ───────────────────────────────────────────────────────────── */

const PROMOS: Array<Artwork & { title: string; tryNow?: boolean; composer?: boolean }> = [
  {
    title: "Meet OzAgent — The Last Ad Tool You'll Ever Open",
    placeholder: 'agent artwork',
    composer: true,
  },
  {
    title: 'Templates — Remix Any Winning Ad in Seconds',
    placeholder: 'template collage · 12 stills',
    tryNow: true,
  },
  {
    title: "Seedance 2.0 — The World's Most Powerful Video Model",
    placeholder: 'Seedance 2.0 still',
    tryNow: true,
  },
];

export function PromoRow() {
  return (
    <div className="grid grid-cols-1 gap-space-4 md:grid-cols-2 lg:grid-cols-3">
      {PROMOS.map(({ title, placeholder, image, tryNow, composer }) => (
        <a
          key={title}
          href="#studio-main"
          /* 198px is the measured card height in the reference at a 1920px viewport.
             An arbitrary value rather than a space step because it is a picture box,
             not spacing — the same distinction ComponentIndex draws for its 132px
             well, which is also a fixed height chosen so a row cannot go ragged. */
          className="group relative isolate block h-[198px] overflow-hidden rounded-6 focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
        >
          <div className="absolute inset-0 -z-10">
            {composer ? <MiniComposer /> : <Well image={image} placeholder={placeholder} alt="" />}
          </div>

          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/3" style={SCRIM} />

          {tryNow && (
            <span className="absolute right-space-4 top-space-4">
              <Badge variant="neutral-over-image">Try Now</Badge>
            </span>
          )}

          {/* body-md, not heading-xs, and no measure clamp. At 18px inside a 34ch box
              every one of the three titles wrapped to two lines; the reference sets all
              three on one. This is a caption on artwork rather than a section heading —
              it is the only text in the card, so it does not need to out-rank anything. */}
          <span className="absolute inset-x-0 bottom-0 block p-space-5 font-display text-body-md font-bold text-content-fixed-inverse">
            {title}
          </span>
        </a>
      ))}
    </div>
  );
}

/** The OzAgent card's artwork is a picture of this product's own composer, so it is
 *  the one of the three that can be built rather than sourced. Non-interactive: the
 *  whole card is a link, and a live button inside it would be a target inside a
 *  target — the failure Card's own guidance names. */
function MiniComposer() {
  return (
    <div className="relative isolate flex h-full items-center gap-space-4 bg-gradient-mesh-base p-space-5">
      {/* The same mesh as the hero, weaker and lower. The reference card is not flat —
          it carries a dark red glow along its bottom edge, which is what marks it as the
          product's own surface rather than a photograph. Reusing the tokens means it
          inverts with the page for free, and the card stays legible in light mode where
          a fixed dark panel would have needed a colour outside the system. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(70% 55% at 30% 125%, var(--oz-color-gradient-mesh-3) 0%, transparent 62%)',
        }}
      />
      <span
        aria-hidden="true"
        className="grid h-space-16 w-[132px] shrink-0 place-items-center rounded-6 bg-surface-tertiary"
      >
        <span className="grid h-space-9 w-space-9 place-items-center rounded-full bg-fill-brand text-content-on-brand">
          <ArrowUpIcon className="h-space-5 w-space-5" />
        </span>
      </span>
      <span className="min-w-0 flex-1 rounded-6 border-2 border-border-secondary bg-surface-elevated p-space-4">
        <span className="block truncate text-body-sm text-content-placeholder">
          Describe your campaign, product, or goal…
        </span>
        <span className="mt-space-4 flex items-center gap-space-2 text-content-secondary">
          <span className="grid h-space-7 w-space-7 place-items-center rounded-4 bg-fill-secondary">
            <PlusIcon className="h-space-4 w-space-4" />
          </span>
          <span className="flex items-center gap-space-1 rounded-4 bg-fill-secondary px-space-3 py-space-1 text-label-sm">
            <ProductIcon />
            Product
          </span>
          <span className="flex items-center gap-space-1 rounded-4 bg-fill-secondary px-space-3 py-space-1 text-label-sm">
            <AvatarIcon />
            Avatar
          </span>
        </span>
      </span>
    </div>
  );
}

/* ── Ad Studio row ──────────────────────────────────────────────────────── */

const FORMATS: Array<Artwork & { title: string }> = [
  { title: 'Static product ad', placeholder: 'serum · flat lay' },
  { title: 'UGC talking head', placeholder: 'UGC · creator to camera' },
  { title: 'Product still life', placeholder: 'paddle ball · still life' },
  { title: 'Lifestyle testimonial', placeholder: 'lifestyle · interior' },
  { title: 'Before and after', placeholder: 'skincare · split frame' },
];

export function AdStudioRow() {
  return (
    <section aria-labelledby="ad-studio-heading">
      <div className="mb-space-5 flex flex-wrap items-end gap-space-4">
        <div>
          {/* Uppercase display, as drawn. This is a two-word section eyebrow over a
              strip of tiles, which is the case Section.tsx's note says the treatment
              is actually for — as opposed to the five-word labels it was misused on. */}
          <h2
            id="ad-studio-heading"
            className="font-display text-heading-sm font-bold uppercase text-content-primary"
          >
            Ad Studio
          </h2>
          <p className="mt-space-1 text-body-sm text-content-secondary">
            Recommended formats to get you started
          </p>
        </div>
        <a
          href="#studio-main"
          className="ml-auto flex items-center gap-space-2 rounded-4 text-label-md text-content-secondary transition-colors duration-effects-fast ease-effects-fast hover:text-content-primary focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
        >
          See more
          <ArrowRightIcon />
        </a>
      </div>

      <ul className="grid grid-cols-2 gap-space-5 sm:grid-cols-3 lg:grid-cols-5">
        {FORMATS.map(({ title, placeholder, image }) => (
          <li key={title}>
            <a
              href="#studio-main"
              className="group block overflow-hidden rounded-6 focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
            >
              {/* 4:5, the portrait ratio the reference tiles are cropped to. The label
                  is visually hidden rather than absent: the tile is a link whose only
                  content is artwork, and a link named by a photograph is a link with
                  no name at all. */}
              <span className="block aspect-[4/5] overflow-hidden rounded-6">
                <Well image={image} placeholder={placeholder} alt="" />
              </span>
              <span className="sr-only">{title}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
