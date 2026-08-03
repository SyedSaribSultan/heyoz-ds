'use client';

import { tableRecipe } from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';

export type Column = { key: string; label: string; align?: 'left' | 'right' };

export type TableProps<Row extends Record<string, React.ReactNode>> = {
  columns: Column[];
  rows: Row[];
  /** Row keys that are selected. Drives both fill/selected and aria-selected — one
   *  prop, so the visual state and the announced state cannot diverge. */
  selectedKeys?: string[];
  rowKey?: (row: Row, index: number) => string;
  onRowClick?: (row: Row, index: number) => void;
  /** Showcase-only, as elsewhere. */
  forceRowState?: StateName;
  caption?: string;
};

export function Table<Row extends Record<string, React.ReactNode>>({
  columns,
  rows,
  selectedKeys = [],
  rowKey,
  onRowClick,
  forceRowState,
  caption,
}: TableProps<Row>) {
  const keyOf = rowKey ?? ((_r: Row, i: number) => String(i));

  return (
    <div className="overflow-hidden rounded-6 border-2 border-border-secondary">
      <table className="w-full border-collapse">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className={tableRecipe.classes({ variant: 'header' })}>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`${tableRecipe.headerCellClasses} border-b-2 border-border-primary ${
                  c.align === 'right' ? 'text-right' : ''
                }`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const key = keyOf(row, i);
            const selected = selectedKeys.includes(key);
            return (
              <tr
                key={key}
                aria-selected={selected || undefined}
                /* A selectable row needs a keyboard path, not just a click handler.
                 * tabIndex plus Enter/Space is what makes the row an actual control —
                 * without them this is a clickable div wearing a <tr>, and the focus
                 * ring the recipe defines would never appear because nothing could
                 * focus it. */
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(row, i);
                        }
                      }
                    : undefined
                }
                className={tableRecipe.classes({
                  variant: 'row',
                  force: forceRowState ?? (selected ? 'selected' : undefined),
                  className: onRowClick ? 'cursor-pointer' : undefined,
                })}
              >
                {columns.map((c, j) => (
                  <td
                    key={c.key}
                    className={`${tableRecipe.cellClasses} ${
                      i < rows.length - 1 ? 'border-b-2 border-border-tertiary' : ''
                    } ${c.align === 'right' ? 'text-right' : ''} ${
                      j === 0 ? 'font-medium text-content-primary' : ''
                    }`}
                  >
                    {row[c.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
