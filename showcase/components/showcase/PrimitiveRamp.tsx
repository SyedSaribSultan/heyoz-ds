'use client';

import { useCallback, useRef, useState } from 'react';
import type { PrimitiveStep, PrimitiveTier } from '@/lib/core/primitives';

/* ---------------------------------------------------------------------------
 * One hue family, all five alpha tiers, as a single 2-D grid.
 *
 * Grouping by family rather than by tier is what makes 655 swatches legible. The
 * tiers share identical step keys in identical order, so one label row across the top
 * serves all five strips, and the alignment states the fact that matters: an alpha
 * tier is the same column at lower alpha, not a different colour.
 *
 * Keyboard: the whole family is one composite widget with a roving tabIndex — arrows
 * move within it, Enter or Space inspects. 655 individually focusable swatches would
 * be 655 tab stops, which is technically accessible and practically unusable; this is
 * 11. Left/right walks the ramp, up/down crosses the tiers.
 * ------------------------------------------------------------------------- */

export type RampProps = {
  family: string;
  tiers: PrimitiveTier[];
  /** Matched by the filter. Non-matching cells are dimmed, never removed, so the
   *  grid geometry — and therefore the column alignment — never moves. */
  matches: (step: PrimitiveStep) => boolean;
  filtering: boolean;
  selected: PrimitiveStep | null;
  onSelect: (step: PrimitiveStep) => void;
};

/** Referenced by at least one semantic token.
 *
 *  A white ring with a dark centre, using the two `content/fixed-*` tokens, because
 *  the marker has to be legible on all 655 backgrounds — including a 30%-alpha yellow
 *  over a checkerboard. Anything keyed to the swatch's own lightness gets this wrong
 *  somewhere in the grid. */
function UsedMark() {
  return (
    <span
      aria-hidden="true"
      className="grid h-[9px] w-[9px] place-items-center rounded-full bg-content-fixed-inverse"
    >
      <span className="h-[4px] w-[4px] rounded-full bg-content-fixed-primary" />
    </span>
  );
}

