import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type RadioVariant = 'unchecked' | 'checked';
export type RadioSize = 'md';

class RadioRecipe extends ComponentRecipe<RadioVariant, RadioSize> {
  readonly meta: RecipeMeta = {
    id: 'radio',
    group: 'forms',
    title: 'Radio',
    tag: 'Radio',
    blurb:
      'One choice from two to about five visible alternatives, all of which stay on screen. Never alone — a single radio cannot be unchecked, so it is a control the user can enter and not leave.',
    notes: [
      'The bindings mirror Checkbox exactly, and the mirroring is the point: two controls that mean "chosen" should not differ by a fill or a border step. The only differences are the radius — rounded-full against Checkbox\'s rounded-2 — and the mark, which is a disc rather than a tick.',
      'Shape carries the entire semantic difference from a checkbox, and it has to survive being the only difference. A circle means "one of these"; a square means "any of these". This is the one place in the system where a radius is load-bearing rather than decorative, which is why the radio is a full circle and not a squarish 6px — at anything less than a full circle the two controls become distinguishable only by comparison, and a form usually shows one kind at a time.',
      'A single radio is a bug, not a use case, and RadioGroup is the only way to render one. A lone radio has no second option to move the selection to, so once chosen it can never be uncleared — the user has made an irreversible decision by clicking something that looked like a preference. That is a checkbox, or a switch.',
      'The mark is content/on-brand — the same token as a primary button label and a checkbox tick, because it sits on the same fill. Drawn as a filled circle element rather than an SVG or a border trick, because a disc is one div and needs no path.',
      'The disc scales in on spatial-fast, and its scale is NOT routed through --oz-motion-spatial-scale. Multiplying it puts the checked disc at scale(0) for a reduced-motion user, which leaves an empty ring on the chosen option and the group saying nothing — the switch-thumb rule with the axis changed, since the disc\'s presence is the state rather than decoration. Reduced motion is honoured by the spring instead: spatial-fast repoints to its effects equivalent, so the overshoot goes and the scale still lands on 1.',
      'unchecked binds a border and no fill, checked binds a fill and no border, and both reserve the border box through the shared shape. Without the reserved box the control resizes by 2px when picked, which shifts the label beside it.',
    ],
  };

  readonly variants = ['unchecked', 'checked'] as const;
  readonly sizes = ['md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    enter: 'none',
    intent:
      'The ring transitions colour on the fast effects spring; the disc inside scales in on spatial-fast, declared on the disc itself. Same split as Checkbox and the same reason: the container changing colour is a graphic updating, and the mark arriving is a commitment. A radio is also the control most often pressed several times in a row while comparing options, so the colour transition has to be short enough that three presses read as three answers rather than as a fade queue.',
  };

  /* rounded-full is the semantic difference from Checkbox — see the notes. Everything else
   * on this line is identical to Checkbox's shape, deliberately. */
  protected readonly shape =
    'relative grid h-space-5 w-space-5 shrink-0 place-items-center rounded-full border-2 ' +
    'disabled:cursor-not-allowed';

  protected readonly sizeClasses: Record<RadioSize, string> = { md: '' };

  protected readonly bindings: Record<RadioVariant, VariantBinding> = {
    unchecked: {
      borderJob: 'affordance',
      intent: 'Not the current choice. The boundary is the whole control.',
      base: { bg: 'surface-primary-variant', border: 'border-tertiary' },
      hover: { border: 'border-tertiary-hover' },
      disabled: { bg: 'fill-secondary-disabled', border: 'border-primary-disabled' },
      focus: 'outline',
    },
    checked: {
      borderJob: 'affordance',
      intent: 'The current choice. Exactly one per group, always.',
      base: { bg: 'fill-brand', fg: 'content-on-brand', border: 'border-brand' },
      hover: { bg: 'fill-brand-hover', border: 'border-brand-hover' },
      disabled: {
        bg: 'fill-brand-disabled',
        fg: 'content-on-brand-disabled',
        border: 'border-primary-disabled',
      },
      focus: 'outline',
    },
  };

  /** The disc. `bg-current` inherits the ring's bound `fg`, so the mark cannot drift from
   *  the token the sweep measured against the fill behind it — a hardcoded
   *  `bg-content-on-brand` here would be a second, unmeasured copy of the same decision,
   *  and would not follow `content/on-brand-disabled` into the disabled state. */
  discClasses(checked: boolean): string {
    return [
      'block size-space-2 rounded-full bg-current',
      'transition-transform duration-spatial-fast ease-spatial-fast',
      /* NOT routed through --oz-motion-spatial-scale, and the first draft of this line was:
       * `scale-[calc(1*var(--oz-motion-spatial-scale))]` makes the disc scale(0) at
       * multiplier 0 — so a reduced-motion user gets an empty ring on the option they just
       * chose, and the radio group stops saying which option is selected at all. It is the
       * switch-thumb rule with the axis changed: the disc's PRESENCE is the state, so
       * removing it removes meaning rather than decoration.
       *
       * Reduced motion is still honoured, by the spring rather than by the value —
       * spatial-fast repoints to its effects equivalent, so the overshoot goes and the
       * scale still lands on 1. Named utilities, so verify-motion.ts's sweep (which matches
       * only bracketed arbitrary values) correctly has nothing to say about them. */
      checked ? 'scale-100' : 'scale-0',
    ].join(' ');
  }

  /**
   * Hover, driven by the ROW rather than by the ring.
   *
   * The ring is a `<span>` beside a visually-hidden `<input>`, so the recipe's own
   * `hover:` prefixes only fire when the pointer is directly over the 20px circle — and
   * the target is the whole 44px row, which is what the user is actually pointing at. A
   * ring that only lights up over its own 20px is a control that appears not to respond.
   *
   * `group-hover:` needs the label to carry `group`. These name the same tokens the
   * `hover` bindings do, so the pairings are still measured by the contrast sweep through
   * those; what is not gated is that the two lists agree, which is why they sit in the
   * same file three lines apart.
   */
  rowHoverClasses(variant: RadioVariant): string {
    return variant === 'checked'
      ? 'group-hover:bg-fill-brand-hover group-hover:border-border-brand-hover'
      : 'group-hover:border-border-tertiary-hover';
  }

  labelFor(variant: RadioVariant): string {
    return variant === 'checked' ? 'Vertical 9:16' : 'Square 1:1';
  }

  protected sampleChildren(): string {
    return '';
  }
}

export const radioRecipe = new RadioRecipe();
