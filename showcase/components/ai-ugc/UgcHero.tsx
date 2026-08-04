'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { ArrowRightIcon, PlayIcon, StarIcon } from './icons';
import { CTA_PRIMARY, CTA_SECONDARY, HERO, SOCIAL_PROOF } from './content';

/* ---------------------------------------------------------------------------
 * Hero.
 *
 * Five of the brief's seven hero points land here: an outcome headline instead of the
 * feature name, an actual visual instead of pure text, a trimmed subhead, a CTA that
 * says what happens, and a secondary route for someone not ready to sign up. The sixth
 * — social proof under the CTA — is built and deliberately switched off; see
 * SOCIAL_PROOF in content.ts. The seventh was contrast, and it is handled by using a
 * gated pair rather than by checking one: content/on-brand on fill/brand is measured at
 * APCA Lc 66.7 in reports/audit.json, which is the pairing `Button variant="primary"`
 * already binds.
 * ------------------------------------------------------------------------- */

/** Does this reader want movement?
 *
 *  An autoplaying looping video is exactly the ambient motion CLAUDE.md's reduced-motion
 *  policy exists to stop — and it is the one kind the token layer cannot reach, because
 *  `.oz-ambient` switches off CSS animation and a <video> element ignores it entirely.
 *  So the preference is read here and the video is paused rather than played. It keeps
 *  its controls and its poster, so the content is still reachable; what goes away is the
 *  movement nobody asked for.
 *
 *  Read in an effect, not during render: matchMedia does not exist on the server. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const sync = () => setReduced(mq.matches);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return reduced;
}

/** The product, moving. Autoplay is conditional; controls are always available.
 *
 *  `muted` and `playsInline` are not decoration — without both, mobile Safari refuses to
 *  autoplay at all and the reader gets a still frame with no explanation. */
export function ProductVideo({
  src,
  poster,
  label,
  className = '',
}: {
  src: string;
  poster: string;
  label: string;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (reduced) v.pause();
    else void v.play().catch(() => {
      /* Autoplay refused — a data-saver setting or a browser policy. The poster and the
       * controls are still there, which is the whole reason both are set. */
    });
  }, [reduced]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      aria-label={label}
      controls
      muted
      loop
      playsInline
      preload="metadata"
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

function SocialProof() {
  /* Gated, not commented out. The block is real code so the layout is already solved,
   * and a boolean is a smaller thing to flip than a section is to write — but until
   * somebody supplies figures that are true, rendering it would put invented numbers on
   * a page whose whole job is to be believed. */
  if (!SOCIAL_PROOF.shipReady) return null;

  return (
    <div className="mt-space-7 flex flex-wrap items-center justify-center gap-x-space-7 gap-y-space-4">
      <div className="flex items-center gap-space-3">
        <span aria-hidden="true" className="flex text-content-warning">
          {[0, 1, 2, 3, 4].map((i) => (
            <StarIcon key={i} className="h-space-5 w-space-5" />
          ))}
        </span>
        <span className="text-body-sm text-content-secondary">
          <span className="font-medium text-content-primary">
            {SOCIAL_PROOF.rating}/{SOCIAL_PROOF.ratingOutOf}
          </span>{' '}
          from {SOCIAL_PROOF.reviewCount} reviews on {SOCIAL_PROOF.reviewSource}
        </span>
      </div>
      <p className="text-body-sm text-content-secondary">
        Used by <span className="font-medium text-content-primary">{SOCIAL_PROOF.brandCount}</span>{' '}
        brands
      </p>
    </div>
  );
}

/** The product in a frame, on a canvas, wearing two tags.
 *
 *  C21, C24 and E31 in one component.
 *
 *  THE FRAME is a window, not a phone. A phone bezel around a 9:16 video says "this is a
 *  phone screenshot"; a window with three dots says "this is our app", which is the thing
 *  being sold. Built from three tokens and a radius — there is no chrome asset and none is
 *  needed.
 *
 *  THE CANVAS is `.oz-canvas`, which already exists in globals.css and is already a
 *  token-built dot grid — the exact "dark viewport with a subtle dot-grid" E31 asks for,
 *  at no cost. It also solves a real problem: a 9:16 video in a 2-up column leaves dead
 *  space either side, and dead space that is textured reads as a stage rather than as a
 *  gap.
 *
 *  THE TAGS use Badge's `neutral-over-image` variant, which exists precisely because a
 *  label sitting on a photograph cannot use the page's content roles. Not invented
 *  metrics — they name what the video is, which is a claim the video itself supports. */
function HeroShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="oz-canvas overflow-hidden rounded-8 border-2 border-border-secondary p-space-6 shadow-large">
        {/* Window chrome. Decorative, so aria-hidden — three dots are not information. */}
        <div
          aria-hidden="true"
          className="mb-space-5 flex items-center gap-space-3 rounded-4 bg-surface-secondary px-space-4 py-space-3"
        >
          <span className="h-space-3 w-space-3 rounded-full bg-fill-critical" />
          <span className="h-space-3 w-space-3 rounded-full bg-fill-warning" />
          <span className="h-space-3 w-space-3 rounded-full bg-fill-success" />
          <span className="ml-space-3 h-space-3 flex-1 rounded-full bg-fill-tertiary" />
        </div>

        {/* The video, centred on the canvas at its native portrait ratio. */}
        <div className="relative mx-auto w-full max-w-[300px]">
          <div className="overflow-hidden rounded-6 border-2 border-border-secondary bg-surface-primary shadow-medium">
            <div className="aspect-[9/16]">
              <ProductVideo
                src={HERO.video}
                poster={HERO.poster}
                label="Example UGC ad generated with HeyOz"
              />
            </div>
          </div>

          {/* F47: the tags sit on their own elevation step above the video, which is what
              makes the stack read as depth rather than as one flat image. Negative offsets
              so they overhang the frame — an element that breaks its container's edge is
              the cheapest depth cue there is, and it costs no shadow. */}
          <span className="absolute -left-space-5 top-space-7 shadow-medium">
            <Badge variant="neutral-over-image">9:16 · ready to post</Badge>
          </span>
          <span className="absolute -right-space-5 bottom-space-9 shadow-medium">
            <Badge variant="neutral-over-image">AI voice · 30+ options</Badge>
          </span>
        </div>
      </div>
    </div>
  );
}

