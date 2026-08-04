'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { ArrowRightIcon, SocialIcon } from './icons';
import { CTA_PRIMARY, FOOTER_COLUMNS, FOOTER_SUPPORT, FOOTER_TAGLINE, NAV, SOCIALS } from './content';

/* ---------------------------------------------------------------------------
 * Page chrome and the vertical rhythm every section shares.
 *
 * RHYTHM IS A COMPONENT, not a habit. The brief's last systemic point is that spacing
 * between sections is inconsistent — Key Features cramped, Pricing sparse. That is what
 * happens when each section chooses its own padding, so no section chooses: `Band` owns
 * it, and the only decision a section makes is whether it is tinted. Same mechanism as
 * Section.tsx on the showcase routes, and the same reason.
 * ------------------------------------------------------------------------- */

/** One section's outer shell. `tone` is the page's secondary rhythm: the brief notes the
 *  design leans on orange for everything and has no second accent, so alternating bands
 *  of page and surface do the work instead of more brand colour. */
export function Band({
  id,
  tone = 'page',
  children,
  className = '',
}: {
  id?: string;
  tone?: 'page' | 'surface' | 'inverse';
  children: React.ReactNode;
  className?: string;
}) {
  const bg =
    tone === 'surface'
      ? 'bg-surface-primary'
      : tone === 'inverse'
        ? 'bg-fill-inverse text-content-on-inverse'
        : 'bg-background';
  return (
    <section
      id={id}
      /* scroll-mt clears the sticky header, and it reads the same custom property the
       * showcase header writes — declared in globals.css with an 88px fallback. */
      className={`scroll-mt-[var(--showcase-header)] py-space-16 ${bg} ${className}`}
    >
      <div className="mx-auto max-w-container-xl px-space-6">{children}</div>
    </section>
  );
}

/** A section's heading block. Centred by default because seven of the nine are.
 *
 *  The type steps are deliberately far apart: the brief says the hierarchy is muted and
 *  the jump between H1, H2 and body is too small to scan. heading-xl for a section head
 *  against body-lg for its lede is three steps of the scale, not one. */
export function BandHead({
  eyebrow,
  title,
  lede,
  align = 'center',
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: 'center' | 'left';
}) {
  const centred = align === 'center';
  return (
    <header className={`${centred ? 'mx-auto text-center' : ''} max-w-[62ch]`}>
      {eyebrow && (
        <p className="font-mono text-label-sm uppercase text-content-brand">
          {eyebrow}
        </p>
      )}
      <h2
        className={`${eyebrow ? 'mt-space-3' : ''} font-display text-heading-xl font-extrabold text-content-primary`}
      >
        {title}
      </h2>
      {lede && (
        <p className={`mt-space-5 text-body-lg text-content-secondary ${centred ? 'mx-auto' : ''}`}>
          {lede}
        </p>
      )}
    </header>
  );
}

/* ---------------------------------------------------------------------------
 * Header.
 *
 * Sticky, with the CTA in it. The brief asks for a persistent CTA on a page this long,
 * and a header that is already sticky is the cheapest place to put one — a floating
 * button is a second control competing with the hero's.
 *
 * The CTA appears only after the hero's own has scrolled away. Two identical primary
 * buttons on screen at once is the redundancy the brief flags between the hero and the
 * closing CTA, and it would be worse here because they would be 200px apart.
 * ------------------------------------------------------------------------- */
