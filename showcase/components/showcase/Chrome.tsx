'use client';

import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { auditSummary } from '@/lib/core/audit';
import { Input } from '../ui/Input';
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

/**
 * A family of rail entries.
 *
 * `count` is separate from `label` rather than baked into it, and that is a fix. Both
 * call sites used to build `"Identity & status · 3"` as one string; at 188px the
 * longest of those wrapped, and a wrapped flex item in a row with a caret centres its
 * second line, so the widest group in the rail rendered as a two-line ragged blob. The
 * count now has its own right-aligned slot, the label gets the rest and truncates, and
 * neither call site formats anything.
 *
 * It stays optional because the foundations group on `/` is a list of page sections
 * rather than a family with a size worth quoting.
 */
export type NavGroup = { label: string; items: NavItem[]; count?: number };

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

/** Where `/` already means something, so the filter shortcut must not steal it. Same
 *  shape and the same argument as ARROWS_ALREADY_TAKEN in ComponentPage.tsx: a global
 *  single-key listener that fires while somebody is typing is a listener that breaks
 *  the components this page exists to demonstrate. */
const SLASH_ALREADY_TAKEN = 'input, textarea, select, [contenteditable]';

/** A chevron that points down when its group is open. Orientation, not travel — which
 *  is why `rotate` is the one transform verify-motion.ts deliberately does not police
 *  (see the note on TRANSFORM_UTILITY). */
