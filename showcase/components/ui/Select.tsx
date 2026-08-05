'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { selectRecipe, type SelectSize, type SelectVariant } from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';
import { cx } from '@/lib/core/cx';
import { useAnchor, type Side } from '@/lib/core/useAnchor';
import { useControllable } from '@/lib/core/useControllable';
import { useRovingFocus } from '@/lib/core/useRovingFocus';
import { Field } from './Field';
import { ListboxEmpty, ListboxGroup, ListboxOption, ListboxPanel } from './Listbox';

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
};

export type SelectGroup = { group: string; options: SelectOption[] };

/** Flat options, groups, or a mix. */
export type SelectItem = SelectOption | SelectGroup;

const isGroup = (i: SelectItem): i is SelectGroup => 'group' in i;

export type SelectProps = {
  items: SelectItem[];
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string) => void;

  variant?: SelectVariant;
  size?: SelectSize;
  forceState?: StateName;
  /** Shown when nothing is chosen. Not a label — see Field. */
  placeholder?: string;
  disabled?: boolean;

  label?: string;
  labelHidden?: boolean;
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;

  /** Preferred side for the panel. `useAnchor` flips it when there is no room. */
  side?: Side;
  className?: string;
  fieldClassName?: string;
  /** Showcase-only: renders the panel open in a static grid cell. */
  forceOpen?: boolean;
};

/** How long a typeahead buffer survives without a keystroke. See the recipe note — this is
 *  the interval Windows and macOS list views both use. */
const TYPEAHEAD_RESET_MS = 500;

/**
 * A choice from a closed set, as a real ARIA listbox.
 *
 * The appearance is selectRecipe (trigger) and listboxRecipe (panel and rows). What lives
 * here is the behaviour, and each piece of it is the fix for a specific way pickers break:
 *
 *   - Opening focuses the SELECTED option, not the first. Landing on the first option
 *     means a keyboard user's next ArrowDown moves away from their current value with no
 *     indication of where it was.
 *   - A letter typed on the closed trigger opens and jumps in one press.
 *   - Tab closes and moves on. A listbox is not a modal; trapping focus in one costs the
 *     user their place in the form and protects nothing.
 *   - Escape closes and returns focus to the trigger. Clicking away closes and does not —
 *     the pointer has already chosen where focus should go.
 *   - The panel is portalled to <body>, so an `overflow: hidden` ancestor cannot clip it.
 *     This is the most common reason a dropdown appears cut in half.
 */
