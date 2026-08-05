'use client';

import { separatorRecipe } from '@/lib/recipes';
import { cx } from '@/lib/core/cx';

export type SeparatorProps = {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
};

/**
 * A line between two groups of content.
 *
 * Reach for it when space has genuinely failed, which is rarer than it feels. Rule 1c bans
 * `separation` as a border job precisely because a line is the easiest thing in CSS to add
 * and the hardest to argue against one at a time — a named component you have to import is
 * the opposite of that reflex.
 */
export function Separator({ orientation = 'horizontal', className }: SeparatorProps) {
  const vertical = orientation === 'vertical';
  return (
    <div
      /* Horizontal announces itself; vertical does not. A vertical rule between two inline
         items is punctuation, and "separator" read aloud between every pair of items in a
         breadcrumb is noise a sighted reader never gets. See the recipe note. */
      {...(vertical
        ? { 'aria-hidden': true as const }
        : { role: 'separator' as const, 'aria-orientation': 'horizontal' as const })}
      className={cx(
        separatorRecipe.classes(),
        separatorRecipe.orientationClasses(orientation),
        className,
      )}
    />
  );
}
