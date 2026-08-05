import { ComponentRecipe, type ClassArgs, type RecipeMeta } from '../core/Recipe';
import { cx } from '../core/cx';
import type { MotionSpec, VariantBinding } from '../core/types';

/* The three pieces of text a field owns.
 *
 * These are on the VARIANT axis rather than being three helper methods, and the reason
 * is the contrast sweep. `verify-contrast.ts` measures `recipe.bindings` — so a colour
 * that lives in a helper method is a colour no gate can see. Switch's thumb is exactly
 * that: `content/fixed-inverse` on `fill/brand` is chosen correctly and measured
 * nowhere, because `thumbClasses()` is a method and the sweep reads the table.
 *
 * Three text roles with three different tokens, three different jobs and three
 * different disabled treatments are a legitimate variant axis, not an abuse of one.
 * The result is that all three appear in the binding table, in the state matrix, and in
 * the sweep. */
export type FieldTextRole = 'label' | 'hint' | 'error';

/** Matches the control ramp it labels: sm beside a 36px control, md beside 40px, lg
 *  beside 48px. */
export type FieldSize = 'sm' | 'md' | 'lg';

class FieldRecipe extends ComponentRecipe<FieldTextRole, FieldSize> {
  readonly meta: RecipeMeta = {
    id: 'field',
    group: 'forms',
    title: 'Field',
    tag: 'Field',
    blurb:
      'The label, hint and error around a control, and the aria wiring that connects them. Every other form component in this system is built on it rather than repeating it.',
    notes: [
      'It is a render-prop rather than a wrapper. `children` is called with the id, the composed aria-describedby, aria-invalid and aria-required, so the control cannot be rendered without receiving them — a wrapper that merely contains its input can be nested wrongly and still look correct, and the failure is silent to everyone except a screen-reader user.',
      'The error does NOT replace the hint. Both render, error first. Removing the format instruction at the moment the user has failed to satisfy it is backwards: "must include a domain" is most useful on the render where "that is not an email" appears. aria-describedby lists the error first so it is announced first.',
      'error is content/critical-hover, not content/critical, and the odd-looking name is the whole point of the note. content/critical measures 3.91:1 on surface/elevated and surface/overlay in dark — under the 4.5 floor — and those two surfaces are Dialog and Card/overlay, which is where forms actually live. The -hover step is the next rung and clears every surface in the ladder: 5.11:1 at its worst, in both modes. Same trade button/tonal makes for its active label, for the same reason and with the same awkward name.',
      'A field message is text on a surface the field does not paint, so no fg/bg pair can express it — the sweep skips any binding with no bg (verify-contrast.ts) and would measure `transparent` against the page, which is the one surface that was never in doubt. The tokens here were instead chosen by measuring all three against all six rungs of the surface ladder in both modes and taking the worst case: label 6.54:1, hint 4.70:1, error 5.11:1. Anything added here must be checked the same way, because no gate will do it for you.',
      'The label carries no colour change when the variant is invalid. A red label above a red border above a red message is one fact stated three times, and the label is the one of the three that still has to be read as a name rather than as an alarm.',
      'The required asterisk is aria-hidden. aria-required already announces the constraint; without the hidden attribute a screen reader reads "Prompt star required". Marking OPTIONAL fields instead is the better pattern whenever most fields in a form are required, which is why `optional` exists beside `required` rather than as a negation of it.',
      'as="group" swaps <label for> for <fieldset><legend>. A radio group has no single control to point a label at, so a <label for> on it either points at the first radio — which makes the group name read as that option\'s name — or points at nothing. This is the one structural difference between labelling a control and labelling a set of them, and it is why the prop exists rather than a second component.',
      'labelHidden renders the label to the accessibility tree only. It is there so that "this field has no visible label" never has to be expressed as aria-label: a search input in a toolbar has a real label that is simply not painted, and a hidden <label> keeps the click-to-focus behaviour that aria-label throws away.',
    ],
  };