export function UgcHero() {
  return (
    <section
      aria-labelledby="ugc-headline"
      /* The gradient is the token set's, so the hero inverts with the page for free —
         white-to-coral in light, near-black-to-deep-red in dark. Same three rungs the
         studio hero uses, and the same reason the stops sit low: full saturation belongs
         at the very bottom edge, not across the middle of the panel. */
      className="relative isolate overflow-hidden bg-gradient-mesh-base px-space-6 pb-space-16 pt-space-14"
    >
      {/* Softened, per A1. Two changes: the hot rung is mesh-3 rather than mesh-4 — one
          step cooler, and mesh-4 in dark is #FF3D01, the brand fill itself, which has no
          business being the largest area of colour on the page — and the linear now tops
          out at mesh-3 instead of running to the floor, so the wash reads as a glow under
          the content rather than as a band across it. No opacity involved: the preset has
          no <alpha-value> slot, so "lower the opacity" is spelled "pick a lower rung". */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: [
            'radial-gradient(50% 34% at 50% 108%, var(--oz-color-gradient-mesh-3) 0%, transparent 62%)',
            'linear-gradient(to bottom, transparent 58%, var(--oz-color-gradient-mesh-3) 100%)',
          ].join(', '),
        }}
      />

      {/* Two columns from lg, per C23. The single centred column put a 640px-tall video
          below a centred headline, which is 1250px of hero before anything else — and it
          wasted the whole right half of a 1920 viewport. Text left, product right, both
          vertically centred: the asymmetry is the point, and it halves the fold. Still one
          centred column below lg, where two would be 180px wide each. */}
      <div className="mx-auto grid max-w-container-xl items-center gap-space-12 lg:grid-cols-2 lg:gap-space-14">
        {/* LEFT: the argument. */}
        <div className="text-center lg:text-left">
          {/* Capped in px, not ch. A `ch` is the width of a "0" in the current font, and in
              an extrabold display face at 52px that is wide enough that a ch-based measure
              read far narrower than it looked — the headline broke to four lines. Every
              other measure on this page is in ch because it is prose at a reading size,
              where ch is the right unit; a display headline is not prose. `text-balance`
              evens the lines instead of filling the first and orphaning the last. */}
          <h1
            id="ugc-headline"
            className="mx-auto text-balance font-display text-display-md font-extrabold text-content-primary lg:mx-0"
          >
            {HERO.headline} <span className="text-content-brand">{HERO.headlineAccent}</span>
          </h1>

          <p className="mx-auto mt-space-6 max-w-[58ch] text-body-lg text-content-secondary lg:mx-0">
            {HERO.sub}
          </p>

          {/* The sticky bottom bar watches this id — see UgcStickyCta. */}
          <div
            id="ugc-hero-cta"
            className="mt-space-9 flex flex-col items-center gap-space-4 sm:flex-row sm:justify-center lg:justify-start"
          >
            <Button variant="primary" size="lg" shape="pill" trailingIcon={<ArrowRightIcon />}>
              {CTA_PRIMARY}
            </Button>
            {/* Outline, not a second primary. A secondary CTA that looks primary splits the
                click rather than capturing a different intent. */}
            <Button variant="outline" size="lg" shape="pill" leadingIcon={<PlayIcon />}>
              {CTA_SECONDARY}
            </Button>
          </div>

          {/* E39: the sub-copy belongs under the button whose objection it removes, not in
              the footer. One muted line. */}
          <p className="mt-space-5 text-body-sm text-content-tertiary">
            No credit card required · Cancel anytime
          </p>

          <SocialProof />
        </div>

        {/* RIGHT: the product, in a frame. */}
        <HeroShowcase />
      </div>
    </section>
  );
}
