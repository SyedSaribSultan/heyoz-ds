import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type PopoverVariant = 'default';
export type PopoverSize = 'sm' | 'md';

class PopoverRecipe extends ComponentRecipe<PopoverVariant, PopoverSize> {
  readonly meta: RecipeMeta = {
    id: 'popover',
    title: 'Popover',
    tag: 'Popover',
    blurb:
      'A non-modal panel anchored to the control that opened it, for content the user may interact with. Everything behind it stays live — if it must not, that is a Dialog.',
    notes: [
      'Non-modal is the whole distinction from Dialog, and it decides four behaviours at once: the page behind is not scroll-locked, there is no scrim, focus is not trapped, and Tab moves out of the panel and on through the page. A popover that traps focus is a dialog wearing the wrong shape — and a dialog without a scrim is a modal nobody can tell is modal.',
      'Focus MOVES INTO the panel on open and returns to the trigger on close, which a tooltip never does. That is the line between the two: a popover holds things you operate, so it has to be reachable, and reachable means focus goes there.',
      'Escape closes and returns focus. A pointer press outside closes and does NOT return focus, because the pointer has already chosen where attention should go — moving the caret back to the trigger would fight it.',
      'It closes on a pointer press outside, on pointerdown rather than click. A click fires after mouseup, so a press starting outside and ending inside would not close and a press starting inside and dragging out would. pointerdown matches where the gesture began, which is what the user meant by it.',
      'role="dialog" with aria-modal deliberately ABSENT. The role is what makes a screen reader announce it as a container with a name and read its contents as a unit; aria-modal="true" would additionally tell it that everything else on the page is unavailable, which for a non-modal panel is a lie that hides the rest of the app.',
      'surface/overlay and shadow-large, the same pair Dialog binds, and no border. Rule 1c: a panel floating above the page is elevation, which is shadow in light and surface lightness in dark — a stroke only says "there is an edge here", which is the one thing nobody needed told about a floating panel.',
      'oz-enter-pop rather than rise. A popover is anchored to the thing that opened it, so it should read as coming OUT of the trigger rather than arriving from below — pop scales from the centre and is the only entrance in the set that says "this belongs to that".',
      'sm is 240px and md is 320px, both as a MINIMUM rather than a fixed width, and useAnchor caps everything at the viewport less its margin. A fixed-width popover on a 360px phone is the horizontal-overflow failure CLAUDE.md names; a min-width one grows to its content and then stops at the screen.',
    ],
  };

  readonly variants = ['default'] as const;
  readonly sizes = ['sm', 'md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    enter: 'pop',
    intent:
      'It scales in from its own centre on the spatial family, which is what `pop` is, and that is correct here for a reason the other entrances are not: a popover has a definite origin — the control that opened it — and pop is the only entrance in the set that reads as emerging from something rather than arriving from a direction. Reduced motion collapses the scale and keeps the fade, so the panel still announces itself without moving.',
  };

  protected readonly shape =
    'oz-stack oz-stack-5 overflow-y-auto overscroll-contain rounded-8 z-popover';

  /* Minimums, not widths. See the note. */
  protected readonly sizeClasses: Record<PopoverSize, string> = {
    sm: 'min-w-[240px] p-space-5',
    md: 'min-w-[320px] p-space-6',
  };

  protected readonly bindings: Record<PopoverVariant, VariantBinding> = {
    default: {
      intent: 'The only kind. Its content decides what it is; the panel is always the panel.',
      base: { bg: 'surface-overlay', fg: 'content-primary', shadow: 'large' },
      focus: 'none',
    },
  };

  /** The panel's own heading, wired to aria-labelledby. A popover with no accessible name is
   *  announced as "dialog" and nothing else. */
  titleClasses(): string {
    return 'text-body-md font-medium text-content-primary';
  }

  protected sampleChildren(): string {
    return '';
  }
}

export const popoverRecipe = new PopoverRecipe();
