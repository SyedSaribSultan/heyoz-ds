'use client';

import { cloneElement, useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { menuRecipe, type MenuVariant } from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';
import { cx } from '@/lib/core/cx';
import { useAnchor, type Align, type Side } from '@/lib/core/useAnchor';
import { useControllable } from '@/lib/core/useControllable';
import { useRovingFocus } from '@/lib/core/useRovingFocus';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * The children. Presentational, stateless, exported — a Menu is composed from these
 * rather than configured with an options array, because a menu's items are actions with
 * handlers and icons and shortcuts, and expressing that as data means inventing a schema
 * for arbitrary callbacks. A Select takes data; a Menu takes children. That difference is
 * real and not an inconsistency.
 * ------------------------------------------------------------------------- */

export type MenuItemProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  variant?: MenuVariant;
  /** A leading glyph. Occupies a fixed column whether present or not, so labels line up. */
  icon?: React.ReactNode;
  /** A keyboard hint, right-aligned. Display only — binding the actual accelerator is the
   *  app's job, and a hint that lies is worse than none. */
  shortcut?: string;
  forceState?: StateName;
};

export function MenuItem({
  variant = 'item',
  icon,
  shortcut,
  forceState,
  disabled,
  className,
  children,
  ...rest
}: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      /* A real <button> with role="menuitem" over it. The role is what makes a screen reader
         announce "menu, 5 items" and read the position; the element is what supplies Enter,
         Space and the hit target. Neither alone is enough. */
      disabled={disabled}
      /* aria-disabled as well as the attribute, because the row stays in the arrow sequence —
         see the recipe note on why a menu keeps disabled items reachable. */
      aria-disabled={disabled || undefined}
      className={menuRecipe.classes({ variant, force: forceState, className })}
      {...rest}
    >
      {icon !== undefined && (
        <span aria-hidden="true" className="grid size-space-5 shrink-0 place-items-center">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut && <span className={menuRecipe.shortcutClasses()}>{shortcut}</span>}
    </button>
  );
}

export type MenuCheckItemProps = Omit<MenuItemProps, 'variant'> & {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

/** A toggle inside a menu. Keeps the menu OPEN when fired — see the recipe note. */
export function MenuCheckItem({
  checked,
  onCheckedChange,
  shortcut,
  forceState,
  disabled,
  className,
  children,
  onClick,
  ...rest
}: MenuCheckItemProps) {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      /* data-oz-menu-stay is read by Menu's click handler, which closes on any other item.
         An attribute rather than a prop on the parent, because the parent renders arbitrary
         children and cannot inspect their types without becoming brittle. */
      data-oz-menu-stay=""
      onClick={(e) => {
        onCheckedChange?.(!checked);
        onClick?.(e);
      }}
      className={menuRecipe.classes({ variant: 'item', force: forceState, className })}
      {...rest}
    >
      {/* The slot is always rendered, so toggling does not shift the label sideways. */}
      <span aria-hidden="true" className={menuRecipe.checkSlotClasses()}>
        {checked && <CheckIcon />}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut && <span className={menuRecipe.shortcutClasses()}>{shortcut}</span>}
    </button>
  );
}

export type MenuGroupProps = { label: string; children: React.ReactNode };

/** A named set of items. role="group" + aria-labelledby, so the heading names its items
 *  rather than being read as one more row. A separator is not a substitute — see the note. */
export function MenuGroup({ label, children }: MenuGroupProps) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id}>
      <div id={id} className={menuRecipe.groupLabelClasses()}>
        {label}
      </div>
      {children}
    </div>
  );
}

/** A rule between groups. Drawn as a 1px background rather than a border, because a rule
 *  between rows is `separation` and rule 1c makes that a build error — so expressing it as a
 *  border would need an exemption in `verify:borders`, and the honest fix is to not use a
 *  border. */
export function MenuSeparator() {
  return <div role="separator" className={menuRecipe.separatorClasses()} />;
}

/* ---------------------------------------------------------------------------
 * The parent.
 * ------------------------------------------------------------------------- */

export type MenuProps = {
  /** The trigger. An element that accepts a ref and spreads props. */
  children: React.ReactElement;
  /** MenuItem / MenuCheckItem / MenuGroup / MenuSeparator. */
  items: React.ReactNode;
  /** Names the menu for assistive technology. */
  label: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: Side;
  align?: Align;
  className?: string;
};

