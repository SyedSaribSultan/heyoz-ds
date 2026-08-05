'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Controlled/uncontrolled parity, once.
 *
 * Every interactive component in this system has to work both ways: `<Select value=…
 * onChange=… />` when the caller owns the value, and `<Select defaultValue=… />` when
 * it does not care. That is two code paths per component, and writing them per
 * component is how they drift — the uncontrolled path forgets to fire `onChange`, or
 * the controlled path keeps a shadow copy of the value in state and the two disagree
 * the first time a parent re-renders with something else.
 *
 * Same argument scrollLock.ts makes about the page lock: this is not a Select
 * behaviour, it is a form-control behaviour, and the failure mode of leaving it inline
 * is that the next control copies the version with the bug in it.
 *
 * Three things here are load-bearing:
 *
 *   1. THE MODE IS FIXED AT MOUNT. `controlled` is a ref read once, not `value !==
 *      undefined` evaluated per render. A component that switches modes mid-life is a
 *      component whose value silently stops tracking its prop — and the way that
 *      happens in practice is a caller passing `value={maybeUndefined}`, which reads
 *      as controlled on the first render and uncontrolled on the second.
 *
 *   2. THE CONTROLLED PATH NEVER WRITES INTERNAL STATE. It fires `onChange` and
 *      nothing else. If it also called `setInternal`, there would be two sources of
 *      truth for one value and the component would render the internal one — so a
 *      parent that rejects a change (a validated field, an optimistic update that
 *      failed) would see the control move anyway. That is the specific bug this
 *      arrangement rules out.
 *
 *   3. THE SETTER IS IDENTITY-STABLE. `onChange` lives in a ref that the render
 *      refreshes, so the returned setter has no dependency on it. Without this, every
 *      caller passing an inline arrow — which is all of them — gets a new setter each
 *      render, and any memoised child below it re-renders on every keystroke.
 */

export type ControllableArgs<T> = {
  /** Present ⇒ controlled. Must not change presence across the component's life. */
  value?: T;
  /** The starting value when uncontrolled. Required, so there is no such thing as a
   *  control with no value — an `undefined` <input> is React's own oldest footgun. */
  defaultValue: T;
  onChange?: (next: T) => void;
};

/** An updater, so callers can derive from the current value without reading it.
 *  Needed by anything that toggles a member of a set — a multi-select, a filter
 *  row — where `set(prev => …)` is the only expression that is correct under two
 *  changes in one tick. */
export type Updater<T> = T | ((prev: T) => T);

export function useControllable<T>({
  value,
  defaultValue,
  onChange,
}: ControllableArgs<T>): readonly [T, (next: Updater<T>) => void] {
  const controlled = useRef(value !== undefined).current;
  const [internal, setInternal] = useState<T>(defaultValue);

  /* Refreshed every render, read only inside the setter. See note 3. */
  const latest = useRef(onChange);
  latest.current = onChange;

  /* Mirrors the resolved value so the updater form can read "prev" without the setter
   * having to depend on it. In the controlled case this is the prop; in the
   * uncontrolled case it is the state. Either way it is one render behind nothing —
   * assigned during render, read during the event. */
  const current = controlled ? (value as T) : internal;
  const currentRef = useRef(current);
  currentRef.current = current;

  if (process.env.NODE_ENV !== 'production') {
    /* Not a hook, so it cannot be conditional — but a plain comparison against a ref
     * read at mount is safe here, and the alternative is that the single most
     * confusing failure in this file stays silent. React warns about exactly this for
     * <input>; nothing warns for a custom control. */
    if (controlled !== (value !== undefined)) {
      console.error(
        '[oz] A control switched between controlled and uncontrolled. The mode is ' +
          'fixed at mount, so the value has stopped tracking the `value` prop. Pass ' +
          '`value` on every render (use null, not undefined, for "empty"), or pass ' +
          '`defaultValue` alone.',
      );
    }
  }

  const set = useCallback(
    (next: Updater<T>) => {
      const resolved =
        typeof next === 'function' ? (next as (prev: T) => T)(currentRef.current) : next;

      /* Bail on a no-op. Not an optimisation — a Select that fires onChange with the
       * value it already had makes "the user picked something" and "the user picked
       * the same thing again" indistinguishable to an analytics handler, and it is
       * the difference between an autosave that runs once and one that runs on every
       * arrow key. Object identity is the right comparison: for the primitives these
       * controls carry it is value equality, and for a caller passing objects it
       * correctly treats a new object as a new value. */
      if (resolved === currentRef.current) return;

      if (!controlled) setInternal(resolved);
      latest.current?.(resolved);
    },
    [controlled],
  );

  return [current, set] as const;
}
