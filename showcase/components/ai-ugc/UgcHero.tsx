'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
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
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: [
            'radial-gradient(60% 40% at 50% 110%, var(--oz-color-gradient-mesh-4) 0%, transparent 60%)',
            'linear-gradient(to bottom, transparent 40%, var(--oz-color-gradient-mesh-3) 100%)',
          ].join(', '),
        }}
      />

      <div className="mx-auto max-w-container-xl">
        {/* 24ch was far too tight: at display-md this headline broke into five lines and
            split "scroll-stopping" across two of them, which is the one place a hyphen
            break is unreadable. Wider measure plus `text-balance`, which lets the browser
            even out the lines rather than filling the first and orphaning the last —
            a headline is the one element worth spending that on.

            Capped in px, not ch. A `ch` is the width of a "0" in the current font, and
            in an extrabold display face at 52px that is wide enough that 34ch measured
            far narrower than it reads — the headline still broke to four lines. Every
            other measure on this page is in ch because it is prose at a reading size,
            where ch is the right unit; a display headline is not prose. */}
        <div className="mx-auto max-w-[860px] text-center">
          <h1
            id="ugc-headline"
            className="text-balance font-display text-display-md font-extrabold text-content-primary"
          >
            {HERO.headline}{' '}
            <span className="text-content-brand">{HERO.headlineAccent}</span>
          </h1>
        </div>

        <p className="mx-auto mt-space-6 max-w-[58ch] text-center text-body-lg text-content-secondary">
          {HERO.sub}
        </p>

        {/* The sticky header watches this id — see UgcHeader. */}
        <div
          id="ugc-hero-cta"
          className="mt-space-9 flex flex-col items-center justify-center gap-space-4 sm:flex-row"
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

        <SocialProof />

        {/* The visual. 9:16 because that is the aspect the product outputs and the aspect
            every platform it publishes to expects — showing a UGC tool's output in a
            16:9 box misrepresents the thing being sold. Capped in height so the hero
            still fits a laptop viewport. */}
        <div className="mx-auto mt-space-12 w-full max-w-[360px]">
          <div className="overflow-hidden rounded-8 border-2 border-border-secondary bg-surface-primary shadow-large">
            {/* aspect-ratio alone. With max-h as well the two fought: the ratio asked
                for 640px at this width, the cap said 560, and the box ended up wider than
                9:16 with the video letterboxed inside its own frame. The width cap above
                is what controls the size. */}
            <div className="aspect-[9/16]">
              <ProductVideo
                src={HERO.video}
                poster={HERO.poster}
                label="Example UGC ad generated with HeyOz"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
