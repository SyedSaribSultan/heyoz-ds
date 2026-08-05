import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type BreadcrumbVariant = 'link' | 'current';
export type BreadcrumbSize = 'md';

class BreadcrumbRecipe extends ComponentRecipe<BreadcrumbVariant, BreadcrumbSize> {
  readonly meta: RecipeMeta = {
    id: 'breadcrumb',
    title: 'Breadcrumb',
    tag: 'Breadcrumb',
    blurb:
      'Where this page sits in a hierarchy that actually exists. Not a history trail — if the path changes depending on how the user arrived, it is telling them about their session rather than about the product.',
    notes: [
      'The last item is NOT a link and carries aria-current="page". A linked final crumb is a link to the page you are on, which does nothing and which a screen-reader user has no way to distinguish from the ones that do something. It is a <span>, in a heavier weight, and that weight is the only visual difference.',
      'It is a <nav> with a name, wrapping an <ol>. The list is what makes the hierarchy real to a screen reader — "list, 4 items, item 3 of 4" is the position, which is the whole point of a breadcrumb. A row of <a>s in a div carries none of that.',
      'The separator is a character in an aria-hidden span, not a border and not a CSS pseudo-element. Hidden because "Projects slash Spring campaign slash Script" is not how anyone wants a path read; a pseudo-element would be read by some screen readers and not others, which is worse than either choice made deliberately.',
      'Collapsing is the caller\'s job and this component will not do it silently. A four-deep path on a phone wraps to two lines, and that is the correct failure — an ellipsis that hides the middle of the path hides exactly the part that says where you are. If a path is too deep for the screen, the hierarchy is too deep.',
      'content/secondary for the links and content/primary for the current page, so the emphasis runs the right way. Most breadcrumbs get this backwards: brand-coloured links draw the eye to where the user has been, and the one thing they need to confirm — where they are now — is the quietest item in the row.',
      'No hover underline on the links, only a colour change. A breadcrumb is a row of four or five short words; underlining on hover shifts the baseline in most fonts and makes the row visibly twitch as the pointer crosses it.',
    ],
  };

  readonly variants = ['link', 'current'] as const;
  readonly sizes = ['md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    enter: 'none',
    intent:
      'Colour only on the fastest effects spring, and only on the links — the current page has no states because it is not a control. No entrance: a breadcrumb is part of the page chrome and is present the moment the page is, so animating it in would be animating the frame rather than the content.',
  };

  protected readonly shape = 'rounded-2 font-body whitespace-nowrap';

  protected readonly sizeClasses: Record<BreadcrumbSize, string> = { md: 'text-body-sm' };

  protected readonly bindings: Record<BreadcrumbVariant, VariantBinding> = {
    link: {
      intent: 'An ancestor. Quieter than the current page, deliberately.',
      base: { bg: 'transparent', fg: 'content-secondary' },
      hover: { fg: 'content-primary' },
      active: { fg: 'content-primary' },
      focus: 'outline',
    },
    current: {
      intent: 'This page. Not a link, and the heaviest item in the row.',
      base: { bg: 'transparent', fg: 'content-primary' },
      focus: 'none',
    },
  };

  /** The separator glyph. aria-hidden in the component — see the notes. */
  separatorClasses(): string {
    return 'select-none px-space-2 text-content-tertiary';
  }

  /** The row. `flex-wrap` because a deep path on a narrow screen should wrap rather than
   *  scroll or truncate — see the note on collapsing. */
  listClasses(): string {
    return 'flex flex-wrap items-center';
  }

  protected sampleChildren(variant: BreadcrumbVariant): string {
    return variant === 'current' ? 'Script' : 'Projects';
  }
}

export const breadcrumbRecipe = new BreadcrumbRecipe();