  readonly variants = ['label', 'hint', 'error'] as const;
  readonly sizes = ['sm', 'md', 'lg'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    /* Applied by the component to the MESSAGE only, never to the label. An error
     * arriving is new information and should announce itself; a label fading in every
     * time the form re-renders is noise. This is the same caller's-choice split the
     * other five recipes make with `enter`, resolved inside the component because Field
     * owns both nodes. */
    enter: 'fade',
    intent:
      'Colour only, on the fastest effects spring, and the entrance is a fade with nothing spatial in it. An error message that slides in moves the control above it, and the control above it is the one the user is still typing into — so the travel would be applied to the thing the user is aiming at. Rule 1b keeps opacity on the effects family where the curve cannot overshoot, which matters here because an overshooting opacity clips at 1 and stalls.',
  };

  protected readonly shape = 'block';

  /* One type step per size, shared by all three roles. Label and hint at the same size
   * differentiated by weight and colour reads cleaner than a second, smaller step — and
   * a 10px hint is not a hint, it is a disclaimer. */
  protected readonly sizeClasses: Record<FieldSize, string> = {
    sm: 'text-label-sm',
    md: 'text-label-md',
    lg: 'text-body-md',
  };

  /** Weight per role. Not a token binding, so it cannot live in `bindings` — and not in
   *  `shape` either, because that is shared across roles. Appended by the `classes`
   *  override below so the component and the showcase's own grid get it from one place;
   *  a component that added the weight itself would render differently from its
   *  specimen, which is the drift this layer exists to prevent. */
  private readonly weight: Record<FieldTextRole, string> = {
    label: 'font-medium',
    hint: '',
    error: 'font-medium',
  };

  protected readonly bindings: Record<FieldTextRole, VariantBinding> = {
    label: {
      intent: 'The name of the control. Always present, sometimes only to the a11y tree.',
      base: { fg: 'content-secondary' },
      /* Not content/secondary-disabled. The label of a disabled control still has to be
       * readable — the user needs to know what the greyed field WAS in order to work out
       * how to enable it. WCAG 1.4.3 exempts the disabled control, not the prose
       * explaining it. content/tertiary is the quietest token still gated at 4.5:1 on
       * every surface. */
      disabled: { fg: 'content-tertiary' },
      focus: 'none',
    },
    hint: {
      intent: 'What to type, or why the field is being asked for. Persists through errors.',
      base: { fg: 'content-tertiary' },
      disabled: { fg: 'content-tertiary' },
      focus: 'none',
    },
    error: {
      intent:
        'What went wrong and what to do about it. Never rendered without also setting aria-invalid on the control.',
      base: { fg: 'content-critical-hover' },
      /* A disabled control cannot be corrected, so its error is stale. The colour drops
       * to the same tertiary as the hint rather than staying red, because red on a
       * control nobody can edit is an instruction with no available action. */
      disabled: { fg: 'content-tertiary' },
      focus: 'none',
    },
  };

  /** Appends the per-role weight. See `weight`. */
  override classes(args: ClassArgs<FieldTextRole, FieldSize> = {}): string {
    const role = args.variant ?? this.defaultVariant;
    return cx(super.classes(args), this.weight[role]);
  }

  /* Vertical rhythm, per size. Two numbers that have to agree with the control ramp, so
   * they live next to each other:
   *
   *   sm   label→control 4px, control→message 4px   beside a 36px control
   *   md   label→control 6px, control→message 6px   beside a 40px control
   *   lg   label→control 8px, control→message 8px   beside a 48px control
   *
   * The two gaps are equal on purpose. An unequal pair makes the message look attached
   * to the field below it rather than the one above — the classic proximity bug in a
   * stacked form, and the reason a validation error frequently appears to belong to the
   * wrong input. */
  private readonly gap: Record<FieldSize, string> = {
    sm: 'oz-stack-1',
    md: 'oz-stack-2',
    lg: 'oz-stack-3',
  };

  /** The stack class for the field's own column. */
  gapFor(size: FieldSize): string {
    return `oz-stack ${this.gap[size]}`;
  }

  protected sampleChildren(role: FieldTextRole): string {
    const copy: Record<FieldTextRole, string> = {
      label: 'Product URL',
      hint: 'Paste a product page and we read the brand, the benefits and the audience from it.',
      error: 'That page did not load. Check the URL, or upload an image instead.',
    };
    return copy[role];
  }
}

export const fieldRecipe = new FieldRecipe();
