'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, IconButton, Input } from '@/components/ui';
import { CloseIcon, MenuIcon, OzMark, SocialIcon } from './icons';
import { FOOTER_COLUMNS, FOOTER_SUPPORT, FOOTER_TAGLINE, NAV, SOCIALS } from './content';

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
        className={`${eyebrow ? 'mt-space-3' : ''} font-display text-heading-xl font-semibold text-content-primary`}
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
 * BUILT FROM FIGMA node 4467:144888 and its four narrower siblings. A full-bleed bar,
 * not the floating pill that was here: mark and wordmark left, anchors centre, the brand
 * CTA right, and below `lg` the anchors collapse behind a disclosure button — the ladder
 * the frames draw at 1920, 1440, 1280, 1025, 768 and 375.
 *
 * TRANSPARENT AT REST, A SURFACE ONCE SCROLLED. Figma draws the bar over the hero's glow
 * with nothing behind it but a 2.5px blur, which is right for the top of the page and
 * unreadable anywhere else — the frames only ever show the bar against the hero. So the
 * surface arrives on scroll. It arrives as a surface and a shadow and NOT as a bottom
 * border: a rule under a header does `separation`, which rule 1c makes a build error,
 * and the answer 1c points at is exactly this pair.
 *
 * WHERE THIS DEPARTS FROM THE FRAMES, both times because the frames describe a site this
 * page is not:
 *
 *   - Seven marketing menus with dropdown chevrons become the five in-page anchors
 *     content.ts already declares. A chevron is a promise of a submenu, and there are no
 *     submenus here to open.
 *   - No "More" overflow menu at `lg`. The 1025 frame needs one because seven menus do
 *     not fit; five short anchors do, measured, so collapsing them would be a dropdown
 *     that exists to imitate a dropdown.
 *
 * The 1280 frame also drops the wordmark and keeps the mark alone. Not reproduced: it
 * only holds for the 1280–1439 band, and a wordmark that vanishes for one window size
 * reads as a bug to everyone who has not seen the file.
 * ------------------------------------------------------------------------- */

/** True once the page has left the top. Drives the bar's surface, nothing else.
 *
 *  A sentinel and an IntersectionObserver rather than a scroll listener: the observer
 *  fires twice per crossing instead of on every frame of a scroll, and it needs no
 *  passive-listener or rAF handling to stay off the main thread. */
function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { scrolled, sentinel };
}

/** Publish the bar's measured height as `--ugc-nav`.
 *
 *  The hero centres itself in the space this bar leaves — `100svh` minus this — and that
 *  subtraction needs a real number, not a guess. The guess was already wrong twice over: the
 *  drawn nav is 70px, a comment here said 72, and the thing actually renders at 74, because
 *  the Button's stroke adds a pixel per edge. A literal would have been a fourth place for
 *  the same value to be wrong, which is the argument globals.css already makes for
 *  `--showcase-header`; this is the same device for a route that does not have the showcase
 *  Chrome to write it.
 *
 *  Measured with a ResizeObserver rather than read once: the bar wraps at narrow widths and
 *  grows when the disclosure opens, and a hero centred against a stale height is a hero that
 *  jumps on rotate.
 *
 *  Only the height of the *bar* is published, not of the bar plus an open disclosure panel —
 *  `barRef` is on the row, not on the <header> — because the panel is transient and the hero
 *  should not resize behind it. */
function useNavHeight() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const write = () =>
      document.documentElement.style.setProperty(
        '--ugc-nav',
        `${Math.round(el.getBoundingClientRect().height)}px`,
      );
    write();
    const ro = new ResizeObserver(write);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--ugc-nav');
    };
  }, []);

  return barRef;
}

export function UgcHeader() {
  const { scrolled, sentinel } = useScrolled();
  const barRef = useNavHeight();
  const [open, setOpen] = useState(false);

  /* Escape closes it. A disclosure that can only be dismissed by the button that opened
     it strands a keyboard user who tabbed past that button. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* Zero-height and at the very top of the page, so "scrolled" is a fact about the
          document rather than a pixel threshold guessed at in a handler. */}
      <div ref={sentinel} aria-hidden="true" className="absolute top-0 h-px w-full" />

      <header
        className={`sticky top-0 z-sticky backdrop-blur-[2.5px] transition-shadow duration-effects-default ease-effects-default ${
          scrolled || open ? 'bg-surface-elevated shadow-medium' : ''
        }`}
      >
        <div
          ref={barRef}
          className="flex items-center justify-between gap-space-6 px-space-4 py-space-5 md:px-space-14"
        >
          {/* Mark and wordmark. `fill/brand` for the plate, where Figma binds
              `content/brand` — a content role used as a background is the one binding in
              the file that cannot come across, because it would put the mark on a ground
              no gate covers. fill/brand is the role for a brand plate and it is the pair
              verify:contrast already measures the mark's colour against. */}
          <a
            href="#ugc-main"
            className="flex shrink-0 items-center gap-space-1 rounded-6 focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
          >
            <span className="grid h-space-11 w-space-11 place-items-center rounded-5 bg-fill-brand text-content-on-brand">
              <OzMark />
            </span>
            <span className="font-display text-heading-md font-semibold text-content-primary">
              Heyoz
            </span>
          </a>

          <nav aria-label="On this page" className="hidden lg:block">
            <ul className="flex items-center gap-space-6">
              {NAV.map((n) => (
                <li key={n.label}>
                  <a
                    href={n.href}
                    className="block rounded-6 px-space-4 py-[9px] text-body-md font-medium text-content-primary transition-colors duration-effects-fast ease-effects-fast hover:bg-fill-secondary-hover focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-space-4">
            {/* size md shape rect is the Figma button exactly: 40px tall, 12px padding,
                12px radius, 16px medium label. */}
            <Button variant="primary" size="md" shape="rect">
              Get Started
            </Button>
            <span className="lg:hidden">
              <IconButton
                variant="ghost"
                size="md"
                shape="rect"
                label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                aria-controls="ugc-nav-panel"
                onClick={() => setOpen((v) => !v)}
                icon={open ? <CloseIcon /> : <MenuIcon />}
              />
            </span>
          </div>
        </div>

        {/* The disclosure panel. Rendered only when open rather than hidden with a class,
            so its links are out of the tab order when it is shut without needing
            `inert` — which Safari only shipped recently. */}
        {open && (
          <nav
            id="ugc-nav-panel"
            aria-label="On this page"
            /* No rule between the bar and the panel. They are one surface while it is
               open, which is the separation — and a stroke here would be a `separation`
               border, which rule 1c makes a build error rather than a style choice. */
            className="oz-enter-rise px-space-4 pb-space-6 pt-space-2 lg:hidden"
          >
            <ul className="oz-stack oz-stack-1">
              {NAV.map((n) => (
                <li key={n.label}>
                  <a
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-6 px-space-4 py-space-4 text-body-lg font-medium text-content-primary transition-colors duration-effects-fast ease-effects-fast hover:bg-fill-secondary-hover focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
    </>
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
            <p className="font-display text-heading-lg font-semibold">
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
                <Button type="submit" variant="inverse" size="sm" shape="rect" className="w-full">
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
                    className="grid min-h-target min-w-target place-items-center rounded-6 border-2 border-border-inverse text-content-on-inverse transition-colors duration-effects-fast ease-effects-fast hover:bg-fill-inverse-hover focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus-inverse"
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
