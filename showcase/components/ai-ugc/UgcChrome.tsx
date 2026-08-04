'use client';

import { useEffect, useState } from 'react';
import { Button, Input } from '@/components/ui';
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
 * A thin floating pill. The persistent primary CTA is NOT here any more — it moved to
 * UgcStickyCta below, which is what E40 asks for and which is the better place for it: a
 * bottom bar can carry the reassurance line beside the button, and a header cannot
 * without becoming two rows tall.
 * ------------------------------------------------------------------------- */
export function UgcHeader() {
  return (
    /* C25, as far as the token set allows. Thinner (py-space-3, not -4) and a floating
       rounded-full pill rather than a full-bleed bar. NOT glass: a frosted panel needs a
       translucent surface token, and the preset has no <alpha-value> slot, so
       `bg-background/70` would emit nothing at all. surface/elevated with a stroke and a
       shadow is the in-system way to say "floating". */
    <div className="sticky top-space-4 z-sticky px-space-4">
      <header className="mx-auto flex max-w-container-lg items-center gap-space-6 rounded-full border-2 border-border-secondary bg-surface-elevated px-space-6 py-space-3 shadow-medium">
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

        {/* The header keeps a quiet CTA at all times; the loud one lives in the bottom
            bar. Two primaries on screen at once was the redundancy worth avoiding, not the
            presence of a header action. */}
        <div className="ml-auto">
          <Button variant="ghost" size="sm" shape="pill">
            Sign in
          </Button>
        </div>
      </header>
    </div>
  );
}

/** E40: the floating micro-bar.
 *
 *  Appears once the hero's own CTA has scrolled out, which is what makes it a capture
 *  rather than a duplicate. It carries the sub-copy too, so the reassurance travels with
 *  the button instead of living only in the hero.
 *
 *  `translate-y` is written through --oz-motion-spatial-scale, because it is decorative
 *  travel: reduced motion collapses the slide and keeps the fade, which is exactly the
 *  graded behaviour CLAUDE.md describes. It is not a state transform — the bar's position
 *  carries no meaning that its presence does not already carry — so it does not belong in
 *  the STATE_TRANSFORMS exemption list. */
export function UgcStickyCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('ugc-hero-cta');
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting), {
      rootMargin: '-120px 0px 0px 0px',
    });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-space-5 z-sticky flex justify-center px-space-5 transition-opacity duration-effects-default ease-effects-default ${
        show ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      style={{
        transform: show
          ? undefined
          : 'translateY(calc(var(--oz-space-6) * var(--oz-motion-spatial-scale)))',
      }}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-space-6 gap-y-space-3 rounded-full border-2 border-border-secondary bg-surface-elevated px-space-6 py-space-4 shadow-large">
        <p className="text-body-sm text-content-secondary">
          No credit card required · Cancel anytime
        </p>
        <Button variant="primary" size="sm" shape="pill" trailingIcon={<ArrowRightIcon />}>
          {CTA_PRIMARY}
        </Button>
      </div>
    </div>
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

            {/* F50. Real Input and Button, so the field inherits the system's focus ring,
                its invalid state and its label wiring rather than being a styled div. */}
            <form
              className="mt-space-7 max-w-[340px]"
              onSubmit={(e) => e.preventDefault()}
            >
              <Input
                type="email"
                label="Get the monthly roundup"
                placeholder="you@company.com"
                message="One email a month. Unsubscribe in one click."
              />
              <div className="mt-space-4">
                <Button type="submit" variant="inverse" size="sm" shape="pill" className="w-full">
                  Subscribe
                </Button>
              </div>
            </form>

            <ul className="mt-space-9 flex flex-wrap gap-space-3">
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
