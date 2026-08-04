'use client';

import { useCallback, useEffect, useId, useRef } from 'react';
import { dialogRecipe, type DialogVariant } from '@/lib/recipes';
import { cx } from '@/lib/core/cx';
import { useScrollLock } from '@/lib/core/scrollLock';
import { Button } from './Button';
import { IconButton } from './IconButton';

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

/** Elements that can hold focus. Used by the tab loop below. */
const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  /** Fires when the confirm button is pressed. Closing is the caller's job — the
   *  dialog does not assume the action succeeded. */
  onConfirm?: () => void;
  variant?: DialogVariant;
  title: string;
  /** The question. One or two sentences; anything longer wants `detailLabel`. */
  children?: React.ReactNode;
  /** detailed type only: the heading of the explanation block, e.g. "Error". */
  detailLabel?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /**
   * One action instead of two: the cancel button is dropped and confirm goes full
   * width.
   *
   * Added for a dialog that asks rather than confirms — an onboarding question has no
   * destructive branch, so a Cancel beside Continue offers a choice between two words
   * that mean the same thing. The escape routes are unchanged and still three: Escape,
   * the scrim, and the close button in the header. That last one is why this is safe to
   * add — dropping Cancel does not make the dialog inescapable, which is the only
   * reason a two-button footer would have been load-bearing.
   *
   * Defaults to false, so every existing caller is byte-identical.
   */
  singleAction?: boolean;
  /**
   * Disables the confirm button without disabling the dialog.
   *
   * Added for the same caller as `singleAction`: a dialog that asks a question cannot
   * submit until the question has been answered, and a live-looking button that
   * silently does nothing is worse than a greyed one. WCAG 1.4.3 exempts disabled
   * controls from the contrast floor, so the greyed state costs nothing to show.
   *
   * Deliberately does NOT gate the escape routes. Escape, the scrim and the close
   * button stay live whatever this is set to — a dialog that can neither be submitted
   * nor left is the one shape a modal must never take, and it is the shape this prop
   * would otherwise make reachable in one line.
   *
   * Defaults to false, so every existing caller is byte-identical.
   */
  confirmDisabled?: boolean;
  className?: string;
};

/**
 * A modal question.
 *
 * The panel's appearance is DialogRecipe's. What lives here is the behaviour that
 * makes it a dialog rather than a styled div, and every piece of it is load-bearing:
 *
 *   - `role="dialog"` + `aria-modal` + `aria-labelledby` — announced as a dialog with
 *     a name, rather than as an unlabelled group.
 *   - Escape closes. Users try it first and it costs nothing to support.
 *   - Focus moves into the panel on open and returns to whatever had it on close. A
 *     modal that leaves focus behind on the page puts the keyboard user outside the
 *     thing blocking their screen.
 *   - Tab cycles within the panel. Without this, Tab walks into the page underneath,
 *     which is inert to a mouse and fully reachable to a keyboard — the most common
 *     modal accessibility defect after the missing name.
 *   - The backdrop click closes; the panel click does not, via a stopPropagation-free
 *     check on the event target, so a text selection that ends outside the panel does
 *     not dismiss the question.
 */
