'use client';

import { tabsRecipe, type TabVariant } from '@/lib/recipes';
import { cx } from '@/lib/core/cx';

export type TabItem = {
  id: string;
  label: string;
  /** Omit and the row derives it from `activeId` and order: everything before the
   *  active tab is `passed`, everything after is `inactive`. Pass it to override —
   *  a sequence the user is allowed to skip around in is not strictly ordered. */
  state?: TabVariant;
  disabled?: boolean;
};

export type TabsProps = {
  items: TabItem[];
  activeId: string;
  onSelect?: (id: string) => void;
  /** Accessible name for the row. Required — a tablist without one is announced as
   *  an unlabelled group, and a stepped sequence is exactly the case where the user
   *  needs to know what the steps belong to. */
  label: string;
  className?: string;
};

/** Derive position from order when a state is not given explicitly. */
function stateFor(items: TabItem[], index: number, activeIndex: number): TabVariant {
  const explicit = items[index].state;
  if (explicit) return explicit;
  if (index === activeIndex) return 'active';
  return index < activeIndex ? 'passed' : 'inactive';
}

/**
 * A stepped sequence. Appearance is TabsRecipe's; this file is the row and the
 * keyboard contract.
 *
 * `role="tablist"` with arrow-key navigation, which is what the ARIA pattern requires
 * and what a row of plain buttons does not give: Tab moves *out* of a tablist rather
 * than between its tabs, so the arrow handling is not a nicety.
 *
 * The row wraps rather than scrolls. Six chapters at 158px do not fit a phone, and a
 * horizontally scrolling progress rail hides the very steps it exists to show — the
 * user cannot see how many there are, which is the one thing a sequence communicates.
 */
export function Tabs({ items, activeId, onSelect, label, className }: TabsProps) {
  const activeIndex = Math.max(
    0,
    items.findIndex((i) => i.id === activeId),
  );

  function move(delta: number) {
    /* Skips disabled steps and wraps at both ends. Wrapping is the documented ARIA
     * behaviour for a tablist and it matters most on the last step, where the
     * alternative is an arrow key that silently does nothing. */
    const n = items.length;
    for (let step = 1; step <= n; step++) {
      const next = items[(activeIndex + delta * step + n * n) % n];
      if (!next.disabled) {
        onSelect?.(next.id);
        return;
      }
    }
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      aria-orientation="horizontal"
      className={cx('flex flex-wrap items-start gap-space-5', className)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          move(1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          move(-1);
        }
      }}
    >
      {items.map((item, i) => {
        const variant = stateFor(items, i, activeIndex);
        const selected = variant === 'active';
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`panel-${item.id}`}
            /* Only the selected tab is in the tab order. Arrow keys move between
               them; Tab moves past the whole row. This is the roving-tabindex the
               pattern specifies, and it is why the arrow handler above exists. */
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onSelect?.(item.id)}
            className={tabsRecipe.classes({ variant })}
          >
            <span className={tabsRecipe.railClasses(variant)} aria-hidden="true" />
            {/* truncate needs the min-w-0 the recipe puts on the button — without it
                the flex child refuses to shrink and the row overflows instead. */}
            <span className={cx('w-full truncate', tabsRecipe.labelWeight(variant))}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
