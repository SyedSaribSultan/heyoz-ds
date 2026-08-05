import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type TooltipVariant = 'default';
export type TooltipSize = 'md';

class TooltipRecipe extends ComponentRecipe<TooltipVariant, TooltipSize> {
  readonly meta: RecipeMeta = {
    id: 'tooltip',
    group: 'overlays',
    title: 'Tooltip',
    tag: 'Tooltip',
    blurb:
      'A short label for a control whose purpose is not obvious from its icon. It is unavailable on touch and unavailable to anyone who never hovers, so nothing inside one may be information the user needs.',
    notes: [
      'WCAG 1.4.13 asks three things of content shown on hover, and this is the reason most tooltips are non-conformant. DISMISSIBLE: Escape closes it without moving the pointer. HOVERABLE: moving the pointer onto the tooltip itself must not close it — someone using screen magnification reads it by moving onto it, and a tooltip that vanishes when approached cannot be read at all. PERSISTENT: it stays until dismissed, the pointer leaves, or focus moves. All three are implemented in components/ui/Tooltip.tsx.',
      'Hover opens after a delay; focus opens immediately. The delay stops a tooltip firing on every icon a pointer crosses on its way somewhere else, which is what makes a toolbar feel like it is shouting. A keyboard user has made a deliberate move to get there, so making them wait is a delay with no noise to suppress.',
      'Once one tooltip has opened, the next opens instantly for a short window. Crossing five buttons in a row should not mean five separate waits — the first delay establishes that the user is reading tooltips, and re-imposing it on every neighbour reads as lag. This is the "warm" period in the component.',
      'It never contains interactive content. A tooltip cannot be reached by a pointer on a touch device and cannot be tabbed into, so a link or a button inside one is unreachable for most people. That is a Popover, which is click-triggered and takes focus.',
      'It is wired with aria-describedby, not aria-labelledby, and the distinction is load-bearing. Describedby ADDS to a control that already has a name; labelledby REPLACES the name. A tooltip on an icon button whose label is "Delete" should announce "Delete, permanently removes the file" — not lose the word Delete to its own explanation.',
      'fill/inverse with content/inverse-primary, the same pair Button\'s inverse variant binds. A tooltip is the one element that should read as sitting above the page rather than on it, and inverting it says so without a border or a heavier shadow.',
      'oz-enter-fade, not a rise. A tooltip appears next to something the pointer is already resting on, so travel would move it under the cursor during the one moment the cursor is stationary and aimed.',
    ],
  };

  readonly variants = ['default'] as const;
  readonly sizes = ['md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    enter: 'fade',
    intent:
      'A fade in on the effects family and nothing spatial at all. The tooltip arrives beside a pointer that has deliberately stopped moving, and any travel would slide it under that stationary cursor — the one case where an entrance actively fights the interaction that triggered it. Rule 1b keeps the opacity on a curve that cannot overshoot, which matters because an overshooting opacity clips at 1 and stalls, and a stalled tooltip reads as the app hanging.',
  };

  protected readonly shape = 'pointer-events-auto max-w-[280px] rounded-4 font-body';

  protected readonly sizeClasses: Record<TooltipSize, string> = {
    md: 'px-space-4 py-space-2 text-body-sm',
  };

  protected readonly bindings: Record<TooltipVariant, VariantBinding> = {
    default: {
      intent: 'The only kind. A tooltip with variants is a tooltip carrying meaning it should not.',
      base: { bg: 'fill-inverse', fg: 'content-inverse-primary', shadow: 'medium' },
      /* No border. Rule 1c: the boundary between an inverted chip and the page is a
       * lightness step of its own, which is separation — and separation is a build error
       * when a surface step already does it. */
      focus: 'none',
    },
  };

  protected sampleChildren(): string {
    return 'Permanently removes the file';
  }
}

export const tooltipRecipe = new TooltipRecipe();
