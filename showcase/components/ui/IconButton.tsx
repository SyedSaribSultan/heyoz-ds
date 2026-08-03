'use client';

import { forwardRef } from 'react';
import {
  iconButtonRecipe,
  type IconButtonShape,
  type IconButtonSize,
  type IconButtonVariant,
} from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';
import { cx } from '@/lib/core/cx';
import { Spinner } from './Spinner';

/** Pointer feedback for the one variant that cannot express it as colour.
 *
 *  `fixed` is white in both modes by definition, and every neutral fill ramp in this
 *  system inverts between modes — so there is no "slightly darker white" token to
 *  hover to. Opacity is the honest alternative: it is geometry rather than colour, it
 *  needs no token, and it inverts with nothing. See the note on the `fixed` binding in
 *  iconButton.recipe.ts. */
const FIXED_FEEDBACK =
  'hover:opacity-90 active:opacity-80 disabled:hover:opacity-100 disabled:active:opacity-100';

export type IconButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'color' | 'children' | 'aria-label'
> & {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  shape?: IconButtonShape;
  /** The icon. One svg — it is sized by the size prop, and inherits currentColor
   *  from the recipe's fg binding. */
  icon: React.ReactNode;
  /**
   * The accessible name. REQUIRED, and deliberately not optional.
   *
   * An icon button has no text node, so without this it is announced as "button"
   * and nothing else. Making it a required prop turns the single most common
   * accessibility defect in a component library into a compile error — the same
   * device `focus` on VariantBinding uses for the ring, and `motion` uses for the
   * spring: if the build cannot check it, make the type system ask.
   */
  label: string;
  loading?: boolean;
  /** Showcase-only. See ButtonProps.forceState. */
  forceState?: StateName;
};

/** An icon button. Appearance lives in IconButtonRecipe; this file is structure and
 *  the accessible name. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    variant,
    size = 'md',
    shape = 'rect',
    icon,
    label,
    loading = false,
    forceState,
    className,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={iconButtonRecipe.classes({
        variant,
        size,
        corner: shape,
        force: forceState,
        className: cx(
          iconButtonRecipe.radiusFor(size, shape),
          variant === 'fixed' && FIXED_FEEDBACK,
          className,
        ),
      })}
      {...rest}
    >
      {loading ? <Spinner size={size} /> : icon}
    </button>
  );
});
