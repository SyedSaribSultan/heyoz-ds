import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type TableRowVariant = 'row' | 'header';
export type TableSize = 'md';

class TableRecipe extends ComponentRecipe<TableRowVariant, TableSize> {
  readonly meta: RecipeMeta = {
    id: 'table',
    group: 'containers',
    title: 'Table',
    tag: 'Table',
    blurb: 'Rows of the same kind of thing. The row is the component; the table is a container.',
    notes: [
      'The recipe describes rows, not the table, because the row is what has states. A hovered row, a selected row and a header row are three bindings; the wrapper is a border and a radius.',
      'selected uses fill/selected — the brand accent at 15% alpha, not the brand fill. A fully saturated selected row would put content/primary on orange, which the build does not gate because nothing should do it. No border: a row is bounded by the rows above and below it, and border/selected is bound only by card/interactive, where the card has no neighbours to be bounded by.',
      'Selection is announced with aria-selected, which is also the Tailwind variant the recipe compiles against. The visual state and the accessible state are the same attribute, so they cannot disagree.',
      'A selectable row gets tabIndex and an Enter/Space handler, not just onClick. The recipe binds a focus ring to the row, and without a way to focus it that ring is dead code — which is also the test for whether a row is a real control or a clickable div wearing a <tr>.',
    ],
  };

  readonly variants = ['row', 'header'] as const;
  readonly sizes = ['md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    /* Rows do not animate individually. Twenty rows each rising in is a stagger, and
     * a stagger on tabular data is decoration on top of the thing people came to
     * read. The container animates once instead — see the .oz-enter-rise on the
     * ready view in Assembled.tsx. */
    enter: 'none',
    intent:
      'Row background only, on the fast effects spring. The restraint is the decision: a table is scanned, and anything that moves while the eye is travelling down a column competes with the column. This is also why there is no press scale — a row that shifts under the cursor makes the click target move during the click.',
  };

  protected readonly shape = '';

  protected readonly sizeClasses: Record<TableSize, string> = {
    md: '',
  };

  protected readonly bindings: Record<TableRowVariant, VariantBinding> = {
    row: {
      intent: 'A data row. Hoverable and selectable.',
      base: { bg: 'transparent', fg: 'content-secondary' },
      hover: { bg: 'fill-primary-hover', fg: 'content-primary' },
      selected: { bg: 'fill-selected', fg: 'content-primary' },
      focus: 'outline',
    },
    header: {
      intent: 'Column labels. Not interactive unless the column sorts.',
      base: { bg: 'surface-secondary', fg: 'content-tertiary' },
      focus: 'none',
    },
  };

  /** Cell padding and the label treatment, shared by the component and the demo. */
  readonly cellClasses = 'px-space-4 py-space-3 text-left align-middle text-body-sm';
  readonly headerCellClasses =
    'px-space-4 py-space-3 text-left align-middle text-label-xs font-medium uppercase';

  protected sampleChildren(): string {
    return '…';
  }
}

export const tableRecipe = new TableRecipe();
