import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type AccordionVariant = 'row' | 'card';
export type AccordionSize = 'md';

class AccordionRecipe extends ComponentRecipe<AccordionVariant, AccordionSize> {
  readonly meta: RecipeMeta = {
    id: 'accordion',
    title: 'Accordion',
    tag: 'Accordion',
    blurb:
      'Sections the reader opens one at a time. Only for content most readers will skip — anything most of them need is content you have hidden, and a page that hides what it is about is shorter and worse.',
    notes: [
      'The trigger is a <button> inside a heading, and the nesting is the part people get wrong in both directions. A bare button gives a screen reader no outline to navigate by, so a twelve-item FAQ becomes twelve unrelated controls; a heading with a click handler and no button is unreachable from a keyboard. The correct structure is <h3><button aria-expanded></button></h3>, and the heading LEVEL is a prop because only the caller knows what it is nested under.',
      'The panel is NOT height-animated, and this is the one place the system accepts a less polished result on purpose. Animating to a measured height means reading scrollHeight on every open, which forces layout, and it is wrong whenever the content reflows mid-transition — an image loading, a font arriving, a nested list wrapping. The content fades in instead, on a curve that cannot overshoot. A collapse that is 40ms less smooth is a better trade than one that clips its own last line.',
      'A closed panel is unmounted, not hidden. `display: none` keeps the content in the DOM where a find-in-page hit lands on something invisible and the browser scrolls to nothing — and it keeps every image inside it downloading. If the content must be findable while closed, an accordion is the wrong container for it.',
      'The chevron rotates and is deliberately NOT routed through --oz-motion-spatial-scale. Rotation is an orientation change rather than travel: at multiplier 0 a chevron that stops rotating stops saying whether the section is open, which is the switch-thumb rule with a different axis. Reduced motion is honoured by the spring being repointed, not by the transform being cancelled.',
      'Two variants and the difference is whether the rows are one object or several. `row` is a stack of hairline-separated rows inside one container — an FAQ, a settings list. `card` gives each section its own bordered surface, for sections that are genuinely independent. `row` is right far more often; `card` on eight sections is eight boxes and the boxes-inside-boxes result rule 1c exists to prevent.',
      'The `row` separator is a 1px background on the row itself, not a border, for the same reason Menu\'s separator is: a rule between rows is `separation`, which rule 1c makes a build error, and a background on a thin box needs no exemption in verify:borders.',
      'Multiple sections open at once is the default. Single-open — where opening one closes the last — is available and is usually wrong: it makes the reader lose their place to see something else, and the two things they wanted to compare are the two things it will not show together.',
    ],
  };

  readonly variants = ['row', 'card'] as const;
  readonly sizes = ['md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    /* The PANEL fades in when mounted; the trigger does not animate in. `fade` is declared
     * here and applied by the component to the panel only. */
    enter: 'fade',
    intent:
      'The trigger transitions colour on the fastest effects spring and the panel fades in — nothing animates height, which is the decision worth defending. A height transition needs a measured scrollHeight, so it forces layout on every open and it is wrong for the whole duration whenever the content reflows underneath it: an image finishing, a webfont arriving, a list wrapping. The failure it produces is the panel clipping its own last line, which is worse than the 40ms of smoothness it buys. The chevron rotates on the same spring, and rotation is an orientation change rather than travel, so it keeps its full value under reduced motion.',
  };

  protected readonly shape =
    'flex w-full items-center gap-space-4 text-left font-body ' +
    'disabled:cursor-not-allowed';

  protected readonly sizeClasses: Record<AccordionSize, string> = {
    md: 'px-space-5 py-space-5 text-body-md',
  };

  protected readonly bindings: Record<AccordionVariant, VariantBinding> = {
    row: {
      intent: 'A stack of rows in one container. The default, and right far more often.',
      base: { bg: 'transparent', fg: 'content-primary' },
      hover: { bg: 'fill-secondary' },
      /* Restated rather than inherited, for the reason button/ghost restates it: a keyboard
       * Enter fires :active with no :hover, so the label has to be legible on the active
       * ground on its own. */
      active: { bg: 'fill-secondary-hover', fg: 'content-primary' },
      disabled: { fg: 'content-primary-disabled' },
      focus: 'outline',
    },
    card: {
      borderJob: 'affordance',
      /* The whole card is the control, which is the same argument card/interactive wins —
       * B20 records that one being stripped and given back for exactly this reason. */
      intent: 'Each section its own surface. For sections that are genuinely independent.',
      base: { bg: 'surface-primary', fg: 'content-primary', border: 'border-secondary' },
      hover: { bg: 'fill-elevated-hover', border: 'border-secondary-hover' },
      active: { bg: 'fill-elevated-active', fg: 'content-primary' },
      disabled: { fg: 'content-primary-disabled', border: 'border-primary-disabled' },
      focus: 'outline',
    },
  };

  /** The container. `row` gets a surface and a radius so its rows have something to sit in;
   *  `card` gets a stack gap because each section is its own object. */
  containerClasses(variant: AccordionVariant): string {
    return variant === 'row'
      ? 'overflow-hidden rounded-8 bg-surface-primary'
      : 'oz-stack oz-stack-3';
  }

  /** Per-section wrapper. `card` needs its own radius so the trigger's hover ground and focus
   *  ring are clipped to the rounded corner; `row` needs nothing, because the hairline between
   *  sections is a real `<Separator />` the component renders between them rather than a
   *  pseudo-element on this class. That was a `before:` arbitrary variant in the first draft —
   *  three stacked Tailwind modifiers to draw a line, when a component that draws exactly that
   *  line already exists in this system and carries the argument for why it is not a border. */
  sectionClasses(variant: AccordionVariant): string {
    return variant === 'card' ? 'overflow-hidden rounded-6' : '';
  }

  /** The chevron. Rotation stays literal — see the notes. */
  chevronClasses(open: boolean): string {
    return [
      'ml-auto size-space-6 shrink-0 text-content-tertiary',
      'transition-transform duration-effects-fast ease-effects-fast',
      open ? 'rotate-180' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  /** The panel. Indented to the trigger's text, and the top padding is removed because the
   *  trigger's own bottom padding already separates them — doubling it makes the answer look
   *  detached from its question. */
  panelClasses(): string {
    return 'px-space-5 pb-space-5 text-body-md text-content-secondary';
  }

  protected sampleChildren(): string {
    return 'How long does a render take?';
  }
}

export const accordionRecipe = new AccordionRecipe();
