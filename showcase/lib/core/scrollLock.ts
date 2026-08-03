'use client';

import { useEffect } from 'react';

/**
 * Lock the page behind an overlay.
 *
 * The appearance of the lock is `.oz-scroll-lock` in the token layer; what lives here
 * is the two things CSS cannot do — knowing when to apply it, and measuring the
 * scrollbar for the browsers that still need the width handed back.
 *
 * Why this is a shared hook rather than three lines in Dialog, which is what it was:
 * locking the page is not a dialog behaviour, it is an overlay behaviour. A sheet, a
 * command palette, a mobile nav drawer and a lightbox all want exactly this, and the
 * failure mode of leaving it inline is that the next one copies the version with the
 * bug in it. There is one description of it now, and it is this file.
 */

const CLASS = 'oz-scroll-lock';
const WIDTH_VAR = '--oz-scrollbar-width';

/**
 * How many overlays currently hold the lock.
 *
 * A counter and not a boolean, because the interesting case is two at once — a
 * confirmation dialog opened from inside a sheet. The inner one closing must not
 * unlock the page while the outer one is still covering it, and with a boolean it
 * does. Module scope is correct here: the lock is a property of the document, so
 * every overlay on the page is talking about the same one.
 */
let depth = 0;

export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    const root = document.documentElement;

    /* Measured BEFORE the class is applied. Applying it removes the scrollbar, at
     * which point innerWidth and clientWidth agree and this reads 0 — the measurement
     * destroys the thing it is measuring if the order is wrong.
     *
     * Only ever consumed inside `@supports not (scrollbar-gutter: stable)`, so on a
     * current browser it is set and ignored. It is set anyway rather than behind a
     * CSS.supports() check, because a value that is only written on the platforms
     * where it matters is a value that is only tested there too. */
    root.style.setProperty(WIDTH_VAR, `${window.innerWidth - root.clientWidth}px`);

    depth += 1;
    root.classList.add(CLASS);

    return () => {
      depth -= 1;
      if (depth > 0) return;
      root.classList.remove(CLASS);
      root.style.removeProperty(WIDTH_VAR);
    };
  }, [locked]);
}
