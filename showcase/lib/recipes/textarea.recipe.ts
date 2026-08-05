import { InputRecipe } from './input.recipe';
import type { RecipeMeta } from '../core/Recipe';
import type { MotionSpec } from '../core/types';

/** Same axes as Input, deliberately. See the note on the class. */
export type TextareaVariant = 'default' | 'invalid';
export type TextareaSize = 'md' | 'lg';

/**
 * Multi-line text entry.
 *
 * Extends InputRecipe rather than restating it — the `bindings` table is inherited whole,
 * so the border, fill, placeholder and disabled treatment of a textarea cannot drift from
 * an input's. What is overridden here is the box: no pinned height, a minimum measured in
 * lines, and a resize policy.
 */
class TextareaRecipe extends InputRecipe {
  override readonly meta: RecipeMeta = {
    id: 'textarea',
    group: 'forms',
    title: 'Textarea',
    tag: 'Textarea',
    blurb:
      'Multi-line entry that grows with its content. Shares Input\'s bindings by inheritance, so the two can never disagree about what a text box looks like.',
    notes: [
      'The bindings are Input\'s, inherited rather than copied. A textarea and an input are the same affordance in different boxes, and two identical tables would drift the first time one of them was edited — silently, because each would still be internally consistent and both would still pass the contrast sweep.',
      'It auto-grows, and the growth is capped in LINES rather than pixels. maxRows is the honest unit: the cap exists so a pasted essay does not push the submit button off the screen, and "how much can I see before it scrolls" is a question about lines of text. Past the cap the element scrolls itself.',
      'resize-none while auto-growing, resize-y otherwise. A drag handle on an element whose height is being set by script is a control that fights the next keystroke — the user drags it taller, types, and it snaps back. Offering both and letting them contradict each other is worse than offering one.',
      'No `sm`. Input has none for the iOS zoom reason — anything under 16px zooms the viewport on focus — and a multi-line field has the same constraint plus a worse consequence, since the zoom happens with the keyboard already up and the caret mid-paragraph.',
      'The character counter goes in Field\'s labelAside, at the top, not under the field. Under the field it competes with the error for the same line and moves when one appears; at the top it sits on the label\'s baseline where nothing else is, and it is visible while the user is typing rather than below the fold of a tall box.',
      'Over the limit is an error, not a red counter. A counter that turns red says a number is wrong; an error says what to do. The counter keeps counting either way — Field renders the error above the hint rather than replacing it.',
    ],
  };

  override readonly sizes = ['md', 'lg'] as const;

  override readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    enter: 'none',
    intent:
      'Colour only, and deliberately nothing on the height. The box changes height as the user types, and that is the one size change in the system that must NOT be animated: a transition on height means the caret arrives at its new line a beat after the character does, so the text and the cursor visibly disagree during fast typing. Input\'s reasoning about the absent press-scale applies here too, and more strongly — there is more area to move and the same one-character aiming tolerance.',
  };

  /* No `min-h-target`: the minimum is set in lines by the component, from `rows`. A
   * 44px floor is the right floor for a control you tap once and the wrong one for a box
   * you write a paragraph in — it would let a 1-row textarea be shorter than its own
   * default content. `resize` is set by the component too, because it depends on whether
   * auto-grow is on. */
  protected override readonly shape =
    'w-full font-body rounded-5 border-2 block ' +
    'placeholder:text-content-placeholder ' +
    'disabled:cursor-not-allowed';

  protected override readonly sizeClasses: Record<TextareaSize, string> = {
    md: 'px-space-4 py-space-3 text-body-md',
    lg: 'px-space-5 py-space-4 text-body-lg',
  };

  override labelFor(variant: TextareaVariant): string {
    return variant === 'invalid' ? 'Script' : 'What is the ad about?';
  }

  override placeholderFor(variant: TextareaVariant): string {
    return variant === 'invalid'
      ? 'Hook, then benefit, then CTA.'
      : 'A 20-second hook for a matcha brand aimed at people who quit coffee.';
  }

  override messageFor(variant: TextareaVariant): string | null {
    return variant === 'invalid' ? 'A script needs at least one line of dialogue.' : null;
  }
}

export const textareaRecipe = new TextareaRecipe();