export function UgcHeader() {
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('ugc-hero-cta');
    if (!hero) return;
    /* An observer rather than a scroll listener: the question is "is the hero CTA still
     * on screen", which is what an IntersectionObserver answers natively and what a
     * scroll handler answers by re-measuring on every frame. */
    const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting), {
      rootMargin: '-88px 0px 0px 0px',
    });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-sticky border-b-2 border-border-secondary bg-background">
      <div className="mx-auto flex max-w-container-xl items-center gap-space-6 px-space-6 py-space-4">
        <a
          href="#ugc-main"
          className="font-display text-heading-xs font-extrabold text-content-primary focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
        >
          HeyOz
        </a>

        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="flex items-center gap-space-6">
            {NAV.map((n) => (
              <li key={n.label}>
                <a
                  href={n.href}
                  className="text-body-sm text-content-secondary transition-colors duration-effects-fast ease-effects-fast hover:text-content-primary focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Reserved, not conditional. Mounting the button when the hero leaves would
            change the header's height mid-scroll and shift the nav under the reader's
            cursor; opacity plus pointer-events keeps the box and hides the control.
            aria-hidden while invisible so it is not a phantom tab stop. */}
        <div
          className={`ml-auto transition-opacity duration-effects-default ease-effects-default ${
            pastHero ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-hidden={!pastHero}
        >
          <Button variant="primary" size="sm" shape="pill" trailingIcon={<ArrowRightIcon />}>
            {CTA_PRIMARY}
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------------------
 * Footer.
 *
 * The brief calls the live footer visually heavy and disconnected — a black-to-orange
 * gradient with a large watermark under a light, clean page. This one keeps the dark
 * block, because a page that ends on the same colour it started on has no ending, and
 * drops the gradient and the watermark. The dark block is also the secondary accent the
 * brief asks for earlier in the page, which is why `Band tone="inverse"` exists.
 *
 * Link columns get body-sm on a loose stack rather than label-sm tight, which is the
 * legibility point, and the socials are 44px targets rather than 16px glyphs.
 * ------------------------------------------------------------------------- */
export function UgcFooter() {
  return (
    <footer className="bg-fill-inverse py-space-16 text-content-on-inverse">
      <div className="mx-auto max-w-container-xl px-space-6">
        {/* Four columns with a span rather than an arbitrary `grid-cols-[minmax(0,1.2fr)_…]`.
            tailwind.config.js says why: the comma inside minmax() ends the arbitrary
            value, so that class generates nothing and the grid silently collapses to one
            column. It is the same trap that put `rail` and `app` in the named
            gridTemplateColumns scale. */}
        <div className="grid gap-space-12 lg:grid-cols-4">
          <div className="lg:col-span-1">
            {/* No leading- utility: every step in this scale ships its own line-height,
                so adding one replaces a token with a literal. */}
            <p className="font-display text-heading-lg font-extrabold">
              {FOOTER_TAGLINE.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>

            <ul className="mt-space-7 flex flex-wrap gap-space-3">
              {SOCIALS.map((s) => (
                <li key={s}>
                  {/* min-h-target: the brief flags these as too small to tap. The token
                      exists precisely so a target is not eyeballed. */}
                  <a
                    href="#ugc-main"
                    aria-label={s}
                    className="grid min-h-target min-w-target place-items-center rounded-full border-2 border-border-inverse text-content-on-inverse transition-colors duration-effects-fast ease-effects-fast hover:bg-fill-inverse-hover focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus-inverse"
                  >
                    <SocialIcon name={s} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-x-space-7 gap-y-space-11 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-5">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.heading}>
                <p className="text-label-md font-medium text-content-on-inverse">{col.heading}</p>
                <ul className="mt-space-5 oz-stack oz-stack-4">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#ugc-main"
                        className="text-body-sm text-content-inverse-secondary transition-colors duration-effects-fast ease-effects-fast hover:text-content-on-inverse focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus-inverse"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <p className="text-label-md font-medium text-content-on-inverse">
                {FOOTER_SUPPORT.heading}
              </p>
              <ul className="mt-space-5 oz-stack oz-stack-4">
                {FOOTER_SUPPORT.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#ugc-main"
                      className="text-body-sm text-content-inverse-secondary transition-colors duration-effects-fast ease-effects-fast hover:text-content-on-inverse focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus-inverse"
                    >
                      {l}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href={`mailto:${FOOTER_SUPPORT.email}`}
                    className="text-body-sm text-content-inverse-secondary underline decoration-border-inverse underline-offset-2 transition-colors duration-effects-fast ease-effects-fast hover:text-content-on-inverse focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus-inverse"
                  >
                    {FOOTER_SUPPORT.email}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
