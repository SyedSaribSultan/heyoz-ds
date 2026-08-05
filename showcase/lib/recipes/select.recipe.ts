import { InputRecipe } from './input.recipe';
import type { RecipeMeta } from '../core/Recipe';
import type { MotionSpec } from '../core/types';

export type SelectVariant = 'default' | 'invalid';
export type SelectSize = 'md' | 'lg';

/**
 * The trigger of a select — the closed control that shows the current value.
 *
 * Extends InputRecipe for the third time in this folder, and for the same reason: a
 * closed select and a text input are the same affordance. They sit side by side in every
 * form, and a border or fill that differed between them would read as one of the two
 * being broken. Inheriting the table makes that agreement structural instead of a thing
 * two files happen to say.
 *
 * The panel and its rows are `listbox.recipe.ts` — see the note there on why that is a
 * component boundary rather than a workaround.
 */
class SelectRecipe extends InputRecipe {
  override readonly meta: RecipeMeta = {
    id: 'select',
    group: 'forms',
    title: 'Select',
    tag: 'Select',
    blurb:
      'A choice from a known, closed set. A real listbox with full keyboard support and typeahead, not a styled native <select> — and not the right component for a set the user can add to.',
    notes: [
      'It is a custom listbox, not a native <select>, and the trade is worth stating because it is not free. Native gets platform-native rendering on mobile, correct behaviour under every assistive technology, and zero JavaScript. It cannot show a description under an option, an icon beside one, or a group heading that is styled — and it cannot be measured by this repo\'s contrast sweep, because the options are drawn by the OS. What is here is the ARIA listbox pattern implemented in full: roving focus, typeahead, Home/End, aria-activedescendant-free real focus, and Escape.',
      'The trigger inherits Input\'s bindings. A closed select beside a text input in the same form must not differ by a border step, and inheritance is what makes that structural.',
      'Typeahead resets after 500ms of no keystrokes. Below about 300ms a deliberate two-letter search — "sk" for Skincare — breaks apart into two single-letter jumps; above about 800ms a user who has stopped typing and starts a new search finds their first letter appended to the last one. 500ms is the interval Windows and macOS list views both use, so it is also the one people already have in their hands.',
      'A letter pressed on the closed trigger opens the panel AND jumps to the match, rather than only opening it. Opening and then requiring the letter again is the behaviour that makes a keyboard user think the first keystroke was dropped.',
      'Tab closes the panel and moves on rather than being trapped. A listbox is not a modal: there is nothing to confirm and nothing to lose, so trapping focus in it costs the user their place in the form for no benefit. Escape closes and returns focus to the trigger; clicking away closes and does not.',
      'The panel is width-matched to the trigger via useAnchor\'s matchAnchorWidth, floored rather than fixed — an option longer than the trigger widens the panel instead of truncating. A listbox narrower than the field it belongs to reads as a detached object; one that can never be wider truncates the only text the user is trying to read.',
      'No `sm`, inherited from Input\'s reasoning: a 14px trigger is fine, but the ROW it opens is a tap target, and a 36px row in a scrolling panel on a phone is a mis-tap. The rows are the reason, not the trigger.',
      'For a set the user can add to, or one long enough to need filtering, this is the wrong component — that is a Combobox, which is a text input that owns a listbox rather than a button that owns one. The two share listbox.recipe.ts and nothing else.',
    ],
  };

  override readonly sizes = ['md', 'lg'] as const;

  override readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    /* The trigger does not animate in; the PANEL does, and it declares that itself in
     * listboxRecipe.panelClasses() as oz-enter-pop. A control that is present when the
     * screen is should not arrive separately. */
    enter: 'none',
    intent:
      'Colour only on the trigger, fastest effects spring, matching Input exactly — they sit next to each other and a different hover speed on two identical-looking boxes reads as one of them lagging. The chevron rotates 180° on open, which is an orientation change rather than travel: it is deliberately not routed through --oz-motion-spatial-scale, because a chevron that stops rotating for a reduced-motion user stops saying whether the panel is open.',
  };

  /* Overridden from Input: a button, not a text box. `justify-between` puts the chevron at
   * the trailing edge; `text-left` because a button centres its text by default and a
   * value that centres itself in a form field is the single clearest tell of a styled
   * <button> pretending to be an input. The placeholder pseudo-selector Input carries is
   * dropped — a button has no placeholder, and the empty state is a span the component
   * colours itself. */
  protected override readonly shape =
    'inline-flex w-full items-center justify-between gap-space-3 ' +
    'font-body text-left rounded-5 border-2 min-h-target ' +
    'disabled:cursor-not-allowed';

  protected override readonly sizeClasses: Record<SelectSize, string> = {
    md: 'px-space-4 py-space-3 text-body-md',
    lg: 'px-space-5 py-space-4 text-body-lg min-h-target-comfortable',
  };

  /** The empty state inside the trigger. Not `content/placeholder` by accident — it is the
   *  same token Input paints its placeholder with, gated against the same surface, so an
   *  empty select and an empty input are the same grey. */
  placeholderClasses(): string {
    return 'truncate text-content-placeholder';
  }

  /** The chosen value. `truncate` and `min-w-0` because the trigger is a flex row and a
   *  long value would otherwise push the chevron out of the box — the flex-child overflow
   *  CLAUDE.md names as one of the two failure modes behind every horizontal scrollbar. */
  valueClasses(): string {
    return 'min-w-0 truncate';
  }

  /** The chevron. Rotation is an orientation change and stays literal — see `motion`. */
  chevronClasses(open: boolean): string {
    return [
      'size-space-6 shrink-0 text-content-tertiary',
      'transition-transform duration-effects-fast ease-effects-fast',
      open ? 'rotate-180' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  override labelFor(variant: SelectVariant): string {
    return variant === 'invalid' ? 'Product category' : 'Ad format';
  }

  override placeholderFor(variant: SelectVariant): string {
    return variant === 'invalid' ? 'Pick a category' : 'Pick a format';
  }

  override messageFor(variant: SelectVariant): string | null {
    return variant === 'invalid' ? 'Pick a category so we can match the right creators.' : null;
  }
}

export const selectRecipe = new SelectRecipe();
