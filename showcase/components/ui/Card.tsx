'use client';

import { forwardRef } from 'react';
import { cardRecipe, type CardSize, type CardVariant } from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  size?: CardSize;
  forceState?: StateName;
  /** Renders a <button> instead of a <div>. Required for the interactive variant:
   *  a clickable div has no keyboard behaviour, no role and no focus, and the
   *  variant's focus ring would never appear. */
  as?: 'div' | 'button';
  selected?: boolean;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'flat', size = 'md', forceState, as, selected, className, ...rest },
  ref,
) {
  /* The lift comes from the recipe, not from here — only `interactive` moves, and
   *  which variants move is a recipe decision. Passed through `className` so it
   *  joins the same string the bindings compile into. Omitted when a state is
   *  forced: a grid cell showing what hover looks like should show the colour, not
   *  sit permanently 2px above its row. */
  const className_ = cardRecipe.classes({
    variant,
    size,
    force: forceState,
    className: [forceState ? '' : cardRecipe.liftFor(variant), className].filter(Boolean).join(' '),
  });
  const element = as ?? (variant === 'interactive' ? 'button' : 'div');

  if (element === 'button') {
    return (
      <button
        ref={ref as unknown as React.Ref<HTMLButtonElement>}
        type="button"
        aria-selected={selected}
        className={`${className_} text-left`}
        {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      />
    );
  }

  return <div ref={ref} aria-selected={selected} className={className_} {...rest} />;
});

/** Card subparts. Type steps and spacing only — no colour decisions, so a card
 *  header on any variant inherits that variant's content token. */
export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-heading-xs font-heading font-semibold">{children}</h4>;
}

export function CardMeta({ children }: { children: React.ReactNode }) {
  return <p className="mt-space-1 text-body-sm text-content-tertiary">{children}</p>;
}
