'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { auditSummary } from '@/lib/core/audit';
import { useTheme, type ThemePreference } from './ThemeProvider';

/* Header and nav rail.
 *
 * The nav is passed its items rather than containing them, because the component
 * sections are generated from the registry and the nav has to stay in step with a
 * list it does not own. */

/** A rail entry. `href` makes it a real link to another route; without one it is an
 *  in-page anchor and the scroll spy decides whether it is current. Both shapes
 *  coexist because the rail does both jobs — on `/` it tracks sections, on a
 *  component page it lists sibling pages. */
export type NavItem = { id: string; label: string; href?: string };

/** The two routes, and the one control that switches between them.
 *
 *  Real links rather than a client-side toggle, so each is addressable, opens in a
 *  new tab, and can be sent to somebody. That is also the fix for a gap this page
 *  had from the start: nothing about its state was linkable, so "this looks wrong"
 *  could never be a URL. */
const ROUTES = [
  { href: '/', key: 'design', label: 'Design system' },
  { href: '/verify', key: 'verify', label: 'Verification' },
] as const;

export type RouteKey = (typeof ROUTES)[number]['key'];

function RouteToggle({ route }: { route: RouteKey }) {
  return (
    <nav
      aria-label="View"
      className="flex gap-space-1 rounded-full bg-surface-secondary p-space-1"
    >
      {ROUTES.map((r) => {
        const on = r.key === route;
        return (
          <a
            key={r.key}
            href={r.href}
            aria-current={on ? 'page' : undefined}
            className={`rounded-full px-space-4 py-space-2 text-label-sm transition-colors duration-effects-fast ease-effects-fast focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus ${
              on
                ? 'bg-fill-elevated font-medium text-content-primary shadow-x-small'
                : 'text-content-tertiary hover:text-content-primary'
            }`}
          >
            {r.label}
          </a>
        );
      })}
    </nav>
  );
}

/** The three colour-mode buttons, in the order light → dark → follow-the-OS.
 *
 *  `short` is what shows below `sm`. Three full words plus their padding is about
 *  185px, which does fit a 320px header — but it fits it by leaving nothing beside
 *  it, and the stale warning (which is now shown at every width, see below) has to
 *  share that row. "sys" is an abbreviation rather than a rename on purpose: the
 *  button's accessible name stays the full word, so the visible text is a substring
 *  of it and WCAG 2.5.3 is satisfied. "auto" would have read better and would have
 *  been a different word from the one stored in localStorage and named in the
 *  no-flash script, which is three places to keep in step for a nicer four letters. */
const COLOUR_MODES: Array<{ value: ThemePreference; label: string; short: string }> = [
  { value: 'light', label: 'light', short: 'light' },
  { value: 'dark', label: 'dark', short: 'dark' },
  { value: 'system', label: 'system', short: 'sys' },
];

/** How long ago the build ran, in words.
 *
 *  The header used to print the raw stamp — "built 2026-08-04 06:34 UTC" — which
 *  answers a question nobody asked. The question is "is this fresh?", and a UTC
 *  stamp makes the reader do the subtraction, in a timezone that is not theirs,
 *  against a clock they have to go and find. The absolute value is not lost: it is
 *  the `title`, and `dateTime` carries it in machine-readable form.
 *
 *  Intl does the units and the plural. It also handles the sign, so a build stamped
 *  in the future — clock skew between a CI box and a laptop, which is the usual
 *  cause — comes out as "in 4 minutes" rather than as a negative number of days. */
function relativeAge(iso: string, now: number): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';

  const seconds = Math.round((then - now) / 1000);
  if (Math.abs(seconds) < 60) return 'just now';

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  /* 'always' rather than 'auto': "yesterday" is friendlier and less precise, and the
   * whole point of this string is precision about age. */
  const fmt = new Intl.RelativeTimeFormat('en', { numeric: 'always' });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return fmt.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

