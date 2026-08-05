'use client';

import { cloneElement, useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { tooltipRecipe } from '@/lib/recipes';
import { cx } from '@/lib/core/cx';
import { useAnchor, type Side } from '@/lib/core/useAnchor';

/**
 * How long a hover must rest before the tooltip opens.
 *
 * 400ms. Below ~250ms a pointer crossing a toolbar fires every tooltip on the way past;
 * above ~600ms a user who has stopped specifically to read one starts to think nothing is
 * going to happen and moves on. Focus bypasses it entirely — see the recipe note.
 */
const OPEN_DELAY_MS = 400;

/**
 * How long the pointer may be off the trigger before it closes.
 *
 * Short, but not zero, and the reason is WCAG 1.4.13's "hoverable": the pointer has to
 * physically cross the gap between the trigger and the tooltip, and a zero delay closes it
 * mid-crossing. That would make the tooltip unreadable to anyone using magnification, who
 * reads it by moving onto it.
 */
const CLOSE_DELAY_MS = 150;

/**
 * After one tooltip closes, the next opens with no delay for this long.
 *
 * Crossing five icons should not mean five separate 400ms waits. The first delay establishes
 * that the user is reading tooltips; re-charging it on every neighbour reads as lag. Module
 * scope on purpose — "is this user currently reading tooltips" is a property of the page,
 * not of one instance, which is the same reason scrollLock.ts keeps its depth counter here.
 */
const WARM_MS = 300;
let lastClosedAt = 0;

export type TooltipProps = {
  /** The label. Short — a tooltip that needs two sentences is a Popover. */
  content: React.ReactNode;
  /** The trigger. Must accept a ref and spread props: an element, not a fragment. */
  children: React.ReactElement;
  side?: Side;
  /** Suppress without unmounting, for a trigger whose tooltip is only sometimes useful. */
  disabled?: boolean;
  className?: string;
  /** Showcase-only: renders it open and statically positioned. */
  forceOpen?: boolean;
};

/**
 * A short label for a control whose icon is not self-explanatory.
 *
 * The three WCAG 1.4.13 obligations are the whole reason this is 200 lines rather than 40,
 * and each is a behaviour rather than a style:
 *
 *   DISMISSIBLE — Escape closes it, pointer where it is. Listened for on the document,
 *     because the pointer may be over the trigger with focus somewhere else entirely, and a
 *     handler on the trigger would never fire.
 *   HOVERABLE — the tooltip itself is a hover target that keeps it open. This is why the
 *     close is delayed rather than immediate: the pointer has to cross a 6px gap to get
 *     there, and a zero-delay close fires during the crossing.
 *   PERSISTENT — it closes on Escape, on the pointer leaving both trigger and tooltip, or
 *     on focus moving. It never closes on a timer.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
  disabled = false,
  className,
  forceOpen = false,
}: TooltipProps) {
  const [open, setOpen] = useState(forceOpen);
  const id = useId();
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const anchor = useAnchor({ open, side, align: 'center', offset: 6 });

  const clearTimers = useCallback(() => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
  }, []);

  const show = useCallback(
    (immediate: boolean) => {
      if (disabled) return;
      clearTimers();
      /* Warm: if another tooltip closed moments ago, this user is reading tooltips and the
       * delay has already been served once. */
      const warm = Date.now() - lastClosedAt < WARM_MS;
      if (immediate || warm) return setOpen(true);
      openTimer.current = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    },
    [disabled, clearTimers],
  );

  const hide = useCallback(
    (immediate: boolean) => {
      clearTimers();
      const close = () => {
        setOpen((was) => {
          if (was) lastClosedAt = Date.now();
          return false;
        });
      };
      if (immediate) return close();
      closeTimer.current = setTimeout(close, CLOSE_DELAY_MS);
    },
    [clearTimers],
  );

  /* Timers cleared on unmount, or a trigger removed while its tooltip is pending fires
   * setState on a dead component. */
  useEffect(() => clearTimers, [clearTimers]);

  /* Escape, on the document. DISMISSIBLE — the pointer may be resting on the trigger while
   * focus is elsewhere, so a handler bound to the trigger would never see the key. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, hide]);

  /* Props merged onto the caller's element rather than a wrapper span. A wrapper changes the
   * layout — an inline-block around a flex child is a different box — and it would break the
   * one thing a tooltip must not touch: where its trigger sits. */
  const trigger = cloneElement(
    children,
    {
      ref: (node: HTMLElement | null) => {
        anchor.anchorRef.current = node;
        /* Preserve whatever ref the caller already had. React 19 puts it in props. */
        const own = (children as unknown as { props: Record<string, unknown> }).props?.ref;
        if (typeof own === 'function') own(node);
        else if (own && typeof own === 'object') (own as { current: unknown }).current = node;
      },
      /* describedby, not labelledby — see the recipe note. Only while open, because a
         reference to an element that is not in the DOM is a dangling id. */
      'aria-describedby': open ? id : undefined,
      onPointerEnter: () => show(false),
      onPointerLeave: () => hide(false),
      /* focus-visible only would be better and is not expressible on a synthetic handler;
         onFocus fires for a pointer press too, which shows the tooltip on click. That is
         acceptable — the pointer user was about to see it anyway — and the alternative is
         missing it for keyboard users entirely. */
      onFocus: () => show(true),
      onBlur: () => hide(true),
    } as Record<string, unknown>,
  );

  return (
    <>
      {trigger}
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={(n) => {
              anchor.floatingRef.current = n;
            }}
            id={id}
            role="tooltip"
            /* HOVERABLE. The pointer moving onto the tooltip keeps it open, which 1.4.13
               requires and which is why the wrapper below is pointer-events-none while the
               chip itself is pointer-events-auto: the positioned box must not swallow clicks
               meant for the page, but the visible chip must be reachable. */
            onPointerEnter={() => show(true)}
            onPointerLeave={() => hide(false)}
            style={{
              ...anchor.style,
              visibility: anchor.ready ? 'visible' : 'hidden',
              pointerEvents: 'none',
            }}
            className="z-tooltip"
          >
            <div
              className={cx(tooltipRecipe.classes({ className }), tooltipRecipe.enterClass)}
            >
              {content}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
