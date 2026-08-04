'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/* ---------------------------------------------------------------------------
 * A horizontally scrollable region that a keyboard can reach and that says it
 * scrolls.
 *
 * Six places in this folder wrapped their overflow in a bare
 * `<div class="overflow-x-auto">`: the gate tables, the binding tables, the variant
 * matrix, the guidance pair-tables, the primitive ramp strips. Two things were wrong
 * with all six and they are the same two things.
 *
 * A scroll container with no focusable child cannot be scrolled without a pointer.
 * That is WCAG 2.1.1 — the content is reachable by mouse and by touch and by nothing
 * else, and on this page the content in question is every measured number the system
 * publishes. `tabIndex=0` on the scroller is the documented fix, and it is applied
 * only when the thing actually overflows: a tab stop that scrolls nothing is noise,
 * and a 14-table page would have added fourteen of them.
 *
 * And an overflow with no visible edge does not read as an overflow — it reads as a
 * table that ends there. The fade appears on whichever side has more content, so it
 * is a statement about scroll position rather than decoration, and it disappears
 * entirely once nothing is clipped.
 *
 * The fade is an overlay rather than a `mask-image` on the scroller, because five of
 * the six call sites carry `rounded-* border-2` on the same element and a mask would
 * fade the border along with the content. It names a token in an inline gradient
 * rather than reaching for `from-*`/`to-*`: the preset emits colours as plain
 * `var(--oz-…)` with no `<alpha-value>` slot, which is the same reason the header bar
 * is opaque instead of `bg-background/95` — see the note in Chrome.tsx.
 * ------------------------------------------------------------------------- */

/** Which token the fade resolves to. The default is right for anything sitting
 *  directly on the page, which is five of the six call sites — the tables draw their
 *  header on surface/secondary but their rows on the page. */
export type FadeSurface = 'background' | 'surface-primary' | 'surface-secondary';

const FADE_VAR: Record<FadeSurface, string> = {
  background: 'var(--oz-color-background)',
  'surface-primary': 'var(--oz-color-surface-primary)',
  'surface-secondary': 'var(--oz-color-surface-secondary)',
};

export function ScrollRegion({
  /** Required. A `role="region"` with no accessible name is not announced, and an
   *  `aria-label` on a div with no role is discarded — it has to be both. */
  label,
  children,
  /** Goes on the scroller, so existing `rounded-* border-2` call sites keep their
   *  frame on the element that clips. */
  className = '',
  fade = 'background',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  fade?: FadeSurface;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ overflow: false, atStart: true, atEnd: true });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    /* 1px of tolerance. Sub-pixel layout makes scrollWidth exceed clientWidth by a
     * fraction on tables that fit perfectly, which would light the fade and add a tab
     * stop on a region with nothing to scroll. */
    const slack = 1;
    const max = el.scrollWidth - el.clientWidth;
    setState({
      overflow: max > slack,
      atStart: el.scrollLeft <= slack,
      atEnd: el.scrollLeft >= max - slack,
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();

    /* Both boxes are watched. The scroller resizes when the column does, and its
     * content resizes when a filter or a "show all" toggle changes the row count —
     * the second is the one a resize listener on the window would miss. */
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    el.addEventListener('scroll', measure, { passive: true });

    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', measure);
    };
  }, [measure]);

  const { overflow, atStart, atEnd } = state;

  return (
    <div className="relative">
      <div
        ref={ref}
        /* Only a real overflow earns a tab stop, and only then is it a region worth
         * announcing. Both attributes drop together so the two agree. */
        tabIndex={overflow ? 0 : undefined}
        role={overflow ? 'region' : undefined}
        aria-label={overflow ? `${label} — scrolls horizontally` : undefined}
        className={`overflow-x-auto focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus ${className}`}
      >
        {children}
      </div>

      {/* Edge fades. `inset-y-px` rather than `inset-y-0` so a call site with a
          2px frame keeps its top and bottom rule visible through the overlay. */}
      {overflow && !atStart && <Fade side="left" fade={fade} />}
      {overflow && !atEnd && <Fade side="right" fade={fade} />}
    </div>
  );
}

function Fade({ side, fade }: { side: 'left' | 'right'; fade: FadeSurface }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-px w-space-8 ${
        side === 'left' ? 'left-px' : 'right-px'
      }`}
      style={{
        backgroundImage: `linear-gradient(to ${side === 'left' ? 'right' : 'left'}, ${
          FADE_VAR[fade]
        }, transparent)`,
      }}
    />
  );
}
