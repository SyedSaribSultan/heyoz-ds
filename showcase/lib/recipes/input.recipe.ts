import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type InputVariant = 'default' | 'invalid';
export type InputSize = 'md' | 'lg';

/* Exported as a class as well as an instance, which no other recipe here is.
 *
 * Textarea extends it. The two are the same affordance — a bordered box you type into —
 * and their `bindings` tables were identical when written side by side. Duplicating them
 * would mean the next change to `border/secondary-hover` lands on one and not the other,
 * and nothing would catch it: verify-contrast would measure both and both would pass,
 * because each is internally consistent. Inheritance says the relationship out loud
 * instead, and leaves Textarea free to override the box — height, resize, padding — which
 * is the part that genuinely differs. */
export class InputRecipe extends ComponentRecipe<InputVariant, InputSize> {
  readonly meta: RecipeMeta = {
    id: 'input',
    group: 'forms',
    title: 'Input',
    tag: 'Input',
    blurb: 'Text entry, and the one component where the type step is a hard requirement.',
    notes: [
      'Both sizes use body-md (16px) or larger. Anything below 16px makes iOS Safari zoom the viewport on focus, which is why there is no sm size — a small input is a size token problem, not a component variant.',
      'The placeholder is content/placeholder, not content/tertiary at reduced opacity. It is a distinct token because the build gates it against the input surface; a faded tertiary would pass no gate at all.',
      'invalid changes the border and adds a message. It does not change the text colour: red input text is unreadable against a red-tinted surface and communicates nothing the border and the message do not already say.',
      'The label, hint and error are Field\'s, not this component\'s. They used to be hand-rolled here — a <label>, a <p> and an aria-describedby, in this file\'s JSX — and Textarea, Select, Radio, Slider and Dropzone all needed the same three. Six copies of an aria wiring is six chances to drop it, and the copy that drops it renders identically.',
      'Adornments are absolutely positioned rather than flex children of a shell that carries the border. The shell arrangement handles a variable-width prefix better, and it costs the thing that matters more: focus-visible would have to move from the input to the shell as a focus-within, which is a different assertion from the one the build gates. A leading or trailing SLOT is for a 20px glyph or a 40px control — anything wider wants its own composition, not this prop.',
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

  /* Adornment geometry, per size. All four numbers that have to agree sit in one table:
   * the glyph's inset from the edge, its box, and the padding the text needs so it
   * clears the glyph.
   *
   *   md   inset 12px + glyph 20px + gap 8px  ->  text starts at 40px (space-11)
   *   lg   inset 16px + glyph 20px + gap 12px ->  text starts at 48px (space-12)
   *
   * The glyph is 20px at both sizes on purpose. An icon that scales with the field
   * scales the one thing in the field that carries no information, and a 24px search
   * glyph beside 18px text reads as a button rather than a label.
   *
   * Every class here is a LITERAL. A constructed name like `left-` + inset would be one
   * which Tailwind's content scanner cannot see — the class reaches the HTML and no rule
   * is ever generated, and the only symptom is that the glyph sits in the corner. That
   * is the failure verify-classes.mjs exists to catch, and the first draft of this table
   * had it. */
  private readonly adornment: Record<
    InputSize,
    { leading: string; trailing: string; padLeading: string; padTrailing: string }
  > = {
    md: {
      leading: 'left-space-4',
      trailing: 'right-space-4',
      padLeading: 'pl-space-11',
      padTrailing: 'pr-space-11',
    },
    lg: {
      leading: 'left-space-5',
      trailing: 'right-space-5',
      padLeading: 'pl-space-12',
      padTrailing: 'pr-space-12',
    },
  };

  /** Extra horizontal padding so the text clears an adornment. */
  padFor(size: InputSize, side: 'leading' | 'trailing'): string {
    const a = this.adornment[size];
    return side === 'leading' ? a.padLeading : a.padTrailing;
  }

  /** The absolutely-positioned adornment box.
   *
   *  `pointer-events-none` on the decorative case only: a leading search glyph must not
   *  eat the click that should focus the field, and a trailing clear button must. The
   *  caller says which by passing an interactive node, so the flag is a parameter rather
   *  than a guess. */
  adornmentClasses(size: InputSize, side: 'leading' | 'trailing', interactive: boolean): string {
    const a = this.adornment[size];
    return [
      /* -translate-y-1/2 is centring, not travel, and must NOT be written through
       * --oz-motion-spatial-scale: at scale 0 the glyph would drop to sit half below the
       * field. It needs no STATE_TRANSFORMS entry either — verify-motion.ts matches only
       * bracketed arbitrary values (`translate-y-[6px]`), and this is a named utility, so
       * the sweep never sees it. Stated because the reverse is easy to assume. */
      'absolute top-1/2 -translate-y-1/2 grid place-items-center',
      side === 'leading' ? a.leading : a.trailing,
      'size-space-6 text-content-tertiary',
      interactive ? '' : 'pointer-events-none',
    ]
      .filter(Boolean)
      .join(' ');
  }

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
