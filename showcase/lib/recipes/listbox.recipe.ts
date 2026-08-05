import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type ListboxVariant = 'option';
export type ListboxSize = 'md' | 'lg';

/**
 * The option row inside a floating panel.
 *
 * WHY THIS IS ITS OWN RECIPE AND NOT PART OF SELECT. A Select is structurally two things
 * — a trigger and a panel of rows — and `ComponentRecipe` gives one `shape` and one
 * `sizeClasses` to be shared by every variant. The trigger needs a border, a radius and a
 * 44px floor; the row needs none of those and needs to be full-bleed inside the panel's
 * padding. Folding both onto one variant axis means one of them gets geometry that is
 * wrong for it.
 *
 * The alternative was helper methods — `optionClasses(state)` on the Select recipe, the
 * way Switch does its thumb. That is what the first draft did, and it puts every colour
 * in this file outside `verify-contrast`, which reads `bindings`. Switch's thumb is
 * exactly that: `content/fixed-inverse` on `fill/brand` is chosen correctly and measured
 * by nothing. A row with four states and a translucent selected fill is far too much
 * colour to leave unmeasured.
 *
 * So it is a component boundary rather than a workaround, and it is a real one: Select,
 * a Combobox and a Menu all render this row.
 */
class ListboxRecipe extends ComponentRecipe<ListboxVariant, ListboxSize> {
  readonly meta: RecipeMeta = {
    id: 'listbox',
    title: 'Listbox option',
    tag: 'ListboxOption',
    blurb:
      'One row in a floating panel of choices. Its own recipe rather than a helper on Select, so all four of its states are measured by the contrast sweep instead of being chosen by eye.',
    notes: [
      'The selected row is fill/selected — a 15% brand wash — and the wash is the reason three of the tokens here are one step louder than they look like they should be. fill/selected composited over surface/overlay is #57382D in dark, not the #3A241C it makes over the page, and every foreground has to clear 4.5:1 against the first of those. The token layer only ever gated it against the second.',
      'The label is content/primary in every state, including selected. content/selected is the token named for this job and it measures 3.55:1 on the selected row over a panel — it is safe on the page, where the token layer gates it, and not safe here. This is the same class of failure as a gradient ground: the pairing that fails is one neither the token build nor verify-contrast can see, because the background is a composite rather than a token.',
      'The description is content/secondary, not content/tertiary. Tertiary measures 4.36:1 on the selected row over a panel. On an unselected row it is 4.95:1 and would be fine, so the quieter token is correct for two rows out of three — and a description that changes colour when its row is picked is a description that looks like it changed meaning.',
      'The check glyph is content/brand-hover. content/brand is 3.55:1 on the selected row and 4.02:1 on the panel itself, so it fails in both places the glyph can sit. brand-hover clears at 4.54:1 worst case. Field\'s error message reaches for the -hover step for the same reason on the same two surfaces.',
      'hover and selected are different grounds and can both be true at once. A pointer over the already-selected row gets fill/selected, not fill/elevated-hover — selected wins, because the state that survives the pointer leaving is the one worth painting. They are bound in that order and the recipe merges them in that order.',
      'No border on the row and none on the panel. Rule 1c: a row against the next row is separation, which is a build error, and the panel floating above the page is elevation — shadow in light, surface lightness in dark. Dialog makes the same two choices for the same reasons.',
      'The row is full-width inside the panel\'s 4px padding, so the hover ground runs edge to edge rather than leaving a hairline of panel colour down each side. A row inset from its own container reads as a card in a list, which invites the user to look for a boundary that is not there.',
    ],
  };

  readonly variants = ['option'] as const;
  readonly sizes = ['md', 'lg'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    /* No entrance on the row. The PANEL animates in, once, as one object; forty rows each
     * running their own fade is forty things arriving, and it is the difference between a
     * menu appearing and a menu assembling itself. */
    enter: 'none',
    intent:
      'Colour only, fastest effects spring. The row is the most-hovered surface in any picker — a pointer crossing a ten-item list fires ten of these — so the transition has to be short enough that a fast pass reads as a highlight following the cursor rather than as ten overlapping fades. Nothing spatial: a row that moves under the pointer changes which row the next click lands on.',
  };

  protected readonly shape =
    'flex w-full items-center gap-space-4 text-left font-body rounded-4 ' +
    'cursor-default select-none scroll-my-space-1 ' +
    'aria-disabled:cursor-not-allowed';

  protected readonly sizeClasses: Record<ListboxSize, string> = {
    /* Matches the trigger's type step at the same size, on purpose: the value shown in the
     * closed trigger and the row it came from should be the same words at the same size, or
     * picking an option looks like it changed the text. */
    md: 'px-space-4 py-space-3 text-body-md',
    lg: 'px-space-4 py-space-3 text-body-lg',
  };

  protected readonly bindings: Record<ListboxVariant, VariantBinding> = {
    option: {
      intent: 'One choice. Selected is a wash plus a glyph, never a wash alone.',
      base: { bg: 'surface-overlay', fg: 'content-primary' },
      hover: { bg: 'fill-elevated-hover' },
      /* Bound after hover so it wins the merge — see the note. */
      selected: { bg: 'fill-selected', fg: 'content-primary' },
      disabled: { fg: 'content-primary-disabled' },
      /* The row takes focus when the arrow keys move to it, so it needs a real ring. It
       * sits on a neutral panel, not on a saturated fill, so it is the outward one. */
      focus: 'outline',
    },
  };

  /** The floating panel the rows sit in.
   *
   *  Not a variant: it is the container rather than a kind of row, it has no states, and
   *  putting it on the variant axis would give it the row's padding and type step. Its one
   *  colour — `surface/overlay` — is the same token the rows bind as their own base, so it
   *  IS covered by the sweep, through them. */
  panelClasses(): string {
    return [
      'oz-enter-pop overflow-y-auto overscroll-contain',
      'rounded-6 bg-surface-overlay shadow-large p-space-1',
      /* z-popover, not z-modal. A select inside a dialog has to paint above the dialog,
       * and the layer scale already orders these — dropdown < sticky < overlay < modal <
       * popover < toast < tooltip. */
      'z-popover',
    ].join(' ');
  }

  /** A group heading. Tertiary is safe here at 4.95:1 worst case because a heading never
   *  sits on a selected row — the one surface where tertiary fails. */
  groupLabelClasses(): string {
    return 'px-space-4 pb-space-1 pt-space-3 text-label-sm font-medium text-content-tertiary';
  }

  /** The check glyph on the selected row. See the note on why it is the -hover step. */
  checkClasses(): string {
    return 'ml-auto size-space-6 shrink-0 text-content-brand-hover';
  }

  /** An option's secondary line. */
  descriptionClasses(): string {
    return 'text-body-sm text-content-secondary';
  }

  /** Shown when a filter matches nothing. A picker with no empty state renders an empty
   *  box, which is indistinguishable from a picker that failed to load. */
  emptyClasses(): string {
    return 'px-space-4 py-space-5 text-body-sm text-content-tertiary';
  }

  protected sampleChildren(): string {
    return 'Skincare';
  }
}

export const listboxRecipe = new ListboxRecipe();
