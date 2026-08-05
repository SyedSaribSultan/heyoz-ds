import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

/* Two kinds of row and they are genuinely different bindings, not one with a modifier.
 *
 * `item` is neutral. `destructive` is the row that deletes something, and it is on the
 * variant axis rather than being a colour prop because it has its own hover — a red row that
 * hovers to the neutral grey every other row hovers to stops being red at the exact moment
 * the pointer is on it and the click is about to happen. */
export type MenuVariant = 'item' | 'destructive';
export type MenuSize = 'md';

class MenuRecipe extends ComponentRecipe<MenuVariant, MenuSize> {
  readonly meta: RecipeMeta = {
    id: 'menu',
    group: 'overlays',
    title: 'Menu',
    tag: 'Menu',
    blurb:
      'A list of actions fired from a button. Not a Select — a menu DOES things and holds no value, which is why moving the caret through one must never commit anything.',
    notes: [
      'Arrow keys move focus and commit NOTHING. That is the opposite of RadioGroup, where selection follows focus, and the difference is that a radio group holds a value while a menu fires actions. A menu where arrowing down triggered each item would delete a file on the way past — so the two use the same useRovingFocus hook with `onFocusChange` deliberately unwired.',
      'Disabled items stay in the arrow sequence, which is also the opposite of RadioGroup. useRovingFocus takes `skipDisabled: false` here on purpose: a screen-reader user looking for "Duplicate" needs to find it and hear that it is unavailable, where an unreachable item is indistinguishable from one that was never there. A radio group skips instead, because stopping on an unselectable option while selection follows focus would mean arrowing onto it and silently failing.',
      'destructive is a variant rather than a colour prop because of its hover. A red row that hovers to the same neutral grey as every other row stops being red in the one instant the pointer is on it and the click is imminent — so it hovers to a red wash instead, and the warning survives the moment it exists for.',
      'The destructive row is content/critical-hover, not content/critical. The menu panel is surface/overlay, where content/critical measures 3.91:1 in dark — under the floor. CLAUDE.md rule 4b, and the same step Field\'s error message reaches for.',
      'A menu item is a <button> in a <div role="menu">, and the roles are set explicitly rather than left to the native semantics: role="menuitem" is what makes a screen reader announce "menu, 5 items" and read the position, which a list of bare buttons does not. The element stays a button so Enter, Space and the click target come for free.',
      'MenuCheckItem is role="menuitemcheckbox" and keeps the menu OPEN when toggled, where a plain item closes it. Toggling three view options should not mean reopening the menu three times — and the check mark moving in place is the confirmation, so nothing is lost by staying.',
      'The separator is role="separator" and is presentational. A group with a heading is MenuGroup, which is role="group" with aria-labelledby — a separator is not a substitute for a label, because it says "these are different" without ever saying how.',
      'Rows are 36px, not 44px. A menu is pointer-and-keyboard furniture that opens over content, and 44px rows make a six-item menu 264px tall, which is tall enough to need flipping on a laptop. The 44px floor is for a control sitting in a layout; a menu row is inside a panel the user has already committed a deliberate click to reach.',
    ],
  };

  readonly variants = ['item', 'destructive'] as const;
  readonly sizes = ['md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    /* The PANEL animates in, once, declared in panelClasses. Rows do not: a menu whose
     * every row fades in separately reads as assembling rather than appearing. */
    enter: 'none',
    intent:
      'Colour only on the fastest effects spring, exactly as the listbox row. A pointer crossing a six-item menu fires six of these, so the transition has to be short enough that a fast pass reads as one highlight following the cursor rather than six overlapping fades. Nothing spatial: a row that moves under the pointer changes which row the next click lands on, and in a menu that click deletes something.',
  };

  protected readonly shape =
    'flex w-full items-center gap-space-4 rounded-4 text-left font-body ' +
    'cursor-default select-none scroll-my-space-1 ' +
    'disabled:cursor-not-allowed';

  /* 36px rows — see the note on why not 44. */
  protected readonly sizeClasses: Record<MenuSize, string> = {
    md: 'min-h-space-10 px-space-4 py-space-2 text-body-sm',
  };

  protected readonly bindings: Record<MenuVariant, VariantBinding> = {
    item: {
      intent: 'An action. Fires and closes the menu.',
      base: { bg: 'surface-overlay', fg: 'content-primary' },
      hover: { bg: 'fill-elevated-hover' },
      selected: { bg: 'fill-selected' },
      disabled: { fg: 'content-primary-disabled' },
      focus: 'outline',
    },
    destructive: {
      intent: 'Deletes something. Never the first item, and never adjacent to a common one.',
      /* content/critical-hover at rest — rule 4b. The panel is surface/overlay, where
       * content/critical is 3.91:1 in dark. */
      base: { bg: 'surface-overlay', fg: 'content-critical-hover' },
      /* Hovers to a red wash, not to neutral grey — see the note; this is the whole reason
       * destructive is a variant rather than a colour prop.
       *
       * The LABEL moves with the wash, and it has to. Keeping `content/critical-hover` on
       * `fill/critical-secondary` over `surface/overlay` measures 4.54:1 in dark — it clears
       * the floor by 0.04, which is not a margin, it is a coincidence that the next ramp
       * move deletes. `content/critical-active` is the next step out and measures 6.14:1 on
       * the same ground. Same trade `button/tonal` makes on its active state, and the same
       * reason: when the ground moves toward the text, the text has to move away from it. */
      hover: { bg: 'fill-critical-secondary', fg: 'content-critical-active' },
      disabled: { fg: 'content-primary-disabled' },
      focus: 'outline',
    },
  };

  /** The floating panel. Same three decisions as the listbox panel and Dialog: no border
   *  (elevation is shadow in light and surface lightness in dark), `z-popover` so a menu
   *  inside a dialog paints above it, and `pop` because a menu has a definite origin. */
  panelClasses(): string {
    return [
      'oz-enter-pop overflow-y-auto overscroll-contain',
      'rounded-6 bg-surface-overlay shadow-large p-space-1',
      'min-w-[200px] z-popover',
    ].join(' ');
  }

  /** A group heading. `content/tertiary` is safe here at 4.95:1 worst case — a heading never
   *  sits on a selected or hovered row, which are the grounds where tertiary fails. */
  groupLabelClasses(): string {
    return 'px-space-4 pb-space-1 pt-space-3 text-label-sm font-medium text-content-tertiary';
  }

  /** The rule between groups. A 1px line is the one border in the system that is neither an
   *  affordance nor a state — so it is drawn as a background on a 1px box rather than as a
   *  border, which keeps `verify:borders` honest instead of forcing an exemption into it. */
  separatorClasses(): string {
    return 'my-space-1 h-px bg-border-secondary';
  }

  /** A trailing keyboard hint. `tabular-nums` so a column of them aligns. */
  shortcutClasses(): string {
    return 'ml-auto shrink-0 text-label-sm tabular-nums text-content-tertiary';
  }

  /** The check on a menuitemcheckbox. A fixed-width column whether or not it is shown, so
   *  labels do not shift horizontally as items are toggled. */
  checkSlotClasses(): string {
    return 'grid size-space-5 shrink-0 place-items-center text-content-brand-hover';
  }

  protected sampleChildren(variant: MenuVariant): string {
    return variant === 'destructive' ? 'Delete project' : 'Duplicate';
  }
}

export const menuRecipe = new MenuRecipe();
