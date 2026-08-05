import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type ToastVariant = 'neutral' | 'success' | 'warning' | 'critical' | 'info';
export type ToastSize = 'md';

class ToastRecipe extends ComponentRecipe<ToastVariant, ToastSize> {
  readonly meta: RecipeMeta = {
    id: 'toast',
    group: 'feedback',
    title: 'Toast',
    tag: 'Toast',
    blurb:
      'Confirmation that something the user already did has finished. It disappears on a timer, so nothing in one may be information they need — if they must read it, it is an Alert, and if they must act on it, it is a Dialog.',
    notes: [
      'It uses the FLAT status surfaces, not the tinted ones Alert uses. A toast floats over arbitrary content — a photograph, a video, a dark panel — so a translucent wash would composite against something unknowable and the text on it could land anywhere. The `-flat` surfaces are opaque, which is the only way a foreground on them can be measured at all. Alert sits inside a layout whose background is known, so it can afford the wash.',
      'critical is a variant and is almost always the wrong one. A failure the user has to know about must not vanish after four seconds — that is an Alert, which persists, or a Dialog, which blocks. The variant exists because "upload failed, retrying" is a legitimate transient, not because errors belong in toasts.',
      'The dismiss timer PAUSES on hover and on focus, and resets when both are released. A toast that expires while being read is a toast that punished the user for reading it — and someone using a screen magnifier takes several times longer to reach and read one.',
      'It also pauses while the document is hidden. Without that, five toasts queued behind a tab switch all expire unseen while the user is in another tab, and the work they confirmed appears to have produced no feedback at all.',
      'The region is aria-live="polite" and the toast itself carries no role. Politeness is the whole point: assertive interrupts whatever the screen reader is currently saying, which for a confirmation of something the user already did is an interruption with no news in it. A critical toast is the one case for role="alert", and it is applied per-toast rather than to the region — changing a live region\'s politeness after it exists is unreliable across screen readers.',
      'Stacked newest-FIRST at the bottom right, which is the opposite of a log. A toast is read at the moment it arrives, so the newest must be the one that has not moved; appending to the end pushes every previous toast up and moves the one the user is mid-sentence through.',
      'Four seconds by default, and it is a floor rather than a guess: below about three the text cannot be read to the end, and above about six a stack of them stops clearing. A toast with an action gets longer, because the user has to decide as well as read.',
      'oz-enter-rise, and it is the one component where a spatial entrance is unambiguously right. A toast has no anchor and no origin — it is new information arriving from off-screen — so travel is what says "this just happened" rather than "this was always here and you missed it".',
    ],
  };

  readonly variants = ['neutral', 'success', 'warning', 'critical', 'info'] as const;
  readonly sizes = ['md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-default',
    properties: 'colors',
    enter: 'rise',
    intent:
      'It rises in on the spatial family, which is the one entrance in this system where travel carries meaning rather than decoration: a toast has no anchor, so movement from off-screen is what distinguishes new information arriving from content that was always there. The colour transition is on the effects family and a tier slower than a button\'s, because a toast is not being interacted with — nobody is waiting on its hover, so 240ms reads as considered where 120ms would read as twitchy on something that just flew in.',
  };

  protected readonly shape =
    'pointer-events-auto flex w-full items-start gap-space-4 rounded-6 p-space-5 ' +
    'max-w-[400px] font-body';

  protected readonly sizeClasses: Record<ToastSize, string> = { md: 'text-body-sm' };

  /* The FLAT status surfaces — opaque, so a foreground on them is measurable. See the note.
   * `content/primary` on all five rather than a per-status foreground: the status is carried
   * by the surface and the icon, and coloured body text on a tinted ground is the thing that
   * makes a notification hard to read rather than easy to classify. */
  protected readonly bindings: Record<ToastVariant, VariantBinding> = {
    neutral: {
      intent: 'Something finished. The default and the commonest by a long way.',
      base: { bg: 'surface-elevated', fg: 'content-primary', shadow: 'large' },
      focus: 'none',
    },
    success: {
      intent: 'Something finished and the outcome is worth colouring. Rare — most are neutral.',
      base: { bg: 'surface-success-flat', fg: 'content-primary', shadow: 'large' },
      focus: 'none',
    },
    warning: {
      intent: 'Finished, with a caveat the user does not have to act on now.',
      base: { bg: 'surface-warning-flat', fg: 'content-primary', shadow: 'large' },
      focus: 'none',
    },
    critical: {
      intent:
        'A transient failure that is already being handled. Almost always the wrong choice — see the notes.',
      base: { bg: 'surface-critical-flat', fg: 'content-primary', shadow: 'large' },
      focus: 'none',
    },
    info: {
      intent: 'Something changed that the user did not cause.',
      base: { bg: 'surface-info-flat', fg: 'content-primary', shadow: 'large' },
      focus: 'none',
    },
  };

  /** The status glyph. Colour comes from the status content token, which IS gated against the
   *  flat surfaces at the token layer — the pairing exists because Alert already needed it. */
  iconClasses(variant: ToastVariant): string {
    const byVariant: Record<ToastVariant, string> = {
      neutral: 'text-content-secondary',
      success: 'text-content-success',
      warning: 'text-content-warning',
      critical: 'text-content-critical',
      info: 'text-content-info',
    };
    return `mt-space-1 size-space-6 shrink-0 ${byVariant[variant]}`;
  }

  /** The stack. `pointer-events-none` on the container and `auto` on each toast, so the
   *  fixed region does not swallow clicks on the page behind it — a full-height invisible
   *  column eating every click down the right-hand side is the classic toast-region bug. */
  regionClasses(): string {
    return [
      'pointer-events-none fixed bottom-space-5 right-space-5 z-toast',
      'flex w-[min(400px,calc(100vw-2*var(--oz-space-5)))] flex-col gap-space-3',
    ].join(' ');
  }

  /** The supporting line under the title. */
  descriptionClasses(): string {
    return 'mt-space-1 text-body-sm text-content-secondary';
  }

  protected sampleChildren(variant: ToastVariant): string {
    const copy: Record<ToastVariant, string> = {
      neutral: 'Draft saved',
      success: 'Video exported',
      warning: 'Exported at 720p — the source was too small for 1080p',
      critical: 'Upload failed — retrying',
      info: 'A teammate edited this script',
    };
    return copy[variant];
  }
}

export const toastRecipe = new ToastRecipe();
