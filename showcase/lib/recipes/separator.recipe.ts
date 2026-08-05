import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type SeparatorVariant = 'rule';
export type SeparatorSize = 'md';

class SeparatorRecipe extends ComponentRecipe<SeparatorVariant, SeparatorSize> {
  readonly meta: RecipeMeta = {
    id: 'separator',
    group: 'containers',
    title: 'Separator',
    tag: 'Separator',
    blurb:
      'A line between two groups of content, for the rare case where space cannot do it. Rule 1c makes separation a build error for a BORDER; this is the deliberate exception, drawn as a filled box and argued for per use.',
    notes: [
      'It exists in tension with rule 1c and the tension is the point. That rule bans `separation` as a border JOB — a card outlined against a page it already differs from, a row outlined against the next row — because a surface step or plain space does the job without a line. It does not claim a line is never right. What it bans is a line added by reflex, one variant at a time, with nobody able to argue against any single instance. A named component you have to reach for deliberately is the opposite of that.',
      'Drawn as a 1px filled box, not a border, and not because of a loophole. `verify:borders` sweeps recipe BINDINGS for a stroke with no declared job; a separator drawn as a border would have to be declared `separation`, which is a build error, so it would need an exemption written into the gate. An exemption is a hole in a check that protects twenty-five other components. A background on a 1px box needs no exemption because it is not a border — it is a rectangle that happens to be thin, which is also a more honest description of what a rule is.',
      'border/secondary is the token, at 1px rather than the 2px every real border in this system uses. A separator is not an affordance and must not read as one: at 2px in `border/primary` it looks like the edge of a container, and the reader starts hunting for the box it belongs to.',
      'Horizontal takes role="separator"; VERTICAL takes aria-hidden instead. A vertical rule between two inline items — a byline, a breadcrumb, a toolbar group — is almost always decorative punctuation, and announcing "separator" between every pair of items is noise a sighted reader does not get. Where a vertical rule genuinely divides two landmarks, the landmarks carry that meaning themselves.',
      'A separator with a label is not in this component and that is deliberate. "OR" between two sign-in options is a real pattern, and it is a layout with a word in it rather than a line — building it in here would mean this component owned typography, alignment and a background colour to punch the gap, none of which a rule has any business knowing about.',
    ],
  };

  readonly variants = ['rule'] as const;
  readonly sizes = ['md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'none',
    enter: 'none',
    intent:
      'None, and it is the only component in the system that declares `properties: none` alongside Skeleton. A rule has no states — nothing hovers it, nothing focuses it, and it never changes — so a transition here would be a declaration with nothing to animate. Stating that explicitly is what the required `motion` field is for: the absence is a decision rather than an omission.',
  };

  protected readonly shape = 'shrink-0';

  protected readonly sizeClasses: Record<SeparatorSize, string> = { md: '' };

  protected readonly bindings: Record<SeparatorVariant, VariantBinding> = {
    rule: {
      /* No borderJob, because there is no border. The bg IS the line. */
      intent: 'The only kind. Reach for it when space has genuinely failed, not before.',
      base: { bg: 'border-secondary' },
      focus: 'none',
    },
  };

  /** Geometry per orientation. 1px on the cross axis, full on the main one — and
   *  `self-stretch` on the vertical case so it matches the height of whatever it sits
   *  between rather than needing one declared. */
  orientationClasses(orientation: 'horizontal' | 'vertical'): string {
    return orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch min-h-space-5';
  }

  protected sampleChildren(): string {
    return '';
  }
}

export const separatorRecipe = new SeparatorRecipe();
