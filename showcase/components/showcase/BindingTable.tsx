'use client';

import { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui';
import type { ComponentRecipe } from '@/lib/core/Recipe';
import { ScrollRegion } from './ScrollRegion';
import { useTheme } from './ThemeProvider';

/* Every token a component names, resolved in the current mode, with the tier-1
 * primitive it came from.
 *
 * This table is the reason the showcase exists in this shape. It is not
 * documentation *about* the component — it is a rendering of the object the
 * component is built from, joined against the build's own audit output. There is no
 * step at which a human could transcribe a value into it wrongly.
 *
 * Inherited rows are dimmed: they show that `hover` keeps content/on-brand rather
 * than changing it, which is exactly the kind of thing a variant table with one row
 * per state hides.
 *
 * Row rules are border/tertiary, not border/primary. They were the latter, which is
 * the same weight as the container edge and the section rule — so a 40-row table gave
 * forty lines each as loud as the boundary of the region holding them, and the data
 * had to be read past them. Nothing structural changed here: border-b-2 is
 * bottom-only, so adjacent cells always merged into ordinary row rules rather than a
 * grid. What changed is that separating rows inside a table is a quieter job than
 * bounding the table, and now looks like it. */

export function BindingTable({ recipe }: { recipe: ComponentRecipe<string, string> }) {
  const { mode } = useTheme();
  const [showInherited, setShowInherited] = useState(false);

  const rows = useMemo(() => recipe.bindingRows(mode), [recipe, mode]);
  const visible = showInherited ? rows : rows.filter((r) => !r.inherited);

  return (
    <div>
      <div className="mb-space-4 flex items-center gap-space-4">
        <p className="font-mono text-label-sm text-content-tertiary">
          {visible.length} of {rows.length} bindings · resolved in {mode}
        </p>
        {/* The system's Checkbox, not a raw input.
            This was `<input type="checkbox" class="accent-fill-brand">` — a control that
            opted out of the very thing the page exists to demonstrate. `accent-color` hands
            the box, the tick, the border and the focus ring to the platform, so it took one
            token and drew the rest of itself out of the OS: square in one browser, rounded
            in another, and bearing no relation to the Checkbox this system ships one
            directory over. It cannot carry the house focus ring either, and its tick has
            none of the motion checkboxRecipe declares.
            Reaching for the component means this control *is* the component, which is the
            only defensible answer on a page whose entire argument is that there is exactly
            one description of a checkbox. The same control in Verification.tsx carries the
            same defect and takes the same fix.

            `ml-auto` moves to a wrapper: Checkbox takes no className, deliberately — a
            component that accepts arbitrary classes is a component whose appearance is
            described in two places. */}
        <div className="ml-auto">
          <Checkbox
            checked={showInherited}
            onCheckedChange={setShowInherited}
            label="Show inherited"
          />
        </div>
      </div>

      {/* Six columns of mono with a hex in the last one, none of them wrapping — it
          overflows on anything narrow, and it was a bare `overflow-x-auto`, so `value`, the
          column the table exists for, was unreachable without a pointer (WCAG 2.1.1). The
          frame moves onto the region because the region is the box that clips; a radius has
          to be on the element hiding the overflow or the corners cut nothing.

          The label names the component, and that matters more here than anywhere else in
          the folder: /verify renders one of these per registered component, fourteen as
          this is written, and `role="region"` is a landmark. Fourteen landmarks all called
          "Bindings" would be a rotor listing the same word fourteen times — worse than the
          nothing that was there before, because a landmark that cannot be told from its
          neighbours costs a reader the attempt as well as the answer. Named for their
          component they are a usable index of the page. Two things keep the trade honest:
          ScrollRegion only takes the role when the table is genuinely clipped, so a wide
          window lists none of them, and the name is derived from the recipe rather than
          passed in — a table cannot end up labelled with a component it is not showing.

          Default fade. The rows sit on the page; only the header band is
          surface/secondary, and the fade's job is the data. */}
      <ScrollRegion
        label={`${recipe.meta.title} bindings`}
        className="rounded-5 border-2 border-border-secondary"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-secondary">
              {['variant', 'state', 'role', 'token', 'primitive', 'value'].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="whitespace-nowrap border-b-2 border-border-primary px-space-4 py-space-3 text-left font-mono text-label-sm font-medium text-content-tertiary"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr
                key={`${r.variant}-${r.state}-${r.role}-${i}`}
                className={r.inherited ? 'text-content-tertiary' : 'text-content-secondary'}
              >
                <td className="whitespace-nowrap border-b-2 border-border-tertiary px-space-4 py-space-3 font-mono text-label-sm">
                  {r.variant}
                </td>
                <td className="whitespace-nowrap border-b-2 border-border-tertiary px-space-4 py-space-3 font-mono text-label-sm">
                  {r.state}
                  {r.inherited && (
                    <span className="ml-space-2 text-content-tertiary" title="inherited from base">
                      ↑
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap border-b-2 border-border-tertiary px-space-4 py-space-3 font-mono text-label-sm">
                  {r.role}
                </td>
                {/* The token name is the row's subject and the cell a reader scans for,
                    so it steps up to content/primary — but only on a row that is
                    stating its own value. An inherited row stays uniformly dim, because
                    the dimming is what says "hover did not change this", and lifting one
                    cell out of it would spend the signal to gain emphasis. */}
                <td
                  className={`whitespace-nowrap border-b-2 border-border-tertiary px-space-4 py-space-3 font-mono text-label-sm ${
                    r.inherited ? '' : 'text-content-primary'
                  }`}
                >
                  {r.token}
                </td>
                <td className="whitespace-nowrap border-b-2 border-border-tertiary px-space-4 py-space-3 font-mono text-label-sm">
                  {r.primitive}
                </td>
                <td className="whitespace-nowrap border-b-2 border-border-tertiary px-space-4 py-space-3">
                  <span className="flex items-center gap-space-3">
                    <span
                      aria-hidden="true"
                      className={`h-space-5 w-space-5 shrink-0 rounded-2 border-2 border-border-tertiary ${
                        r.alpha < 1 ? 'oz-alpha-grid' : ''
                      }`}
                    >
                      <span
                        className="block h-full w-full rounded-[1px]"
                        style={{ background: r.value }}
                      />
                    </span>
                    <span className="font-mono text-label-sm">{r.value}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
    </div>
  );
}
