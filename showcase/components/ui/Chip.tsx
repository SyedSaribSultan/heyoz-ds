'use client';

import { chipRecipe, type ChipSize, type ChipVariant } from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';
import { cx } from '@/lib/core/cx';

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export type ChipProps = {
  children: React.ReactNode;
  variant?: ChipVariant;
  size?: ChipSize;
  disabled?: boolean;
  /** A leading glyph or swatch. */
  icon?: React.ReactNode;
  /**
   * Makes the WHOLE chip a button. For a filter that toggles.
   *
   * Mutually exclusive with `onRemove` — see the recipe note. A button inside a button is
   * invalid HTML that browsers resolve by dropping one of them, and which one varies.
   */
  onClick?: () => void;
  /** Adds a dismiss button inside the chip. The chip itself stays a span. */
  onRemove?: () => void;
  forceState?: StateName;
  className?: string;
};

/**
 * A value the user put there and can take away.
 *
 * Three shapes depending on what it does, and the shape is the ELEMENT rather than a style —
 * because the element is what decides whether a keyboard can reach it:
 *
 *   onClick            <button>  the whole chip toggles
 *   onRemove           <span> + inner <button>  the ✕ is the only target
 *   neither            <span>  a plain tag
 */
export function Chip({
  children,
  variant = 'neutral',
  size = 'md',
  disabled = false,
  icon,
  onClick,
  onRemove,
  forceState,
  className,
}: ChipProps) {
  if (process.env.NODE_ENV !== 'production' && onClick && onRemove) {
    console.error(
      '[oz] <Chip> got both onClick and onRemove. That would nest a button inside a button, ' +
        'which browsers resolve by dropping one of them. Use two controls side by side.',
    );
  }

  const paint = chipRecipe.classes({
    variant,
    size,
    force: forceState,
    /* pr is reduced when there is no ✕: the trailing padding in sizeClasses is sized for a
       dismiss button, and without one the pill looks lopsided. */
    className: cx(!onRemove && (size === 'sm' ? 'pr-space-4' : 'pr-space-5'), className),
  });

  const inner = (
    <>
      {icon && (
        <span aria-hidden="true" className="grid size-space-5 shrink-0 place-items-center">
          {icon}
        </span>
      )}
      <span className={chipRecipe.labelClasses()}>{children}</span>
    </>
  );

  /* The whole chip is the control. */
  if (onClick) {
    return (
      <button
        type="button"
        /* aria-pressed rather than aria-selected: a filter chip is a toggle button, and
           `selected` belongs to things inside a listbox or a tablist. A screen reader
           announces "Skincare, toggle button, pressed", which is the state exactly. */
        aria-pressed={variant === 'selected'}
        disabled={disabled}
        onClick={onClick}
        className={paint}
      >
        {inner}
      </button>
    );
  }

  return (
    <span className={paint}>
      {inner}
      {onRemove && (
        <button
          type="button"
          /* The value is in the label. Eight chips whose buttons all say "Remove" are eight
             controls a screen-reader user cannot tell apart. */
          aria-label={`Remove ${typeof children === 'string' ? children : 'item'}`}
          disabled={disabled}
          onClick={onRemove}
          className={chipRecipe.removeClasses(size)}
        >
          <CloseIcon />
        </button>
      )}
    </span>
  );
}
