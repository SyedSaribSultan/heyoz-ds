'use client';

import { forwardRef } from 'react';
import {
  buttonRecipe,
  type ButtonShape,
  type ButtonSize,
  type ButtonVariant,
} from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';
import { cx } from '@/lib/core/cx';
import { Spinner } from './Spinner';

/** Icon box per size, from the Figma control ramp: 16 / 18 / 22 / 24 / 26 / 28.
 *
 *  The icon does not track the type step. It is consistently a little larger than
 *  the cap height, because an icon optically reads smaller than a letter of the
 *  same measured height — matching them makes the icon look shrunken next to its
 *  own label. These are the numbers off the canvas, not a ratio. */
const ICON_BOX: Record<ButtonSize, string> = {
  xs: '[&>svg]:size-4',
  sm: '[&>svg]:size-[18px]',
  md: '[&>svg]:size-[22px]',
  lg: '[&>svg]:size-6',
  xl: '[&>svg]:size-[26px]',
  '2xl': '[&>svg]:size-7',
};

export type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** rect keeps the size-dependent radius ramp; pill goes to radius/full. */
  shape?: ButtonShape;
  /** Rendered before the label. Pass an svg — it is sized by the size prop. */
  leadingIcon?: React.ReactNode;
  /** Rendered after the label. */
  trailingIcon?: React.ReactNode;
  /** Swaps the leading icon for a spinner and disables the button. The label stays,
   *  because a button that loses its label on click loses its width and the row
   *  around it reflows. */
  loading?: boolean;
  /** Stretch to the container. For a card CTA or a form submit, where the button is
   *  the width of the thing it belongs to rather than the width of its own copy. */
  fullWidth?: boolean;
  /** Showcase-only. Renders the appearance of a state without the interaction, so
   *  a documentation grid can show `hover` truthfully. Production code omits it and
   *  gets the real :hover / :active / :disabled / :focus-visible from the recipe.
   *  Both paths compile from the same binding table, so they cannot disagree. */
  forceState?: StateName;
};

/** The entire component. Nothing about how a button looks lives here — that is
 *  ButtonRecipe's job. The icon slots are structure, not appearance: they add no
 *  colour of their own and inherit `currentColor` from the recipe's fg binding. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant,
    size = 'md',
    shape = 'rect',
    leadingIcon,
    trailingIcon,
    loading = false,
    fullWidth = false,
    forceState,
    className,
    children,
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
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonRecipe.classes({
        variant,
        size,
        corner: shape,
        force: forceState,
        className: cx(
          buttonRecipe.radiusFor(size, shape),
          ICON_BOX[size],
          fullWidth && 'w-full',
          className,
        ),
      })}
      {...rest}
    >
      {loading ? <Spinner size={size} /> : leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
});
