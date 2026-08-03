import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type InputVariant = 'default' | 'invalid';
export type InputSize = 'md' | 'lg';

class InputRecipe extends ComponentRecipe<InputVariant, InputSize> {
  readonly meta: RecipeMeta = {
    id: 'input',
    title: 'Input',
    tag: 'Input',
    blurb: 'Text entry, and the one component where the type step is a hard requirement.',
    notes: [
      'Both sizes use body-md (16px) or larger. Anything below 16px makes iOS Safari zoom the viewport on focus, which is why there is no sm size — a small input is a size token problem, not a component variant.',
      'The placeholder is content/placeholder, not content/tertiary at reduced opacity. It is a distinct token because the build gates it against the input surface; a faded tertiary would pass no gate at all.',
      'invalid changes the border and adds a message. It does not change the text colour: red input text is unreadable against a red-tinted surface and communicates nothing the border and the message do not already say.',
    ],
  };

  readonly variants = ['default', 'invalid'] as const;
  readonly sizes = ['md', 'lg'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    enter: 'none',
    intent:
      'Colour only, fast, no overshoot — and no press scale, unlike Button. A text field that moves when you click into it moves the caret you are aiming at, and the caret is a target with roughly one character of tolerance. This is the clearest case in the system for motion that is deliberately absent: every argument for a press-scale on a button is an argument against one here.',
  };

  protected readonly shape =
    'w-full font-body rounded-5 border-2 ' +
    'placeholder:text-content-placeholder ' +
    'disabled:cursor-not-allowed';

  protected readonly sizeClasses: Record<InputSize, string> = {
    md: 'px-space-4 py-space-3 text-body-md min-h-target',
    lg: 'px-space-5 py-space-4 text-body-lg min-h-target-comfortable',
  };

  protected readonly bindings: Record<InputVariant, VariantBinding> = {
    default: {
      borderJob: 'affordance',
      intent: 'Every field until the user has done something wrong.',
      base: { bg: 'surface-secondary', fg: 'content-primary', border: 'border-secondary' },
      hover: { border: 'border-secondary-hover' },
      disabled: {
        bg: 'fill-secondary-disabled',
        fg: 'content-primary-disabled',
        border: 'border-primary-disabled',
      },
      focus: 'outline',
    },
    invalid: {
      borderJob: 'affordance',
      intent: 'Failed validation. Always paired with a message that says what to do.',
      base: { bg: 'surface-secondary', fg: 'content-primary', border: 'border-critical' },
      hover: { border: 'border-critical-hover' },
      disabled: {
        bg: 'fill-secondary-disabled',
        fg: 'content-primary-disabled',
        border: 'border-critical-disabled',
      },
      focus: 'outline',
    },
  };

  protected sampleChildren(): string {
    return '';
  }

  placeholderFor(variant: InputVariant): string {
    return variant === 'invalid'
      ? 'design@heyoz'
      : 'A slow dolly through a rain-lit street at dusk';
  }

  /** Label and message copy live with the recipe so the showcase and the app tell
   *  the user the same thing. An error that says what happened and what to do next
   *  is a design decision, not a string the caller invents each time. */
  labelFor(variant: InputVariant): string {
    return variant === 'invalid' ? 'Work email' : 'Prompt';
  }

  messageFor(variant: InputVariant): string | null {
    return variant === 'invalid' ? 'Add the domain — for example design@heyoz.com.' : null;
  }
}

export const inputRecipe = new InputRecipe();
