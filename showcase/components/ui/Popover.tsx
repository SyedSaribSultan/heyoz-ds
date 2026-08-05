'use client';

import { cloneElement, useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { popoverRecipe, type PopoverSize } from '@/lib/recipes';
import { cx } from '@/lib/core/cx';
import { useAnchor, type Side, type Align } from '@/lib/core/useAnchor';
import { useControllable } from '@/lib/core/useControllable';

/** Same list Dialog uses. Kept in step with it deliberately — two different ideas of what
 *  "focusable" means in one codebase is how one of them ends up missing a control type. */
const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export type PopoverProps = {
  /** The trigger. An element that accepts a ref and spreads props. */
  children: React.ReactElement;
  /** The panel's content. */
  content: React.ReactNode;
  /** Names the panel. Rendered as a heading and wired to aria-labelledby — a popover with
   *  no name is announced as "dialog" and nothing more. Pass `titleHidden` to keep the name
   *  without painting it. */
  title?: string;
  titleHidden?: boolean;

  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  side?: Side;
  align?: Align;
  size?: PopoverSize;
  className?: string;
};

/**
 * A non-modal panel anchored to its trigger.
 *
 * What makes it non-modal, stated as the four things it deliberately does NOT do — because
 * each is something Dialog does, and doing any of them here would make this a dialog with
 * the wrong shape:
 *
 *   no scroll lock · no scrim · no focus trap · Tab leaves the panel and continues the page
 *
 * What it DOES do, and what separates it from Tooltip: focus moves into the panel on open.
 * A popover holds things you operate, so they have to be reachable.
 */
export function Popover({
  children,
  content,
  title,
  titleHidden = false,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  side = 'bottom',
  align = 'start',
  size = 'md',
  className,
}: PopoverProps) {
  const [open, setOpen] = useControllable<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const titleId = useId();
  const panelId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const anchor = useAnchor({ open, side, align, offset: 6 });

  const close = useCallback(
    (returnFocus: boolean) => {
      setOpen(false);
      if (returnFocus) triggerRef.current?.focus();
    },
    [setOpen],
  );

  /* Focus into the panel once it has been positioned. First focusable, or the panel itself —
   * a panel of static content still has to receive focus, or Escape has nowhere to be heard
   * and the screen reader's cursor never enters it. */
  useEffect(() => {
    if (!open || !anchor.ready) return;
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panelRef.current)?.focus();
  }, [open, anchor.ready]);

  /* pointerdown, not click — see the recipe note on why the distinction matters. */
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

  /* Tab out closes it. NOT a trap: the panel is non-modal, so leaving it is legitimate and
   * the page behind is live. What would be wrong is leaving an orphaned panel open behind
   * the caret — so the panel closes as focus departs, and the next Tab lands wherever it
   * would have without the popover. Checked on focusout with relatedTarget, because that is
   * the only event that reports where focus is GOING. */
  const onFocusOut = (e: React.FocusEvent) => {
    const next = e.relatedTarget as Node | null;
    if (!next) return;
    if (panelRef.current?.contains(next) || triggerRef.current?.contains(next)) return;
    setOpen(false);
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
      'aria-haspopup': 'dialog',
      'aria-expanded': open,
      'aria-controls': open ? panelId : undefined,
      onClick: () => setOpen(!open),
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
            }}
            id={panelId}
            role="dialog"
            /* aria-modal deliberately absent — see the recipe note. */
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key !== 'Escape') return;
              e.stopPropagation();
              close(true);
            }}
            onBlur={onFocusOut}
            style={{ ...anchor.style, visibility: anchor.ready ? 'visible' : 'hidden' }}
            className={cx(
              popoverRecipe.classes({ size, className }),
              popoverRecipe.enterClass,
              'outline-none',
            )}
          >
            {title && (
              <h2 id={titleId} className={cx(titleHidden ? 'sr-only' : popoverRecipe.titleClasses())}>
                {title}
              </h2>
            )}
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
