import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type SegmentedVariant = 'segment';
export type SegmentedSize = 'sm' | 'md';

class SegmentedRecipe extends ComponentRecipe<SegmentedVariant, SegmentedSize> {
  readonly meta: RecipeMeta = {
    id: 'segmented',
    title: 'Segmented control',
    tag: 'SegmentedControl',
    blurb:
      'Two to four mutually exclusive options, all visible, changing a value rather than a view. If it swaps the content below it, that is Tabs — and if the options have descriptions, it is a RadioGroup.',
    notes: [
      'Three components do "pick one of these" and the differences are structural rather than stylistic. TABS swap the panel below them and take role="tablist", so the selected tab OWNS the content and a screen reader is told which region it controls. SEGMENTED sets a value that something else reads — a sort order, a unit, a density — and takes role="radiogroup", because that is what it is. RADIOGROUP is the same semantics with room for a description per option and no width limit. Using tabs to set a value announces a relationship to a panel that does not exist.',
      'Two to four options, and past that it should be a Select. Every segment shares the width, so a fifth option means five labels in the space of four — and the first thing to go is the longest label, which is usually the one that needed the words.',
      'The selected segment is a raised surface inside a recessed track, which is the whole visual idea: the track is `surface/secondary` and the segment is `surface/elevated` with a shadow, so the chosen one reads as sitting on top rather than as being coloured in. That is why it is not `fill/brand` — a brand-filled segment in a row of four is the loudest element on most screens, and this control is furniture.',
      'It uses useRovingFocus with selection following focus, exactly like RadioGroup, because it IS a radio group. One tab stop for the whole control, arrows move and commit, and the arrows wrap. It differs from RadioGroup only in layout and in having no per-option description.',
      'No border on the segments and none on the track. The recessed track is a surface step and the raised segment is a shadow — separation and elevation respectively, both build errors as borders under rule 1c, and both already solved by the two things this control is made of.',
      'The moving segment is a background on the button itself, not a sliding indicator element. A single indicator that animates between positions is the prettier implementation and it needs an absolutely-positioned element whose left and width are measured from the DOM — which is a layout read on every render, and which is wrong for one frame whenever the labels reflow. The paint moves instantly and the colour transitions; nothing translates.',
    ],
  };

  readonly variants = ['segment'] as const;
  readonly sizes = ['sm', 'md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    enter: 'none',
    intent:
      'Colour and shadow on the fastest effects spring, and deliberately no travel. A sliding indicator is the obvious flourish here and it was declined: it needs an absolutely-positioned element measured from the DOM, so it is a layout read on every render and it is visibly wrong for a frame whenever the labels reflow. The selected segment simply becomes the raised one, which is instantaneous and correct at every width.',
  };

  protected readonly shape =
    'relative inline-flex flex-1 items-center justify-center gap-space-2 rounded-5 ' +
    'font-label font-medium whitespace-nowrap ' +
    'disabled:cursor-not-allowed';

  protected readonly sizeClasses: Record<SegmentedSize, string> = {
    sm: 'h-space-9 px-space-4 text-label-sm',
    md: 'h-space-10 px-space-5 text-label-md',
  };

  protected readonly bindings: Record<SegmentedVariant, VariantBinding> = {
    segment: {
      /* Transparent at rest so the recessed track shows through; the SELECTED state is where
       * the raised surface and its shadow arrive. */
      intent: 'One option. Selected is a raised surface, never a brand fill — see the notes.',
      base: { bg: 'transparent', fg: 'content-secondary' },
      hover: { fg: 'content-primary' },
      selected: { bg: 'surface-elevated', fg: 'content-primary', shadow: 'x-small' },
      disabled: { fg: 'content-primary-disabled' },
      focus: 'outline',
    },
  };

  /** The recessed track the segments sit in. A surface step plus padding — no border, because
   *  the step IS the boundary and a stroke there would be `separation`. */
  trackClasses(size: SegmentedSize): string {
    return [
      'inline-flex w-full items-center rounded-6 bg-surface-secondary',
      size === 'sm' ? 'gap-space-1 p-space-1' : 'gap-space-1 p-space-1',
    ].join(' ');
  }

  protected sampleChildren(): string {
    return 'Monthly';
  }
}

export const segmentedRecipe = new SegmentedRecipe();
