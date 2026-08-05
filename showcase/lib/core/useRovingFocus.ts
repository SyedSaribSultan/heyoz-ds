'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * One tab stop, arrow keys inside.
 *
 * This is the pattern every composite widget in the ARIA spec is built on — radio
 * group, menu, toolbar, segmented control, tab list — and the reason it is a shared
 * hook is that getting it wrong is invisible to a mouse user and total to a keyboard
 * one. A ten-option radio group with ten tab stops is not a broken radio group; it is
 * ten checkboxes that happen to be drawn in a row, and Tab is the only way to find out.
 *
 * WHY THE DOM IS THE SOURCE OF TRUTH FOR *WHICH* ITEMS EXIST, and state only for which
 * one is tabbable. The alternative is the caller registering items into an array, which
 * has to stay ordered under conditional rendering, filtering and reordering — three
 * things a menu does constantly. Querying `[data-oz-roving]` at keydown time cannot
 * fall out of order with what is on screen, because it *is* what is on screen. Dialog
 * already reaches for the DOM the same way to find its focusable children.
 *
 * DISABLED ITEMS ARE SKIPPED, NOT HIDDEN. The selector excludes `[disabled]` and
 * `[aria-disabled="true"]`, so arrows step over them. That is the correct behaviour for
 * a radio group and a segmented control; for a MENU it is deliberately wrong — a menu
 * should let the caret land on a disabled item so a screen reader can announce why the
 * thing you are looking for cannot be picked. Menu passes `skipDisabled: false`.
 *
 * WHAT THIS HOOK DOES NOT DO. It moves focus. It does not select. Those are the same
 * gesture in a radio group (`selectionFollowsFocus`) and different gestures in a menu,
 * and conflating them is how a keyboard user ends up unable to *look* at an option
 * without committing to it. The caller decides, via `onFocusChange`.
 */

export type Orientation = 'horizontal' | 'vertical' | 'both';

export type RovingArgs = {
  /** Which arrows move. `both` accepts all four, for a grid or a wrapping cluster. */
  orientation?: Orientation;
  /** Wrap past the ends. True for a menu and a radio group — a radio group MUST wrap,
   *  because ARIA specifies it and because a set of mutually exclusive options has no
   *  meaningful "past the last one". False for a toolbar, where the ends are real. */
  loop?: boolean;
  /** See the note above: false for Menu only. */
  skipDisabled?: boolean;
  /** Fires with the index focus moved to. This is where a radio group commits the
   *  value and a menu does nothing. */
  onFocusChange?: (index: number) => void;
};

/** Every item, in DOM order. Built per keystroke — see the note above. */
function itemsIn(container: HTMLElement | null, skipDisabled: boolean): HTMLElement[] {
  if (!container) return [];
  const all = [...container.querySelectorAll<HTMLElement>('[data-oz-roving]')];
  if (!skipDisabled) return all;
  return all.filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true',
  );
}

export function useRovingFocus({
  orientation = 'vertical',
  loop = true,
  skipDisabled = true,
  onFocusChange,
}: RovingArgs = {}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  /** Which index carries `tabIndex=0`. Exactly one, always — that is the whole point. */
  const [tabbable, setTabbable] = useState(0);

  const latest = useRef(onFocusChange);
  latest.current = onFocusChange;

  const moveTo = useCallback((items: HTMLElement[], i: number) => {
    const el = items[i];
    if (!el) return;
    /* Order matters. setTabbable first would re-render and hand tabIndex=0 to the new
     * element before focus moves, which is fine — but focusing first means that if the
     * render is interrupted the DOM is still in a usable state, with focus on a real
     * element rather than on <body>. */
    el.focus();
    /* The index reported is the item's position among ALL items, not among the
     * filtered set, because that is what the caller's own array is indexed by. A
     * radio group with a disabled third option would otherwise commit the wrong
     * value — off by exactly the number of disabled items above the cursor. */
    const among = itemsIn(containerRef.current, false).indexOf(el);
    setTabbable(among);
    latest.current?.(among);
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const horizontal = orientation === 'horizontal' || orientation === 'both';
      const vertical = orientation === 'vertical' || orientation === 'both';

      let dir = 0;
      if (horizontal && e.key === 'ArrowRight') dir = 1;
      else if (horizontal && e.key === 'ArrowLeft') dir = -1;
      else if (vertical && e.key === 'ArrowDown') dir = 1;
      else if (vertical && e.key === 'ArrowUp') dir = -1;

      const home = e.key === 'Home';
      const end = e.key === 'End';
      if (!dir && !home && !end) return;

      const items = itemsIn(containerRef.current, skipDisabled);
      if (items.length === 0) return;

      /* preventDefault only once a move is certain. An ArrowDown inside a horizontal
       * toolbar has to keep scrolling the page — swallowing every arrow key because
       * the widget recognised the *event* rather than the *gesture* is the most common
       * way a composite widget breaks the page around it. */
      e.preventDefault();

      if (home) return moveTo(items, 0);
      if (end) return moveTo(items, items.length - 1);

      /* Current position is read from focus, not from state. When the container itself
       * has focus — which is where Tab lands, since only one child is tabbable and it
       * may not be the one under the caret — indexOf gives -1 and the first arrow
       * press correctly lands on the first item for ArrowDown and the last for ArrowUp. */
      const at = items.indexOf(document.activeElement as HTMLElement);
      if (at === -1) return moveTo(items, dir > 0 ? 0 : items.length - 1);

      const next = at + dir;
      if (next < 0) return loop ? moveTo(items, items.length - 1) : undefined;
      if (next >= items.length) return loop ? moveTo(items, 0) : undefined;
      return moveTo(items, next);
    },
    [orientation, loop, skipDisabled, moveTo],
  );

  /** Spread onto each item. `index` is its position in the caller's own array. */
  const itemProps = useCallback(
    (index: number) => ({
      'data-oz-roving': '',
      tabIndex: index === tabbable ? 0 : -1,
      /* Pointer focus has to update the tab stop too, or the next Tab press leaves via
       * whichever item state still thinks it is tabbable — usually the first — and the
       * keyboard user's position jumps to somewhere they never were. */
      onFocus: () => setTabbable(index),
    }),
    [tabbable],
  );

  /** Point the tab stop at a specific item without moving focus. Called by a radio
   *  group on mount so Tab lands on the *checked* option rather than the first one,
   *  which is what ARIA specifies and what every native radio group does. */
  const setTabStop = useCallback((index: number) => setTabbable(index), []);

  return { containerRef, onKeyDown, itemProps, setTabStop, tabbable } as const;
}
