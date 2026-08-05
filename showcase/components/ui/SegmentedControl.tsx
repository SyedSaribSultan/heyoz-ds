'use client';

import { useEffect } from 'react';
import { segmentedRecipe, type SegmentedSize } from '@/lib/recipes';
import { cx } from '@/lib/core/cx';
import { useControllable } from '@/lib/core/useControllable';
import { useRovingFocus } from '@/lib/core/useRovingFocus';

export type SegmentedOption = {
  value: string;
  label: string;
  /** A leading glyph. Keep it optional per option — a row where only some have icons is
   *  misaligned, so either all or none. */
  icon?: React.ReactNode;
  disabled?: boolean;
};

export type SegmentedControlProps = {
  options: SegmentedOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  size?: SegmentedSize;
  disabled?: boolean;
  /** Names the control. Required — a radiogroup with no name announces the options and never
   *  what they are options for. */
  label: string;
  /** Stretch to the container. Off by default: a segmented control is usually sized by its
   *  content and a full-width one in a wide column has enormous segments. */
  fullWidth?: boolean;
  className?: string;
};

/**
 * Two to four mutually exclusive options, all visible, setting a value.
 *
 * It is a radiogroup, not a tablist, and that is the whole reason it exists separately from
 * Tabs. A tablist announces that the selected item OWNS a region below it; this one changes a
 * value something else reads. Using tabs for a sort order tells a screen reader about a panel
 * relationship that is not there.
 *
 * Keyboard is RadioGroup's exactly — one tab stop, arrows move and commit, wrapping — because
 * the semantics are identical. Only the layout and the absence of per-option descriptions
 * differ.
 */
export function SegmentedControl({
  options,
  value,
  defaultValue,
  onChange,
  size = 'md',
  disabled = false,
  label,
  fullWidth = false,
  className,
}: SegmentedControlProps) {
  const [selected, setSelected] = useControllable<string>({
    value,
    defaultValue: defaultValue ?? options[0]?.value ?? '',
    onChange,
  });

  if (process.env.NODE_ENV !== 'production' && options.length > 4) {
    console.error(
      `[oz] <SegmentedControl> has ${options.length} options. Past four, every segment shares ` +
        'the width and the longest label truncates first — use a Select.',
    );
  }

  const selectedIndex = options.findIndex((o) => o.value === selected);

  const roving = useRovingFocus({
    orientation: 'horizontal',
    loop: true,
    skipDisabled: true,
    /* Selection follows focus, same as RadioGroup. It is a radio group. */
    onFocusChange: (i) => {
      const o = options[i];
      if (o && !o.disabled && !disabled) setSelected(o.value);
    },
  });

  /* Tab lands on the SELECTED segment, not the first — ARIA specifies it for a radiogroup and
   * without it the caret ring appears on one segment while Tab goes to another. */
  useEffect(() => {
    if (selectedIndex >= 0) roving.setTabStop(selectedIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  return (
    <div
      ref={roving.containerRef}
      role="radiogroup"
      aria-label={label}
      onKeyDown={roving.onKeyDown}
      className={cx(segmentedRecipe.trackClasses(size), !fullWidth && 'w-auto', className)}
    >
      {options.map((o, i) => {
        const on = o.value === selected;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled || o.disabled}
            {...roving.itemProps(i)}
            onClick={() => setSelected(o.value)}
            className={segmentedRecipe.classes({
              variant: 'segment',
              size,
              /* `selected` is forced rather than left to `aria-selected:`, because the recipe's
                 state variant maps to aria-selected and this control is a radiogroup using
                 aria-checked. Forcing keeps one source of truth for the paint. */
              force: on ? 'selected' : undefined,
              className: fullWidth ? 'flex-1' : 'flex-none',
            })}
          >
            {o.icon && (
              <span aria-hidden="true" className="grid size-space-5 shrink-0 place-items-center">
                {o.icon}
              </span>
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
