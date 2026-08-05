import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type SwitchVariant = 'off' | 'on';
export type SwitchSize = 'md' | 'lg';

class SwitchRecipe extends ComponentRecipe<SwitchVariant, SwitchSize> {
  readonly meta: RecipeMeta = {
    id: 'switch',
    group: 'forms',
    title: 'Switch',
    tag: 'Switch',
    blurb: 'Takes effect immediately. If it needs a Save button next to it, use a checkbox.',
    notes: [
      'on and off are variants rather than states, because "on" is not something the user is doing to the control — it is what the control says. hover, disabled and focus are the states, and both variants bind all three.',
      'Both variants use the outward focus ring even though the on track is a saturated fill. The inset ring is for a ring drawn *on* a fill; this one is drawn on the page beside a 44×20 track, where border/focus measures 5.90:1 against the page in light and 7.76:1 in dark, and the inverse ring — which is the page colour — would be invisible. This note carried 4.63:1 until it was recomputed: that figure was fill/brand against surface/elevated at its pre-B18 value of #211F1D, a number that stopped being true when the dark ladder moved and was never about border/focus in the first place.',
      'The thumb is content/fixed-inverse — white in both modes, not content/on-brand. It sits on brand orange when on and on neutral grey when off, and only the fixed token is correct on both.',
      'The whole row is the label, so the 44px touch target is the label, not the track — which is 20px tall at md and 24px at lg, and never meets it alone.',
      'Two sizes, 36x20 and 44x24, both from the Figma set. The track was 44x20 before, which was neither: it had lg\'s width and md\'s height, so the thumb had 24px of travel inside a 20px tube and the control read as a slot rather than a switch.',
    ],
  };

  readonly variants = ['off', 'on'] as const;
  readonly sizes = ['md', 'lg'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    enter: 'none',
    intent:
      'The track changes colour on the fast effects spring; the thumb travels on spatial-fast, declared on the thumb itself below. This is the component the spatial family exists for — a switch thumb that eases to a stop reads as a graphic changing, and one that arrives with a slight overshoot reads as a physical toggle that has been thrown. The travel is ~20px, which is why spatial-fast has the lowest bounce in the family: the same overshoot fraction over 20px is a nudge and over 200px is a flourish.',
  };

  protected readonly shape =
    'relative inline-flex shrink-0 items-center rounded-full border-2 border-transparent ' +
    'disabled:cursor-not-allowed';

  /* Track geometry only. The thumb is a child element the recipe's className never
   * reaches, so its size and travel live in `thumbClasses` below — and the two have
   * to agree, which is what `THUMB` encodes. */
  protected readonly sizeClasses: Record<SwitchSize, string> = {
    md: 'h-space-6 w-space-10',
    lg: 'h-space-7 w-[44px]',
  };

  protected readonly bindings: Record<SwitchVariant, VariantBinding> = {
    off: {
      intent: 'The setting is not applied. Neutral, not an error.',
      base: { bg: 'fill-tertiary' },
      hover: { bg: 'fill-tertiary-hover' },
      disabled: { bg: 'fill-tertiary-disabled' },
      focus: 'outline',
    },
    on: {
      intent: 'The setting is applied, right now, without confirmation.',
      base: { bg: 'fill-brand' },
      hover: { bg: 'fill-brand-hover' },
      disabled: { bg: 'fill-brand-disabled' },
      focus: 'outline',
    },
  };

  /* Thumb size and travel per track size. Written as one table so the two numbers
   * that have to agree with `sizeClasses` sit next to each other:
   *
   *   md   track 36 wide, thumb 16, 2px inset  ->  on = 36 - 16 - 2 = 18
   *   lg   track 44 wide, thumb 20, 2px inset  ->  on = 44 - 20 - 2 = 22
   *
   * The `on` offsets are literal arbitrary values and must stay that way: they are
   * listed in STATE_TRANSFORMS in scripts/verify-motion.ts because thumb position IS
   * the on/off state, and routing them through --oz-motion-spatial-scale would make
   * both states identical for a reduced-motion user. Adding a size means adding its
   * offset to that list; the sweep fails on an unlisted literal AND on a listed one
   * that no longer matches, so neither half can rot. */
  private readonly thumb: Record<SwitchSize, { size: string; on: string; off: string }> = {
    md: { size: 'size-space-5', on: 'translate-x-[18px]', off: 'translate-x-[2px]' },
    lg: { size: 'size-space-6', on: 'translate-x-[22px]', off: 'translate-x-[2px]' },
  };

  /** The moving part. Position is geometry, colour is a token. */
  thumbClasses(variant: SwitchVariant, size: SwitchSize = 'md'): string {
    const t = this.thumb[size];
    return [
      'pointer-events-none block rounded-full bg-content-fixed-inverse',
      t.size,
      /* The thumb is the only child element in the system carrying its own spring,
       * and it is spatial because it is the only thing here that actually travels.
       * duration-spatial-fast / ease-spatial-fast are the same token pair the recipe
       * would compile — named explicitly because this is a nested element the
       * recipe's own className never reaches. */
      'shadow-x-small transition-transform duration-spatial-fast ease-spatial-fast',
      variant === 'on' ? t.on : t.off,
    ].join(' ');
  }

  labelFor(variant: SwitchVariant): string {
    return variant === 'on' ? 'Upscale to 4K on export' : 'Email me when a render finishes';
  }

  protected sampleChildren(): string {
    return '';
  }
}

export const switchRecipe = new SwitchRecipe();