export function Dialog({
  open,
  onClose,
  onConfirm,
  variant = 'basic',
  title,
  children,
  detailLabel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  singleAction = false,
  confirmDisabled = false,
  className,
}: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      /* Only intervene at the two ends. Everything between them is the browser's own
       * tab order, which is already correct and should not be re-implemented. */
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;

    /* Which control gets the caret matters for the destructive type. See
     * dialogRecipe.focusesCancel — an Enter landing on "Yes, delete" before the
     * sentence has been read is the failure this component exists to prevent. */
    const target = panelRef.current?.querySelector<HTMLElement>(
      dialogRecipe.focusesCancel(variant) ? '[data-dialog-cancel]' : '[data-dialog-confirm]',
    );

    /* The disabled check is not defensive padding — `confirmDisabled` makes it reachable.
     * `.focus()` on a disabled button is a silent no-op, and because `target` is still a
     * non-null element the `??` below would never reach the fallback: focus would stay on
     * <body>, outside the modal, with the page behind it inert to a pointer and fully
     * tabbable. That is the exact defect this component's header comment says the tab
     * loop exists to prevent, arriving through the one prop that can disable the element
     * the loop starts from.
     *
     * The fallback deliberately skips the close button. It is the first focusable in the
     * panel, so "first focusable" would open every gated dialog with the caret on Dismiss
     * — which on an onboarding question is an invitation to leave, offered before the
     * question has been read. First non-dismiss control, then the panel itself. */
    const usable =
      target && !target.hasAttribute('disabled')
        ? target
        : [...(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].find(
            (el) => !el.hasAttribute('data-dialog-close'),
          );
    (usable ?? panelRef.current)?.focus();

    return () => {
      restoreTo.current?.focus();
    };
  }, [open, variant]);

  /* The page behind a modal must not scroll. This used to be
   * `document.body.style.overflow = 'hidden'` right here, which worked and shifted the
   * entire document 15px sideways every time it ran: turning off the page's scrollbar
   * hands its track back to the layout. The fix is a reserved gutter on :root, which
   * is in the token layer where every future overlay gets it too — so what is left
   * here is a call to the shared lock. See lib/core/scrollLock.ts. */
  useScrollLock(open);

  if (!open) return null;

  return (
    /* items-center on a tall viewport, items-end on a short one is not what this
     * does — it centres, and `overflow-y-auto` plus `py` lets a panel taller than the
     * viewport scroll as a whole rather than trapping its own footer offscreen. That
     * is the edge case a centred flex modal usually gets wrong. */
    <div
      /* The scrim. Paint comes from dialogRecipe.scrimStyle — `overlay/dimness` and
         `overlay/blur`, the pair spec.mjs declares for precisely this element.
         Previously `bg-content-fixed-primary/70`, which generated no rule and left the
         panel apparently sitting on the page; see the last note in the recipe.

         The paint is on this element and not on an inset child, which matters as soon
         as the panel is taller than the viewport: this is `fixed`, so its background
         always covers the viewport, whereas an `absolute inset-0` layer inside a scroll
         container scrolls away with the content and reveals an unpainted strip.

         `oz-enter-fade` rather than a spatial entrance: a scrim has nowhere to travel
         from, and rule 1b keeps opacity on the effects family, where the curve does not
         overshoot. The panel takes the spatial one. Both are the default tier of their
         family, which is what the recipe's motion note means by one gesture — and both
         come from the token layer, so reduced motion already knows about them. */
      className="oz-enter-fade fixed inset-0 z-modal flex items-center justify-center overflow-y-auto p-space-5"
      style={dialogRecipe.scrimStyle}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        /* enterClass is applied here and not by the caller, which is the exception
           rather than the rule: five other recipes declare an entrance and leave it to
           whoever mounts them, because a card animating every time a grid renders is
           noise. A dialog is different — it is created by the interaction, so it owns
           its own mount and there is no caller decision to defer to. Without this the
           panel appeared instantly under a fading scrim, which reads as the page
           jumping. `rise` is the recipe's declaration, not a choice made here. */
        className={dialogRecipe.classes({
          variant,
          className: cx('outline-none', dialogRecipe.enterClass, className),
        })}
      >
        {/* Header. The close button is pulled out of the padding box with a negative
            margin so the glyph aligns optically with the title's cap height while the
            40px hit area still reaches the panel corner. */}
        <div className="flex items-start justify-between gap-space-5">
          <h2 id={titleId} className="text-heading-xs font-medium text-content-primary">
            {title}
          </h2>
          <IconButton
            variant="ghost"
            size="sm"
            shape="rect"
            label="Close"
            icon={<CloseIcon />}
            onClick={onClose}
            /* Marked so the open-effect can skip it. See the note there: it is the first
               focusable in the panel, so a fallback that took "the first focusable" would
               open every gated dialog with the caret on Dismiss. */
            data-dialog-close=""
            className="-mr-space-2 -mt-space-1 shrink-0"
          />
        </div>

        {/* Body. The detailed type wraps its copy in a labelled block; the other three
            put the sentence straight under the title. The separation between them is
            space, not a hairline — see the recipe note. */}
        {variant === 'detailed' ? (
          <div className="oz-stack oz-stack-1">
            {detailLabel && (
              <p className="flex items-center gap-space-2 text-body-md font-medium text-content-primary">
                {detailLabel}
              </p>
            )}
            <div className="text-body-sm text-content-secondary">{children}</div>
          </div>
        ) : (
          <div className="text-body-md text-content-secondary">{children}</div>
        )}

        {/* Footer. Reverses to a stacked, full-width pair under 380px: two buttons
            side by side with "Delete permanently" on one of them do not fit on a
            small phone, and a squeezed row truncates the label that says what the
            button does. Confirm sits last in the DOM and first visually when stacked,
            which keeps the tab order (Cancel, then Confirm) stable across both. */}
        <div
          className={
            singleAction
              ? ''
              : 'flex flex-col-reverse gap-space-3 min-[380px]:flex-row min-[380px]:justify-end'
          }
        >
          {!singleAction && (
            <Button
              variant="outline"
              size="md"
              onClick={onClose}
              data-dialog-cancel=""
              className="min-[380px]:w-auto"
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={dialogRecipe.confirmVariant(variant)}
            size="md"
            onClick={onConfirm}
            disabled={confirmDisabled}
            data-dialog-confirm=""
            /* w-full is stated rather than inherited in the single-action case. In the
               two-button footer the buttons stretch because the wrapper is a stacked
               flex column and only widen back at 380px; with no wrapper flex there is
               nothing to stretch against. */
            className={singleAction ? 'w-full' : 'min-[380px]:w-auto'}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
