import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type SliderVariant = 'track';
export type SliderSize = 'md' | 'lg';

class SliderRecipe extends ComponentRecipe<SliderVariant, SliderSize> {
  readonly meta: RecipeMeta = {
    id: 'slider',
    group: 'forms',
    title: 'Slider',
    tag: 'Slider',
    blurb:
      'A value on a continuous range where the approximate position matters more than the exact number. If the user knows the number they want, they want an input.',
    notes: [
      'It is a div with role="slider", not a styled <input type="range">. The native control cannot have its filled portion or its thumb painted from tokens without vendor pseudo-elements — ::-webkit-slider-thumb and ::-moz-range-thumb — which are two selectors this repo would have to hand-write outside the token layer and which cannot be measured by verify-classes. The cost is that the keyboard, the drag and every aria-value* attribute are implemented here rather than inherited.',
      'The track is the only thing on the variant axis, so the sweep measures it. The filled range and the thumb are helper methods, and neither is text: WCAG 1.4.11 asks 3:1 of a non-text UI component rather than 4.5:1, and that is a different assertion from the one verify-contrast makes. They are not silently exempt — they are a gap, and the honest place to close it is a non-text contrast sweep this repo does not yet have.',
      'The thumb is white with a brand border rather than a solid brand disc. A solid brand thumb vanishes into the filled range it sits at the end of — the two are the same colour, so at any value above zero the thumb has no edge on its left side. The ring is what separates it from its own track.',
      'PageUp and PageDown move ten steps, not one. A 0–100 slider at step 1 needs a hundred key presses to cross, and a keyboard user who cannot cross a control in a reasonable number of presses does not use it. Home and End go to the ends.',
      'The thumb does NOT transition its position. A slider being dragged has to track the pointer exactly, and a transition on `left` puts the thumb behind the finger — which reads as lag in the product rather than as easing. Only its colour and its ring animate.',
      'aria-valuetext is set whenever the number is not self-explanatory. "40" on a duration slider is announced as forty; "40 seconds" is the same information in a form somebody can act on, and the raw number is what a screen reader gets without it.',
      'The whole row is 44px tall even though the track is 4px. The track is the thing you see and the row is the thing you hit — the same split Switch makes, and for the same reason: a 4px pointer target is not a target.',
    ],
  };

  readonly variants = ['track'] as const;
  readonly sizes = ['md', 'lg'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    enter: 'none',
    intent:
      'Colour only, on the fastest effects spring, and nothing at all on the thumb\'s position. This is the clearest case in the system for motion being deliberately absent from the thing that moves: the thumb is being dragged, so any easing on its position puts it behind the pointer, and the user reads that as the product lagging rather than as an animation. Rule 1b would also make it wrong twice over — a spatial spring on a dragged element would overshoot past the finger.',
  };

  protected readonly shape = 'relative w-full rounded-full';

  protected readonly sizeClasses: Record<SliderSize, string> = {
    md: 'h-space-1',
    lg: 'h-space-2',
  };

  protected readonly bindings: Record<SliderVariant, VariantBinding> = {
    track: {
      intent: 'The unfilled remainder of the range. Neutral — it is not an error to be low.',
      base: { bg: 'fill-tertiary' },
      hover: { bg: 'fill-tertiary-hover' },
      disabled: { bg: 'fill-tertiary-disabled' },
      /* The ring goes on the THUMB, not on the track — a 4px-tall outline around a
       * full-width bar is not a focus indicator anyone can find. See thumbClasses. */
      focus: 'none',
    },
  };

  /** The filled portion, from the minimum to the current value. */
  rangeClasses(disabled: boolean): string {
    return [
      'absolute inset-y-0 left-0 rounded-full',
      disabled ? 'bg-fill-brand-disabled' : 'bg-fill-brand',
    ].join(' ');
  }

  /** The handle. `-translate-x-1/2` centres it on its value — a centring transform, not
   *  travel, so it is not routed through the reduced-motion multiplier and needs no
   *  STATE_TRANSFORMS entry (verify-motion matches bracketed arbitrary values only). */
  thumbClasses(size: SliderSize, disabled: boolean): string {
    return [
      'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2',
      size === 'lg' ? 'size-space-6' : 'size-space-5',
      'bg-surface-elevated shadow-small',
      disabled ? 'border-border-primary-disabled' : 'border-border-brand',
      /* Colour only. Position is set inline from the value and must not ease — see the
       * note on `motion`. */
      'transition-colors duration-effects-fast ease-effects-fast',
      /* The focus ring lives here because this is the part with a findable size. It is the
       * outward ring: the thumb sits on the page beside the track, not on a saturated
       * fill. */
      'focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus',
      disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing',
    ].join(' ');
  }

  /** The hit area. 44px regardless of how thin the track is — see the notes. */
  rowClasses(): string {
    return 'relative flex min-h-target w-full items-center';
  }

  /** The live value, shown beside the label. */
  readoutClasses(): string {
    return 'text-label-md font-medium tabular-nums text-content-primary';
  }

  labelFor(): string {
    return 'Clip length';
  }

  protected sampleChildren(): string {
    return '';
  }
}

export const sliderRecipe = new SliderRecipe();
