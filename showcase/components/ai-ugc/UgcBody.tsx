'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { Band, BandHead } from './UgcChrome';
import { ProductVideo } from './UgcHero';
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FEATURE_ICONS,
} from './icons';
import { CTA_PRIMARY, FEATURES, STEPS, USE_CASES, WHY } from './content';

/* ---------------------------------------------------------------------------
 * Why choose.
 *
 * The brief's highest-priority item is here: the live page ships a visible "Feature
 * Image" placeholder box, which it calls the single fastest way to lose a reader's
 * trust. It is now the real product video, at the size the design gave the placeholder.
 *
 * The bullets were 16px orange marks with heavy left padding and no baseline alignment.
 * They are 24px marks in a tinted disc, aligned to the first line's cap height by a
 * fixed-width column rather than by eye — the same device Notes uses in Section.tsx.
 * ------------------------------------------------------------------------- */
export function WhyChoose() {
  return (
    <Band id="why" tone="surface">
      <div className="grid items-center gap-space-12 lg:grid-cols-2">
        <div>
          <BandHead eyebrow="Why UGC" title={WHY.heading} align="left" />
          <p className="mt-space-6 max-w-[58ch] text-body-md text-content-secondary">{WHY.body}</p>

          <ul className="mt-space-9 oz-stack oz-stack-6">
            {WHY.bullets.map((b) => (
              <li key={b} className="flex gap-space-5">
                <span
                  aria-hidden="true"
                  className="grid h-space-9 w-space-9 shrink-0 place-items-center rounded-full bg-fill-brand-secondary text-content-brand"
                >
                  <CheckIcon className="h-space-6 w-space-6" />
                </span>
                {/* pt centres the text's cap height against a 32px disc without a
                    flex-align guess that breaks when the line wraps. */}
                <span className="pt-space-2 text-body-lg text-content-primary">{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-space-11">
            <Button variant="primary" size="lg" shape="pill" trailingIcon={<ArrowRightIcon />}>
              {CTA_PRIMARY}
            </Button>
          </div>
        </div>

        {/* Was the placeholder. A frame, a radius and a shadow so it has the visual
            weight the brief says the grey box lacked — elevation in light, and in dark
            the surface rung does that job because a drop shadow on a near-black page
            barely reads. */}
        <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-8 border-2 border-border-secondary bg-surface-elevated shadow-large">
          {/* Ratio only — see the note on the hero video for why max-h cannot coexist
              with it. */}
          <div className="aspect-[9/16]">
            <ProductVideo
              src={WHY.video}
              poster={WHY.poster}
              label="A UGC ad being generated in HeyOz"
            />
          </div>
        </div>
      </div>
    </Band>
  );
}

/* ---------------------------------------------------------------------------
 * Key features.
 *
 * Six equal cards became five real ones with two flagged. The brief's point was that
 * identical visual weight gives the reader no way in; lip-sync and multi-language are
 * the two a competitor cannot trivially match, so they get the badge and the wider cell.
 *
 * Cards are links with a hover lift and a real focus ring, on a tinted surface with a
 * stroke — which is an `affordance` under rule 1c, because the whole card is the
 * control. The lift is a shadow change on the effects family, not a translate: rule 1b
 * keeps colour and opacity off the springs that overshoot, and a card that jumps under
 * the cursor is the "bouncy and cheap" failure CLAUDE.md names.
 * ------------------------------------------------------------------------- */
export function KeyFeatures() {
  return (
    <Band id="features">
      <BandHead
        eyebrow="Key features"
        title="Everything a creator-style ad needs, without a creator"
        lede="Five things the tool does. The first two are the ones people switch for."
      />

      <ul className="mt-space-12 grid gap-space-5 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i] ?? FEATURE_ICONS[0];
          return (
            <li key={f.title} className={f.flagship ? 'lg:col-span-3 xl:col-span-1' : ''}>
              <a
                href="#how-it-works"
                className={`group flex h-full flex-col gap-space-5 rounded-6 border-2 p-space-7 transition-shadow duration-effects-default ease-effects-default hover:shadow-medium focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus ${
                  f.flagship
                    ? 'border-border-brand bg-fill-brand-secondary'
                    : 'border-border-secondary bg-surface-primary'
                }`}
              >
                <span className="flex items-center gap-space-4">
                  <span
                    aria-hidden="true"
                    className={`grid h-space-11 w-space-11 shrink-0 place-items-center rounded-5 ${
                      f.flagship
                        ? 'bg-fill-brand text-content-on-brand'
                        : 'bg-fill-tertiary text-content-secondary'
                    }`}
                  >
                    <Icon className="h-space-7 w-space-7" />
                  </span>
                  {f.flagship && <Badge variant="brand">Flagship</Badge>}
                </span>

                <span className="block">
                  <span className="block font-display text-heading-sm font-bold text-content-primary">
                    {f.title}
                  </span>
                  <span className="mt-space-3 block text-body-md text-content-secondary">
                    {f.body}
                  </span>
                </span>

                <span className="mt-auto flex items-center gap-space-2 pt-space-4 text-label-md font-medium text-content-brand">
                  See it in the flow
                  <ArrowRightIcon className="h-space-5 w-space-5" />
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </Band>
  );
}

/* ---------------------------------------------------------------------------
 * Use cases.
 *
 * A carousel with the three things the brief says the live one lacks: arrows big enough
 * to hit and contrasty enough to see, dot indicators that say how much is left, and a
 * whole card that is the click target rather than a 12px arrow inside it.
 *
 * The scroll container is focusable and labelled for the same reason ScrollRegion exists
 * on the showcase routes — a scroller with no focusable child cannot be operated without
 * a pointer (WCAG 2.1.1). It is hand-rolled rather than reused because the arrows need a
 * ref to scroll, which ScrollRegion does not expose; the reasoning is the same and the
 * duplication is one `tabIndex`.
 *
 * NO THUMBNAILS, and it is the one brief item here I could not do. Per-use-case imagery
 * does not exist in the file or on the live page, and a stock photo of a shoe would be a
 * claim about output the product did not make. Each card gets a tinted plate instead.
 * ------------------------------------------------------------------------- */
export function UseCases() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const per = Math.max(1, Math.round(el.clientWidth / (el.firstElementChild?.clientWidth || 1)));
    setPages(Math.max(1, Math.ceil(USE_CASES.length / per)));
    setPage(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener('scroll', measure, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', measure);
    };
  }, [measure]);

  const go = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  const toPage = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <Band id="use-cases" tone="surface">
      <div className="flex flex-wrap items-end gap-space-6">
        <BandHead
          eyebrow="Use cases"
          title="Built for the things people actually sell"
          align="left"
        />
        {/* 44px targets on a stroke, which is the brief's "small and low-contrast" fix. */}
        <div className="ml-auto flex gap-space-3">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous use cases"
            className="grid min-h-target min-w-target place-items-center rounded-full border-2 border-border-primary bg-surface-elevated text-content-primary transition-colors duration-effects-fast ease-effects-fast hover:bg-fill-secondary-hover focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
          >
            <ChevronLeftIcon className="h-space-6 w-space-6" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="More use cases"
            className="grid min-h-target min-w-target place-items-center rounded-full border-2 border-border-primary bg-surface-elevated text-content-primary transition-colors duration-effects-fast ease-effects-fast hover:bg-fill-secondary-hover focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
          >
            <ChevronRightIcon className="h-space-6 w-space-6" />
          </button>
        </div>
      </div>

      <ul
        ref={trackRef}
        tabIndex={0}
        role="region"
        aria-label="Use cases — scrolls horizontally"
        className="mt-space-9 flex snap-x snap-mandatory gap-space-5 overflow-x-auto pb-space-4 focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
      >
        {USE_CASES.map((u) => (
          <li key={u.slug} className="w-[264px] shrink-0 snap-start">
            <a
              href={`#use-cases`}
              className="group flex h-full flex-col overflow-hidden rounded-6 border-2 border-border-secondary bg-background transition-shadow duration-effects-default ease-effects-default hover:shadow-medium focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
            >
              {/* The plate. Tinted from the token set rather than a stock photograph —
                  see the note above about imagery that does not exist. */}
              <span
                aria-hidden="true"
                className="block aspect-[4/3] bg-fill-brand-secondary"
                style={{
                  backgroundImage:
                    'radial-gradient(70% 60% at 30% 110%, var(--oz-color-gradient-mesh-4) 0%, transparent 65%)',
                }}
              />
              <span className="flex flex-1 items-center justify-between gap-space-4 p-space-5">
                <span className="min-w-0 text-body-md font-medium text-content-primary">
                  {u.label}
                </span>
                <ArrowRightIcon className="h-space-5 w-space-5 shrink-0 text-content-tertiary transition-colors duration-effects-fast ease-effects-fast group-hover:text-content-brand" />
              </span>
            </a>
          </li>
        ))}
      </ul>

      {/* Dots. The brief asks for "how many cards exist"; a dot per page answers that
          better than a dot per card when there are 35 of them upstream. Buttons, not
          decoration, so a pointer user can jump. */}
      <div className="mt-space-6 flex items-center justify-center gap-space-3">
        {Array.from({ length: pages }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toPage(i)}
            aria-label={`Go to use cases, page ${i + 1} of ${pages}`}
            aria-current={i === page}
            className={`h-space-3 rounded-full transition-all duration-effects-default ease-effects-default focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus ${
              i === page ? 'w-space-9 bg-fill-brand' : 'w-space-3 bg-fill-tertiary'
            }`}
          />
        ))}
      </div>
    </Band>
  );
}

