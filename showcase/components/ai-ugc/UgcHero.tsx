'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { ArrowRightIcon, StarIcon } from './icons';
import { CTA_PRIMARY, HERO, HERO_CARDS, SOCIAL_PROOF } from './content';

/* ---------------------------------------------------------------------------
 * Hero.
 *
 * BUILT FROM FIGMA node 4442:80522, plus the eight responsive frames that go with it
 * (375, 430, 768, 1025, 1280, 1440, 1920). It replaces the two-column
 * headline-beside-a-video hero that was here before, and the replacement is a different
 * idea rather than a restyle: one centred column of type on a warm glow, with four
 * generated ads arranged around it. The argument for it is the same one the old hero's
 * comment made for the video — show the output, do not describe it — settled a better
 * way. Four stills say "this is what comes out" at a glance and at a fifth of the weight
 * of a 4MB webm, and they say it above the fold on a phone, which the video never did.
 *
 * WHAT WENT, AND WHY IT IS NOT AN OVERSIGHT:
 *
 *   - The framed product video and its window chrome. Superseded by the four stills. The
 *     video itself is still on the page — WhyChoose renders it — and `ProductVideo` below
 *     is still its component, so nothing about the reduced-motion handling was lost.
 *   - The secondary "Watch a 60-second demo" CTA. Every one of the nine frames draws
 *     exactly one button. A second action in the hero was a defensible call when the hero
 *     was mostly text; against a design whose whole composition points at one button it
 *     is an argument with the design rather than an implementation of it.
 *   - "No credit card required · Cancel anytime". Not in any frame. It is not lost: it is
 *     the line the pricing card carries beside its own button, which is where the
 *     objection actually gets raised.
 *
 * SOCIAL PROOF STAYS GATED AND STAYS HERE. The Figma has no slot for it, but the block is
 * a confirmed decision recorded in content.ts, `shipReady: false` means it renders
 * nothing, and the reason it exists — the layout is the expensive part and it is already
 * solved — is unaffected by the hero being redrawn.
 *
 * ONE IMPLEMENTATION, BOTH MODES. The Figma is dark only, and every value it names has a
 * semantic token whose dark value is the one drawn: `bg/subtle` is the page,
 * `content/primary` and `content/brand` are the headline's two colours, `fill/brand` is
 * the button. So this is written in those roles and light mode comes out for free, which
 * is the whole bet of this folder. There is still no `dark:` anywhere in it.
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
 *  No longer used by the hero — see the note above — but still the page's only video
 *  component, and still the only place the preference above is honoured.
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

/** The warm glow behind everything.
 *
 *  FIGMA DRAWS THIS as one ellipse filled with a radial gradient: `#FF3D00` at 50% alpha
 *  in the centre falling to 0 at the edge, with radii of 1.125× the frame width and a
 *  flat 711px, centred 882px down the page. The vertical radius is identical in all nine
 *  frames, so it is px here too — expressing it as a percentage of the section's height would
 *  make the glow grow with the hero and stop matching any frame.
 *
 *  AND EVERY LAYER CARRIES A 350px LAYER BLUR, which is the whole character of the effect and
 *  which the first version of this shipped without. Unblurred, a radial gradient has a bright
 *  core and a kink where its alpha ramp meets zero at the ellipse edge, and the thing reads as
 *  emerging from the middle of the page — which is exactly how Sarib described it. Blurred, it
 *  is a wash with no core and no edge. The number in the Figma panel is a diameter: the layer
 *  exports as `feGaussianBlur stdDeviation="175"`, and CSS `blur()` takes the deviation, so it
 *  is `blur(175px)` and not `blur(350px)`. Confirmed off the exported SVG rather than assumed.
 *
 *  ONE ELEMENT PER LAYER, because Figma blurs each of its three ellipses on its own and
 *  composites afterwards. Several background layers on one element are composited and then
 *  blurred together, which is a different picture whenever an opaque layer sits over a
 *  translucent one — and the cap is opaque over the warm coat, so it is precisely that case.
 *
 *  The two coats of `gradient/halo` DO share one element and one blur, deliberately: they are
 *  the same hue and the same ellipse, so the only thing compositing them buys is the alpha,
 *  and 51% against the drawn 50% survives a 175px blur with nothing to see. Two coats is
 *  still what gets the peak — see below — and a `gradient/halo-strong` at 50% would be a
 *  token-layer change for one decorative wash.
 *
 *  BOTH COATS ARE PLACED FROM THE SECTION'S CENTRE LINE, not from its top, because the copy
 *  is centred there and a glow pinned to the top would slide out from under the words as the
 *  screen height changed — a different ground under the headline on every laptop, and the
 *  contrast verdict along with it. Centre-relative, the whole composition is invariant to
 *  viewport height.
 *
 *  The offsets are Figma's distances from the *text block's* centre rather than its page
 *  coordinates: the file puts the text at 430–694 (centre 562) and the warm ellipse at 882,
 *  so +320; the cap at -194, so -756. Using page coordinates directly is what put this hero
 *  one header-height low before — Figma draws the nav inside the hero frame and measures from
 *  the top of the document, where here the header is its own element ahead of the section.
 *
 *  THE COLOUR IS `gradient/halo`, which is brand at 30% alpha and is the only token that
 *  carries alpha for this job — and alpha is the whole point of the layer, because at 50%
 *  over the page this reads as deep burnt orange while the same hue at full strength is
 *  the brand fill itself. A1 in DECISIONS.md rejected `mesh-4` as a large-area wash for
 *  exactly that reason and the reasoning still holds; the answer here is not a cooler hue
 *  but a transparent one. Two coats of the 30% token measure 51%, which is the 50% the
 *  design asks for and needs no hand-computed alpha to say so.
 *
 *  THE DARK CAP OVER THE TOP IS LOAD-BEARING AND WAS NEARLY MISSED. Figma's other two
 *  layers are named "gradient-white" and are not white: they are `#151312` to `#070605`,
 *  and they are later siblings, so they paint *over* the glow rather than under it. The
 *  upper one is an ellipse whose centre is 194px above the page and whose radius reaches
 *  y 830 in Figma's coordinates — which is to say it dims the glow across exactly the band the headline occupies,
 *  and it is the reason the drawn headline sits on a near-black ground while the glow
 *  blooms below it.
 *
 *  Leaving it out is not a cosmetic difference. Measured with a compositing sweep over the
 *  text band, `content/brand` on the uncapped glow came to 4.39:1 in dark — under the 4.5
 *  floor, and failing in the one place on this page where the accent is the whole point.
 *  Nothing about the floor was negotiated: the missing layer was found and added, and the
 *  pair now measures 4.96:1 in dark and 5.22:1 in light, worst row of the swept band in
 *  each. The two quieter roles clear it wider — `content/primary` at 12.51:1 and
 *  `content/secondary` at 7.30:1 in dark. This is CLAUDE.md rule 4 arriving through a background
 *  instead of a token — the glow created a pairing no gate could see, because both gate
 *  suites measure a foreground against an opaque token and this ground is a composite.
 *
 *  THE SWEEP IS NOW A GATE: scripts/verify-glow.ts, wired into `npm run verify`. It reads
 *  its own model of this stack rather than parsing it out of here, so if these coats are
 *  retuned, retune the copy in that file too or the new ground goes unmeasured. That is the
 *  one thing about this arrangement that can rot, and it is stated in both places.
 *
 *  `gradient/mesh-base` rather than `surface/primary` for the cap: it is the same value in
 *  dark (#151312, Figma's exactly), it is the gradient family's own base, and a stop in a
 *  gradient belongs to the gradient group.
 *
 *  The lower vignette is Figma's third layer, which in the file starts below the hero and
 *  fades the glow out over the next 800px of page. That cannot be reproduced literally
 *  here, because the glow is clipped to this section — so it is a fade to `background`
 *  inside the section's last quarter instead, which buys the same soft ending and keeps
 *  the seam with the section below from being a hard warm edge. */