export function PrimitiveRamp({
  family,
  tiers,
  matches,
  filtering,
  selected,
  onSelect,
}: RampProps) {
  /* Steps come from the solid tier; every tier carries the same keys, which the
   * verify script asserts rather than assumes. */
  const solid = tiers[0].families.find((f) => f.family === family);
  const rows = tiers.map((t) => ({
    tier: t,
    steps: t.families.find((f) => f.family === family)?.steps ?? [],
  }));

  if (!solid) return null;

  const stepCount = solid.steps.length;
  const total = rows.reduce((n, r) => n + r.steps.length, 0);
  const used = rows.reduce((n, r) => n + r.steps.filter((s) => s.consumers.length).length, 0);

  const [cursor, setCursor] = useState({ row: 0, col: 0 });
  const gridRef = useRef<HTMLDivElement>(null);

  const move = useCallback(
    (dRow: number, dCol: number) => {
      setCursor((c) => {
        const row = Math.min(rows.length - 1, Math.max(0, c.row + dRow));
        const col = Math.min(stepCount - 1, Math.max(0, c.col + dCol));
        /* Focus follows the cursor, which is what makes arrow keys feel like a grid
         * rather than like a state machine someone forgot to wire to the DOM. */
        requestAnimationFrame(() => {
          gridRef.current
            ?.querySelector<HTMLButtonElement>(`[data-cell="${row}-${col}"]`)
            ?.focus();
        });
        return { row, col };
      });
    },
    [rows.length, stepCount],
  );

  function onKeyDown(e: React.KeyboardEvent) {
    const map: Record<string, [number, number]> = {
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
    };
    const delta = map[e.key];
    if (delta) {
      e.preventDefault();
      move(delta[0], delta[1]);
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      setCursor((c) => ({ ...c, col: 0 }));
    }
    if (e.key === 'End') {
      e.preventDefault();
      setCursor((c) => ({ ...c, col: stepCount - 1 }));
    }
  }

  /* Column count varies by family — 10, 11, 13 or 24 — so the template is computed.
   * A Tailwind arbitrary class here would need one safelist entry per family. */
  const columns = { gridTemplateColumns: `repeat(${stepCount}, minmax(0, 1fr))` };

  return (
    <section className="oz-stack oz-stack-2" aria-label={`${family} ramp`}>
      <div className="flex flex-wrap items-baseline gap-space-3">
        <h4 className="font-mono text-label-sm text-content-primary">{family}</h4>
        <p className="font-mono text-label-sm text-content-tertiary">
          {stepCount} steps × {rows.length} tiers · {total} tokens · {used} referenced
        </p>
      </div>

      {/* Left gutter holds the tier labels; the grid to its right is the widget. */}
      <div className="flex gap-space-3 overflow-x-auto">
        <div className="flex shrink-0 flex-col pt-[18px]">
          {rows.map((r) => (
            <div
              key={r.tier.tier}
              className="flex h-space-9 items-center justify-end pr-space-1 font-mono text-label-sm text-content-tertiary"
              style={{ minWidth: 62 }}
            >
              {r.tier.alpha >= 1 ? 'solid' : `${Math.round(r.tier.alpha * 100)}%`}
            </div>
          ))}
        </div>

        <div className="min-w-[520px] flex-1">
          {/* Shared step labels. One row for all five tiers.
           *
           * The last label-xs on the page that is not inside a mock product, and it
           * stays: neutral runs 22 steps across a 520px minimum, so a column is about
           * 23px wide and every label is already truncating. A step up in size here
           * buys nothing a reader can use and costs the column alignment that is doing
           * the labelling for all five strips. */}
          <div className="grid gap-[2px] pb-space-1" style={columns}>
            {solid.steps.map((s) => (
              <span
                key={s.step}
                className="truncate text-center font-mono text-label-xs text-content-tertiary"
                title={s.step}
              >
                {s.step === 'white' ? 'wht' : s.step === 'black' ? 'blk' : s.step}
              </span>
            ))}
          </div>

          <div
            ref={gridRef}
            role="grid"
            aria-label={`${family} primitives`}
            onKeyDown={onKeyDown}
            className="flex flex-col gap-[2px]"
          >
            {rows.map((r, rowIndex) => (
              <div key={r.tier.tier} role="row" className="grid gap-[2px]" style={columns}>
                {r.steps.map((s, colIndex) => {
                  const isUsed = s.consumers.length > 0;
                  const isCursor = cursor.row === rowIndex && cursor.col === colIndex;
                  const isSelected = selected?.path === s.path;
                  const dimmed = filtering && !matches(s);
                  const translucent = s.alpha < 1;

                  return (
                    <button
                      key={s.path}
                      type="button"
                      role="gridcell"
                      data-cell={`${rowIndex}-${colIndex}`}
                      tabIndex={isCursor ? 0 : -1}
                      aria-selected={isSelected}
                      onFocus={() => setCursor({ row: rowIndex, col: colIndex })}
                      onClick={() => onSelect(s)}
                      title={`${s.path}\n${s.value}${
                        translucent ? ` · ${Math.round(s.alpha * 100)}% alpha` : ''
                      }\nL* ${s.lightness.toFixed(1)}\n${
                        isUsed ? `${s.consumers.length} consumer(s)` : 'no consumer'
                      }`}
                      className={`group relative grid h-space-9 place-items-center rounded-2 border-2 transition-opacity duration-fast ease-standard focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus ${
                        isSelected ? 'border-border-inverse' : 'border-transparent'
                      } ${dimmed ? 'opacity-20' : 'opacity-100'} ${
                        translucent ? 'oz-alpha-grid' : ''
                      }`}
                    >
                      {/* The colour itself, inset so the selected border reads as a
                          frame around the swatch rather than as part of it. */}
                      <span
                        aria-hidden="true"
                        className="absolute inset-[2px] rounded-[2px]"
                        style={{ background: s.value }}
                      />
                      {isUsed && <span className="relative">{<UsedMark />}</span>}
                      <span className="sr-only">
                        {s.path}, {s.value}
                        {isUsed ? `, used by ${s.consumers.length} tokens` : ', unused'}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
