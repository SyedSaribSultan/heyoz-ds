import type { ComponentRecipe } from './Recipe';
import type { StateName } from './types';

/* ---------------------------------------------------------------------------
 * ComponentRegistry
 *
 * The showcase page does not contain a list of components. It asks the registry.
 *
 * That inversion is the point. Adding a component means writing its recipe, its
 * React component and one `registry.register(...)` call; the nav, the section, the
 * variant grid, the state grid, the binding table and the usage snippet all appear
 * without the page being edited. A page that hard-codes its own contents is a page
 * that will eventually be missing something.
 * ------------------------------------------------------------------------- */

/** A live, interactive rendering of the component — the row you can actually
 *  hover, press and tab through. Bespoke per component, because a Table demo and
 *  a Button demo have nothing structural in common. */
export type LiveDemo = React.ComponentType;

/** Renders one cell of the variant × state grid.
 *
 *  Note what it is given: a variant and a state, not a class string. The cell is
 *  required to render the real component with `forceState`, so that a grid cell and
 *  a live component are literally the same React component with the same recipe
 *  behind them. Handing the cell a pre-compiled className would have let a demo
 *  drift into rendering a styled <div> that merely resembles a button, which is the
 *  failure this whole arrangement is built to rule out. */
export type CellRenderer = React.ComponentType<{
  variant: string;
  state: StateName;
  disabled: boolean;
  /** Appended to the component's own className. Used only by the focus column, to
   *  add the statically-rendered ring. */
  extraClassName?: string;
}>;

export type RegistryEntry = {
  recipe: ComponentRecipe<string, string>;
  Live: LiveDemo;
  /**
   * The index tile's specimen. ONE representative instance at its natural size.
   *
   * Separate from `Live` because the two answer different questions and the index was
   * asking the wrong one. `Live` is the full demo — every variant, every size, the
   * state rows — and it belongs on the component's own page where it has the width
   * for it. Rendering that same demo into a 17rem tile produced the failure this
   * field exists to fix: fourteen tiles of wildly different heights, a Card row
   * squeezed to four 70px columns with one word per line, and three 400px pricing
   * cards crushed into a column narrower than their own padding.
   *
   * The rule for a preview is one instance, no grids, no state rows, no size ramps,
   * no explanatory prose. It is a thumbnail whose job is to make the component
   * recognisable at a glance so somebody can decide whether to open the page.
   *
   * Required in practice: ComponentIndex refuses to fall back to `Live`, and renders
   * a labelled placeholder instead, because silently substituting the full demo is
   * exactly how the tiles broke in the first place.
   */
  Preview?: LiveDemo;
  Cell?: CellRenderer;
  /** Set on components whose interesting states cannot be forced with classes
   *  alone (an input's placeholder, a switch's thumb position). The showcase then
   *  leans on the Live demo and says so instead of showing a misleading grid. */
  gridSuppressed?: boolean;
};

class ComponentRegistry {
  private entries = new Map<string, RegistryEntry>();

  /** Idempotent by id, so a hot reload re-running the module cannot double-list. */
  register(entry: RegistryEntry): this {
    this.entries.set(entry.recipe.id, entry);
    return this;
  }

  get all(): RegistryEntry[] {
    return [...this.entries.values()];
  }

  get ids(): string[] {
    return [...this.entries.keys()];
  }

  get size(): number {
    return this.entries.size;
  }

  get(id: string): RegistryEntry | undefined {
    return this.entries.get(id);
  }

  /** Distinct tokens named across every registered recipe. The honest answer to
   *  "how much of the system do the components actually use". */
  get tokenCoverage(): string[] {
    const seen = new Set<string>();
    for (const e of this.all) for (const t of e.recipe.tokensUsed) seen.add(t);
    return [...seen].sort();
  }
}

export const registry = new ComponentRegistry();
