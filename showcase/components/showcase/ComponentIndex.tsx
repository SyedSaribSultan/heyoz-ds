'use client';

import { useState } from 'react';
import { registry } from './catalog';
import { content } from '@/lib/content';
import { Section } from './Section';
import { Button, Input } from '@/components/ui';

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
 * The filter is the system's own Input, for the same reason. This page is the
 * reference for that component, so a hand-rolled `<input className="border …">` here
 * would be the index documenting a field it does not itself use — and the first thing
 * that would drift is the one detail the recipe exists to hold: the 16px floor below
 * which iOS Safari zooms the viewport on focus.
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
 *
 * The filter takes tiles OUT of the grid and changes nothing about what a tile is.
 * That distinction is the whole safety margin: `oz-grid` reflows on its own box, so a
 * shorter list is a shorter grid and the three invariants above still hold on every
 * tile that survives. Dimming non-matches in place — which is what the primitive ramps
 * do, and correctly, because there the column alignment is the information — would be
 * wrong here: nothing lines up across tiles, so a dimmed tile is a tile you still have
 * to read past.
 * ------------------------------------------------------------------------- */

/** The fixed geometry every tile shares. Written once here rather than per tile,
 *  because the point of the well is that every tile has the same one. (This said "all
 *  fourteen" and now says "every": a literal count in a comment about a generated list
 *  is the drift the note at the top of ComponentPage.tsx was written about, and the
 *  filter means the number rendered is no longer the number registered anyway.) */
const WELL =
  'oz-canvas pointer-events-none relative flex h-[132px] items-center justify-center ' +
  'overflow-hidden rounded-5 px-space-4';

/** Every registered entry, its definition resolved, and the one lowercased string the
 *  filter reads.
 *
 *  `definition` is resolved HERE and handed to the tile, rather than resolved again
 *  inside the map below. Two call sites both writing
 *  `content[id]?.definition ?? recipe.meta.blurb` is a filter that can disagree with
 *  its own results, and that is the worst class of search bug — it presents as broken
 *  match logic when what is actually wrong is the haystack.
 *
 *  Recomputed per render, not memoised and not hoisted to module scope, and each of
 *  those was considered. `useMemo` cannot help: `registry.all` returns a fresh array on
 *  every call, so there is no stable dependency to key on and the memo would recompute
 *  on every keystroke while reading as though it did not. Module scope would work in
 *  production — the catalogue is fixed before this module's body runs — and is wrong in
 *  development, which is where this file is used: editing a `Preview` in catalog.tsx
 *  re-registers the entry, and a captured module-scope array would still be holding the
 *  previous one, so the tile you are iterating on would not change until something
 *  happened to reload this file too. The work is one string concat and one `toLowerCase`
 *  per component, over a title and a sentence. It is not worth a trap. */
function searchable() {
  return registry.all.map((entry) => {
    const definition = content[entry.recipe.id]?.definition ?? entry.recipe.meta.blurb;
    return {
      entry,
      definition,
      haystack: `${entry.recipe.meta.title} ${definition}`.toLowerCase(),
    };
  });
}

