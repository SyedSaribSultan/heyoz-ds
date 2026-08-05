import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

/** Where a step sits relative to the one the user is on. Not an interaction state —
 *  `passed` is not something a pointer does, it is what the component says. */
export type TabVariant = 'inactive' | 'active' | 'passed';
export type TabSize = 'md';

class TabsRecipe extends ComponentRecipe<TabVariant, TabSize> {
  readonly meta: RecipeMeta = {
    id: 'tabs',
    group: 'navigation',
    title: 'Tabs',
    tag: 'Tabs',
    blurb:
      'A stepped sequence with a progress rail above each label. Built for the onboarding video player, so it lives on an inverse ground rather than on the page.',
    notes: [
      'The rail is above the label, not below it, and it is per-tab rather than one bar across the row. That is what makes this a sequence rather than a tab strip: three separate rails read as three chapters with their own extents, where a single underline sliding between them reads as one view with three filters.',
      'inactive, active and passed are variants, not states — the same call Switch makes for on/off. hover is the state, and all three variants bind it.',
      'passed and inactive share a label colour and differ only in the rail. That is deliberate: the label says what the step is, and how far through it you are is the rail\'s job. Colouring a completed label differently from an upcoming one implies the text changed meaning, which it did not.',
      'Bound to the inverse content ramp because this sits on a dark panel in both modes — a video chrome, not a page. content-inverse-primary and content-inverse-secondary are gated against surface/inverse, which is the surface it is actually on; the page tokens would be gated against the wrong thing.',
      'The rail names one colour token, fill-fixed, and gets its unfilled weight from a structural opacity rather than from a second token. Figma specifies #ffffff80 for the empty rail, which would otherwise want a fill/fixed-tertiary token that is only meaningful on an inverse ground and therefore cannot be gated against the page the way every other fill is. Opacity is geometry; this keeps the colour layer honest without inventing an ungateable token.',
    ],
  };

  readonly variants = ['inactive', 'active', 'passed'] as const;
  readonly sizes = ['md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    enter: 'none',
    intent:
      'Colour only, on the fastest effects spring. The rail does not animate its width, which is the thing a progress component is usually tempted to do: these rails are chapter extents rather than a completion percentage, so there is no value travelling between two numbers. What changes when the user moves a step is which rail is lit, and that is a colour change.',
  };

  /* min-w-0 on a flex child, which is the failure mode dist/layout.css exists to
   * prevent: a flex item defaults to min-width:auto and refuses to shrink below its
   * content, so three tabs with long labels push the row into horizontal overflow
   * instead of truncating. Same rule the layout primitives gate. */
  protected readonly shape =
    'group flex min-w-0 flex-1 flex-col items-start gap-space-3 text-left ' +
    'disabled:cursor-not-allowed';

  protected readonly sizeClasses: Record<TabSize, string> = {
    /* body-sm is 14/20, which is the canvas value exactly. 4 + 8 + 20 = 32, the
     * Figma height, and here the leading really does set it — a tab has no pinned
     * height because its label wraps. */
    md: 'text-body-sm',
  };

  protected readonly bindings: Record<TabVariant, VariantBinding> = {
    inactive: {
      intent: 'A step the user has not reached. Reachable, not yet visited.',
      base: { fg: 'content-inverse-secondary' },
      hover: { fg: 'content-inverse-primary' },
      disabled: { fg: 'content-inverse-secondary-disabled' },
      focus: 'outline',
    },
    active: {
      intent: 'The step being watched right now. Exactly one per row.',
      base: { fg: 'content-inverse-primary' },
      /* No hover change: it is already at the top of the ramp, and a hover that
       * cannot go anywhere is a hover that reads as broken. Restated rather than
       * omitted so the generated table shows the decision instead of a gap. */
      hover: { fg: 'content-inverse-primary' },
      disabled: { fg: 'content-inverse-secondary-disabled' },
      focus: 'outline',
    },
    passed: {
      intent: 'A completed step. Same label weight as inactive; the rail is what differs.',
      base: { fg: 'content-inverse-secondary' },
      hover: { fg: 'content-inverse-primary' },
      disabled: { fg: 'content-inverse-secondary-disabled' },
      focus: 'outline',
    },
  };

  /** The rail. One colour token; the unfilled weight is a structural opacity.
   *
   *  `active` and `passed` are both fully lit — a step you are on and a step you have
   *  finished are both "covered ground". Only `inactive` is dimmed. */
  railClasses(variant: TabVariant): string {
    return [
      'h-space-1 w-full shrink-0 rounded-full bg-fill-fixed',
      'transition-opacity duration-effects-fast ease-effects-fast',
      variant === 'inactive' ? 'opacity-50' : 'opacity-100',
    ].join(' ');
  }

  /** Active is the only one that carries weight. */
  labelWeight(variant: TabVariant): string {
    return variant === 'active' ? 'font-medium' : 'font-normal';
  }

  protected sampleChildren(): string {
    return 'Product reshoots';
  }
}

export const tabsRecipe = new TabsRecipe();
