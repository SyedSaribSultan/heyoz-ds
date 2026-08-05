import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

/** Three weights of text action. Figma keeps these in their own component set
 *  (Button / Link) and so does this layer, for the reason in the blurb: none of
 *  Button's six size rows describes something with no box. */
export type ButtonLinkVariant = 'brand' | 'neutral' | 'subtle';

/** One size. Figma's Link row is 22px tall at a single step, because a text action
 *  is sized by the paragraph it sits in rather than by a control ramp. */
export type ButtonLinkSize = 'md';

class ButtonLinkRecipe extends ComponentRecipe<ButtonLinkVariant, ButtonLinkSize> {
  readonly meta: RecipeMeta = {
    id: 'button-link',
    group: 'actions',
    title: 'Button Link',
    tag: 'ButtonLink',
    blurb:
      'A text action with no box. Reads as a link and behaves as whichever of the two it is — the tag is chosen by whether the thing it does is navigation or a command.',
    notes: [
      'Not a variant of Button. Every entry in Button\'s size table sets a height, a horizontal padding and a radius, and all three are wrong for something with no fill: a 40px-tall text link has 9px of dead space above and below the word that still swallows clicks. Figma made the same split for the same reason.',
      'The underline is present at rest, not added on hover. A text action that only looks like one when the pointer is already on it is not discoverable, and hover is not available on touch at all. What hover changes is the colour.',
      'Renders as an <a> when given href and a <button> otherwise, and the choice is not cosmetic: middle-click, ctrl-click, "open in new tab" and the browser status bar all come from the anchor, and none of them are appropriate for something that mutates state. The component refuses to be an anchor without an href, because an <a> with no href is not focusable and drops out of the tab order.',
      'subtle sits at content-tertiary, which is gated at 4.5:1 against all four surfaces rather than only the page — it was the token whose single gate passed while it failed everywhere an app actually draws text. See CLAUDE.md rule 4.',
    ],
  };

  readonly variants = ['brand', 'neutral', 'subtle'] as const;
  readonly sizes = ['md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    enter: 'none',
    intent:
      'Colour only, on the fastest effects spring. No press-scale and no entrance: a text action sits inside a sentence or a footer row, and scaling it on press would move the surrounding baseline. The transition is on the colour alone because the underline is always present — there is no thickness or offset animating, which is the usual way a link transition ends up reflowing text on hover.',
  };

  /* No padding, no height, no radius. `underline-offset-2` is the only structural
   * decision: at offset 0 the underline collides with the descenders of g, y and p,
   * and "Copy" is a word this system actually ships. */
  protected readonly shape =
    'inline-flex items-center gap-space-1 w-fit font-label font-medium ' +
    'underline decoration-1 underline-offset-2 ' +
    'rounded-2 disabled:cursor-not-allowed disabled:no-underline';

  protected readonly sizeClasses: Record<ButtonLinkSize, string> = {
    md: 'text-body-md',
  };

  protected readonly bindings: Record<ButtonLinkVariant, VariantBinding> = {
    brand: {
      intent: 'The action a sentence is pointing at. "See full details", "Upgrade now".',
      base: { fg: 'content-brand' },
      hover: { fg: 'content-brand-hover' },
      active: { fg: 'content-brand-active' },
      disabled: { fg: 'content-primary-disabled' },
      focus: 'outline',
    },
    neutral: {
      intent: 'A text action that should not draw the eye off the copy around it.',
      base: { fg: 'content-primary' },
      hover: { fg: 'content-brand' },
      active: { fg: 'content-brand-active' },
      disabled: { fg: 'content-primary-disabled' },
      focus: 'outline',
    },
    subtle: {
      intent: 'Footer and metadata links. Present, findable, not competing.',
      base: { fg: 'content-tertiary' },
      hover: { fg: 'content-primary' },
      /* Restated rather than inherited from hover: a keyboard Enter or a touch tap
       * fires :active with no :hover, so this state cannot rely on hover having
       * already lifted the colour off content-tertiary. */
      active: { fg: 'content-primary' },
      disabled: { fg: 'content-tertiary-disabled' },
      focus: 'outline',
    },
  };

  protected sampleChildren(variant: ButtonLinkVariant): string {
    const copy: Record<ButtonLinkVariant, string> = {
      brand: 'See full details',
      neutral: 'Manage billing',
      subtle: 'Privacy policy',
    };
    return copy[variant];
  }
}

export const buttonLinkRecipe = new ButtonLinkRecipe();