export function ComponentIndex({ index }: { index: string }) {
  const [query, setQuery] = useState('');

  const catalogue = searchable();

  /* Trimmed, so a trailing space from a paste or a phone keyboard does not empty the
   * grid. No debounce either: this is one `includes` per entry, which costs less than
   * the state update that schedules it, and that stays true at the thirty components
   * this filter was added for. */
  const needle = query.trim().toLowerCase();
  const shown = needle ? catalogue.filter((c) => c.haystack.includes(needle)) : catalogue;

  return (
    <Section
      id="components"
      index={index}
      /* The TRUE catalogue size, never the filtered one.
       *
       * The tag sits in the section header, above and away from the field, and a
       * heading that rewrites its own subject as you type is disorienting — you look
       * up to check what section you are in and the answer moved. It also reads as a
       * claim about the system rather than about your query: "3 · one page each" says
       * the design system has three components.
       *
       * The honest place for a match count is beside the control that caused it, which
       * is where it is, and that also fixes the announcement: an aria-live count in the
       * header would be read out with no nearby context for what changed. */
      title="Components"
      tag={`${catalogue.length} · one page each`}
      blurb="Every one is the real component, compiled from the recipe the app imports. Open a page for its variants, its guidance, and what the build does and does not enforce about it."
    >
      <div className="oz-stack oz-stack-8">
        {/* items-end so the count sits on the field's baseline rather than the label's,
            and pb-space-3 lifts it clear of the Input's own message line. The same row
            shape as the primitive filter in Primitives.tsx, which is the proven pairing
            for this component with a `message` set. */}
        <div className="flex flex-wrap items-end gap-space-5">
          <div className="w-full max-w-[360px]">
            <Input
              label="Filter"
              /* Three terms that actually match, checked against the resolved
                 definitions rather than invented: `badge` hits a title, `surface` hits
                 Card's definition, `pricing` hits Pricing Card. A placeholder
                 demonstrating a query that returns nothing teaches the wrong thing
                 about the field on first contact. */
              placeholder="badge, surface, pricing…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              hint="Matches the title and the definition printed under it."
            />
          </div>
          {/* The live region is this line, and it is rendered unconditionally.
            *
            * Both parts matter. A live region is announced when an element already in
            * the accessibility tree mutates, so a count that only appears once you are
            * filtering is a region born at the moment it would have spoken and is
            * announced by nothing — which is why it states the total at rest rather than
            * rendering nothing.
            *
            * And it is the count, not the grid. Marking the grid live would replay every
            * surviving tile's title and definition on each keystroke; one short sentence
            * is the whole of what changed. It is also how a screen reader hears the empty
            * case at all — the "0 of N" arrives here, before the panel below it. */}
          <p
            aria-live="polite"
            className="pb-space-3 font-mono text-label-sm text-content-tertiary"
          >
            {needle
              ? `${shown.length} of ${catalogue.length} match`
              : `all ${catalogue.length} shown`}
          </p>
        </div>

        {shown.length === 0 ? (
          /* A stated result, not an absent grid.
           *
           * An empty `oz-grid` collapses to nothing and leaves the page looking like it
           * failed to load — the reader cannot tell a filter with no matches from a
           * component list that did not render. So the region keeps its presence and
           * says which of the two happened.
           *
           * `oz-canvas` and no stroke, which is the same choice the wells above make and
           * the same argument Stage settled in Section.tsx: the dot grid marks out a
           * region that would hold specimens without adding an edge. A bordered box here
           * would contradict this file's own opening paragraph about tiles, in the one
           * place a reader is most likely to be looking at it. */
          <div className="oz-canvas rounded-6 p-space-9">
            <div className="oz-stack oz-stack-4">
              <p className="font-display text-heading-sm font-bold text-content-primary">
                Nothing matches “{query.trim()}”.
              </p>
              <p className="max-w-[64ch] text-body-md text-content-secondary">
                The catalogue is the entire component layer — every registered recipe, all{' '}
                {catalogue.length} of them, with no second page to try. A miss here means the
                system has not got the thing yet, rather than that it is filed somewhere else.
              </p>
              <p className="max-w-[64ch] text-body-md text-content-secondary">
                The filter reads two strings: the title, and the definition each tile prints
                beneath it. Variant names, token bindings and the written guidance are not
                searched — those are generated per component and live on its own route, which is
                the only place a search across them could be honest about what it found.
              </p>
              <div>
                <Button variant="outline" size="sm" onClick={() => setQuery('')}>
                  Clear the filter
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* oz-grid, from dist/layout.css. Container-aware and gapped, so it reflows on
             its own box rather than on the viewport — the primitive doing the job it
             was built for rather than a hand-written grid-cols-N ladder. */
          <div className="oz-grid" style={{ '--grid-min': '17rem' } as React.CSSProperties}>
            {shown.map(({ entry, definition }) => {
              const { recipe, Preview } = entry;

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
        )}
      </div>
    </Section>
  );
}
