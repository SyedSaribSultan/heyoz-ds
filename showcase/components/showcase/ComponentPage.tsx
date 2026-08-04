'use client';

import { useEffect, useRef } from 'react';
import { notFound } from 'next/navigation';
import { registry } from './catalog';
import { ComponentSection } from './ComponentSection';
import { Header, NavRail, type NavGroup } from './Chrome';
import { ThemeProvider } from './ThemeProvider';

/* ---------------------------------------------------------------------------
 * One component, one page.
 *
 * The showcase was a single scroll until the written guidance landed, and then it
 * was some 150,000 pixels of one. Every registered component renders the same stack
 * of sections — the specimen, the written guidance, the token strip, the state
 * matrix, the motion table, the snippet — and the whole catalogue of those on one
 * route is not a page that can be scanned. The guidance is the part that made it
 * unscannable, which is a strange reason to regret writing it.
 *
 * So a component section became a route. Nothing about the section changed:
 * ComponentSection is the same component the index used to map over, and this file
 * hands it one entry instead of the whole list. The registry made that free — it
 * already knew the list, and `generateStaticParams` in the route just asks it.
 *
 * What it buys, beyond length: a component is addressable. "The Button page" is now
 * a URL somebody can send, Ctrl+F searches one component rather than every component
 * at once, and the first paint is one component's worth of content.
 *
 * NO COUNTS ARE WRITTEN DOWN HERE, deliberately, and that is a fix rather than a
 * style. This comment used to say "nine components" and then, one sentence later,
 * "fourteen sections" — two numerals that did not agree with each other or with the
 * catalogue, which by then held fourteen components. ComponentIndex.tsx had been
 * updated to fourteen and this file, Showcase.tsx and app/c/[component]/page.tsx had
 * not; that disagreement is the only reason the drift was noticeable at all. A
 * sentence phrased as "every registered component" is still true when the fifteenth
 * arrives. A numeral is a fact with an expiry date and nothing in the build checks
 * it — CLAUDE.md rule 5. The live figure is `registry.size`, rendered on the index.
 * ------------------------------------------------------------------------- */

/** Where ArrowLeft and ArrowRight already mean something, so the page-level shortcut
 *  below must not fire. None of this is hypothetical — a component page renders the
 *  real components, so /c/tabs has a live `role="tablist"` that moves selection with
 *  the arrows, /c/input has a caret, /c/dialog can have a dialog holding the keyboard,
 *  and ScrollRegion gives its scroller a tab stop for the precise purpose of letting
 *  the arrows scroll a clipped table (the variant matrix and the guidance pair-tables
 *  are two of its call sites). `role="grid"` is PrimitiveRamp's cell cursor, which is
 *  on the index and not here; it is listed anyway, because one more selector costs
 *  nothing and finding out later that a grid moved costs a bug report. An unguarded
 *  global listener would break the specimens the page exists to demonstrate — a
 *  shortcut that documents the components by defeating them. */
const ARROWS_ALREADY_TAKEN = [
  'input',
  'textarea',
  'select',
  '[contenteditable]',
  '[role="tablist"]',
  '[role="grid"]',
  '[role="dialog"]',
  '[role="region"]',
].join(', ');