/**
 * A list of actions fired from a button.
 *
 * The two decisions that separate it from every other floating list in this system, both
 * inherited from what a menu MEANS rather than from how it looks:
 *
 *   ARROWS COMMIT NOTHING. `useRovingFocus` is called without `onFocusChange`. RadioGroup
 *     passes one and selects on focus; a menu must not, because arrowing past "Delete"
 *     would delete. Same hook, opposite wiring, and the difference is that a radio group
 *     holds a value while a menu fires actions.
 *   DISABLED ITEMS STAY REACHABLE. `skipDisabled: false`, the opposite of RadioGroup again.
 *     A screen-reader user hunting for an action needs to find it and hear that it is
 *     unavailable; skipping it makes unavailable indistinguishable from absent.
 */
export function Menu({
  children,
  items,
  label,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  side = 'bottom',
  align = 'start',
  className,
}: MenuProps) {
  const [open, setOpen] = useControllable<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const menuId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const anchor = useAnchor({ open, side, align, offset: 6 });
  const roving = useRovingFocus({
    orientation: 'vertical',
    loop: true,
    /* See the header. The opposite of RadioGroup, deliberately. */
    skipDisabled: false,
    /* No onFocusChange. This absence is the component's most important line. */
  });

  const close = useCallback(
    (returnFocus: boolean) => {
      setOpen(false);
      if (returnFocus) triggerRef.current?.focus();
    },
    [setOpen],
  );

  /* Focus the first item once positioned. A menu opened from the keyboard with focus left on
   * the trigger is a menu the arrow keys do not reach. */
  useEffect(() => {
    if (!open || !anchor.ready) return;
    const first = panelRef.current?.querySelector<HTMLElement>('[data-oz-roving]');
    (first ?? panelRef.current)?.focus();
  }, [open, anchor.ready]);

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

  /* Roving props are applied by walking the rendered rows rather than by cloning `items`.
   * Cloning would have to recurse through MenuGroup to reach the items inside it, and would
   * break on any wrapper a caller introduced. The DOM already has them in order — the same
   * argument useRovingFocus itself makes for querying rather than registering. */
  useEffect(() => {
    if (!open) return;
    const rows = panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"],[role="menuitemcheckbox"]');
    rows?.forEach((r, i) => {
      r.setAttribute('data-oz-roving', '');
      r.tabIndex = i === 0 ? 0 : -1;
    });
  }, [open, items]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close(true);
      return;
    }
    /* Tab closes and moves on. A menu is not modal. */
    if (e.key === 'Tab') {
      close(false);
      return;
    }
    roving.onKeyDown(e);
  };

  const trigger = cloneElement(
    children,
    {
      ref: (node: HTMLElement | null) => {
        triggerRef.current = node;
        anchor.anchorRef.current = node;
        const own = (children as unknown as { props: Record<string, unknown> }).props?.ref;
        if (typeof own === 'function') own(node);
        else if (own && typeof own === 'object') (own as { current: unknown }).current = node;
      },
      'aria-haspopup': 'menu',
      'aria-expanded': open,
      'aria-controls': open ? menuId : undefined,
      onClick: () => setOpen(!open),
      onKeyDown: (e: React.KeyboardEvent) => {
        /* ArrowDown/Up open the menu from the trigger, which is what a keyboard user tries
           first and what every native menu button does. */
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          setOpen(true);
        }
      },
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
              panelRef.current = n;
              anchor.floatingRef.current = n;
              roving.containerRef.current = n;
            }}
            id={menuId}
            role="menu"
            aria-label={label}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            /* Closes on any item click EXCEPT one marked to stay — a checkbox item. Handled
               here by delegation rather than by each child calling a callback, because the
               children are arbitrary and a child that forgot to close would look like the
               menu was broken. */
            onClick={(e) => {
              const el = (e.target as HTMLElement).closest(
                '[role="menuitem"],[role="menuitemcheckbox"]',
              );
              if (!el || el.getAttribute('aria-disabled') === 'true') return;
              if (el.hasAttribute('data-oz-menu-stay')) return;
              close(true);
            }}
            style={{ ...anchor.style, visibility: anchor.ready ? 'visible' : 'hidden' }}
            className={cx(menuRecipe.panelClasses(), 'outline-none', className)}
          >
            {items}
          </div>,
          document.body,
        )}
    </>
  );
}
