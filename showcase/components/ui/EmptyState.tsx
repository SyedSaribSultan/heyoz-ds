'use client';

import { emptyStateRecipe, type EmptyStateSize, type EmptyStateVariant } from '@/lib/recipes';
import { cx } from '@/lib/core/cx';

export type EmptyStateProps = {
  variant?: EmptyStateVariant;
  size?: EmptyStateSize;
  /** One line. What the situation is, in the user's terms — not "No data". */
  title: string;
  /** One or two sentences. For no-results, this is where the way back goes. */
  body?: string;
  /** A 24px glyph. Optional, and there is deliberately no illustration slot — see the recipe. */
  icon?: React.ReactNode;
  /**
   * The action, as a node rather than a label and a callback.
   *
   * An empty state's action is frequently the primary action of the whole screen, so it needs
   * the full Button API — size, variant, icon, disabled. Reducing it to `actionLabel` would
   * mean re-adding each of those one prop at a time.
   */
  action?: React.ReactNode;
  /** A quieter second option: "Clear filters" beside "Create one". */
  secondaryAction?: React.ReactNode;
  /** The heading level. An empty state usually replaces a list that sat under a heading, so it
   *  is a section in an outline rather than a page — hard-coding h2 breaks that half the time. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  className?: string;
};

/**
 * The screen when there is nothing to show.
 *
 * Four variants because there are four reasons for nothing, and picking the wrong one is the
 * actual bug: `first-run` tells someone with forty projects that they have none, and
 * `no-results` tells someone whose request failed that their search worked.
 */
export function EmptyState({
  variant = 'first-run',
  size = 'md',
  title,
  body,
  icon,
  action,
  secondaryAction,
  headingLevel = 3,
  className,
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  return (
    /* No aria-live. An empty state renders because a navigation or a filter changed, and both
       are user-initiated — a live region announces the emptiness a second time. Where the
       transition is genuinely silent, the caller wraps it, because only the caller knows. */
    <div
      className={cx(
        emptyStateRecipe.classes({ variant, size }),
        emptyStateRecipe.enterClass,
        className,
      )}
    >
      {icon && (
        /* The tint comes from the variant's bound `fg`, which the plate inherits via
           currentColor — so the glyph cannot drift from the token the sweep measured. */
        <span aria-hidden="true" className={emptyStateRecipe.iconPlateClasses(variant)}>
          <span className="size-space-7">{icon}</span>
        </span>
      )}

      <Heading className={emptyStateRecipe.titleClasses()}>{title}</Heading>
      {body && <p className={emptyStateRecipe.bodyClasses()}>{body}</p>}

      {(action || secondaryAction) && (
        /* oz-cluster rather than a hand-written flex row: it wraps on a narrow container and
           sets min-width:0 on the children, which is what stops a long button label from
           forcing a horizontal scroll inside a centred column. */
        <div className="oz-cluster oz-cluster-3 justify-center pt-space-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
