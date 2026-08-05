'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Anchored positioning for the floating layer.
 *
 * Same argument scrollLock.ts makes, one layer up: positioning a panel against a
 * trigger is not a Select behaviour, it is a floating-layer behaviour. A listbox, a
 * menu, a tooltip, a popover and a combobox all want exactly this, and the failure mode
 * of leaving it inline is five implementations of which four never got tested near the
 * bottom of the viewport.
 *
 * It is hand-rolled rather than taken from a library, deliberately. The token package
 * has no runtime dependencies and the showcase has three; a floating-UI package would
 * be a fourth whose behaviour no gate in this repo can measure. What is here is the
 * subset that is actually load-bearing — flip, clamp, and a height budget — at a size
 * somebody can read in one sitting.
 *
 * THE FOUR THINGS IT DOES, each because leaving it out produces a specific bug:
 *
 *   1. FLIP. A dropdown 40px from the bottom of the window opens downward into nothing.
 *      If the preferred side has no room and the opposite does, use the opposite; if
 *      neither fits, use whichever has more and let the height budget handle the rest.
 *
 *   2. CLAMP on the cross axis. A left-aligned menu on a trigger near the right edge
 *      hangs off the screen. Clamping keeps it `padding` inside the viewport, which
 *      breaks the alignment and is unambiguously the better failure — a menu that is
 *      6px out of alignment is a menu; one that is 200px offscreen is not.
 *
 *   3. A HEIGHT BUDGET. `maxHeight` is the space actually available on the resolved
 *      side. Without it a 30-item listbox renders 30 items tall and the last twenty are
 *      unreachable, because the *page* cannot scroll — it is locked — and the panel has
 *      no scroll container of its own. This is the one people forget, and it is the one
 *      that makes a long select unusable rather than ugly.
 *
 *   4. REPOSITION on scroll and resize. `position: fixed` is relative to the viewport,
 *      and the anchor is not — so any scroll of any ancestor detaches them. The scroll
 *      listener is on `document` in the CAPTURE phase, which is what catches a scrolling
 *      ancestor: scroll events from an element do not bubble, so a listener on window
 *      sees the page scrolling and never sees the panel inside it.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. No `transform`-based placement, no virtual
 * elements, no arrow positioning, no auto-`side` from a list of fallbacks. Each is real
 * and none is needed by a component in this system; the moment one is, it goes here
 * rather than into the component that wanted it.
 */

export type Side = 'top' | 'right' | 'bottom' | 'left';
export type Align = 'start' | 'center' | 'end';

export type AnchorArgs = {
  /** Positioning only runs while open. Closed panels are unmounted by their callers,
   *  so there is nothing to measure and no listener worth keeping attached. */
  open: boolean;
  side?: Side;
  align?: Align;
  /** Gap between anchor and panel, in px. A number rather than a token because it is
   *  consumed by arithmetic, not by CSS — `space-2` is 6px and that is the default. */
  offset?: number;
  /** Keep-out margin from the viewport edge. */
  padding?: number;
  /** Floor the panel at the anchor's width. What a Select wants: a listbox narrower
   *  than the field it belongs to reads as a detached object. A Menu does not. */
  matchAnchorWidth?: boolean;
};

export type AnchorPosition = {
  /** Ready to paint. False for exactly one frame after open, while the panel is
   *  measured. Callers hide the panel until it is true — a panel painted before it is
   *  positioned appears at the top-left of the window and jumps, which reads as a bug
   *  in the product rather than as a frame of layout. */
  ready: boolean;
  /** The side actually used, after flipping. Callers key their entrance direction off
   *  this: a panel that flipped upward should rise from the bottom, not from the top. */
  side: Side;
  style: React.CSSProperties;
};

