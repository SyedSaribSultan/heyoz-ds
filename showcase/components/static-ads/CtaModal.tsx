'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, Textarea } from '@/components/ui';

/* ---------------------------------------------------------------------------
 * The Call-to-Action modal.
 *
 * ENTIRELY ui/Dialog, and the mapping is exact rather than approximate — which is worth
 * recording, because the asset picker beside it could not reuse Dialog at all:
 *
 *   sheet                          Dialog gives it
 *   ─────────────────────────      ──────────────────────────────────────────────
 *   header title + × close         `title`, plus the IconButton in its header
 *   `Cancel` outline button        `cancelLabel`, rendered `variant="outline"`
 *   `Done` solid black button      `confirmLabel`, and `variant="basic"` maps confirm to
 *                                  the `inverse` button — #070605 in light, which is the
 *                                  sheet's black, and correctly near-white in dark
 *   modal, scrim, focus trap       all of it, including the scroll lock
 *   ~460px wide                    dialogRecipe pins max-w-[460px]
 *
 * So there is no custom chrome here at all. The 460px cap is the reason this works and the
 * reason AssetPickerModal does not: a tabbed card grid needs roughly three times that, and
 * the cap is in the recipe rather than a prop.
 *
 * THE DRAFT IS LOCAL AND COMMITS ON DONE. Typing does not change the chip behind the modal —
 * Cancel and Escape have to be able to leave the value alone, and a modal that writes
 * through on every keystroke gives its own Cancel nothing to undo. Reset happens on OPEN
 * rather than on close, so the field shows the committed value each time it is reopened
 * instead of whatever was abandoned last.
 * ------------------------------------------------------------------------- */

export function CtaModal({
  open,
  onClose,
  /** The committed call to action. Empty means none. */
  value,
  onCommit,
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  onCommit: (next: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  /* Seeded from the committed value whenever the modal opens. `open` in the deps and not
     `value`: syncing on `value` would also overwrite a live draft the moment anything else
     committed, which is the bug this shape exists to avoid. */
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  /* PORTALLED TO BODY, AND THIS IS A WORKAROUND FOR A REAL DEFECT IN ui/Dialog RATHER THAN A
   * preference. Dialog renders INLINE — `fixed inset-0 z-modal` on an element left wherever
   * the caller mounted it — while Popover and Menu both `createPortal` to body. Inline is
   * fine until an ancestor creates a stacking context, and StaticAdsHero has one: it carries
   * `isolate` so its `-z-10` glow layers stack against the section instead of escaping behind
   * the page.
   *
   * Inside that isolation `z-modal` cannot climb past the hero itself, and the hero is a
   * positioned element with `z-index: auto`. So is every ResultCard in Recents (`group
   * relative`), and those come LATER in DOM order — which means a 176px card painted over the
   * whole dialog and swallowed the clicks meant for Done. It looked open and was inert.
   *
   * Caught by driving the states in a browser, not by reading them: the dialog SCREENSHOTS
   * correctly, because the scrim and panel are visible and only the hit-testing is wrong.
   *
   * The proper fix is one line in ui/Dialog — wrap its root in createPortal the way Popover
   * already does — which would fix every consumer at once. Not done here: Dialog is shared
   * with the whole showcase and `/c/dialog` carries committed visual baselines, so that is a
   * change to make deliberately with those re-approved, not as a side effect of this route.
   * When it lands, delete this wrapper. */
  if (typeof document === 'undefined') return null;

  return createPortal(
    <Dialog
      open={open}
      onClose={onClose}
      onConfirm={() => {
        onCommit(draft.trim());
        onClose();
      }}
      variant="basic"
      title="Enter your Call-to-Action (CTA)"
      confirmLabel="Done"
      cancelLabel="Cancel"
    >
      {/* The real Textarea here, unlike the prompt box's raw one: this field IS the content
          of the dialog rather than a chromeless area inside a card, so it wants the border,
          the focus ring and the label plumbing Field gives it.

          maxRows caps the growth. Dialog's panel is a flex column that scrolls its body, but
          an uncapped textarea inside it would push the footer down before the body started
          scrolling — which puts Done off-screen on a short viewport. */}
      <Textarea
        label="Call to action"
        labelHidden
        rows={3}
        maxRows={6}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="e.g Claim Offer Now!"
      />
    </Dialog>,
    document.body,
  );
}