export function Header({
  route = 'design',
  /* Computed by the route (a server component) via lib/core/staleness.ts and passed
   * in, because the check needs node:fs and this file is client-side. */
  staleSources = [],
}: {
  route?: RouteKey;
  staleSources?: string[];
}) {
  const { preference, setPreference } = useTheme();
  const built = new Date(auditSummary.generatedAt)
    .toISOString()
    .slice(0, 16)
    .replace('T', ' ');

  /* The bar writes its own height into --showcase-header.
   *
   * This block replaces a comment. The one that used to be here said the sizes were
   * "deliberately unchanged" because three files hardcoded an 88px offset — a comment
   * standing in for a variable, and one that was already wrong: the bar is
   * `flex-wrap`, so below `md` it wraps to two rows and is taller than 88px, and every
   * anchor on a phone landed short by the difference. The literal is now declared once
   * in globals.css as a first-paint fallback and measured here, which means the bar is
   * free to grow and the offsets follow it.
   *
   * Rounded, because the fractional height of a wrapped flex row changes in the fourth
   * decimal place as fonts settle and writing that to a custom property repaints every
   * consumer of it for no visible reason. The property is removed on unmount rather
   * than left behind: a stale measurement from a header that is gone is worse than the
   * declared fallback. */
  const barRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const write = () => {
      const h = Math.round(bar.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--showcase-header', `${h}px`);
    };
    write();
    const ro = new ResizeObserver(write);
    ro.observe(bar);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--showcase-header');
    };
  }, []);

  /* Relative age, client-only.
   *
   * The server has to render the absolute stamp: "2 days ago" computed on the server
   * and again on the client disagree the moment a minute rolls over between the two,
   * and a hydration mismatch throws away the whole tree rather than the one string.
   * So `built` is what ships in the HTML and the effect upgrades it — the same
   * discipline ThemeProvider uses for the mode.
   *
   * The interval exists for the "just now" case. A page left open on a fresh build
   * would otherwise still claim "just now" an hour later, which is the one wrong thing
   * this line is here to prevent. A minute is the resolution of the coarsest thing it
   * can say, so nothing finer would ever repaint. */
  const [age, setAge] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setAge(relativeAge(auditSummary.generatedAt, Date.now()));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  /* The bar is opaque, not a translucent blur. The preset emits colours as plain
   * var(--oz-…) rather than with an <alpha-value> slot, so `bg-background/95`
   * silently generates no rule at all — and a blur behind an opaque bar buys
   * nothing anyway. */
  return (
    <header
      ref={barRef}
      className="sticky top-0 z-sticky border-b-2 border-border-primary bg-background"
    >
      <div className="mx-auto flex max-w-container-xl flex-wrap items-center gap-space-4 px-space-6 py-space-4">
        <div className="flex items-baseline gap-space-3">
          <span className="font-display text-heading-xs font-bold text-content-primary">
            HeyOz
          </span>
          <span className="font-mono text-label-sm uppercase text-content-tertiary">
            design system
          </span>
        </div>

        <div className="ml-auto flex items-center gap-space-4">
          <RouteToggle route={route} />
        </div>

        {/* The trust line, and on the Design System route it is the only verification
            on the page — everything else moved to /verify. It links there, so the
            claim and its evidence are one click apart rather than interleaved.
            Numbers come from reports/audit.json, so this is the build's own verdict
            rather than a claim about it. */}
        {/* Stale wins over clean. A build whose sources have moved on is not
            reporting 250/250 about the code in front of you, and saying so is more
            useful than the count — see lib/core/staleness.ts.

            THE TWO BRANCHES GET DIFFERENT RESPONSIVE TREATMENT, ON PURPOSE. Both used
            to be `hidden … md:block`, so on a phone the single most important thing
            this header can say — that the numbers below it describe files that have
            since changed — was the first thing dropped, while a route toggle and a
            wordmark kept their space. A warning and a reassurance are not the same
            kind of content: the reassurance is worth reading and safe to lose, and the
            warning is the reason the header is trusted at all. So the warning shows at
            every breakpoint and only its detail collapses, and the clean line keeps
            the `md` floor it had.

            What survives below `sm` is the word, the colour, and a count — the count
            rather than the filenames because `build/spec.mjs, build/palette.mjs` is
            wider than a phone and truncating a filename list produces a filename that
            does not exist. The count is derived from the same array the list is, so
            the two cannot disagree. */}
        {staleSources.length > 0 ? (
          <p className="font-mono text-label-sm text-content-critical">
            <span className="font-medium">stale</span>
            <span className="sm:hidden">
              {' '}
              · {staleSources.length} source{staleSources.length === 1 ? '' : 's'} changed
            </span>
            <span className="hidden sm:inline">
              {' '}
              · {staleSources.map((f) => f.replace('build/', '')).join(', ')} changed after
              this build · run <code>node build/build.mjs</code>
            </span>
          </p>
        ) : (
          <a
            href="/verify"
            className="hidden font-mono text-label-sm text-content-tertiary hover:text-content-primary md:block"
          >
            <span className="text-content-secondary">
              {auditSummary.passing}/{auditSummary.gates} gates ·{' '}
              {auditSummary.errors === 0 ? 'no build errors' : `${auditSummary.errors} errors`}
            </span>{' '}
            · built{' '}
            <time dateTime={auditSummary.generatedAt} title={`${built} UTC`}>
              {age ?? `${built} UTC`}
            </time>{' '}
            →
          </a>
        )}

        {/* Three options, not two: light, dark, and follow-the-OS. `aria-pressed` on
            each rather than a radiogroup, which is what this really is — the print
            stylesheet in globals.css selects
            `[role='group'][aria-label='Colour mode']` to hide the control on paper, so
            BOTH the role and the label are load-bearing and neither may be renamed
            here. Turning this into a real radiogroup means arrow-key handling and a
            matching change to that selector; it is not a free rename.

            Padding tightens below `sm` instead of the buttons shrinking, because the
            hit target is the one thing on a phone that must not get smaller. */}
        <div
          role="group"
          aria-label="Colour mode"
          className="flex gap-space-1 rounded-full bg-surface-secondary p-space-1"
        >
          {COLOUR_MODES.map(({ value, label, short }) => {
            const on = preference === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={on}
                /* Only where the visible text is an abbreviation. Everywhere else the
                 * text IS the name, and a duplicate aria-label is one more string to
                 * keep in step with it. */
                aria-label={short === label ? undefined : label}
                onClick={() => setPreference(value)}
                className={`rounded-full px-space-3 py-space-2 text-label-sm transition-colors duration-fast ease-standard focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus sm:px-space-4 ${
                  on
                    ? 'bg-fill-elevated font-medium text-content-primary shadow-x-small'
                    : 'text-content-tertiary hover:text-content-primary'
                }`}
              >
                {short === label ? (
                  label
                ) : (
                  <>
                    <span className="sm:hidden">{short}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

export type NavGroup = { label: string; items: NavItem[] };

/** Height of the sticky header in px, measured live.
 *
 *  Two things have to clear the same bar — the anchor offset and the scroll spy's
 *  root margin — and until now both said `88px`, in different files, which is how
 *  they came to disagree with the bar and with each other. The bar measures itself
 *  into `--showcase-header` (see Header above); this reads the same box rather than
 *  that property, because a `resize` handler runs before the frame's ResizeObserver
 *  delivery, so the property is still last frame's value at the moment we need it.
 *  Same box either way, so the two cannot drift.
 *
 *  Falling back to the declared property and then to 0 rather than to a literal 88:
 *  a spy with no offset fires slightly early, which is a far smaller bug than an
 *  offset that is confidently wrong, and it keeps the fallback declared exactly once
 *  in globals.css. */
function headerOffset(): number {
  const bar = document.querySelector('header');
  if (bar) return Math.round(bar.getBoundingClientRect().height);
  const declared = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--showcase-header'),
  );
  return Number.isFinite(declared) ? declared : 0;
}

/** Tracks which section is on screen, so the rail can mark it. This is the only
 *  place other than a real primary button where the accent appears in the page
 *  chrome — an accent used four times has stopped being a signal. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  /* null until measured, and the observer waits for it. Building the observer with a
   * placeholder offset and rebuilding it a tick later would work, but it means the
   * first resolution of the spy happens against a margin nobody chose. */
  const [offset, setOffset] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => setOffset(headerOffset());
    sync();
    /* The bar only changes height when the viewport width changes — it is fixed
     * content that wraps — so a resize listener is the whole set of triggers, and the
     * observer below rebuilds itself when the number moves. */
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  useEffect(() => {
    if (offset === null) return;
    const seen = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.intersectionRatio);
        let best: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of seen) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = id;
          }
        }
        if (best) setActive(best);
      },
      /* rootMargin takes a length, not a var() — a custom property here is silently
       * an invalid margin — so the measured number is interpolated. The -55% is a
       * proportion of the viewport rather than a header height and stays a literal. */
      { rootMargin: `-${offset}px 0px -55% 0px`, threshold: [0, 0.1, 0.35, 0.75, 1] },
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [ids, offset]);

  /* Sync the hash, so scroll position is a URL.
   *
   * The note on ROUTES above argues that the point of real routes is that a reader
   * can send somebody what they are looking at — and the sections were the one part
   * of this page that stayed unaddressable: scroll to Typography, reload, and you are
   * back at the top. replaceState rather than pushState, because a spy firing per
   * section would otherwise fill the back button with a scroll history nobody asked
   * for and make Back mean "up a bit".
   *
   * Two things this must not do.
   *
   * It must not write on the first resolution. `active` starts at ids[0], so merely
   * opening `/` would rewrite the address bar to `/#primitives` before the reader has
   * touched anything, which looks like the page navigating on its own.
   *
   * And it must preserve the query string. There are `?q=` and `?p=` parameters on
   * `/`, so building the URL from the id alone — or from pathname alone — silently
   * discards somebody's filter, and they find out when they send the link. */
  const settled = useRef(false);
  useEffect(() => {
    if (!active) return;
    if (!settled.current) {
      settled.current = true;
      return;
    }
    if (window.location.hash.slice(1) === active) return;
    const { pathname, search } = window.location;
    window.history.replaceState(null, '', `${pathname}${search}#${active}`);
  }, [active]);

  return active;
}

