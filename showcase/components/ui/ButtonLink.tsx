'use client';

import { forwardRef } from 'react';
import { buttonLinkRecipe, type ButtonLinkVariant } from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';

type Common = {
  variant?: ButtonLinkVariant;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  /** Showcase-only. See ButtonProps.forceState. */
  forceState?: StateName;
  className?: string;
  children?: React.ReactNode;
};

/* Two shapes, discriminated on href. There is no third case where the element is
 * ambiguous: either activating this thing changes the URL or it does not.
 *
 * Written as a union rather than one loose props type so that `disabled` is not
 * accepted on the anchor branch. HTML has no disabled attribute on <a>, so a
 * `<ButtonLink href="…" disabled>` would render an ordinary working link that
 * merely looked dimmed — the exact bug that ships as "the disabled link is
 * clickable". */
export type ButtonLinkProps =
  | (Common &
      Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'color'> & {
        /** Required on the anchor branch. An <a> without href is not focusable and
         *  falls out of the tab order entirely. */
        href: string;
      })
  | (Common &
      Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & {
        href?: never;
      });

/** A text action. Renders an <a> when it navigates and a <button> when it does not.
 *
 *  The icon boxes are 1em so they scale with the text step rather than being pinned,
 *  which is what a glyph inside a line of copy has to do. */
export const ButtonLink = forwardRef<HTMLAnchorElement & HTMLButtonElement, ButtonLinkProps>(
  function ButtonLink({ variant, leadingIcon, trailingIcon, forceState, className, children, ...rest }, ref) {
    const cls = buttonLinkRecipe.classes({
      variant,
      force: forceState,
      className: `[&>svg]:size-[1em] ${className ?? ''}`.trim(),
    });

    const inner = (
      <>
        {leadingIcon}
        {children}
        {trailingIcon}
      </>
    );

    if ('href' in rest && rest.href !== undefined) {
      const anchorProps = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>;
      return (
        <a ref={ref} className={cls} {...anchorProps}>
          {inner}
        </a>
      );
    }

    const { type = 'button', ...buttonProps } = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button ref={ref} type={type} className={cls} {...buttonProps}>
        {inner}
      </button>
    );
  },
);
