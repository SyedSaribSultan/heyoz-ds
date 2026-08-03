import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type CardVariant = 'flat' | 'raised' | 'overlay' | 'interactive';
export type CardSize = 'md' | 'lg';

class CardRecipe extends ComponentRecipe<CardVariant, CardSize> {
  readonly meta: RecipeMeta = {
    id: 'card',
    title: 'Card',
    tag: 'Card',
    blurb: 'A surface that groups content. The rung of the surface ladder it sits on is the decision.',
    notes: [
      'flat and raised are the same surface token and differ only in shadow. Depth is elevation, not colour — using surface/secondary to mean "raised" breaks the ladder, because that token already means "nested inside a card".',
      'overlay uses surface/elevated and no border, in either mode. It used to need one: surface/elevated was byte-identical to surface/secondary in dark, so a popover on a nested surface had no boundary and the stroke was the only thing holding it — this note used to say exactly that, and it was right at the time. DECISIONS B18 moved both floating surfaces to neutral/105, ΔL 4.3 above surface/tertiary and 9.7 above surface/secondary, so the surface is the boundary and the shadow is the depth. The border came off with it.',
      'interactive is the only variant with states, and it is for a card that is entirely one link or button. A card containing several actions is not interactive; its children are.',
    ],
  };

  readonly variants = ['flat', 'raised', 'overlay', 'interactive'] as const;
  readonly sizes = ['md', 'lg'] as const;

  readonly motion: MotionSpec = {
    /* The only component whose transition is spatial, and the reason is that the
     * interactive variant lifts: it changes shadow AND translates. A lift on an
     * effects spring arrives and stops dead, which reads as a shadow being swapped
     * rather than as the card coming toward you. */
    transition: 'spatial-default',
    properties: 'colors-and-transform',
    enter: 'rise',
    intent:
      'Lifts on hover — shadow and a 2px rise together, on the default spatial spring, so the overshoot makes it read as a physical card rather than a box whose shadow changed. Was transition-shadow at duration-base, which animated the shadow while the position snapped; the two are one gesture and now share one spring. The rise multiplies by --oz-motion-spatial-scale, so under reduced motion the shadow still changes and the card stays put.',
  };

  /* border-2 stays here, and it is border-transparent by default via the shared
   * shape — the box is reserved so a bordered `interactive` card that is selected
   * and an unbordered `flat` card sitting beside it are the same height. Card is
   * the one place left where that reservation is still earning its keep. */
  protected readonly shape = 'rounded-6 border-2 border-transparent';

  protected readonly sizeClasses: Record<CardSize, string> = {
    md: 'p-space-5',
    lg: 'p-space-7',
  };

  protected readonly bindings: Record<CardVariant, VariantBinding> = {
    /* Separation. surface/primary against the page is ΔL 2.9 in light and 6.6 in
     * dark — a real step in both, and the step is the boundary. */
    flat: {
      intent: 'The default. Grouping, no depth claim.',
      base: { bg: 'surface-primary', fg: 'content-primary' },
      focus: 'none',
    },
    /* Elevation. The shadow is the depth claim in light; in dark the shadow barely
     * reads and surface lightness carries it, which is what DECISIONS B18 fixed.
     * Before that fix this variant needed its border, because the ladder did not
     * express depth and something had to. */
    raised: {
      intent: 'Sits above the page: a stat tile, a summary panel.',
      base: {
        bg: 'surface-primary',
        fg: 'content-primary',
        shadow: 'x-small',
      },
      focus: 'none',
    },
    /* The variant the whole ladder fix was for. `surface/elevated` used to be
     * byte-identical to `surface/secondary` in dark, so a popover on a nested
     * surface had literally no boundary and `border/elevated` was the only thing
     * holding it — this file used to say so. It now sits at neutral/105, ΔL 4.3
     * above surface/tertiary and 9.7 above surface/secondary, so the surface is the
     * boundary and the shadow is the depth. */
    overlay: {
      intent: 'Detached from the page: popover, menu, tooltip body, dialog.',
      base: {
        bg: 'surface-elevated',
        fg: 'content-primary',
        shadow: 'medium',
      },
      focus: 'none',
    },
    /* The only variant that keeps a stroke, and it keeps it at every state.
     *
     * AFFORDANCE, not separation — this was briefly mis-classified as the latter and
     * stripped along with flat/raised/overlay, which was wrong twice over. The whole
     * card is one click target, and a target's boundary is the thing that says so;
     * that is the same argument `button/secondary` wins, and the reason both are
     * `affordance` while a `flat` card is not.
     *
     * The second error was worse and the written guidance is what caught it. In light
     * mode `fill/elevated-hover` and `surface/primary` are byte-identical — both
     * #F7F5F4, 1.000:1 — so the background genuinely does not move on hover, and the
     * state is carried by exactly three things: the border step, the shadow step, and
     * the 2px lift. Removing the border left two, on the one variant whose entire
     * purpose is being obviously clickable. Dark was never affected; it moves
     * #151312 → #2E2C2B at 1.333:1 and would have hidden the regression.
     *
     * `selected` still overrides to `border/selected`, because selection has to be
     * unmistakable against hover and both change the fill. */
    interactive: {
      intent: 'The whole card is one target. Renders as a button or a link.',
      borderJob: 'affordance',
      base: {
        bg: 'surface-primary',
        fg: 'content-primary',
        border: 'border-primary',
        shadow: 'x-small',
      },
      hover: { bg: 'fill-elevated-hover', border: 'border-primary-hover', shadow: 'medium' },
      active: { bg: 'fill-elevated-active' },
      selected: { border: 'border-selected', bg: 'fill-selected' },
      focus: 'outline',
    },
  };

  /** The lift, per variant.
   *
   *  A method rather than part of `shape`, because shape is shared across variants
   *  and only `interactive` should move — a static card that rose on hover would be
   *  claiming to be a target it is not, which is worse than not moving at all.
   *  Follows the same pattern as tableRecipe.cellClasses and
   *  skeletonRecipe.geometryFor: the recipe keeps the decision, the component just
   *  renders it.
   *
   *  The distance multiplies by --oz-motion-spatial-scale, so this is 2px normally
   *  and 0px for anyone who asked for reduced motion — while the shadow change on
   *  the same hover keeps running, which is the whole argument for the graded tier
   *  over a blanket kill. Written as an arbitrary value rather than a Tailwind step
   *  because the calc() has to reach the custom property. */
  liftFor(variant: CardVariant): string {
    return variant === 'interactive'
      ? 'hover:translate-y-[calc(-2px*var(--oz-motion-spatial-scale))]'
      : '';
  }

  protected sampleChildren(): string {
    return '…';
  }
}

export const cardRecipe = new CardRecipe();
