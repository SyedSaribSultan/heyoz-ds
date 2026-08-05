'use client';

import { forwardRef } from 'react';
import { listboxRecipe, type ListboxSize } from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';
import { cx } from '@/lib/core/cx';

/**
 * The presentational parts of a floating list of choices.
 *
 * These are deliberately dumb: no state, no positioning, no keyboard. Select owns all
 * three and renders these; a Combobox and a Menu will do the same. Splitting it this way
 * is what stops the second consumer reimplementing the row — which is how two pickers in
 * one product end up with different selected states.
 */

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* -- panel ----------------------------------------------------------------- */

export type ListboxPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  /** From useAnchor. Carries position, maxHeight and the width floor. */
  style?: React.CSSProperties;
};

export const ListboxPanel = forwardRef<HTMLDivElement, ListboxPanelProps>(function ListboxPanel(
  { className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx(listboxRecipe.panelClasses(), className)} {...rest}>
      {children}
    </div>
  );
});

/* -- group ----------------------------------------------------------------- */

export type ListboxGroupProps = {
  label: string;
  /** Wired to aria-labelledby on the group, so the heading names its options rather than
   *  being a decorative row a screen reader reads as one more item in the list. */
  labelId: string;
  children: React.ReactNode;
};

export function ListboxGroup({ label, labelId, children }: ListboxGroupProps) {
  return (
    <div role="group" aria-labelledby={labelId}>
      <div id={labelId} className={listboxRecipe.groupLabelClasses()}>
        {label}
      </div>
      {children}
    </div>
  );
}

/* -- option ---------------------------------------------------------------- */

export type ListboxOptionProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'aria-selected'> & {
  selected: boolean;
  disabled?: boolean;
  size?: ListboxSize;
  /** A leading glyph or swatch. */
  icon?: React.ReactNode;
  /** A second line. content/secondary rather than tertiary — see the recipe note. */
  description?: string;
  forceState?: StateName;
};

export const ListboxOption = forwardRef<HTMLDivElement, ListboxOptionProps>(function ListboxOption(
  { selected, disabled = false, size = 'md', icon, description, forceState, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role="option"
      aria-selected={selected}
      /* aria-disabled, not the `disabled` attribute: a div has no disabled attribute, and
         more importantly a disabled option should still be reachable by the arrow keys so
         a screen reader can say why the thing being looked for cannot be picked. Removing
         it from the sequence makes it invisible instead of unavailable. */
      aria-disabled={disabled || undefined}
      className={listboxRecipe.classes({
        variant: 'option',
        size,
        /* `selected` beats `hover` because the recipe binds it after hover and the merge is
           ordered. Forcing it here keeps a selected row's ground stable while the pointer
           crosses it. */
        force: forceState ?? (selected ? 'selected' : undefined),
        className,
      })}
      {...rest}
    >
      {icon && (
        <span aria-hidden="true" className="grid size-space-6 shrink-0 place-items-center">
          {icon}
        </span>
      )}

      {/* min-w-0 so a long label truncates instead of pushing the check glyph out of the
          row — the flex-child overflow CLAUDE.md names. */}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{children}</span>
        {description && <span className={cx('block', listboxRecipe.descriptionClasses())}>{description}</span>}
      </span>

      {selected && (
        <span aria-hidden="true" className={listboxRecipe.checkClasses()}>
          <CheckIcon />
        </span>
      )}
    </div>
  );
});

/* -- empty ----------------------------------------------------------------- */

/** Shown when a filter matches nothing. Without it the panel renders an empty box, which
 *  is indistinguishable from a panel that failed to load its options. */
export function ListboxEmpty({ children = 'Nothing matches.' }: { children?: React.ReactNode }) {
  return (
    /* role="presentation" so it is not announced as an option. The count of options is
       what a listbox announces, and an empty list announcing "1 item" is worse than
       silence. */
    <div role="presentation" className={listboxRecipe.emptyClasses()}>
      {children}
    </div>
  );
}