export function ComponentPage({ id, staleSources = [] }: { id: string; staleSources?: string[] }) {
  const entry = registry.get(id);
  const all = registry.all;

  /* The two anchors at the foot of the page, so the keyboard shortcut can activate
   * the link itself rather than rebuild its URL. Same reason the section numbering is
   * derived: two expressions of one fact are one chance for them to disagree. */
  const prevRef = useRef<HTMLAnchorElement>(null);
  const nextRef = useRef<HTMLAnchorElement>(null);

  /* Prev/next as keys, not only as links.
   *
   * The bottom nav is sequential because prev/next is how somebody reads a set, and
   * the keys that mean "the next one" in every reader, gallery and slide deck did
   * nothing here. The listener is on the document so it works without the page having
   * to be focused first; the guards are what that costs, and they are not optional.
   *
   * It clicks the anchor rather than pushing a route, so the shortcut cannot navigate
   * anywhere the visible link does not — and if these ever become <Link>, the
   * shortcut inherits client-side routing along with them. */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

      /* A modifier makes it a different gesture that somebody else already owns:
       * Alt+← is Back, Cmd+← is start-of-line, Shift+→ extends a selection. */
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      /* Handled closer to the event than this — Tabs and PrimitiveRamp both
       * preventDefault on the arrows once they have moved their own cursor. */
      if (e.defaultPrevented) return;

      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest(ARROWS_ALREADY_TAKEN)) return;

      const link = e.key === 'ArrowLeft' ? prevRef.current : nextRef.current;
      /* Silent at the ends of the catalogue, and no wrap-around: landing on the first
       * component from the last would read as a bug, and knowing where you are in the
       * sequence is the only thing the sequence is for. */
      if (!link) return;

      /* Only after deciding to navigate. Preventing the default first would have eaten
       * the page's own horizontal scroll on the pages where nothing happens. */
      e.preventDefault();
      link.click();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  /* The rail lists every component, not this component's sections — on a page that
   * is one component, the useful next move is a different component. Position in the
   * catalogue is shown rather than hidden so the set still reads as a set. */
  const navGroups: NavGroup[] = [
    {
      label: 'components',
      items: all.map((e) => ({ id: e.recipe.id, label: e.recipe.meta.title, href: `/c/${e.recipe.id}` })),
    },
    {
      label: 'foundations',
      items: [
        { id: 'primitives', label: 'Primitives', href: '/#primitives' },
        { id: 'colour', label: 'Colour', href: '/#colour' },
        { id: 'typography', label: 'Typography', href: '/#typography' },
        { id: 'elevation', label: 'Elevation & motion', href: '/#elevation' },
        { id: 'assembled', label: 'Assembled', href: '/#assembled' },
      ],
    },
  ];

  /* A miss is a 404, not a page.
   *
   * This used to render "No component called {id}" with the whole catalogue listed
   * underneath, and that branch was unreachable and dishonest at the same time.
   * Unreachable: `dynamicParams = false` in the route means Next answers a segment
   * that generateStaticParams did not return before this component is asked to
   * render, so only a bug could get here. Dishonest: if a bug ever had, the page
   * would have replied to a crawler and to a link checker with HTTP 200 and a body
   * saying the thing does not exist — a soft 404, which is the one failure mode a
   * status code exists to prevent. The message lives in app/not-found.tsx now, on the
   * response that carries the right status.
   *
   * notFound() rather than `return null` because it returns `never`, so TypeScript
   * narrows `entry` for everything below without a rendered branch existing to be
   * wrong about. */
  if (!entry) notFound();

  const position = all.findIndex((e) => e.recipe.id === id) + 1;
  const prev = all[position - 2];
  const next = all[position];

  return (
    <ThemeProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-space-4 focus:top-space-4 focus:z-tooltip focus:rounded-4 focus:bg-fill-inverse focus:px-space-4 focus:py-space-3 focus:text-label-sm focus:text-content-on-inverse"
      >
        Skip to content
      </a>

      <Header route="design" staleSources={staleSources} />

      <div className="mx-auto grid max-w-container-xl grid-cols-1 gap-x-space-9 px-space-6 lg:grid-cols-rail">
        <NavRail groups={navGroups} activeId={id} />

        <main id="main" className="min-w-0 pb-space-18">
          <ComponentSection entry={entry} index={String(position).padStart(2, '0')} />

          {/* Sequential rather than a grid. The catalogue is still a set small enough
              to read end to end, and prev/next is how somebody reads a set — that
              argument does depend on the size, so it is worth revisiting if the
              catalogue ever grows past a couple of dozen, at which point a reader
              wants a filter rather than a chain. */}
          <nav
            aria-label="Other components"
            className="mt-space-17 flex flex-wrap gap-space-6 border-t-2 border-border-primary pt-space-7"
          >
            {prev && (
              <a ref={prevRef} href={`/c/${prev.recipe.id}`} className="group max-w-[28ch]">
                <span className="font-mono text-label-sm text-content-tertiary">← previous</span>
                <span className="mt-space-1 block font-display text-heading-sm font-bold text-content-primary">
                  {prev.recipe.meta.title}
                </span>
              </a>
            )}
            {next && (
              <a
                ref={nextRef}
                href={`/c/${next.recipe.id}`}
                className="group ml-auto max-w-[28ch] text-right"
              >
                <span className="font-mono text-label-sm text-content-tertiary">next →</span>
                <span className="mt-space-1 block font-display text-heading-sm font-bold text-content-primary">
                  {next.recipe.meta.title}
                </span>
              </a>
            )}

            {/* The shortcut, written down. An undiscoverable shortcut is a shortcut
                for the person who wrote it, and this is the only place it is
                announced. `w-full` puts it on its own wrapped row under the two
                links, so it reads as a footnote to them rather than a third
                destination.

                The glyphs are duplicated as prose for a screen reader: a bare "←" is
                announced inconsistently and often not at all, and an aria-label on a
                <kbd> is an aria-label on a generic element — the same thing
                ScrollRegion notes gets discarded. The keys are surfaces rather than
                bordered chips because a stroke here would be doing separation, and
                separation is a surface step in this system (CLAUDE.md 1c). */}
            <p className="w-full font-mono text-label-xs text-content-tertiary">
              <span className="sr-only">
                The left and right arrow keys move to the previous and next component.
              </span>
              <span aria-hidden="true">
                <kbd className="rounded-2 bg-surface-secondary px-space-2 text-content-secondary">
                  ←
                </kbd>{' '}
                <kbd className="rounded-2 bg-surface-secondary px-space-2 text-content-secondary">
                  →
                </kbd>{' '}
                move between components
              </span>
            </p>
          </nav>
        </main>
      </div>
    </ThemeProvider>
  );
}
