'use client';

import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { textareaRecipe, type TextareaSize, type TextareaVariant } from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';
import { cx } from '@/lib/core/cx';
import { Field } from './Field';

export type TextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'> & {
  variant?: TextareaVariant;
  size?: TextareaSize;
  forceState?: StateName;

  label?: string;
  labelHidden?: boolean;
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;

  /** Starting height, in lines. Also the floor the box never shrinks below. */
  rows?: number;
  /** Height cap, in lines. Past it the element scrolls itself. Omit for no cap, which
   *  is almost never right — an uncapped textarea can push everything below it,
   *  including the submit button, off the bottom of the screen. */
  maxRows?: number;
  /** Turn off auto-grow and hand the user a drag handle instead. */
  autoGrow?: boolean;

  /**
   * A SOFT character limit: it renders the counter and produces an error past it, and it
   * does not truncate.
   *
   * Deliberately not the native `maxLength`, which silently drops everything past the
   * cap — so a 900-character paste into an 800-character field becomes 800 characters
   * with no indication that the last hundred existed. The user cannot recover what they
   * cannot see was removed. Pass `maxLength` as well if a hard cap is genuinely required
   * by a backend; both can coexist and the soft one will never be reached.
   */
  limit?: number;
  className?: string;
  fieldClassName?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    variant,
    size = 'md',
    forceState,
    label,
    labelHidden,
    hint,
    error,
    required,
    optional,
    rows = 3,
    maxRows,
    autoGrow = true,
    limit,
    className,
    fieldClassName,
    disabled,
    value,
    defaultValue,
    onChange,
    ...rest
  },
  ref,
) {
  const inner = useRef<HTMLTextAreaElement | null>(null);
  const [len, setLen] = useState(() => String(value ?? defaultValue ?? '').length);

  const over = limit !== undefined && len > limit;
  /* The soft-limit error is generated here rather than being the caller's job, because a
   * limit with no message is a limit the user discovers by being blocked. An explicit
   * `error` always wins — a server-side failure is more important than a length. */
  const resolvedError =
    error ?? (over ? `${len - limit!} character${len - limit! === 1 ? '' : 's'} over the limit.` : undefined);
  const resolved: TextareaVariant = variant ?? (resolvedError ? 'invalid' : 'default');

  /** Grow to fit, capped at maxRows. */
  const grow = useCallback(() => {
    const el = inner.current;
    if (!el || !autoGrow) return;

    /* Recomputed each time rather than measured once. The web font loads after first
     * paint, which changes the line height under a box that was already sized — measure
     * once at mount and every textarea on the page is wrong by a few pixels for the rest
     * of the session. */
    const cs = getComputedStyle(el);
    const line = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
    /* border-box, so the height set below includes padding and border; scrollHeight
     * includes padding but not border, so the border has to be added back explicitly or
     * the box is 4px short and scrolls one line early. */
    const chrome =
      parseFloat(cs.paddingTop) +
      parseFloat(cs.paddingBottom) +
      parseFloat(cs.borderTopWidth) +
      parseFloat(cs.borderBottomWidth);

    const min = line * rows + chrome;
    const max = maxRows === undefined ? Infinity : line * maxRows + chrome;

    /* 'auto' first. Without the reset, scrollHeight is measured against the height
     * already set, so the box can grow and never shrink — the classic auto-grow bug,
     * where deleting a paragraph leaves the field the size it was. */
    el.style.height = 'auto';
    const next = Math.min(Math.max(el.scrollHeight, min), max);
    el.style.height = `${next}px`;
    /* Only scroll once capped. An overflow-y: auto on an uncapped box shows a scrollbar
     * track for one frame during growth on some platforms. */
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  }, [autoGrow, rows, maxRows]);

  /* Layout effect, keyed on the controlled value: a parent that rewrites the text — an
   * AI filling in a script, a reset button — must resize the box before paint, or the
   * new content is visibly clipped for a frame. Runs on mount too, which is what sizes a
   * field that arrives with a defaultValue already in it. */
  useLayoutEffect(grow, [grow, value]);

  /* Re-fit when the field's own width changes: a narrower box needs more lines for the
   * same text, and neither the value nor a keystroke has changed. Covers the sidebar
   * opening, the container query firing, and the window resizing — the reason this is a
   * ResizeObserver and not a window listener is B17's argument, that the element's own
   * box is the thing that matters and the viewport is a poor proxy for it. */
  useEffect(() => {
    const el = inner.current;
    if (!el || !autoGrow) return;
    const ro = new ResizeObserver(grow);
    ro.observe(el);
    return () => ro.disconnect();
  }, [grow, autoGrow]);

  const counter =
    limit !== undefined ? (
      <span
        /* aria-hidden, and the count is not announced on every keystroke. A live region
           here would interrupt the user mid-sentence with a number on every character
           typed, which is the single most hostile thing a counter can do to a screen
           reader. The limit belongs in the hint, where it is read once when the field is
           entered; the error announces itself if it is exceeded. */
        aria-hidden="true"
        className={cx('text-label-sm tabular-nums', over ? 'text-content-critical-hover' : 'text-content-tertiary')}
      >
        {len}/{limit}
      </span>
    ) : null;

  const control = (c?: Record<string, unknown>) => (
    <textarea
      ref={(node) => {
        inner.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      {...c}
      rows={rows}
      disabled={disabled}
      value={value}
      defaultValue={defaultValue}
      onChange={(e) => {
        setLen(e.target.value.length);
        /* Grow from the event as well as from the effect. The effect covers the
           controlled case; an uncontrolled textarea never re-renders on input, so
           without this it would not resize at all. */
        grow();
        onChange?.(e);
      }}
      className={textareaRecipe.classes({
        variant: resolved,
        size,
        force: forceState,
        className: cx(autoGrow ? 'resize-none' : 'resize-y', className),
      })}
      {...rest}
    />
  );

  if (!label && !hint && !resolvedError && !counter) return control();

  return (
    <Field
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      error={resolvedError}
      required={required}
      optional={optional}
      disabled={disabled}
      size={size}
      labelAside={counter}
      className={fieldClassName}
    >
      {control}
    </Field>
  );
});
