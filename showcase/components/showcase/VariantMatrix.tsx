'use client';

import type { RegistryEntry } from '@/lib/core/Registry';
import { ScrollRegion } from './ScrollRegion';

/* The variant × state grid, generated from `recipe.matrix()`.
 *
 * Nothing in this file knows what a button is. It asks the recipe for cells and
 * asks the registry entry how to render one. That is the reason the grid can be
 * trusted: there is no code path by which the cell labelled `hover` could be given
 * a colour other than the one the live component uses on hover, because both come
 * from the same binding table two function calls earlier.
 *
 * Cells a variant does not bind are drawn at reduced opacity with a dash rather
 * than omitted — "ghost has no disabled background, only a disabled label" is
 * information, and a blank cell would read as an oversight. */

export function VariantMatrix({ entry }: { entry: RegistryEntry }) {
  const { recipe, Cell } = entry;
  const states = recipe.allStates;
  const cells = recipe.matrix(recipe.defaultSize);

  if (!Cell) return null;

  return (
    <div>
      {/* The grid is one column per state plus focus, so its width is set by the component
          rather than by the layout and the wider recipes overflow a phone — and it was a
          bare `overflow-x-auto`, which no keyboard can scroll and which said nothing about
          being scrollable at all. ScrollRegion brings the tab stop, the name and the edge
          fades.

          The paragraph below stays outside it. It explains the table rather than being
          part of it, and folding it into the scroller would put prose inside a region
          announced as "scrolls horizontally" and let it drag sideways with the columns.

          The label names the component even though a component page renders exactly one
          of these: it costs nothing to derive from the recipe already in hand, and it is
          what keeps the name right if this grid is ever rendered alongside its siblings
          the way the binding tables are on /verify. Default fade — a section's children
          sit directly on the page column here, with no card surface underneath. */}
      <ScrollRegion label={`${recipe.meta.title} variants by state`}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-[1%] whitespace-nowrap border-b-2 border-border-primary px-space-3 py-space-3 text-left font-mono text-label-sm font-medium text-content-tertiary">
                variant
              </th>
              {states.map((s) => (
                <th
                  key={s}
                  className="border-b-2 border-border-primary px-space-3 py-space-3 text-left font-mono text-label-sm font-medium text-content-tertiary"
                >
                  {s}
                </th>
              ))}
              <th className="border-b-2 border-border-primary px-space-3 py-space-3 text-left font-mono text-label-sm font-medium text-content-tertiary">
                focus
              </th>
            </tr>
          </thead>
          <tbody>
            {recipe.variants.map((variant) => {
              const row = cells.filter((c) => c.variant === variant);
              return (
                <tr key={variant} className="align-middle">
                  <th
                    scope="row"
                    className="whitespace-nowrap border-b-2 border-border-tertiary px-space-3 py-space-5 text-left font-mono text-label-sm font-normal text-content-secondary"
                  >
                    {variant}
                  </th>
                  {row.map((cell) => (
                    <td
                      key={cell.state}
                      className="border-b-2 border-border-tertiary px-space-3 py-space-5"
                    >
                      {cell.defined ? (
                        <Cell
                          variant={cell.variant}
                          state={cell.state}
                          disabled={cell.state === 'disabled'}
                        />
                      ) : (
                        /* The sentence twice: a `title` for a pointer, an sr-only copy for
                           everyone else. The title was the only carrier, which left this
                           file's own argument — an omitted cell would read as an oversight
                           — holding solely for readers who can hover. A touch screen has no
                           hover, and a `title` on a non-interactive span is not reliably
                           surfaced by assistive tech either, so "ghost has no disabled
                           background" arrived as a bare em dash: precisely the oversight the
                           dash exists to deny. The glyph goes aria-hidden so the fact is not
                           prefixed by "em dash" on the way out. */
                        <span
                          className="font-mono text-label-sm text-content-tertiary"
                          title={`${variant} does not bind ${cell.state}`}
                        >
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">
                            {variant} does not bind {cell.state}
                          </span>
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="border-b-2 border-border-tertiary px-space-3 py-space-5">
                    <div className="flex items-center gap-space-3">
                      <Cell
                        variant={variant}
                        state="base"
                        disabled={false}
                        extraClassName={recipe.forcedFocusClasses(variant)}
                      />
                      <span className="font-mono text-label-sm text-content-tertiary">
                        {recipe.focusModeFor(variant)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollRegion>
      <p className="mt-space-5 max-w-[74ch] text-body-sm text-content-tertiary">
        States above are rendered statically so they can be seen at once. The live row
        further up has the real <code className="font-mono">:hover</code>,{' '}
        <code className="font-mono">:active</code>, <code className="font-mono">:disabled</code> and{' '}
        <code className="font-mono">:focus-visible</code> — both are compiled from the same
        bindings, so they cannot disagree.
      </p>
    </div>
  );
}
