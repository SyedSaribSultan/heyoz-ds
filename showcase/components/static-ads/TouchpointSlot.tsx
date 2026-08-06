'use client';

import { PlaceholderArt, type ArtSeed, type ArtKind } from './PlaceholderArt';
import { PencilIcon, PlusIcon } from './icons';

/* ---------------------------------------------------------------------------
 * A Touchpoint — the square that picks one product or one template.
 *
 * Two states on ONE component, per the brief, and the reason is worth stating because the
 * empty and filled versions look nothing alike: they are the same control at the same
 * coordinates doing the same job, and the only difference is whether it has a value yet. Two
 * components would mean two focus treatments, two hit areas and two labels, and the pair
 * would drift the first time either changed.
 *
 * IT IS ONE BUTTON, NOT A BUTTON WITH A BUTTON IN IT. The filled state draws a pencil badge
 * top-right, and the obvious reading of the sheet is that the badge is its own control. It is
 * not one here: a button inside a button is invalid HTML that browsers resolve by dropping
 * one of them, and which one varies — the same trap Chip's recipe note describes for
 * `onClick` plus `onRemove`. The whole square already opens the picker, which is what the
 * badge would do, so the badge is `aria-hidden` decoration marking the square as editable. If
 * the badge ever needs to do something DIFFERENT from the square — clear the selection, say —
 * it has to become a sibling beside the square rather than a child inside it.
 *
 * The empty state's label sits under a `+`; the filled state keeps the label out of the
 * artwork and puts it in the accessible name instead, because the sheet shows the thumbnail
 * filling the square edge to edge. So the two states have the same accessible name shape —
 * "Product: none selected" / "Product: Knitted Polo Shirt, change" — and a screen reader gets
 * the value it cannot see rather than an unchanged word.
 * ------------------------------------------------------------------------- */

export type TouchpointSlotProps = {
  /** `Product` or `Template`. Rendered uppercase; used verbatim in the accessible name. */
  label: string;
  /** The chosen asset's name. Absent means the empty state. */
  value?: string;
  /** Seeds the stand-in artwork. Required whenever `value` is set. */
  seed?: ArtSeed;
  /** Which composition the stand-in draws. */
  kind?: ArtKind;
  onClick?: () => void;
  /** Sizing lives at the call site: the prompt box's slots stretch to the card's inner
   *  height, and a slot used anywhere else will want its own footprint. Everything else
   *  about the control is fixed here. */
  className?: string;
};

export function TouchpointSlot({
  label,
  value,
  seed = 1,
  kind = 'product',
  onClick,
  className = '',
}: TouchpointSlotProps) {
  const filled = Boolean(value);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={filled ? `${label}: ${value}. Change` : `${label}: none selected. Choose one`}
      className={`group relative shrink-0 overflow-hidden rounded-6 border-2 transition-colors duration-effects-fast ease-effects-fast focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus ${
        filled
          ? 'border-border-secondary'
          : 'flex flex-col items-center justify-between border-border-secondary bg-fill-secondary px-space-2 py-space-3 text-content-secondary hover:bg-fill-secondary-hover hover:text-content-primary'
      } ${className}`}
    >
      {filled ? (
        <>
          <PlaceholderArt seed={seed} kind={kind} />

          {/* The badge. A span, not a button — see the header. `fill/fixed` is white in both
              modes and the glyph is the accent, which is the sheet's lockup and also the
              only pairing that survives the artwork underneath it changing colour. */}
          <span
            aria-hidden="true"
            className="absolute right-space-1 top-space-1 grid h-space-6 w-space-6 place-items-center rounded-full bg-fill-fixed text-content-brand shadow-x-small"
          >
            <PencilIcon />
          </span>
        </>
      ) : (
        <>
          <PlusIcon className="h-space-4 w-space-4" />
          <span
            aria-hidden="true"
            className="font-mono text-label-xs uppercase tracking-[0.08em]"
          >
            {label}
          </span>
        </>
      )}
    </button>
  );
}