/* ---------------------------------------------------------------------------
 * How it works.
 *
 * The brief calls this the strongest section and asks for five changes: bigger step
 * numerals, a consistent zig-zag, an annotation on each still, the duplicate CTA moved
 * off the top, and motion instead of static frames.
 *
 * Four of the five are done. The zig-zag is derived from the index so it cannot drift.
 * The numerals are 56px display figures rather than 24px circles. The annotation is a
 * caption under each still, because this repo cannot draw arrows onto an image it did
 * not author. The CTA is at the end of the section now.
 *
 * The fifth — autoplaying clips per step — is not: the four step assets are .webp
 * stills, and the only moving asset on the page is UGC_6.webm, already used twice above.
 * Four short screen recordings would do it, and they do not exist yet.
 * ------------------------------------------------------------------------- */
export function HowItWorks() {
  return (
    <Band id="how-it-works">
      <BandHead
        eyebrow="How it works"
        title="Four steps, about five minutes"
        lede="From a blank script to a published ad, without opening a camera app."
      />

      <ol className="mt-space-14 oz-stack oz-stack-16">
        {STEPS.map((s, i) => {
          /* Derived, not authored. The brief flags the live alternation as inconsistent,
             and a side computed from the index cannot be. */
          const mediaFirst = i % 2 === 1;
          return (
            <li key={s.title} className="grid items-center gap-space-11 lg:grid-cols-2">
              <div className={mediaFirst ? 'lg:order-2' : ''}>
                <div className="flex items-baseline gap-space-5">
                  <span
                    aria-hidden="true"
                    className="font-display text-display-sm font-extrabold tabular-nums text-content-brand"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-display text-heading-lg font-bold text-content-primary">
                    {s.title}
                  </h3>
                </div>
                <p className="mt-space-5 max-w-[58ch] text-body-lg text-content-secondary">
                  {s.body}
                </p>
              </div>

              <figure className={mediaFirst ? 'lg:order-1' : ''}>
                <div className="overflow-hidden rounded-8 border-2 border-border-secondary bg-surface-elevated shadow-large">
                  <img
                    src={s.media}
                    alt={`${s.title} — ${s.callout}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* The annotation the brief asks for. A caption rather than callout
                    arrows, which would mean editing an image this repo does not own. */}
                <figcaption className="mt-space-4 text-body-sm text-content-tertiary">
                  {s.callout}
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ol>

      {/* Moved from the top of the section, where it duplicated the hero's. */}
      <div className="mt-space-14 flex justify-center">
        <Button variant="primary" size="lg" shape="pill" trailingIcon={<ArrowRightIcon />}>
          {CTA_PRIMARY}
        </Button>
      </div>
    </Band>
  );
}
