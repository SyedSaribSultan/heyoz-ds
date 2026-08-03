'use client';

import { registry } from './catalog';
import { ComponentSection } from './ComponentSection';
import { Header, NavRail, type NavGroup } from './Chrome';
import { ThemeProvider } from './ThemeProvider';

/* ---------------------------------------------------------------------------
 * One component, one page.
 *
 * The showcase was a single scroll until the written guidance landed, and then it
 * was 150,000 pixels of one. Twelve sections per component times nine components is
 * not a page that can be scanned, and the guidance is the part that made it
 * unscannable — which is a strange reason to regret writing it.
 *
 * So a component section became a route. Nothing about the section changed:
 * ComponentSection is the same component the index used to map over, and this file
 * hands it one entry instead of nine. The registry made that free — it already knew
 * the list, and `generateStaticParams` in the route just asks it.
 *
 * What it buys, beyond length: a component is addressable. "The Button page" is now
 * a URL somebody can send, Ctrl+F searches one component rather than fourteen
 * sections, and the first paint is one component's worth of content.
 * ------------------------------------------------------------------------- */

export function ComponentPage({ id, staleSources = [] }: { id: string; staleSources?: string[] }) {
  const entry = registry.get(id);
  const all = registry.all;

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

  if (!entry) {
    return (
      <ThemeProvider>
        <Header route="design" staleSources={staleSources} />
        <main className="mx-auto max-w-container-xl px-space-6 pt-space-12">
          <h1 className="font-display text-display-sm font-extrabold text-content-primary">
            No component called “{id}”.
          </h1>
          <p className="mt-space-5 max-w-[58ch] text-body-lg text-content-secondary">
            The catalogue has {all.length}:{' '}
            {all.map((e) => e.recipe.meta.title).join(', ')}. A component appears here by being
            registered in <code className="font-mono">catalog.tsx</code>, so a missing one is a
            missing registration rather than a missing page.
          </p>
        </main>
      </ThemeProvider>
    );
  }

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

          {/* Sequential rather than a grid of nine. Nine components is a set small
              enough to read end to end, and prev/next is how somebody reads a set. */}
          <nav
            aria-label="Other components"
            className="mt-space-17 flex flex-wrap gap-space-6 border-t-2 border-border-primary pt-space-7"
          >
            {prev && (
              <a href={`/c/${prev.recipe.id}`} className="group max-w-[28ch]">
                <span className="font-mono text-label-sm text-content-tertiary">← previous</span>
                <span className="mt-space-1 block font-display text-heading-sm font-bold text-content-primary">
                  {prev.recipe.meta.title}
                </span>
              </a>
            )}
            {next && (
              <a href={`/c/${next.recipe.id}`} className="group ml-auto max-w-[28ch] text-right">
                <span className="font-mono text-label-sm text-content-tertiary">next →</span>
                <span className="mt-space-1 block font-display text-heading-sm font-bold text-content-primary">
                  {next.recipe.meta.title}
                </span>
              </a>
            )}
          </nav>
        </main>
      </div>
    </ThemeProvider>
  );
}