function Caret({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={`size-space-4 shrink-0 transition-transform duration-effects-fast ease-effects-fast ${
        open ? 'rotate-90' : ''
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M4.5 2.5 8 6l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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

  /* ---- is this rail long enough to need managing? -----------------------------
   *
   * Two rails call this component and they are not the same problem. `/verify` lists
   * nine in-page sections in two families; `/` and every component page list
   * thirty-nine destinations in eight. The filter and the disclosures are the answer to
   * the second and are pure machinery on the first — worse than machinery, actually:
   * that rail is one page's table of contents, so collapsing it hides the page's own
   * structure, and "filter" is a strange verb for eight headings you can already see.
   *
   * A count rather than a prop, so neither call site has to know it is the long one,
   * and so a rail that grows past the line gets managed without anybody noticing it
   * needed to be. Fifteen is where the unmanaged list stops fitting the shortest laptop
   * viewport under the header — below it the column was never the problem. */
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const dense = total > 15;

  /* ---- the filter ------------------------------------------------------------
   *
   * Thirty-one components in six families, plus the foundations, is forty-odd rows —
   * a column nobody reads, they scan it for a word they already know. So the rail
   * takes the word.
   *
   * ComponentPage.tsx predicted this in as many words: "worth revisiting if the
   * catalogue ever grows past a couple of dozen, at which point a reader wants a
   * filter rather than a chain". It is at thirty-one.
   *
   * Titles only, and that is a deliberate difference from the index filter, which also
   * reads each component's definition. This is navigation: a rail that surfaces Slider
   * because the word "track" appears in Progress's definition has answered a question
   * nobody asked of it, and the index — one click away, and searching properly — is
   * where that search belongs. */
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const filterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.defaultPrevented) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest(SLASH_ALREADY_TAKEN)) return;
      /* Only when the filter is actually on screen. Below lg it is display:none, and
       * focusing a hidden input scrolls nothing, focuses nothing, and silently eats a
       * character the reader meant for the page. */
      const box = filterRef.current;
      /* Also covers the short rail, where the filter is not rendered at all. */
      if (!box || box.offsetParent === null) return;
      e.preventDefault();
      box.focus();
      box.select();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  /* ---- collapsed groups ------------------------------------------------------
   *
   * Open the one that holds the current page and leave the rest shut. On /c/button
   * that is seven headings and three links instead of forty-three rows, and the
   * headings keep their counts — `FORMS · 11` is the line that tells a first-time
   * reader the shape of the system, and it does that better without eleven names
   * under it.
   *
   * It also sharpens the argument ComponentPage.tsx makes for grouping at all: a
   * reader who lands on Slider should see that Switch is a sibling. Open, that family
   * is the only expanded thing on screen rather than one eleventh of a list.
   *
   * Keyed by label because the label is already this list's React key, so the two
   * cannot disagree about what a group is. */
  const activeGroup = useMemo(
    () => groups.find((g) => g.items.some((i) => i.id === active))?.label ?? null,
    [groups, active],
  );

  const [opened, setOpened] = useState<ReadonlySet<string>>(() => new Set<string>());

  /* Follows the spy as well as the route. On `/` the current item moves as the reader
   * scrolls, and a highlight inside a collapsed group is a highlight nobody can see. */
  useEffect(() => {
    if (!activeGroup) return;
    setOpened((prev) => (prev.has(activeGroup) ? prev : new Set(prev).add(activeGroup)));
  }, [activeGroup]);

  const toggle = (label: string) =>
    setOpened((prev) => {
      const next = new Set(prev);
      if (!next.delete(label)) next.add(label);
      return next;
    });

  /* Under a filter, a group with no surviving match is dropped rather than rendered
   * empty — the same rule ComponentIndex applies to its grid, and for the same reason:
   * an empty heading reads as a family with nothing in it. */
  const shown = useMemo(() => {
    if (!needle) return groups;
    return groups
      .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(needle)) }))
      .filter((g) => g.items.length > 0);
  }, [groups, needle]);

  const matches = shown.reduce((n, g) => n + g.items.length, 0);

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
    /* THE COLUMN IS CAPPED AND SCROLLS ITSELF, and that is a bug fix rather than a
     * refinement. `position: sticky` only sticks while the box fits: an element taller
     * than the viewport pins its TOP to `top` and then has nowhere left to go, so the
     * rest of it can only be reached by scrolling the page far enough to drag it up —
     * which is exactly the reported symptom, "I have to scroll to the bottom of the
     * page before the left panel scrolls".
     *
     * `max-height` to the space under the header, `overflow-y: auto` on the list, and
     * the filter outside that box so it does not scroll away from the thing it filters.
     * svh rather than vh: on a phone `100vh` is the address-bar-hidden height, which is
     * taller than the viewport actually is, and the cap would be wrong by that much —
     * it does nothing below lg today, but a cap that is only correct at one breakpoint
     * is a trap for whoever changes the breakpoint. */
    <nav
      aria-label="Sections"
      className="lg:sticky lg:top-[var(--showcase-header)] lg:flex lg:max-h-[calc(100svh-var(--showcase-header))] lg:flex-col lg:self-start lg:pt-space-9"
    >
      {dense && (
        <RailFilter
          ref={filterRef}
          value={query}
          onChange={setQuery}
          matches={matches}
          total={total}
        />
      )}

      {/* Horizontal and scrollable below lg, vertical above. Not hidden behind a
          hamburger — on a reference page the section list is the main affordance. */}
      {/* `flex-1 min-h-0` TWICE, down two levels, and every part of it is load-bearing.
          Both were measured wrong before they were measured right.

          Without `flex-1` on this box it sizes to its content and overflows the capped
          nav: the nav stopped at 539px while the list inside reported clientHeight 1666,
          so `overflow-y: auto` had nothing to scroll and the rail was exactly as stuck as
          the bug being fixed. Without `min-h-0` a flex item refuses to shrink below its
          content and produces the same number by the other route.

          And the scroller cannot be `h-full`. A percentage height resolves against the
          parent's `height`, which here is still `auto` — the 451px is a flex USED size,
          not a computed one — so `height: 100%` measured 1666 again. Making this box a
          flex column and the scroller its `flex-1 min-h-0` child avoids percentage
          resolution entirely, which is why the pattern repeats rather than shortens. */}
      <div className="relative lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <div
          ref={scrollerRef}
          className="flex gap-space-5 overflow-x-auto pb-space-3 lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-space-4 lg:overflow-y-auto lg:pb-space-9 lg:pr-space-2"
        >
          {/* A filter that matches nothing has to say so. Otherwise it is indistinguishable
              from a rail that failed to render — the same argument ComponentIndex makes
              about its own empty result. */}
          {needle && matches === 0 && (
            <p className="hidden px-space-3 py-space-2 text-body-sm text-content-tertiary lg:block">
              Nothing matches “{query.trim()}”.
            </p>
          )}

          {shown.map((group) => {
            /* Everything opens under a filter. A reader who has typed three letters is
               asking to see the matches, not to be told which family they are in and
               made to click. */
            const open = !dense || Boolean(needle) || opened.has(group.label);
            return (
            <div key={group.label} className="shrink-0">
              {/* Uppercase mono survives here. These are one- and two-word group
                  eyebrows over a list, which is what that treatment is for — unlike the
                  five-word section labels it was also being used on.

                  A button at lg and nothing at all below it, because below lg the strip
                  shows every item and there is no disclosure to announce — an
                  `aria-expanded` that is false while all eleven children are visible is
                  worse than no control. Same reason the label itself was already
                  `hidden lg:block`. */}
              {dense ? (
                <button
                  type="button"
                  onClick={() => toggle(group.label)}
                  aria-expanded={open}
                  disabled={Boolean(needle)}
                  className="mb-space-1 hidden w-full items-center gap-space-2 rounded-4 px-space-3 py-space-1 font-mono text-label-sm uppercase text-content-tertiary transition-colors duration-fast ease-standard hover:text-content-primary focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus disabled:cursor-default disabled:hover:text-content-tertiary lg:flex"
                >
                  <Caret open={open} />
                  <span className="min-w-0 flex-1 truncate text-left">{group.label}</span>
                  {group.count !== undefined && (
                    <span className="tabular-nums text-content-tertiary">{group.count}</span>
                  )}
                </button>
              ) : (
                /* A heading, not a control. A disclosure whose children are always
                   visible is a lie told with aria-expanded. */
                <p className="hidden items-center gap-space-2 px-space-3 pb-space-3 font-mono text-label-sm uppercase text-content-tertiary lg:flex">
                  <span className="min-w-0 flex-1 truncate">{group.label}</span>
                  {group.count !== undefined && (
                    <span className="tabular-nums">{group.count}</span>
                  )}
                </p>
              )}
              <ul
                className={`flex gap-space-2 lg:flex-col lg:gap-[2px] ${
                  open ? '' : 'lg:hidden'
                }`}
              >
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
            );
          })}
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

/**
 * The rail's filter.
 *
 * The system's own Input, for the reason ComponentIndex gives about its filter: this
 * site is the reference for that component, and a hand-rolled `<input className="border
 * …">` in its chrome is the page contradicting itself. `labelHidden` rather than
 * `aria-label` for the same reason Input's own prop docs give — it keeps
 * click-to-focus.
 *
 * lg only. Below it the rail is a horizontal strip of every item, which is already
 * short to swipe and was argued for as-is; a text field stacked above a chip strip is
 * a different component, not a smaller one.
 *
 * The count under the field is the whole feedback loop for a filter that lives beside
 * collapsed groups: without it, three letters that match nothing look identical to
 * three letters that match one thing inside a family you cannot see.
 */
const RailFilter = forwardRef<
  HTMLInputElement,
  { value: string; onChange: (v: string) => void; matches: number; total: number }
>(function RailFilter({ value, onChange, matches, total }, ref) {
  const typing = value.trim().length > 0;
  return (
    <div className="hidden shrink-0 pb-space-4 lg:block">
      <Input
        ref={ref}
        size="md"
        label="Filter"
        labelHidden
        /* NOT type="search". Chrome and Safari draw their own clear affordance inside a
           search field — a blue ✕ that answers to no token in this system and sat next
           to the accent focus ring looking like a bug. The slot below is the one this
           system ships for the job, and Input's own prop docs name "a clear button" as
           what it is for. */
        type="text"
        value={value}
        placeholder="Filter"
        onChange={(e) => onChange(e.target.value)}
        /* Escape clears, then a second Escape hands focus back to the page. The order
           matters: a single Escape that both cleared and blurred would make correcting
           a typo impossible without reaching for the mouse. */
        onKeyDown={(e) => {
          if (e.key !== 'Escape') return;
          e.stopPropagation();
          if (typing) onChange('');
          else e.currentTarget.blur();
        }}
        /* Two things share the slot because they are never both true: the shortcut hint
           while the field is empty, and the way out of the filter once it is not.
           Written down, in the one place either is discoverable — the same argument
           ComponentPage.tsx makes for printing ← → under the prev/next links. */
        trailing={
          typing ? (
            <button
              type="button"
              aria-label="Clear filter"
              onClick={() => {
                onChange('');
                /* Focus back to the field, not to the page. Clearing is a step inside
                   the filter, and losing focus after it means the next keystroke goes
                   somewhere else. */
                if (ref && typeof ref === 'object') ref.current?.focus();
              }}
              className="grid size-space-6 place-items-center rounded-full text-content-tertiary transition-colors duration-effects-fast ease-effects-fast hover:bg-fill-tertiary-hover hover:text-content-primary focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" className="size-space-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          ) : (
            <kbd className="rounded-2 bg-surface-secondary px-space-2 font-mono text-label-xs text-content-tertiary">
              /
            </kbd>
          )
        }
        trailingInteractive={typing}
      />
      {typing && (
        <p aria-live="polite" className="px-space-3 pt-space-2 font-mono text-label-xs text-content-tertiary">
          {matches} of {total}
        </p>
      )}
    </div>
  );
});

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