export function NavRail({
  groups,
  /** Set on a route that IS one thing — a component page — where "current" is a
   *  fact about the URL rather than a question about scroll position. Passing it
   *  also switches the scroll spy off, because a page with one section would
   *  otherwise mark that section current and nothing else ever. */
  activeId,
}: {
  groups: NavGroup[];
  activeId?: string;
}) {
  const ids = useMemo(
    () => (activeId ? [] : groups.flatMap((g) => g.items.filter((i) => !i.href).map((i) => i.id))),
    [groups, activeId],
  );
  const spied = useActiveSection(ids);
  const active = activeId ?? spied;

  /* Below lg the rail is a horizontal scroller, and it was a horizontal scroller with
   * neither of the two things one needs: it never followed the spy, so on a phone the
   * current section was frequently off the left-hand edge of a rail that claimed to
   * show where you are; and it had no visible edge, so it read as a list that simply
   * ended at the fifth item. Both are fixed below. Nothing here does anything at lg,
   * where the rail is a static vertical column. */
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [clipped, setClipped] = useState({ overflow: false, atStart: true, atEnd: true });

  useEffect(() => {
    const box = scrollerRef.current;
    if (!box) return;
    /* Deliberately the same technique as ScrollRegion, including the 1px of slack for
     * sub-pixel layout — a second edge-fade implementation that behaves differently
     * from that one is worse than either. ScrollRegion itself is not used here for two
     * reasons: the follow-the-spy effect below needs a ref to the scrolling element,
     * and ScrollRegion's tabIndex is the wrong answer for this container. Its argument
     * is that a scroller with no focusable child cannot be scrolled by keyboard; every
     * child of this one is a link, so a keyboard reaches the content by tabbing and the
     * browser scrolls it into view. An extra tab stop in front of the site navigation
     * would be a cost with no matching benefit. */
    const measure = () => {
      const slack = 1;
      const max = box.scrollWidth - box.clientWidth;
      setClipped({
        overflow: max > slack,
        atStart: box.scrollLeft <= slack,
        atEnd: box.scrollLeft >= max - slack,
      });
    };
    measure();

    /* The box resizes with the viewport; its children resize when the webfont swaps
     * in, which is the case a resize listener alone would miss and which changes the
     * content width by enough to matter. */
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    for (const child of Array.from(box.children)) ro.observe(child);
    box.addEventListener('scroll', measure, { passive: true });

    return () => {
      ro.disconnect();
      box.removeEventListener('scroll', measure);
    };
  }, [groups]);

  useEffect(() => {
    const box = scrollerRef.current;
    if (!box || !active) return;
    /* Only when this container is genuinely the horizontal scroller. Testing
     * scrollWidth against clientWidth rather than matching the `lg` breakpoint in JS:
     * the breakpoint lives in the class list, and a media query duplicated here is a
     * second copy of it that a Tailwind config change would not update. */
    if (box.scrollWidth <= box.clientWidth + 1) return;

    /* The active item is the one the render already marked, so this cannot disagree
     * with what is highlighted. */
    const link = box.querySelector('[aria-current]');
    if (!link) return;

    const boxRect = box.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    /* Leave the width of the edge fade clear, so the item this scroll exists to
     * reveal does not land underneath it. Read from the token rather than typed as
     * 28px — the fade is `w-space-8` and the two have to be the same number. */
    const gutter =
      Number.parseFloat(getComputedStyle(box).getPropertyValue('--oz-space-8')) || 0;

    let delta = 0;
    if (linkRect.right > boxRect.right) delta = linkRect.right - boxRect.right + gutter;
    else if (linkRect.left < boxRect.left) delta = linkRect.left - boxRect.left - gutter;
    if (delta === 0) return;

    /* scrollLeft, NOT Element.scrollIntoView. scrollIntoView scrolls every scrollable
     * ancestor including the document, so a rail following the scroll spy would move
     * the page, which moves the spy, which moves the rail — the page fighting the
     * reader's own scrolling. Setting scrollLeft on this one box cannot touch anything
     * outside it.
     *
     * Instant rather than smooth, and that is not an oversight. This is the page
     * keeping up with the reader rather than a movement the reader asked for, so it
     * has nothing to communicate by taking time — and a smooth scroll here would be
     * animated travel that owes `prefers-reduced-motion` an answer it cannot give from
     * JS as cheaply as not moving does. */
    box.scrollLeft += delta;
  }, [active]);

  const { overflow, atStart, atEnd } = clipped;

  return (
    <nav
      aria-label="Sections"
      className="lg:sticky lg:top-[var(--showcase-header)] lg:self-start lg:pt-space-9"
    >
      {/* Horizontal and scrollable below lg, vertical above. Not hidden behind a
          hamburger — on a reference page the section list is the main affordance. */}
      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex gap-space-5 overflow-x-auto pb-space-3 lg:flex-col lg:gap-space-4 lg:overflow-visible lg:pb-0"
        >
          {groups.map((group) => (
            <div key={group.label} className="shrink-0">
              {/* Uppercase mono survives here. These are one- and two-word group
                  eyebrows over a list, which is what that treatment is for — unlike the
                  five-word section labels it was also being used on. */}
              <p className="hidden px-space-3 pb-space-3 font-mono text-label-sm uppercase text-content-tertiary lg:block">
                {group.label}
              </p>
              <ul className="flex gap-space-2 lg:flex-col lg:gap-[2px]">
                {group.items.map((item) => {
                  const on = active === item.id;
                  return (
                    <li key={item.id} className="shrink-0">
                      <a
                        href={item.href ?? `#${item.id}`}
                        aria-current={on ? (item.href ? 'page' : 'true') : undefined}
                        className={`flex min-h-target items-center whitespace-nowrap rounded-4 px-space-3 text-body-sm transition-colors duration-fast ease-standard focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus lg:min-h-0 lg:py-space-2 ${
                          /* Accent on the label, no block behind it.
                           *
                           * This was `bg-fill-selected` — brand at 15% alpha — with
                           * `content/selected` on top, and it was the loudest element on
                           * an otherwise restrained page: a salmon tile in a column of
                           * grey text, competing with the one real primary action on
                           * screen. The comment on useActiveSection above already argues
                           * that an accent used four times has stopped being a signal,
                           * and a filled tile per rail was the fourth use.
                           *
                           * Colour plus weight is an unmistakable current-page treatment
                           * and takes no visual budget. `aria-current` carries it for
                           * anyone not reading colour, and is set on the same element.
                           *
                           * REVERTIBLE IN ONE LINE: put `bg-fill-selected` back on the
                           * `on` branch. The tokens are unchanged and still used by
                           * Table's selected row and Card's selected state, where a
                           * filled block is right because the thing being selected is a
                           * region rather than a label. */
                          on
                            ? 'font-medium text-content-selected'
                            : 'text-content-tertiary hover:bg-fill-tertiary-hover hover:text-content-primary'
                        }`}
                      >
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* The affordance. Present only on the side that has content off screen, so it
            is a statement about scroll position rather than decoration, and gone
            entirely once nothing is clipped. `lg:hidden` belts what the braces already
            hold: above lg the column does not overflow horizontally, so `overflow` is
            false and neither fade renders — but "nothing changes at lg" is worth being
            true by declaration rather than by inference from a measurement. */}
        {overflow && !atStart && <RailFade side="left" />}
        {overflow && !atEnd && <RailFade side="right" />}
      </div>
    </nav>
  );
}

/** An edge fade over the rail. Same construction as ScrollRegion's: an absolutely
 *  positioned, pointer-events-none overlay rather than a `mask-image` on the scroller,
 *  and an inline gradient naming a token rather than `from-*`/`to-*`, because the
 *  preset emits colours as plain `var(--oz-…)` with no `<alpha-value>` slot and the
 *  gradient utilities need one. The rail sits directly on the page, so the token is
 *  the page colour — and reading it as a variable is what makes the fade follow a mode
 *  switch without a second declaration for dark. */
function RailFade({ side }: { side: 'left' | 'right' }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 w-space-8 lg:hidden ${
        side === 'left' ? 'left-0' : 'right-0'
      }`}
      style={{
        backgroundImage: `linear-gradient(to ${
          side === 'left' ? 'right' : 'left'
        }, var(--oz-color-background), transparent)`,
      }}
    />
  );
}