/** How far each blurred layer is grown past the section, and why it has to be.
 *
 *  `filter: blur()` samples outside the element's own box, and outside the box there is
 *  nothing — so an un-grown layer fades out over ~3σ at all four of its edges. Vertically
 *  that would eat the cap right where it is doing its job; horizontally it would add a
 *  vignette the drawing does not have, because Figma's ellipse is 2.25× the frame wide and
 *  never reaches the sides. 3σ is 525px at σ=175, so 600 clears it, and the section's
 *  `overflow-hidden` throws the surplus away. */
const GLOW_BLEED = 600;

/** σ, not the number in the Figma panel. Figma's "Layer blur: 350" exports as
 *  `feGaussianBlur stdDeviation="175"` — the panel states a diameter — and CSS `blur()`
 *  takes the standard deviation. Read off the exported SVG rather than halved on faith. */
const GLOW_BLUR = 'blur(175px)';

/** One blurred coat. Its own element, because Figma's layers are blurred independently and
 *  only then composited, which is not what one element with several background layers does:
 *  that blurs the composite. For opaque-over-translucent — which the cap is — the two are
 *  visibly different. */
function GlowLayer({ image }: { image: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        inset: `-${GLOW_BLEED}px`,
        filter: GLOW_BLUR,
        backgroundImage: image,
      }}
    />
  );
}

