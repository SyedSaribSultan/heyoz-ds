'use client';

import { registry } from './catalog';
import { content } from '@/lib/content';
import { Section } from './Section';

/* ---------------------------------------------------------------------------
 * The catalogue, as a grid of links.
 *
 * This replaced nine full component sections on the index. Each one is now a route,
 * and what stays here is the specimen and the sentence — enough to choose from,
 * which is the only job an index has.
 *
 * The tile is deliberately not a Card. A Card would make each entry a bordered box
 * and put us back where the stroke work started; the grid gap and the specimen's own
 * shape do the separating. It is the same argument Badge and Alert won.
 *
 * WHAT WENT WRONG HERE, because the fix is the whole design of this file.
 *
 * The tile used to render each component's `Live` demo, scaled to 90%, into a
 * min-height box. `Live` is the full specimen — every variant, every size, the state
 * rows, the explanatory paragraphs — so the result was fourteen tiles of unrelated
 * heights: Badge contributed three rows of fourteen pills, Card four columns squeezed
 * to 70px with one word per line, and PricingCard three 400px cards and a 1240px
 * comparison table inside a 17rem column. A `scale-90` on the way in was the tell —
 * it was compensating for content that did not belong there rather than fixing it.
 *
 * Three things now hold the grid regular:
 *
 *   1. A separate `Preview` per entry — one instance, natural size. See RegistryEntry.
 *   2. A fixed-height well, identical on every tile, that CLIPS. A preview cannot
 *      change the tile's height, so no tile can push its row taller than the rest.
 *   3. Clamped copy — title one line, definition two. Definitions in this system run
 *      from nine words to forty, and unclamped that alone made every row ragged.
 * ------------------------------------------------------------------------- */

/** The fixed geometry every tile shares. Written once here rather than per tile,
 *  because the point of the well is that all fourteen are the same. */
const WELL =
  'oz-canvas pointer-events-none relative flex h-[132px] items-center justify-center ' +
  'overflow-hidden rounded-5 px-space-4';

export function ComponentIndex({ index }: { index: string }) {
  const entries = registry.all;

  return (
    <Section
      id="components"
      index={index}
      title="Components"
      tag={`${entries.length} · one page each`}
      blurb="Every one is the real component, compiled from the recipe the app imports. Open a page for its variants, its guidance, and what the build does and does not enforce about it."
    >
      {/* oz-grid, from dist/layout.css. Container-aware and gapped, so it reflows on
          its own box rather than on the viewport — the primitive doing the job it
          was built for rather than a hand-written grid-cols-N ladder. */}
      <div className="oz-grid" style={{ '--grid-min': '17rem' } as React.CSSProperties}>
        {entries.map((entry) => {
          const { recipe, Preview } = entry;
          const definition = content[recipe.id]?.definition ?? recipe.meta.blurb;

          return (
            <a
              key={recipe.id}
              href={`/c/${recipe.id}`}
              className="group flex min-w-0 flex-col gap-space-4 rounded-6 p-space-5 transition-colors duration-effects-fast ease-effects-fast hover:bg-fill-tertiary-hover focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
            >
              {/* The specimen, at rest and non-interactive. `pointer-events-none`
                  because the whole tile is one link — a live Button inside it would
                  be a target inside a target, which is the failure Card's own
                  guidance names. */}
              <div aria-hidden="true" className={WELL}>
                {Preview ? (
                  <Preview />
                ) : (
                  /* Deliberately NOT a fallback to <Live />. Substituting the full
                     demo is what broke this grid, so an entry with no preview says so
                     in the one place somebody will see it. */
                  <span className="font-mono text-label-sm text-content-tertiary">
                    no preview
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate font-display text-heading-xs font-bold text-content-primary">
                  {recipe.meta.title}
                </p>
                {/* Two lines, always. `min-h` reserves the second line so a nine-word
                    definition and a forty-word one occupy the same box and the row
                    below stays level. */}
                <p className="mt-space-2 line-clamp-2 min-h-[2.75em] text-body-sm text-content-secondary">
                  {definition}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </Section>
  );
}
