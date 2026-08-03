/** Join class values, dropping falsy ones. No dependency, no conflict resolution.
 *
 * Deliberately not tailwind-merge. Recipes emit a closed, non-overlapping set of
 * utilities, and a caller's `className` is meant to be additive — if it needs to
 * fight the recipe for the same property, the recipe is missing a variant, and
 * silently resolving that collision would hide the fact. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
