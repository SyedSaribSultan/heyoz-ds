import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type ChipVariant = 'neutral' | 'selected' | 'brand';
export type ChipSize = 'sm' | 'md';

class ChipRecipe extends ComponentRecipe<ChipVariant, ChipSize> {
  readonly meta: RecipeMeta = {
    id: 'chip',
    title: 'Chip',
    tag: 'Chip',
    blurb:
      'A value the user put there and can take away — a filter, a tag, an uploaded file. The distinction from Badge is not visual: a Badge reports state the system decided, a Chip holds an input the user owns.',
    notes: [
      'Badge and Chip look similar and are not the same component, and the test is who owns the value. A Badge says "this render failed" — the system decided that and the user cannot remove it. A Chip says "filtered to Skincare" — the user put it there and must be able to take it off. Making them one component with an `onRemove` prop would mean every Badge in the system carried the affordance for something it must never do.',
      'It is interactive or it is not, and that changes the ELEMENT rather than a style. With onRemove it renders a <span> containing a real dismiss <button>; with onClick it renders a <button> for the whole chip; with neither it is a plain <span>. A div with a click handler would be none of the three, and would be the one shape that is unreachable from a keyboard.',
      'Both together — a clickable chip with a remove button — is deliberately not supported, and the reason is nesting. A button inside a button is invalid HTML that browsers resolve by dropping one of them, and which one is dropped varies. A filter chip that toggles AND removes needs two separate controls side by side, which is a layout decision the caller should make visibly rather than one this component should make quietly.',
      'selected is a variant, not a state, for the same reason Switch has on and off as variants: "selected" is not something the user is currently doing to the chip, it is what the chip says. hover, active and disabled are the states, and selected binds all of them.',
      'The remove button is 20px inside a 44px row and is the ONLY hit target — not the chip. A chip small enough to be a chip cannot give both the label and the ✕ a 44px target, so the ✕ gets the padding and the label gets none. Reversing that produces the worst outcome: a chip that removes itself when the user meant to read it.',
      'The dismiss button\'s label names the value. "Remove" repeated across eight filter chips is eight controls a screen-reader user cannot distinguish; "Remove Skincare" is one they can find.',
      'No `critical` variant. A chip the user can remove does not need to be red — and a red removable chip reads as "this is broken, delete it", which is a judgement about the user\'s own input.',
    ],
  };

  readonly variants = ['neutral', 'selected', 'brand'] as const;
  readonly sizes = ['sm', 'md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    /* `pop` on the chip itself, because a chip usually arrives as the direct result of the
     * user adding it — a filter applied, a file dropped. That is the one entrance where the
     * user is looking straight at the place the thing appears. */
    enter: 'pop',
    intent:
      'Colour on the fastest effects spring, and it scales in on `pop` — which for once is the entrance carrying real information. A chip almost always appears because the user just added it, so they are already looking at the spot where it lands, and a scale from the centre confirms the action took effect. Reduced motion collapses the scale and keeps the fade, so the confirmation survives without the movement.',
  };

  protected readonly shape =
    'inline-flex max-w-full items-center gap-space-2 rounded-full border-2 font-label ' +
    'disabled:cursor-not-allowed';

  protected readonly sizeClasses: Record<ChipSize, string> = {
    sm: 'h-space-9 pl-space-4 pr-space-2 text-label-sm',
    md: 'h-space-10 pl-space-5 pr-space-3 text-label-md',
  };

  protected readonly bindings: Record<ChipVariant, VariantBinding> = {
    neutral: {
      borderJob: 'affordance',
      intent: 'An unselected filter, or a tag that is simply present.',
      base: { bg: 'surface-secondary', fg: 'content-primary', border: 'border-secondary' },
      hover: { bg: 'fill-secondary-hover', border: 'border-secondary-hover' },
      active: { bg: 'fill-secondary-active' },
      disabled: {
        bg: 'fill-secondary-disabled',
        fg: 'content-primary-disabled',
        border: 'border-primary-disabled',
      },
      focus: 'outline',
    },
    selected: {
      borderJob: 'state',
      /* The one `state` border in this recipe and one of two in the system. The boundary here
       * is not the affordance — a chip is a chip either way — it is what says THIS one is on,
       * which is exactly what BorderJob's `state` means. */
      intent: 'A filter that is currently applied. The border is the state, not the affordance.',
      base: { bg: 'fill-selected', fg: 'content-primary', border: 'border-brand' },
      hover: { bg: 'fill-selected-hover', border: 'border-brand-hover' },
      active: { bg: 'fill-selected-active' },
      disabled: {
        bg: 'fill-selected-disabled',
        fg: 'content-primary-disabled',
        border: 'border-brand-disabled',
      },
      focus: 'outline',
    },
    brand: {
      borderJob: 'affordance',
      intent: 'A chip that is itself the brand accent — a plan name, an active model.',
      base: {
        bg: 'fill-brand-secondary',
        fg: 'content-brand-hover',
        border: 'border-brand-secondary',
      },
      hover: { bg: 'fill-brand-secondary-hover' },
      active: { bg: 'fill-brand-secondary-active' },
      disabled: {
        bg: 'fill-secondary-disabled',
        fg: 'content-primary-disabled',
        border: 'border-primary-disabled',
      },
      focus: 'outline',
    },
  };

  /** The dismiss button. 20px glyph in a target the size of the chip's own height, which is
   *  the compromise the notes describe — the chip cannot give both parts 44px. */
  removeClasses(size: ChipSize): string {
    return [
      'grid shrink-0 place-items-center rounded-full',
      size === 'sm' ? 'size-space-6' : 'size-space-7',
      'text-content-tertiary',
      'transition-colors duration-effects-fast ease-effects-fast',
      'hover:bg-fill-tertiary-hover hover:text-content-primary',
      'focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus',
      'disabled:cursor-not-allowed',
    ].join(' ');
  }

  /** The label. `truncate` and `min-w-0` because a chip in a wrapping row is a flex child, and
   *  a long tag would otherwise push its own ✕ out of the pill. */
  labelClasses(): string {
    return 'min-w-0 truncate';
  }

  protected sampleChildren(variant: ChipVariant): string {
    const copy: Record<ChipVariant, string> = {
      neutral: 'Skincare',
      selected: 'Vertical 9:16',
      brand: 'Seedance 2',
    };
    return copy[variant];
  }
}

export const chipRecipe = new ChipRecipe();
