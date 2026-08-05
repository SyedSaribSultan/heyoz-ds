import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type ProgressVariant = 'brand' | 'success' | 'critical';
export type ProgressSize = 'sm' | 'md';

class ProgressRecipe extends ComponentRecipe<ProgressVariant, ProgressSize> {
  readonly meta: RecipeMeta = {
    id: 'progress',
    title: 'Progress',
    tag: 'Progress',
    blurb:
      'How much of a known amount of work is done. If the amount is not known, it is indeterminate — and an indeterminate bar that pretends to advance is worse than a spinner.',
    notes: [
      'Determinate and indeterminate are the same component with `value` present or absent, not two components. The distinction is whether the total is knowable, and a caller who has to choose between two components will pick the one that looks busier — which is how a fake 90% bar ends up in front of an upload nobody is measuring.',
      'Indeterminate is a PULSING full-width track, not a bar travelling across it, and that is a constraint rather than a preference. A traverse needs a keyframe that translates, and the token layer ships exactly five — four entrances and `oz-pulse` — so a traversing bar would mean hand-writing a keyframe in the app layer. CLAUDE.md is explicit that a keyframe defined in the app layer is a keyframe defined outside the thing that knows when not to run: the reduced-motion block switches off `.oz-ambient` and anything driving `--oz-duration-ambient`, and a bespoke animation would sail past both. A pulse says "working" as clearly as a sweep and costs nothing that has to be argued for later.',
      'It deliberately does NOT loop a fill from 0 to 100. A repeating fill reads as "nearly done" over and over, and a user who watches it complete four times concludes the product is stuck. The pulse makes no claim about how far along anything is, which is the honest position when the total is unknown.',
      'Under reduced motion the pulse stops and leaves a FILLED track at rest, not an empty one — an empty progress bar is indistinguishable from a broken one. That falls out of using `.oz-ambient`: it animates opacity from 1 down and back, so removing the animation leaves opacity 1, which is the filled state. Reaching for a keyframe that animated width or position would have left it at whatever the 0% frame declared, and getting that right would have been this file\'s problem instead of the token layer\'s.',
      'The fill transitions its width on the effects family, not spatial. Width is a size and rule 1b puts sizes on spatial springs — but a progress bar is the exception, and the reason is that overshoot on a width means the fill visibly exceeds the value it is reporting. A bar that springs past 100% and settles back has, for two frames, told the user something untrue.',
      'value is clamped and the LABEL is the clamp, not the bar. Passing 140 of 100 renders a full bar and announces 100 — silently, because a caller who has miscounted needs the bar to stay inside its track more than they need to be told. What is not silent is the console warning in development.',
      'critical is for a determinate process that has failed part-way — an upload that stopped at 60%. It keeps the 60% rather than emptying, because where it stopped is the only useful thing left to say about it.',
      'role="progressbar" with aria-valuenow, and the value is NOT announced on every frame. A live region here would read a number on every one of a hundred updates, which is the most hostile thing a progress bar can do to a screen reader — the accessible name says what is happening and the value is available on demand.',
    ],
  };

  readonly variants = ['brand', 'success', 'critical'] as const;
  readonly sizes = ['sm', 'md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-default',
    properties: 'colors',
    enter: 'none',
    /* ambient: the indeterminate sweep is a decorative loop, and this is the flag that puts
     * it under the token layer's reduced-motion switch alongside Skeleton's shimmer. */
    ambient: true,
    intent:
      'The fill moves its width on the DEFAULT effects spring, and the family choice is a deliberate exception to rule 1b. A width is a size and sizes belong on spatial springs — but a spatial spring overshoots, and a progress fill that springs past its value has told the user the work is further along than it is. So it takes the curve that cannot overshoot, at the default tier rather than the fast one: 240ms, because a bar that snaps between values reads as jumping while one that eases reads as filling.',
  };

  protected readonly shape = 'relative w-full overflow-hidden rounded-full';

  protected readonly sizeClasses: Record<ProgressSize, string> = {
    sm: 'h-space-1',
    md: 'h-space-2',
  };

  protected readonly bindings: Record<ProgressVariant, VariantBinding> = {
    /* The TRACK is what the recipe paints. The fill is a child and takes `fillClasses`,
     * because a track and its fill are two boxes and one binding cannot hold both. */
    brand: {
      intent: 'Work in progress. The default and almost always the right one.',
      base: { bg: 'fill-tertiary' },
      disabled: { bg: 'fill-tertiary-disabled' },
      focus: 'none',
    },
    success: {
      intent: 'Finished. Worth colouring only where the completion is itself the news.',
      base: { bg: 'fill-tertiary' },
      disabled: { bg: 'fill-tertiary-disabled' },
      focus: 'none',
    },
    critical: {
      intent: 'Stopped part-way. Keeps its value — where it failed is the useful part.',
      base: { bg: 'fill-tertiary' },
      disabled: { bg: 'fill-tertiary-disabled' },
      focus: 'none',
    },
  };

  /** The filled portion. Colour by variant; width is set inline from the value. */
  fillClasses(variant: ProgressVariant, disabled = false): string {
    const byVariant: Record<ProgressVariant, string> = {
      brand: 'bg-fill-brand',
      success: 'bg-fill-success',
      critical: 'bg-fill-critical',
    };
    return [
      'h-full rounded-full',
      disabled ? 'bg-fill-brand-disabled' : byVariant[variant],
      /* Width on the effects curve — see `motion` for why not spatial. */
      'transition-[width] duration-effects-default ease-effects-default',
    ].join(' ');
  }

  /**
   * The indeterminate fill: a full-width band that pulses.
   *
   * `.oz-ambient` is the token layer's own decorative-loop hook — `oz-pulse`, opacity 1 to
   * 0.45 and back — and the reduced-motion block already switches it off along with anything
   * driving `--oz-duration-ambient`. So this file needs to know nothing about the media
   * query, which is the entire reason to use the shipped class instead of a bespoke keyframe.
   *
   * Full width rather than a 40% segment, because with a pulse there is nothing to travel:
   * a stationary 40% band that fades in and out reads as a bar that has stopped at 40%,
   * which is a claim about progress that nobody is entitled to make here.
   */
  indeterminateClasses(variant: ProgressVariant): string {
    const byVariant: Record<ProgressVariant, string> = {
      brand: 'bg-fill-brand',
      success: 'bg-fill-success',
      critical: 'bg-fill-critical',
    };
    return ['oz-ambient absolute inset-0 rounded-full', byVariant[variant]].join(' ');
  }

  /** The value readout beside the label. */
  readoutClasses(): string {
    return 'text-label-md font-medium tabular-nums text-content-secondary';
  }

  protected sampleChildren(): string {
    return '';
  }
}

export const progressRecipe = new ProgressRecipe();
