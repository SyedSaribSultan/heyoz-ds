'use client';

import { forwardRef } from 'react';
import { badgeRecipe, type BadgeVariant } from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  /**
   * The leading marker. `true` gives the default dot; pass a node to replace it with
   * any 12x12 glyph — a tick for Ready, a cross for Failed.
   *
   * Replaces the old `dot` boolean, which composed its colour as
   * `bg-fill-${variant}`. That worked while every variant name was also a fill token
   * name and stopped working the moment there were fourteen of them: there is no
   * `fill-neutral-subtle`, so the dot silently lost its background. The marker is
   * `currentColor` now, which cannot drift from the text it sits beside because it
   * is the same value.
   */
  icon?: boolean | React.ReactNode;
  /** Renders the disabled appearance. A badge has no pointer states, so this is the
   *  only state worth forcing — and it is a real prop rather than showcase-only,
   *  because a badge labelling a disabled row genuinely is in it. */
  forceState?: StateName;
};

/** The default marker: a filled 8px circle in a 12px slot.
 *
 *  `shrink-0` because the badge is `whitespace-nowrap` but its parent may still be
 *  squeezing it, and a dot that compresses to an ellipse reads as a rendering fault
 *  rather than as a tight fit.
 *
 *  Hidden from assistive tech. Colour is never the only carrier here — the word
 *  beside it already says the status — so the dot is decoration. */
function Dot() {
  return (
    <svg
      className="size-3 shrink-0"
      viewBox="0 0 12 12"
      fill="currentColor"
      role="presentation"
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="4" />
    </svg>
  );
}

/** A status pill. Appearance is BadgeRecipe's; this file is the marker slot.
 *
 *  A <span>, not a <button>. A badge that can be clicked is the wrong component, and
 *  the element is the cheapest place to make that true rather than merely documented. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = 'neutral-subtle', icon, forceState, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={badgeRecipe.classes({ variant, force: forceState, className })}
      {...rest}
    >
      {icon === true ? <Dot /> : icon}
      {children}
    </span>
  );
});
