import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type StepperVariant = 'upcoming' | 'current' | 'complete' | 'failed';
export type StepperSize = 'md';

class StepperRecipe extends ComponentRecipe<StepperVariant, StepperSize> {
  readonly meta: RecipeMeta = {
    id: 'stepper',
    group: 'navigation',
    title: 'Stepper',
    tag: 'Stepper',
    blurb:
      'Where the user is in a sequence with a known number of steps. If the number is not known, or the steps can be done in any order, it is lying about both — that is a checklist.',
    notes: [
      'Four states and `failed` is the one usually missing. A step that errored is not upcoming and not complete, and without a state for it the stepper either shows a tick over a step that did not work or leaves the user on a "current" step with no indication anything went wrong. Any sequence with a network call in it needs this.',
      'complete shows a TICK, not the numeral. Keeping the number means the only difference between done and not-done is a fill colour, which fails for anyone not distinguishing it — and the tick is what makes the state survive greyscale, which is the same argument Badge\'s icon prop wins.',
      'The current step is announced with aria-current="step", and the whole thing is an <ol>. Position in a sequence is the entire content of this component, and "list, 4 items, item 2 of 4, current step" is a screen reader saying exactly that. A row of divs says none of it.',
      'Completed steps are links ONLY when going back is genuinely possible; upcoming ones never are. A stepper whose future steps are clickable is a stepper in a flow that has no order, which is the case where it is the wrong component. Whether a completed step is reachable is a prop because only the flow knows — an upload cannot be un-uploaded.',
      'The connector between steps is a background on a thin box, not a border, for the reason Separator and Menu both give: a line between items is `separation`, which rule 1c makes a build error, and a filled box needs no exemption in verify:borders. It is coloured by the state of the step BEFORE it, so the completed run reads as one continuous path rather than as dots with gaps.',
      'The numeral is `tabular-nums`. Step 1 through step 10 in a proportional font shifts every label by the width difference between a 1 and a 0, which makes a vertical stepper\'s text edge visibly ragged — the same problem B20 fixed in the /ai-ugc how-it-works numerals, and the same fix.',
      'It does not animate between steps. A progress line that fills from step to step is the obvious flourish and it needs a measured width, so it is a layout read that is wrong for a frame whenever labels reflow — the same trade SegmentedControl declines for its sliding indicator. The state changes and the colour transitions.',
    ],
  };

  readonly variants = ['upcoming', 'current', 'complete', 'failed'] as const;
  readonly sizes = ['md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-default',
    properties: 'colors',
    enter: 'none',
    intent:
      'Colour on the default effects spring rather than the fast one, and nothing else. A step changing state is not a hover — it happens because work finished, the user is not waiting on the pointer, and 240ms reads as a state settling where 120ms reads as a flicker. No travel and no filling line: a connector that animates its width needs a measured layout and is wrong for a frame every time the labels reflow.',
  };

  protected readonly shape =
    'grid size-space-9 shrink-0 place-items-center rounded-full border-2 ' +
    'font-label text-label-sm font-semibold tabular-nums';

  protected readonly sizeClasses: Record<StepperSize, string> = { md: '' };

  protected readonly bindings: Record<StepperVariant, VariantBinding> = {
    upcoming: {
      borderJob: 'affordance',
      /* The boundary is the marker — with no border an upcoming step is an unpainted gap in
       * the sequence, indistinguishable from a missing step. */
      intent: 'Not reached. The boundary is what says a step exists here at all.',
      base: { bg: 'transparent', fg: 'content-secondary', border: 'border-secondary' },
      focus: 'none',
    },
    current: {
      borderJob: 'state',
      /* The second `state` border in the system, alongside chip/selected. Here the stroke is
       * not the affordance — every marker is a circle either way — it is what says THIS is
       * where you are, which is precisely what `state` means. */
      intent: 'Where the user is now. The border is the state, not the affordance.',
      base: { bg: 'fill-brand-secondary', fg: 'content-brand-active', border: 'border-brand' },
      focus: 'none',
    },
    complete: {
      borderJob: 'affordance',
      intent: 'Done. Shows a tick rather than its numeral — see the notes.',
      base: { bg: 'fill-brand', fg: 'content-on-brand', border: 'border-brand' },
      focus: 'none',
    },
    failed: {
      borderJob: 'affordance',
      intent: 'Errored. The state most steppers are missing, and the one a retry needs.',
      base: { bg: 'fill-critical', fg: 'content-on-critical', border: 'border-critical' },
      focus: 'none',
    },
  };

  /** The label beside the marker. `current` is the only one in full strength — the emphasis
   *  runs toward where the user is, not toward where they have been. */
  labelClasses(variant: StepperVariant): string {
    const byVariant: Record<StepperVariant, string> = {
      upcoming: 'text-content-tertiary',
      current: 'text-content-primary font-medium',
      complete: 'text-content-secondary',
      failed: 'text-content-critical-hover font-medium',
    };
    return `text-body-sm ${byVariant[variant]}`;
  }

  /** The connector. Coloured by the state of the step BEFORE it, so a completed run is one
   *  continuous path. A background on a thin box, not a border — see the notes. */
  connectorClasses(previous: StepperVariant, orientation: 'horizontal' | 'vertical'): string {
    const done = previous === 'complete';
    return [
      orientation === 'horizontal' ? 'h-px min-w-space-6 flex-1' : 'w-px flex-1 min-h-space-6',
      done ? 'bg-border-brand' : 'bg-border-secondary',
      'transition-colors duration-effects-default ease-effects-default',
    ].join(' ');
  }

  /** A completed step that can be returned to. The marker itself stays the same paint; this is
   *  the focus ring and the pointer affordance around it. */
  interactiveClasses(): string {
    return [
      'rounded-full',
      'focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus',
      'hover:opacity-80 transition-opacity duration-effects-fast ease-effects-fast',
    ].join(' ');
  }

  protected sampleChildren(variant: StepperVariant): string {
    const copy: Record<StepperVariant, string> = {
      upcoming: 'Publish',
      current: 'Pick a creator',
      complete: 'Upload product',
      failed: 'Generate script',
    };
    return copy[variant];
  }
}

export const stepperRecipe = new StepperRecipe();
