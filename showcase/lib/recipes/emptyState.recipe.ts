import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

/* Four situations, not four decorations. Which one you are in decides what the copy has to
 * do, and getting it wrong is the actual failure — a "no results" illustration where an error
 * belongs tells the user their search worked and found nothing, when in fact it never ran. */
export type EmptyStateVariant = 'first-run' | 'no-results' | 'error' | 'success';
export type EmptyStateSize = 'sm' | 'md';

class EmptyStateRecipe extends ComponentRecipe<EmptyStateVariant, EmptyStateSize> {
  readonly meta: RecipeMeta = {
    id: 'empty-state',
    title: 'Empty state',
    tag: 'EmptyState',
    blurb:
      'The screen when there is nothing to show. Four variants because there are four different reasons for nothing, and they need different copy — the commonest bug in an empty state is using the wrong one.',
    notes: [
      'FIRST-RUN is not the same as NO-RESULTS and conflating them is the mistake this component exists to prevent. First-run means the user has never made one of these, so the copy has to say what the thing is and give them the action — it is the best onboarding surface most products have and most waste it on "No projects yet." No-results means they have plenty and this filter matched none, so the copy has to offer a way back: clear the filter, broaden the search. Showing "Create your first project" to someone with forty projects and a bad search term is telling them their work is gone.',
      'ERROR is a fourth variant and not an Alert, when the emptiness IS the error — a list that could not load has nothing to show and needs to explain itself in the space the list would have occupied. An Alert above an empty list makes the user read two things to learn one.',
      'The action is a real Button passed in as a node, not a label plus a callback. An empty state\'s action is frequently the primary action of the whole screen, and it needs the full Button API — a size, a variant, an icon, a loading state. Reducing it to `actionLabel` would mean re-adding each of those one prop at a time.',
      'The icon is optional and there is no illustration slot. A 200px illustration in an empty state is the thing most likely to be there because the space felt bare rather than because it says anything — and it pushes the action below the fold on a phone, which is the one element that had to be reachable.',
      'The title is a real heading at a caller-supplied level. An empty state usually replaces a list that sat under a heading, so it is a section within a document outline and not a standalone page — hard-coding h2 here breaks the outline in half the places it is used.',
      'aria-live is deliberately NOT set. An empty state renders because a navigation or a filter changed, and both of those already move focus or are user-initiated — a live region on top of that announces the emptiness a second time. Where the transition is genuinely silent, the CALLER wraps it, because only the caller knows.',
      'It is centred and width-capped at 44ch. Centred text is harder to read and correct here: there are two lines of it, the block is the only thing on the screen, and a left-aligned paragraph in the middle of an empty container reads as content that failed to fill its space rather than as a deliberate message.',
    ],
  };

  readonly variants = ['first-run', 'no-results', 'error', 'success'] as const;
  readonly sizes = ['sm', 'md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    enter: 'fade',
    intent:
      'It fades in, on the effects family, with nothing spatial. An empty state replaces content that was there a moment ago — a list, a grid, a table — so travel would read as the new thing arriving from somewhere, which invites the user to look for where it came from. A fade reads as the container changing what it holds, which is what happened. Rule 1b keeps opacity on the curve that cannot overshoot.',
  };

  protected readonly shape =
    'oz-stack flex w-full flex-col items-center justify-center text-center';

  protected readonly sizeClasses: Record<EmptyStateSize, string> = {
    /* `oz-stack-N` supplies the gap and the min-width guard; the padding is the box. */
    sm: 'oz-stack-4 px-space-5 py-space-11',
    md: 'oz-stack-5 px-space-6 py-space-16',
  };

  /* The variants differ in the ICON's tint and nothing else. The title and body are the same
   * two tokens in all four, because an empty state is prose and coloured prose is harder to
   * read — the situation is carried by the words and the glyph. */
  protected readonly bindings: Record<EmptyStateVariant, VariantBinding> = {
    'first-run': {
      intent: 'Never made one. The best onboarding surface most products have.',
      base: { bg: 'transparent', fg: 'content-brand-hover' },
      focus: 'none',
    },
    'no-results': {
      intent: 'Has plenty; this filter matched none. The copy must offer a way back.',
      base: { bg: 'transparent', fg: 'content-tertiary' },
      focus: 'none',
    },
    error: {
      intent: 'Could not load. The emptiness IS the error, so it explains itself here.',
      base: { bg: 'transparent', fg: 'content-critical-hover' },
      focus: 'none',
    },
    success: {
      intent: 'Deliberately empty and that is good news — an inbox cleared, no failures.',
      base: { bg: 'transparent', fg: 'content-success-hover' },
      focus: 'none',
    },
  };

  /** The glyph plate. A tinted disc rather than a bare icon, so a 24px glyph has presence in a
   *  large empty container without needing an illustration. */
  iconPlateClasses(variant: EmptyStateVariant): string {
    const wash: Record<EmptyStateVariant, string> = {
      'first-run': 'bg-fill-brand-secondary',
      'no-results': 'bg-fill-tertiary',
      error: 'bg-fill-critical-secondary',
      success: 'bg-fill-success-secondary',
    };
    return `grid size-space-13 place-items-center rounded-full ${wash[variant]}`;
  }

  titleClasses(): string {
    return 'font-display text-heading-xs font-semibold text-content-primary';
  }

  /** 44ch, and centred — see the notes for why centring is right here and almost nowhere else. */
  bodyClasses(): string {
    return 'max-w-[44ch] text-body-md text-content-secondary';
  }

  protected sampleChildren(variant: EmptyStateVariant): string {
    const copy: Record<EmptyStateVariant, string> = {
      'first-run': 'Make your first ad',
      'no-results': 'No ads match those filters',
      error: 'We could not load your ads',
      success: 'Every render finished',
    };
    return copy[variant];
  }
}

export const emptyStateRecipe = new EmptyStateRecipe();