/* Horizontal radii are `vw` and not `%`. A percentage would resolve against the grown box,
 * which is 1200px wider than the section, and the ellipse would inflate with the bleed.
 * Figma's radii are fractions of the FRAME, and the frame is the viewport here, so `vw` is
 * the honest unit and it makes GLOW_BLEED free to change. The vertical radii are already px
 * in the file — identical in all nine frames — so they stay px. */
const HALO_COAT =
  'radial-gradient(112.5vw 711px at 50% calc(50% + 320px), var(--oz-color-gradient-halo) 0%, transparent 100%)';

function HeroGlow() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10">
      {/* Warm first, cap over it, matching the sibling order in the file. */}
      <GlowLayer image={`${HALO_COAT}, ${HALO_COAT}`} />
      <GlowLayer image="radial-gradient(50vw 1024px at 50% calc(50% - 756px), var(--oz-color-gradient-mesh-base) 0%, transparent 100%)" />

      {/* NOT blurred, and not grown. Blurring a fade whose whole job is to arrive exactly at
          the section's bottom edge would feather away the edge it exists to hide, and growing
          it would move that edge outside the clip. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, transparent 78%, var(--oz-color-background) 100%)',
        }}
      />
    </div>
  );
}

/** The four generated ads, in whichever arrangement the width calls for.
 *
 *  One list, two layouts, both read off HERO_CARDS — see the geometry note there. Below
 *  `lg` this is a band in the flow at the foot of the hero; from `lg` it is an absolute
 *  layer over the whole section. Either way each card is positioned, so only the offsets
 *  change across the breakpoint.
 *
 *  THE ROTATION SITS ON AN INNER ELEMENT, and that is load-bearing rather than tidy:
 *  `.oz-enter-rise` finishes on `transform: none` with `animation-fill-mode: both`, so an
 *  entrance animation and a static tilt on the same element means the animation flattens
 *  the tilt and holds it flat. Two elements let the outer one animate and the inner one
 *  stay tilted.
 *
 *  A static `rotate` needs no `--oz-motion-spatial-scale`: the multiplier removes travel,
 *  and this is orientation — it never moves, so there is nothing for reduced motion to
 *  collapse. The stagger below is on the entrance, which is already graded by the
 *  keyframe it plays.
 *
 *  `z-0` against the copy's `z-10`, so the paint order does not depend on which layout is
 *  in force: at `lg` these come after the copy in the DOM and would otherwise cover it. */
function HeroStills() {
  return (
    /* The gap above the band is small on purpose: the 375 frame leaves 20px between the
       CTA and the first card, which is what makes the hero read as one screen with the
       collage as its floor rather than as a section with pictures under it. */
    <ul className="relative z-0 mt-space-6 h-[220px] sm:mt-space-12 sm:h-[300px] md:mt-space-16 md:h-[424px] lg:absolute lg:inset-0 lg:mt-0 lg:h-auto">
      {HERO_CARDS.map((card, i) => (
        <li
          key={card.src}
          className={`oz-enter-rise absolute ${card.collage} ${card.scattered}`}
          /* Staggered by index so the four read as arriving rather than appearing. The
             delay is a fraction of the spring the class already uses, so it stays in
             step with the token if the spring is retuned. */
          style={{ animationDelay: `calc(var(--oz-spring-spatial-default-ms) * ${0.18 * (i + 1)})` }}
        >
          <div className={`h-full w-full ${card.tilt}`}>
            <img
              src={card.src}
              alt={card.alt}
              /* No lazy loading and no async decode: this is the fold. `fetchPriority`
                 pulls them level with the headline's font rather than behind it. */
              fetchPriority="high"
              className="h-full w-full rounded-11 object-cover shadow-large lg:rounded-10"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** The one button.
 *
 *  Figma's annotation on it: "only on hover will the arrow appear in a smooth animation".
 *
 *  THE ARROW'S SPACE IS RESERVED and only its paint is withheld, rather than the arrow
 *  being added to the flow on hover. Animating it in would change the button's width, and
 *  a primary CTA that grows under the cursor moves its own hit target away from the
 *  pointer that is arriving at it.
 *
 *  THE TRAVEL GOES THROUGH `--oz-motion-spatial-scale` and the fade does not, which is
 *  the point of splitting them: under `prefers-reduced-motion` the multiplier is 0, the
 *  slide collapses to nothing, and the arrow simply fades in. The two properties also get
 *  their own springs — the fade on `effects`, which must not overshoot, and the slide on
 *  `spatial`, which must. One spring for both would break rule 1b on whichever of the two
 *  it was wrong for.
 *
 *  Keyed on focus-visible as well as hover, because a keyboard user gets to this button
 *  without a pointer and should see the same affordance.
 *
 *  `size="xl"` `shape="rect"` is not an approximation of the Figma button — it is the
 *  same object. The recipe's xl row is 56px tall with 20px of horizontal padding, an 8px
 *  gap, a 20px medium label and a 16px radius, and Figma draws 56 / 20 / 8 / 20 / 16. */
function HeroCta() {
  return (
    <Button
      variant="primary"
      size="xl"
      shape="rect"
      className="group"
      trailingIcon={
        <span
          aria-hidden="true"
          className="inline-flex translate-x-[calc(var(--oz-space-3)*var(--oz-motion-spatial-scale)*-1)] opacity-0 [transition-duration:var(--oz-spring-effects-default-ms),var(--oz-spring-spatial-default-ms)] [transition-property:opacity,transform] [transition-timing-function:var(--oz-spring-effects-default),var(--oz-spring-spatial-default)] group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
        >
          <ArrowRightIcon className="h-[26px] w-[26px]" />
        </span>
      }
    >
      {CTA_PRIMARY}
    </Button>
  );
}

export function UgcHero() {
  return (
    <section
      aria-labelledby="ugc-headline"
      /* `overflow-hidden` is what makes the collage a design rather than a scrollbar:
         every frame draws cards past both edges and past the section's foot, and this is
         the clip they were drawn against. `isolate` keeps the glow's negative z-index
         inside the section instead of behind the page.

         FROM `lg` THE HERO IS THE SCREEN, AND THE COPY IS CENTRED IN IT. This replaced a
         fixed 984px section with the copy pinned 360px down, which is what the frames draw
         and which does not survive contact with a real laptop: the file's hero is 1054px
         tall, so on an 857px viewport the copy had 434px of air above it and 151px below and
         read as sitting near the bottom of the screen. Percentages do not fix that — a `%`
         padding resolves against the section's own height, so it is still one fixed ratio,
         failing short screens and tall ones in opposite directions.

         `100svh` minus the bar, and `svh` rather than `vh` deliberately: on mobile `vh` is
         the *largest* viewport, so a `vh`-sized hero hides its own bottom edge behind the
         browser toolbars. The bar's height is measured and published by UgcHeader rather
         than written here — see useNavHeight — because this file guessing it is how the copy
         ended up one header-height low in the first place. The 74px fallback is for first
         paint and for no-JS.

         `min-h`, not `h`: if the copy ever needs more room than the screen it takes it. */
      className="relative isolate overflow-hidden bg-background lg:grid lg:min-h-[calc(100svh-var(--ugc-nav,74px))] lg:content-center"
    >
      <HeroGlow />

      {/* No vertical padding from `lg` up — the section centres this block, and every card
          and both glow coats are placed as offsets from that same centre line. That is what
          makes the composition hold its shape at any screen height instead of being pushed
          down by a fixed pad. The padding below `lg` is spacing on a page that scrolls, so it
          comes off the ramp. */}
      <div className="oz-enter-hero relative z-10 px-space-6 pt-space-6 text-center sm:pt-space-14 md:pt-space-18 lg:py-0">
        {/* Two measures, not one. Figma sets 56px type in a 768px column, which breaks to
            two lines; `display-lg` tops out at 64px, which is the step this scale has for
            the biggest line on a page and the closest one to the drawing — but at 64px a
            768px column breaks to three. The headline gets the wider measure so the
            design's two-line silhouette survives the type step, and the sub-headline
            keeps Figma's 768 exactly. Capped in px rather than ch for the reason the old
            hero recorded: a ch is the width of a "0", and in a display face it measures
            far wider than the text it is meant to be sizing.

            `font-semibold` is Figma's weight. It was extrabold here, which is a heavier
            face than the design specifies at every size on the page. */}
        <h1
          id="ugc-headline"
          className="mx-auto max-w-[880px] text-balance font-display text-display-lg font-semibold text-content-primary"
        >
          {HERO.headline} <span className="text-content-brand">{HERO.headlineAccent}</span>
        </h1>

        {/* space-3 between an 8px-gapped headline and sub is Figma's, and it is tighter
            than this page's other heading/lede pairs on purpose: the two lines are one
            statement here, not a heading and its section. */}
        <p className="mx-auto mt-space-3 max-w-container-md text-body-lg text-content-secondary">
          {HERO.sub}
        </p>

        <div className="mt-space-5 flex justify-center">
          <HeroCta />
        </div>

        <SocialProof />
      </div>

      <HeroStills />
    </section>
  );
}
