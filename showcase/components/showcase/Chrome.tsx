'use client';

import { useEffect, useMemo, useState } from 'react';
import { auditSummary } from '@/lib/core/audit';
import { useTheme } from './ThemeProvider';

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

export function Header({
  route = 'design',
  /* Computed by the route (a server component) via lib/core/staleness.ts and passed
   * in, because the check needs node:fs and this file is client-side. */
  staleSources = [],
}: {
  route?: RouteKey;
  staleSources?: string[];
}) {
  const { mode, setMode } = useTheme();
  const built = new Date(auditSummary.generatedAt)
    .toISOString()
    .slice(0, 16)
    .replace('T', ' ');

  /* The bar is opaque, not a translucent blur. The preset emits colours as plain
   * var(--oz-…) rather than with an <alpha-value> slot, so `bg-background/95`
   * silently generates no rule at all — and a blur behind an opaque bar buys
   * nothing anyway. */
  return (
    <header className="sticky top-0 z-sticky border-b-2 border-border-primary bg-background">
      <div className="mx-auto flex max-w-container-xl flex-wrap items-center gap-space-4 px-space-6 py-space-4">
        {/* Sizes here are deliberately unchanged: three files hardcode an 88px header
            offset — scroll-padding-top in globals.css, scroll-mt on Section, and the
            rail's sticky top — so growing the bar silently misaligns every anchor on
            the page. Contrast and weight do the work instead. */}
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
            useful than the count — see lib/core/staleness.ts. */}
        {staleSources.length > 0 ? (
          <p className="hidden font-mono text-label-sm text-content-critical md:block">
            <span className="font-medium">stale</span> ·{' '}
            {staleSources.map((f) => f.replace('build/', '')).join(', ')} changed after
            this build · run <code>node build/build.mjs</code>
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
            · built {built} UTC →
          </a>
        )}

        <div
          role="group"
          aria-label="Colour mode"
          className="flex gap-space-1 rounded-full bg-surface-secondary p-space-1"
        >
          {(['light', 'dark'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-full px-space-4 py-space-2 text-label-sm transition-colors duration-fast ease-standard focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus ${
                mode === m
                  ? 'bg-fill-elevated font-medium text-content-primary shadow-x-small'
                  : 'text-content-tertiary hover:text-content-primary'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

export type NavGroup = { label: string; items: NavItem[] };

/** Tracks which section is on screen, so the rail can mark it. This is the only
 *  place other than a real primary button where the accent appears in the page
 *  chrome — an accent used four times has stopped being a signal. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);

  useEffect(() => {
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
      { rootMargin: '-88px 0px -55% 0px', threshold: [0, 0.1, 0.35, 0.75, 1] },
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [ids]);

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

  return (
    <nav aria-label="Sections" className="lg:sticky lg:top-[88px] lg:self-start lg:pt-space-9">
      {/* Horizontal and scrollable below lg, vertical above. Not hidden behind a
          hamburger — on a reference page the section list is the main affordance. */}
      <div className="flex gap-space-5 overflow-x-auto pb-space-3 lg:flex-col lg:gap-space-4 lg:overflow-visible lg:pb-0">
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
    </nav>
  );
}
