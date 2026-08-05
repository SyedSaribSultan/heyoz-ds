import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';
import type { ButtonVariant } from './button.recipe';

/** The four dialogue types from the Figma set. The name selects the *tone of the
 *  action*, not the colour of the panel — see the note in `meta`. */
export type DialogVariant = 'basic' | 'warning' | 'error' | 'detailed';
export type DialogSize = 'md';

class DialogRecipe extends ComponentRecipe<DialogVariant, DialogSize> {
  readonly meta: RecipeMeta = {
    id: 'dialog',
    group: 'overlays',
    title: 'Dialog',
    tag: 'Dialog',
    blurb:
      'A question that blocks the screen until it is answered. Four types, and all four look identical — what the type changes is which button commits.',
    notes: [
      'The panel is tone-agnostic on purpose, and it is the most interesting thing about this component. An error dialogue is not a red box: it is an ordinary panel whose confirm button is red. Colouring the container as well would say the same thing twice and leave nothing louder for the button, which is the control that actually does the irreversible thing. Same argument as Alert, where no two of the four dots separate by more than 1.09:1 in greyscale — the copy carries the meaning and the colour only sorts it.',
      'So the binding table below has four identical rows. That is information, not duplication: it is the generated proof that the four types cannot drift apart visually, which is exactly the property a reviewer would otherwise have to take on trust.',
      'No border, and this is a deliberate deviation from the Figma file. The Figma panel carries border/primary, and the detailed type additionally carries a hairline under the title. Both are separation/elevation strokes, which CLAUDE.md rule 1c makes a build error: elevation is shadow in light and surface lightness in dark, and separation is a surface step or space. The panel gets surface-overlay plus a shadow; the title/body split gets space. verify-borders.ts would reject either stroke, and it is right to.',
      'surface-overlay rather than surface-elevated. They are the same value in light and in dark they are both neutral/105 — at the top of the usable ramp a popover separates by elevation rather than by hue, and there is only one rung available. overlay is the honest name for the thing that sits above everything.',
      'The confirm button is never the default focus target when it is destructive. The dialog focuses Cancel on open for the error type and the confirm for the rest, because an Enter keypress landing on "Yes, delete" before the user has read the sentence is the failure this component exists to prevent.',
      'The scrim is overlay/dimness and overlay/blur — two tokens that already existed for exactly this element and that no component was using. It shipped instead as an opacity modifier on a content token, which painted nothing at all: the preset emits every colour as a bare var(--oz-…) with no <alpha-value> slot, so Tailwind cannot apply a modifier to one and drops the declaration silently. The compiled stylesheet contains no such rule, for any token, anywhere. So the backdrop was a full-viewport transparent div: surface-overlay sat on surface-page with only its shadow to separate them, and the panel read as part of the page — the one thing a modal must never do. verify-classes could not see it, because the dialog is closed in the prerender it reads; it now also scans source for the pattern, which is a check that does not depend on a state being reachable without a click.',
    ],
  };

  readonly variants = ['basic', 'warning', 'error', 'detailed'] as const;
  readonly sizes = ['md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-default',
    properties: 'colors',
    /* Rises. A dialog that appears with no transition is the thing users describe as
     * the page jumping, and it arrives at the same moment the backdrop fades — one
     * gesture, so one spring family. */
    enter: 'rise',
    intent:
      'Enters on the default spatial spring so it reads as arriving rather than blinking into place, and transitions colour on an effects spring. Not `expressive`, deliberately: a dialog is usually asking about something irreversible, and a panel that bounces while it asks whether you want to delete your work is a tonal mistake. The motion should be calm precisely when the message is not.',
  };

  /* 460px is the Figma width and it is a max, not a width — below that the panel is
   * the viewport minus a gutter. A fixed 460 on a 375px phone is 85px of horizontal
   * scroll on a modal, which is the worst place in a product to put one. */
  protected readonly shape =
    'relative flex w-full max-w-[460px] flex-col rounded-8 ' +
    'p-space-7 gap-space-5';

  protected readonly sizeClasses: Record<DialogSize, string> = { md: '' };

  /* One appearance, written four times. See the second note in `meta` for why this
   * is not collapsed to a single variant: the repetition is what the generated table
   * turns into a guarantee. */
  private static readonly PANEL = {
    base: { bg: 'surface-overlay', fg: 'content-primary', shadow: 'large' },
    focus: 'none',
  } as const;

  protected readonly bindings: Record<DialogVariant, VariantBinding> = {
    basic: {
      intent: 'A question with a consequence the user can undo. Confirm is neutral.',
      ...DialogRecipe.PANEL,
    },
    warning: {
      intent: 'A consequence that is recoverable but costly. Confirm is amber.',
      ...DialogRecipe.PANEL,
    },
    error: {
      intent: 'Irreversible. Confirm is red and Cancel takes the initial focus.',
      ...DialogRecipe.PANEL,
    },
    detailed: {
      intent:
        'The same question where the reason needs a paragraph — a labelled explanation block above the actions.',
      ...DialogRecipe.PANEL,
    },
  };

  /** Which Button variant commits, per type. The whole of what the type axis does.
   *
   *  `inverse` rather than `primary` for basic and detailed: brand orange on a
   *  confirm button reads as promotion, and a dialog asking whether to delete a chat
   *  is not promoting anything. */
  confirmVariant(variant: DialogVariant): ButtonVariant {
    const map: Record<DialogVariant, ButtonVariant> = {
      basic: 'inverse',
      warning: 'warning',
      error: 'destructive',
      detailed: 'inverse',
    };
    return map[variant];
  }

  /** True where an Enter keypress must not commit. Only the irreversible type. */
  focusesCancel(variant: DialogVariant): boolean {
    return variant === 'error';
  }

  /** The scrim's paint: `overlay/dimness` over `overlay/blur`.
   *
   *  A style object rather than utility classes, because these two are deliberately
   *  absent from the Tailwind preset — they are not `color/*` tokens and reach CSS as
   *  `--oz-overlay-dimness` and `--oz-overlay-blur`. The Scrim demo in the Elevation
   *  section reads them exactly this way, and this is the second reader.
   *
   *  Here rather than in Dialog.tsx for the same reason every other appearance
   *  decision is here: one description, which the page can then render. A plain object
   *  and not `React.CSSProperties`, because nothing in `lib/recipes` imports React and
   *  the scrim is not a good enough reason to be the first.
   *
   *  Both properties are one token each, so a designer changing the scrim changes it
   *  in `build/spec.mjs` and both readers follow. The -webkit- twin is for Safari
   *  below 18, where the unprefixed property does nothing and the dim would ship
   *  without its blur — a degradation, not a break, but a free one to avoid. */
  readonly scrimStyle = {
    background: 'var(--oz-overlay-dimness)',
    backdropFilter: 'blur(var(--oz-overlay-blur))',
    WebkitBackdropFilter: 'blur(var(--oz-overlay-blur))',
  } as const;

  protected sampleChildren(): string {
    return '';
  }
}

export const dialogRecipe = new DialogRecipe();
