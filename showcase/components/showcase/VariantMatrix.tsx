'use client';

import type { RegistryEntry } from '@/lib/core/Registry';

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
    <div className="overflow-x-auto">
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
                      <span
                        className="font-mono text-label-sm text-content-tertiary"
                        title={`${variant} does not bind ${cell.state}`}
                      >
                        —
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
