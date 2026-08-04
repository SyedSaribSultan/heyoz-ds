'use client';

import { useCallback, useRef, useState } from 'react';
import type { PrimitiveStep, PrimitiveTier } from '@/lib/core/primitives';
import { ScrollRegion } from './ScrollRegion';

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
 * one per family, plus one more on any family whose strip is currently clipped, where
 * ScrollRegion adds a stop for the scroller itself. Left/right walks the ramp,
 * up/down crosses the tiers, Home and End jump to the ends of the strip.
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

/** Which cell the roving tabIndex is on. Row is the alpha tier, column is the ramp
 *  step, and both are indices into `rows` rather than keys — the tiers carry identical
 *  step keys in identical order, which the verify script asserts. */
type Cursor = { row: number; col: number };

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

  const [cursor, setCursor] = useState<Cursor>({ row: 0, col: 0 });
  const gridRef = useRef<HTMLDivElement>(null);

  /* The only place the cursor moves, and the only place this file calls .focus().
   * That it was not the only place is the bug this replaced.
   *
   * The arrows went through a relative `move()` that clamped the cursor AND moved DOM
   * focus onto the new cell. Home and End called setCursor directly and focused
   * nothing — so End handed the family's single tabbable cell to the far end of the
   * ramp while focus stayed where it was, and the next Tab left the widget from a cell
   * the reader was not on. A roving tabIndex that has stopped describing where focus
   * is has stopped being a roving tabIndex. Two paths through one widget is how they
   * came apart, and there is now one.
   *
   * It takes an absolute target rather than a delta, and Home is the reason. Home IS
   * expressible through the old relative form — `move(0, -stepCount)` clamps to column
   * 0 — and that is precisely the version to avoid: it says "go a very long way left"
   * and leans on the clamp being the only thing that stops it, so the day this grid
   * wraps at the edges, or a ramp gains a column, Home quietly means something else. An
   * absolute target says what the key means. The deltas are resolved by the caller,
   * where the current cursor is already in scope, and the clamp is left with one job —
   * keeping a target inside the grid — instead of two.
   *
   * The focus call stays a frame behind, as it was. A keydown is a discrete event, so
   * setCursor has already flushed by the time the frame runs and the new cell holds
   * tabIndex=0 before it is focused; the tab stop and the focused element are therefore
   * never briefly two different cells. It is not waiting for the cell to exist — all
   * 655 are mounted at all times, dimmed rather than removed. */
  const moveTo = useCallback(
    (target: Cursor) => {
      const row = Math.min(rows.length - 1, Math.max(0, target.row));
      const col = Math.min(stepCount - 1, Math.max(0, target.col));
      setCursor({ row, col });
      requestAnimationFrame(() => {
        gridRef.current?.querySelector<HTMLButtonElement>(`[data-cell="${row}-${col}"]`)?.focus();
      });
    },
    [rows.length, stepCount],
  );

  function onKeyDown(e: React.KeyboardEvent) {
    const { row, col } = cursor;
    /* Absolute destinations, the arrows included, so no key can reach the grid by a
     * different route than the others. `cursor` is read from the render closure rather
     * than from a ref because a keydown here can only have come from the focused cell,
     * and the cell's onFocus below is what keeps the cursor on it. */
    const target: Record<string, Cursor> = {
      ArrowLeft: { row, col: col - 1 },
      ArrowRight: { row, col: col + 1 },
      ArrowUp: { row: row - 1, col },
      ArrowDown: { row: row + 1, col },
      Home: { row, col: 0 },
      End: { row, col: stepCount - 1 },
    };
    const next = target[e.key];
    if (!next) return;
    e.preventDefault();
    moveTo(next);
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

      {/* Left gutter holds the tier labels; the grid to its right is the widget.
       *
       * This strip was a bare `flex … overflow-x-auto`. The grid carries a 520px
       * minimum, so on a narrow column — and on the phone layout, where the rail is
       * above the content rather than beside it — it clipped, and the clipped part of a
       * ramp was reachable by pointer and by nothing else (WCAG 2.1.1) with no visible
       * edge to say it continued. ScrollRegion brings the tab stop, the accessible name
       * and the edge fades, and adds the tab stop only while something is actually
       * clipped.
       *
       * That stop sits in front of the cells rather than instead of them. Tabbing into
       * a clipped family lands on the scroller, where the arrows scroll it — this grid's
       * onKeyDown is on a descendant and a keydown does not travel downward, so the two
       * arrow behaviours cannot collide — and the next Tab lands on the cursor cell,
       * where the arrows move the cursor. Two stops for a clipped family, one for a
       * family that fits.
       *
       * The flex classes move onto ScrollRegion's own className because the element that
       * clips has to be the element laying out the two columns. `fade` names the page
       * colour, which is what these strips sit on. The label is not `${family} ramp`:
       * that is already the enclosing section's name, and `${family} primitives` is the
       * grid's, so a third distinct name keeps the three announcements apart. */}
      <ScrollRegion
        label={`${family} ramp strips`}
        className="flex gap-space-3"
        fade="background"
      >
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
           * stays: neutral runs 24 steps, which at the 520px minimum and a 2px gap is a
           * column under 20px wide, and every label is already truncating. A step up in
           * size here buys nothing a reader can use and costs the column alignment that
           * is doing the labelling for all five strips.
           *
           * This read "22 steps … about 23px" and both figures were wrong: neutral is 15
           * decades plus white, black and the seven half-steps, which is 24, and 24
           * columns and 23 gaps do not fit in 23px each. CLAUDE.md rule 5 — the ramp is
           * in tokens/01-colors-primitives.tokens.json, so count it rather than
           * remember it. `stepCount` above is the same figure, computed. */}
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
                      {/* Every fact the title carries, in the order the detail panel
                          shows them. The title above stays — it is right for a pointer
                          — but it was the only place any of this existed, so on touch
                          there was nothing at all, and a title is read at the screen
                          reader's discretion rather than reliably.

                          What was missing here was the lightness, which is the measured
                          number the whole ramp is ordered by, and on the four alpha
                          tiers the alpha: `value` there is an 8-bit suffix on the hex —
                          opacity-15/brand/60 is `#FF3D0126` — which is announced as two
                          more hex characters rather than as "15%". Prose rather than the
                          panel's `L*`: the asterisk is read as anything from nothing to
                          "asterisk" depending on the reader's punctuation setting, and
                          "lightness 65.4" needs no setting to come out right. */}
                      <span className="sr-only">
                        {s.path}, {s.value}
                        {translucent ? `, ${Math.round(s.alpha * 100)}% alpha` : ''}, lightness{' '}
                        {s.lightness.toFixed(1)}
                        {isUsed
                          ? `, used by ${s.consumers.length} token${
                              s.consumers.length === 1 ? '' : 's'
                            }`
                          : ', unused'}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </ScrollRegion>
    </section>
  );
}
