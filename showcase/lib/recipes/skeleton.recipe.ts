import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type SkeletonVariant = 'line' | 'block' | 'circle';
export type SkeletonSize = 'md';

class SkeletonRecipe extends ComponentRecipe<SkeletonVariant, SkeletonSize> {
  readonly meta: RecipeMeta = {
    id: 'skeleton',
    title: 'Skeleton',
    tag: 'Skeleton',
    blurb: 'Loading, shaped like the thing that is loading. Never a spinner in a layout slot.',
    notes: [
      'fill/tertiary, one step up the ladder from the card it sits on. Using surface/tertiary instead would make the skeleton the same colour as a muted section and read as content rather than absence.',
      'The pulse runs at duration/ambient (1500ms) with ease/standard. Anything faster reads as an error state; anything with more than one moving property reads as decoration.',
      'globals.css collapses all animation under prefers-reduced-motion, so this holds a flat tone for anyone who asked for that. The skeleton still communicates — the shape was doing the work, not the pulse.',
      'aria-hidden with a live region elsewhere. A screen reader should hear "loading four clips", not eleven unlabelled boxes.',
    ],
  };

  readonly variants = ['line', 'block', 'circle'] as const;
  readonly sizes = ['md'] as const;

  readonly motion: MotionSpec = {
    /* Declared even though nothing here transitions, because the field is required
     * and "this component does not transition" is an answer worth having on the
     * record rather than an omission to be inferred. */
    transition: 'effects-default',
    properties: 'none',
    enter: 'fade',
    ambient: true,
    intent:
      'The only ambient loop in the system, and the only animation with no target to settle toward — which is why it is not a spring. It runs on duration/ambient with a symmetric curve. Now uses the token layer\'s .oz-ambient class rather than a keyframe defined locally in tailwind.config.js, which matters because .oz-ambient is the marker the reduced-motion block switches off: the local version kept pulsing for anyone who had asked it not to.',
  };

  protected readonly shape = 'oz-ambient';

  protected readonly sizeClasses: Record<SkeletonSize, string> = { md: '' };

  protected readonly bindings: Record<SkeletonVariant, VariantBinding> = {
    line: {
      intent: 'A line of text that has not arrived. Width implies the content length.',
      base: { bg: 'fill-tertiary' },
      focus: 'none',
    },
    block: {
      intent: 'A thumbnail, chart or media slot. Matches the real aspect ratio.',
      base: { bg: 'fill-tertiary' },
      focus: 'none',
    },
    circle: {
      intent: 'An avatar. Same token, different geometry.',
      base: { bg: 'fill-tertiary' },
      focus: 'none',
    },
  };

  /** Geometry per variant. Not a token concern — these are shapes, not values. */
  geometryFor(variant: SkeletonVariant): string {
    const geo: Record<SkeletonVariant, string> = {
      line: 'h-space-4 rounded-2',
      block: 'aspect-video w-full rounded-4',
      circle: 'aspect-square w-space-11 rounded-full',
    };
    return geo[variant];
  }

  protected sampleChildren(): string {
    return '';
  }
}

export const skeletonRecipe = new SkeletonRecipe();
