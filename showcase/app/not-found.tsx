import type { Metadata } from 'next';
import { Header } from '@/components/showcase/Chrome';
import { ThemeProvider } from '@/components/showcase/ThemeProvider';
import { allRecipes } from '@/lib/recipes';
import { staleSources } from '@/lib/core/staleness';

/* ---------------------------------------------------------------------------
 * The 404, rendered inside the design system.
 *
 * `/c/buton` is a real 404: app/c/[component]/page.tsx sets `dynamicParams = false`,
 * so a segment `generateStaticParams` did not return is answered with the status code
 * before anything renders. That is the correct answer and it was being given by Next's
 * stock error page — a centred serif "404 | This page could not be found" with no
 * header, no rail, no mode toggle, and none of this system's type or colour on it. A
 * design system that falls out of itself on a typo is making a claim about its own
 * coverage that it cannot support.
 *
 * The substance of the copy below is inherited from a branch in ComponentPage.tsx that
 * rendered "No component called X" with the catalogue underneath. That branch was
 * unreachable (see the note there) and, worse, would have answered a crawler with HTTP
 * 200 while saying the thing does not exist — a soft 404, the one failure a status code
 * exists to prevent. The words were the only good part of it, so they moved here, onto
 * the response that carries the right status.
 *
 * TWO THINGS CHANGED IN THE MOVE, both deliberate.
 *
 * The heading no longer quotes the id, because this file cannot know it. Next renders
 * not-found.tsx without params — there is no segment to read — and the route is
 * prerendered as `/_not-found`, so the only ways to name the URL would be
 * `usePathname()` in a client component, which on a prerendered page renders one
 * string on the server and a different one on the client, or a header read that forces
 * the page dynamic. Neither is worth it: the reader can see the URL in the address bar,
 * and this page's actual job is to say what does exist.
 *
 * And it names both lists rather than only `catalog.tsx`. The old branch named the
 * registry because the registry is what it had failed to find. The 404 is answered
 * earlier than that, by `generateStaticParams`, which reads `allRecipes` — so somebody
 * sent to `catalog.tsx` alone could add a registration, rebuild, and still get this
 * page. Both lists hold the same recipes and both have to.
 *
 * Counts and titles come from `allRecipes`, not from the registry: this is a server
 * component and the registry lives in a .tsx file full of client JSX demos. It is the
 * same import the route itself uses, which is what makes the list below the actual set
 * of pages rather than a description of it.
 * ------------------------------------------------------------------------- */

/** The same string app/c/[component]/page.tsx returns from `generateMetadata` for an
 *  id it cannot find, so the tab title does not depend on which of the two paths
 *  produced the 404. */
export const metadata: Metadata = {
  title: 'Not found · HeyOz design system',
  description: 'No page at this URL. The catalogue is every registered recipe.',
};

export default function NotFound() {
  return (
    <ThemeProvider>
      {/* Every route has this and so does this one — a page reached by mistake is the
          worst place to drop the one control that gets a keyboard past the header. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-space-4 focus:top-space-4 focus:z-tooltip focus:rounded-4 focus:bg-fill-inverse focus:px-space-4 focus:py-space-3 focus:text-label-sm focus:text-content-on-inverse"
      >
        Skip to content
      </a>

      {/* The real header, including the stale-sources warning. A 404 is a page somebody
          landed on while looking for something, which makes it exactly as bad a place
          to hide "the numbers on this site describe files that have since changed" as
          any other. `staleSources()` needs node:fs and this component is the server
          boundary that can call it — see lib/core/staleness.ts. */}
      <Header route="design" staleSources={staleSources()} />

      <main id="main" className="mx-auto max-w-container-xl px-space-6 pb-space-18 pt-space-12">
        {/* Same construction as the no-matches state in ComponentIndex.tsx: the dot
            canvas marks out the region without a stroke, because a stroke here would be
            doing separation and separation in this system is a surface step or space
            (CLAUDE.md 1c). Two pages that both mean "nothing here" should look like
            each other. */}
        <div className="oz-canvas rounded-6 p-space-9">
          <div className="oz-stack oz-stack-5">
            <p className="font-mono text-label-sm uppercase text-content-tertiary">404</p>

            <h1 className="font-display text-display-sm font-extrabold text-content-primary">
              That page is not in the catalogue.
            </h1>

            <p className="max-w-[64ch] text-body-lg text-content-secondary">
              A component page exists because its recipe is in{' '}
              <code className="font-mono text-body-md">lib/recipes/index.ts</code>, and it
              renders because that recipe is registered in{' '}
              <code className="font-mono text-body-md">catalog.tsx</code>. Both lists hold the
              same recipes, so a URL with nothing behind it is a missing registration rather
              than a missing page. The catalogue has {allRecipes.length}:
            </p>

            {/* oz-cluster, from dist/layout.css: it wraps rather than overflowing at any
                container width, which is why a row this long needs no breakpoint here and
                stays right when the catalogue grows. Real links in a real list — the old
                branch printed the titles as a comma-separated sentence, which named every
                destination and gave a keyboard none of them. */}
            <ul className="oz-cluster oz-cluster-3">
              {allRecipes.map((r) => (
                <li key={r.meta.id}>
                  <a
                    href={`/c/${r.meta.id}`}
                    className="flex min-h-target items-center rounded-4 bg-surface-secondary px-space-4 text-body-sm text-content-primary transition-colors duration-effects-fast ease-effects-fast hover:bg-fill-tertiary-hover focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
                  >
                    {r.meta.title}
                  </a>
                </li>
              ))}
            </ul>

            <p className="max-w-[64ch] text-body-md text-content-tertiary">
              The foundations — primitives, colour, typography, elevation and motion — are on{' '}
              <a
                href="/"
                className="text-content-secondary underline decoration-border-tertiary underline-offset-2 hover:text-content-primary focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
              >
                the index
              </a>
              , and every gate the build measures is on{' '}
              <a
                href="/verify"
                className="text-content-secondary underline decoration-border-tertiary underline-offset-2 hover:text-content-primary focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
              >
                the verification route
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </ThemeProvider>
  );
}