export function Select({
  items,
  value,
  defaultValue = null,
  onChange,
  variant,
  size = 'md',
  forceState,
  placeholder = 'Select…',
  disabled = false,
  label,
  labelHidden,
  hint,
  error,
  required,
  optional,
  side = 'bottom',
  className,
  fieldClassName,
  forceOpen = false,
}: SelectProps) {
  const [selected, setSelected] = useControllable<string | null>({
    value,
    defaultValue,
    /* Narrowed rather than cast. The internal value is nullable because "nothing chosen"
       is a real state; `onChange` is not, because the only thing that can clear a Select
       is the caller itself, and firing onChange(null) from inside would let a required
       field silently unset itself. */
    onChange: onChange ? (next) => next !== null && onChange(next) : undefined,
  });

  const [open, setOpen] = useState(forceOpen);
  const listId = useId();
  const groupIdBase = useId();

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const typeahead = useRef({ buffer: '', at: 0 });

  /** Every option in DOM order, groups flattened. The order the arrow keys and typeahead
   *  both work in, so it has to be derived from the same array the rows render from. */
  const flat = useMemo(
    () => items.flatMap((i) => (isGroup(i) ? i.options : [i])),
    [items],
  );

  const resolved: SelectVariant = variant ?? (error ? 'invalid' : 'default');
  const chosen = flat.find((o) => o.value === selected) ?? null;

  const anchor = useAnchor({ open, side, align: 'start', offset: 6, matchAnchorWidth: true });

  /* One ref, two consumers: useAnchor measures it and the component focuses it. Assigning
   * in a callback ref rather than passing anchor.anchorRef directly keeps both. */
  const setTrigger = useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
      anchor.anchorRef.current = node;
    },
    [anchor.anchorRef],
  );

  /* Declared before setPanel, which assigns into its containerRef. The closure would work
     either way, but a const referenced above its declaration is a temporal-dead-zone trap
     waiting for the first person who moves the call out of the callback. */
  const roving = useRovingFocus({ orientation: 'vertical', loop: true, skipDisabled: false });

  /* One node, three consumers: useAnchor measures it, useRovingFocus queries it for rows,
     and this component reads it for hit-testing and focus. */
  const setPanel = useCallback(
    (node: HTMLDivElement | null) => {
      panelRef.current = node;
      anchor.floatingRef.current = node;
      roving.containerRef.current = node;
    },
    [anchor.floatingRef, roving.containerRef],
  );

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const commit = useCallback(
    (option: SelectOption) => {
      if (option.disabled) return;
      setSelected(option.value);
      close(true);
    },
    [setSelected, close],
  );

  /* Focus the selected row on open. In a layout effect rather than an event handler,
   * because the panel does not exist until the render that `open` triggers. */
  useEffect(() => {
    if (!open || !anchor.ready) return;
    const rows = panelRef.current?.querySelectorAll<HTMLElement>('[data-oz-roving]');
    if (!rows?.length) return;
    const at = Math.max(0, flat.findIndex((o) => o.value === selected));
    roving.setTabStop(at);
    rows[at]?.focus();
    /* block: 'nearest' rather than scrollIntoView's default 'start' — centring the
     * selected row on open makes a long list appear to have scrolled for no reason. */
    rows[at]?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, anchor.ready]);

  /* Close on a pointer press outside. pointerdown, not click: a click fires after mouseup,
   * so a press that starts outside and ends inside would not close, and a press that
   * starts inside and drags out would. pointerdown matches where the gesture began, which
   * is what the user meant. */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      close(false);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [open, close]);

  /** Jump to the first option starting with the buffer. Returns the index, or -1. */
  const seek = useCallback(
    (key: string): number => {
      const now = Date.now();
      const t = typeahead.current;
      t.buffer = now - t.at > TYPEAHEAD_RESET_MS ? key : t.buffer + key;
      t.at = now;

      const q = t.buffer.toLowerCase();
      /* Search from the option after the current one, wrapping, so repeating a single
       * letter cycles through everything starting with it rather than sticking on the
       * first match. */
      const from = Math.max(0, flat.findIndex((o) => o.value === selected));
      const order = t.buffer.length > 1 ? flat : [...flat.slice(from + 1), ...flat.slice(0, from + 1)];
      const hit = order.find((o) => o.label.toLowerCase().startsWith(q));
      return hit ? flat.indexOf(hit) : -1;
    },
    [flat, selected],
  );

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
      return;
    }
    /* A printable character opens AND seeks. Length 1 excludes every named key ('Tab',
     * 'Shift'); the modifier check lets Ctrl+F reach the browser. */
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const at = seek(e.key);
      if (at === -1) return;
      e.preventDefault();
      setSelected(flat[at].value);
      setOpen(true);
    }
  };

  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
      return;
    }
    /* Tab is NOT swallowed — it closes and lets the browser move on. See the header note. */
    if (e.key === 'Tab') {
      close(false);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const rows = [...(panelRef.current?.querySelectorAll<HTMLElement>('[data-oz-roving]') ?? [])];
      const at = rows.indexOf(document.activeElement as HTMLElement);
      if (at >= 0) commit(flat[at]);
      return;
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const at = seek(e.key);
      if (at === -1) return;
      e.preventDefault();
      const rows = panelRef.current?.querySelectorAll<HTMLElement>('[data-oz-roving]');
      rows?.[at]?.focus();
      rows?.[at]?.scrollIntoView({ block: 'nearest' });
      return;
    }
    roving.onKeyDown(e);
  };

  /* Row index has to be counted across groups, because the arrow keys and the roving tab
   * stop both work on the flat sequence while the DOM is nested. */
  let cursor = -1;
  const renderOption = (o: SelectOption) => {
    cursor += 1;
    const i = cursor;
    return (
      <ListboxOption
        key={o.value}
        {...roving.itemProps(i)}
        size={size}
        selected={o.value === selected}
        disabled={o.disabled}
        icon={o.icon}
        description={o.description}
        onClick={() => commit(o)}
      >
        {o.label}
      </ListboxOption>
    );
  };

  const panel = (
    <ListboxPanel
      ref={setPanel}
      id={listId}
      role="listbox"
      aria-label={label ?? placeholder}
      /* No aria-activedescendant. That pattern keeps DOM focus on the trigger and points
         at the active row by id; this listbox moves real focus onto the row instead. Both
         are valid ARIA, and mixing them — an activedescendant AND a focused option — makes
         a screen reader announce two current items. Real focus is chosen because the row is
         also the click target, so it has to be focusable regardless. */
      style={{ ...anchor.style, visibility: anchor.ready ? 'visible' : 'hidden' }}
      onKeyDown={onPanelKeyDown}
    >
      {flat.length === 0 ? (
        <ListboxEmpty />
      ) : (
        items.map((item, gi) =>
          isGroup(item) ? (
            <ListboxGroup key={item.group} label={item.group} labelId={`${groupIdBase}-${gi}`}>
              {item.options.map(renderOption)}
            </ListboxGroup>
          ) : (
            renderOption(item)
          ),
        )
      )}
    </ListboxPanel>
  );

  const control = (c?: Record<string, unknown>) => (
    <>
      <button
        ref={setTrigger}
        type="button"
        {...c}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onKeyDown={onTriggerKeyDown}
        onClick={() => setOpen((o) => !o)}
        className={selectRecipe.classes({
          variant: resolved,
          size,
          force: forceState,
          className,
        })}
      >
        <span className={chosen ? selectRecipe.valueClasses() : selectRecipe.placeholderClasses()}>
          {chosen?.label ?? placeholder}
        </span>
        <span className={selectRecipe.chevronClasses(open)} aria-hidden="true">
          <ChevronIcon />
        </span>
      </button>

      {/* Portalled to <body>. An `overflow: hidden` on any ancestor — a card, a scrolling
          table, a dialog — clips a panel rendered in place, and that is the single most
          common reason a dropdown appears cut in half. typeof document guards the SSR
          pass, where there is no body to portal into. */}
      {open && typeof document !== 'undefined' && createPortal(panel, document.body)}
    </>
  );

  if (!label && !hint && !error) return control();

  return (
    <Field
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      disabled={disabled}
      size={size}
      className={fieldClassName}
    >
      {control}
    </Field>
  );
}