/* useLayoutEffect is correct here — the measurement has to happen before paint or the
 * panel is visibly at 0,0 for a frame — and it warns during SSR, where there is nothing
 * to measure. This is the standard shim, kept local because it is four lines and one
 * concept. */
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function useAnchor({
  open,
  side = 'bottom',
  align = 'start',
  offset = 6,
  padding = 8,
  matchAnchorWidth = false,
}: AnchorArgs) {
  const anchorRef = useRef<HTMLElement | null>(null);
  const floatingRef = useRef<HTMLElement | null>(null);
  const [pos, setPos] = useState<AnchorPosition>({ ready: false, side, style: {} });

  const compute = useCallback(() => {
    const anchor = anchorRef.current;
    const floating = floatingRef.current;
    if (!anchor || !floating) return;

    const a = anchor.getBoundingClientRect();
    const f = floating.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    /* Room on each side of the anchor, already net of the keep-out margin. */
    const room: Record<Side, number> = {
      top: a.top - padding,
      bottom: vh - a.bottom - padding,
      left: a.left - padding,
      right: vw - a.right - padding,
    };

    const OPPOSITE: Record<Side, Side> = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left',
    };

    const vertical = side === 'top' || side === 'bottom';
    /* The extent that has to fit on the main axis: height for a panel above or below,
     * width for one beside. */
    const need = (vertical ? f.height : f.width) + offset;

    let resolved = side;
    if (room[side] < need) {
      const other = OPPOSITE[side];
      /* Flip only if the other side is genuinely better. Flipping to a side that is
       * also too small just moves the clipping somewhere less expected. */
      resolved = room[other] > room[side] ? other : side;
    }

    /* The height budget. On a vertical side it is the room actually left after the
     * offset; on a horizontal one the panel is free to use the full viewport height, so
     * the budget is the viewport minus both margins. Math.max keeps it positive when
     * the anchor is itself partly offscreen — a negative max-height computes to
     * `max-height: -12px`, which the browser discards, silently removing the scroll
     * container this whole field exists to create. */
    const budget = vertical
      ? Math.max(96, room[resolved] - offset)
      : Math.max(96, vh - padding * 2);

    let top: number;
    let left: number;

    if (vertical) {
      top = resolved === 'bottom' ? a.bottom + offset : a.top - offset - f.height;
      /* Cross axis: align to the anchor, then clamp into the viewport. */
      const width = matchAnchorWidth ? Math.max(a.width, f.width) : f.width;
      left =
        align === 'start'
          ? a.left
          : align === 'end'
            ? a.right - width
            : a.left + a.width / 2 - width / 2;
      left = Math.min(Math.max(left, padding), Math.max(padding, vw - width - padding));
    } else {
      left = resolved === 'right' ? a.right + offset : a.left - offset - f.width;
      const height = Math.min(f.height, budget);
      top =
        align === 'start'
          ? a.top
          : align === 'end'
            ? a.bottom - height
            : a.top + a.height / 2 - height / 2;
      top = Math.min(Math.max(top, padding), Math.max(padding, vh - height - padding));
    }

    const style: React.CSSProperties = {
      position: 'fixed',
      top: Math.round(top),
      left: Math.round(left),
      maxHeight: Math.round(budget),
      /* Always set, not only when matchAnchorWidth. A panel wider than the viewport is
       * the horizontal-overflow failure CLAUDE.md names as the reason every layout
       * primitive wraps its minimum in `min(…, 100%)`. */
      maxWidth: Math.round(vw - padding * 2),
      ...(matchAnchorWidth ? { minWidth: Math.round(a.width) } : null),
    };

    setPos((prev) => {
      /* Only commit a real change. Setting state on every scroll frame with an
       * identical object re-renders the whole panel 60 times a second for nothing, and
       * — because a re-render can change the panel's measured size — is how a
       * positioning loop starts. */
      const s = prev.style;
      if (
        prev.ready &&
        prev.side === resolved &&
        s.top === style.top &&
        s.left === style.left &&
        s.maxHeight === style.maxHeight &&
        s.maxWidth === style.maxWidth &&
        s.minWidth === style.minWidth
      ) {
        return prev;
      }
      return { ready: true, side: resolved, style };
    });
  }, [side, align, offset, padding, matchAnchorWidth]);

  useIsoLayoutEffect(() => {
    if (!open) {
      /* Reset, so the next open measures from scratch rather than painting one frame at
       * the previous trigger's position — which is visible and wrong whenever the same
       * panel component is reused by two triggers. */
      setPos((p) => (p.ready ? { ready: false, side, style: {} } : p));
      return;
    }

    compute();

    /* rAF-coalesced: scroll fires far more often than the screen refreshes, and the
     * work here is two getBoundingClientRect calls, both of which force layout. */
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        compute();
      });
    };

    /* Capture phase. Scroll does not bubble, so a listener on window never sees a
     * scrolling ancestor — which is the case that matters, because a panel anchored to
     * a row inside a scrolling table is the one that visibly detaches. */
    document.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);

    /* The panel's own size is not fixed: an async-loaded list, a filtered combobox and
     * a wrapping label all change it after the first measurement. Without this the
     * flip decision is made against a stale height. */
    const ro = new ResizeObserver(schedule);
    if (floatingRef.current) ro.observe(floatingRef.current);
    if (anchorRef.current) ro.observe(anchorRef.current);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      ro.disconnect();
    };
  }, [open, compute, side]);

  return { anchorRef, floatingRef, ...pos } as const;
}
