import { cx } from './cx';
import { cssValue, resolveRole, rolePath } from './audit';
import type {
  BindingRow,
  FocusMode,
  MatrixCell,
  Mode,
  MotionSpec,
  StateName,
  TokenBinding,
  TokenRole,
  VariantBinding,
} from './types';

/* ---------------------------------------------------------------------------
 * ComponentRecipe
 *
 * One subclass per component, and it is the only place that component's
 * appearance is described. The React component compiles its className from here;
 * the showcase compiles its variant grid, its state grid, its binding table and
 * its usage snippet from the same object. There is deliberately no second
 * description of a button anywhere — the docs cannot drift from the component
 * because they are not a copy of it.
 *
 * The interesting part is `classes()`. It has two modes:
 *
 *   classes({ variant })                → 'bg-fill-brand hover:bg-fill-brand-hover …'
 *   classes({ variant, force: 'hover' })→ 'bg-fill-brand-hover …'
 *
 * The first is what ships: real :hover, real :active, real :disabled, real
 * :focus-visible. The second exists so the showcase can *display* a hover state
 * in a grid without lying about it — both strings are compiled from the same
 * binding table, so the swatch labelled "hover" is guaranteed to be the colour
 * you get when you actually hover. A hand-written state grid is the thing this
 * design is built to make impossible.
 * ------------------------------------------------------------------------- */

/** Token role → Tailwind utility prefix. The whole mapping, in one place. */
const ROLE_UTILITY: Record<TokenRole, (token: string) => string> = {
  bg: (t) => `bg-${t}`,
  fg: (t) => `text-${t}`,
  border: (t) => `border-${t}`,
  shadow: (t) => `shadow-${t}`,
};

/** State → Tailwind variant prefix for the live (non-forced) compilation.
 *  Keep in step with the `variants` arrays in tailwind.config.js safelist. */
const STATE_VARIANT: Record<StateName, string> = {
  base: '',
  hover: 'hover:',
  active: 'active:',
  disabled: 'disabled:',
  selected: 'aria-selected:',
};

/** Canonical state order. Used for table columns so every component reads the
 *  same way left to right. */
export const STATE_ORDER: readonly StateName[] = [
  'base',
  'hover',
  'active',
  'selected',
  'disabled',
];

/** The two documented focus treatments, as classes.
 *
 * Written as literals so Tailwind's content scanner finds the arbitrary inset
 * shadow. See docs/DEV-GUIDE.md "The two focus rings" for why there are two, and
 * CLAUDE.md for why border/focus-inverse being the same colour as the page is
 * correct rather than a bug: drawn with an outward offset it would fill the gap
 * with page colour and vanish at 1.00:1, so it is inset-only. */
const FOCUS_CLASSES: Record<FocusMode, string> = {
  outline:
    'focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus',
  inset:
    'focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_var(--oz-focus-ring-width)_var(--oz-color-border-focus-inverse)]',
  none: '',
};

export type ClassArgs<V extends string, S extends string, C extends string = string> = {
  variant?: V;
  size?: S;
  /** Corner treatment, when the component has more than one. See `corners`. */
  corner?: C;
  /** Render the appearance of this state statically. Showcase-only — production
   *  code omits it and gets the real pseudo-classes. */
  force?: StateName;
  className?: string;
};

export type RecipeMeta = {
  /** Anchor id and registry key. Kebab-case. */
  id: string;
  /** Section heading. */
  title: string;
  /** One sentence: what this component is for. Shown under the heading. */
  blurb: string;
  /** The element or component name used in the generated usage snippet. */
  tag: string;
  /** Documented subtleties worth surfacing next to the component. Each should be
   *  a fact a developer could otherwise get wrong, not a description of the code. */
  notes?: string[];
};

/** Transition-property sets, keyed by what a MotionSpec asks for.
 *
 *  The first two are Tailwind's. The last two come from the token layer as real
 *  classes, because Tailwind arbitrary properties containing commas —
 *  `[transition-property:color,background-color,…]` — do not survive its content
 *  scanner: the extractor treats the commas as delimiters, so the class lands in the
 *  HTML and no rule is ever generated. That failure is invisible except that the
 *  transition does not happen. verify-classes.mjs caught it; see motionUtilities()
 *  in build/build.mjs for the emitted definitions. */
const TRANSITION_PROPERTY: Record<MotionSpec['properties'], string> = {
  colors: 'transition-colors',
  transform: 'transition-transform',
  'colors-and-transform': 'oz-transition-visual',
  shadow: 'oz-transition-depth',
  none: '',
};

export abstract class ComponentRecipe<
  V extends string = string,
  S extends string = string,
  C extends string = string,
> {
  abstract readonly meta: RecipeMeta;

  /** How this component moves. Abstract, so it cannot be forgotten — the same
   *  device as `focus` on VariantBinding, for the same reason. */
  abstract readonly motion: MotionSpec;

  /** Variant order as shown. First entry is the default. */
  abstract readonly variants: readonly V[];

  /** Size order as shown. First entry is the default. Empty when a component has
   *  a single size — the showcase then omits the size axis entirely. */
  abstract readonly sizes: readonly S[];

  /** Token bindings, per variant, per state. The single source of appearance. */
  protected abstract readonly bindings: Record<V, VariantBinding>;

  /** Size → structural utilities (padding, type step, min target). No colour. */
  protected abstract readonly sizeClasses: Record<S, string>;

  /** Optional third axis: corner treatment, shown as `shape` on the component API.
   *
   *  Empty for every component whose radius is a function of its size, which is
   *  most of them — the showcase then omits the axis entirely, exactly as it does
   *  for `sizes`. It is a separate axis rather than six more size keys because it
   *  is genuinely orthogonal: `rect` at lg and `pill` at lg differ in one property
   *  and share padding, type step and height. Folding them together would produce
   *  twelve size keys that have to agree with each other by hand, which is the
   *  drift this class exists to prevent.
   *
   *  Named `corners` rather than `shapes` because `shape` above is already the
   *  shared-utility string every recipe declares, and two fields one letter apart
   *  is a bug waiting to be written. */
  readonly corners: readonly C[] = [];

  /** Corner → the radius utility. Partial so a recipe with no corner axis need not
   *  declare it. */
  protected readonly cornerClasses: Partial<Record<C, string>> = {};

  /** Utilities every variant shares: layout, radius, transition, cursor. No colour
   *  beyond `border-transparent`, which reserves the border box so a bordered and
   *  an unbordered variant are the same height. */
  protected readonly shape: string = '';

  get id() {
    return this.meta.id;
  }

  get defaultVariant(): V {
    return this.variants[0];
  }

  get defaultSize(): S | undefined {
    return this.sizes[0];
  }

  get defaultCorner(): C | undefined {
    return this.corners[0];
  }

  /** States this variant actually binds, in canonical order. Always includes base. */
  statesFor(variant: V): StateName[] {
    const b = this.bindings[variant];
    return STATE_ORDER.filter((s) => s === 'base' || b[s as Exclude<StateName, 'base'>]);
  }

  /** Union of states across all variants, in canonical order. Table columns. */
  get allStates(): StateName[] {
    const seen = new Set<StateName>();
    for (const v of this.variants) for (const s of this.statesFor(v)) seen.add(s);
    return STATE_ORDER.filter((s) => seen.has(s));
  }

  /** True when no variant binds anything but base — the component is static and
   *  the showcase should say so rather than render a one-column state grid. */
  get isStatic(): boolean {
    return this.allStates.length === 1;
  }

  focusModeFor(variant: V): FocusMode {
    return this.bindings[variant].focus;
  }

  intentFor(variant: V): string {
    return this.bindings[variant].intent;
  }

  /* ---------------------------------------------------------------------- *
   * Motion
   * ---------------------------------------------------------------------- */

  /** The transition utilities for this component, compiled from `motion`.
   *
   *  Emitted as `duration-<spring> ease-<spring>` — the token build registers every
   *  spring under the same key in both Tailwind scales precisely so the pair cannot
   *  be mismatched at a call site. A `duration-effects-fast ease-spatial-slow` is
   *  not expressible by accident here. */
  get motionClasses(): string {
    const m = this.motion;
    if (m.properties === 'none') return '';
    return cx(
      TRANSITION_PROPERTY[m.properties],
      `duration-${m.transition}`,
      `ease-${m.transition}`,
      /* A press-scale is the one place a second spring is allowed, and it is applied
       * via active: so it only exists while the pointer is down.
       *
       * Routed through --oz-motion-spatial-scale, which it was not: this shipped as a
       * literal `active:scale-[0.98]`, so a button kept springing under the pointer
       * for a user who had asked for reduced motion while every other spatial
       * movement in the system correctly collapsed. It is the exact bug CLAUDE.md
       * names — "a spatial translate must be written through the multiplier" — and it
       * was introduced in the same change that wrote that rule. Card's lift got it
       * right and this did not, which is why verify-motion.ts now sweeps for it
       * rather than trusting either. At scale 1 this is 0.98; at scale 0 it is 1. */
      m.press && 'active:scale-[calc(1-0.02*var(--oz-motion-spatial-scale))]',
    );
  }

  /** The entrance class, or '' for `none`. Separate from motionClasses because an
   *  entrance runs once on mount and a transition runs on every state change — a
   *  component often wants the second without the first. */
  get enterClass(): string {
    return this.motion.enter === 'none' ? '' : `oz-enter-${this.motion.enter}`;
  }

  /** Which spring family this component's transition belongs to. Used by the
   *  showcase and by the recipe-level assertion below. */
  get transitionFamily(): 'effects' | 'spatial' {
    return this.motion.transition.startsWith('effects') ? 'effects' : 'spatial';
  }

  /** True when this component's declared motion is internally consistent.
   *
   *  The one rule the token build cannot check: it can measure that
   *  `spring/effects-fast` does not overshoot, but it cannot see that a component
   *  put `spatial-slow` on a colour-only transition. That pairing is the single most
   *  common way a design system ends up feeling bouncy and cheap — overshoot on a
   *  colour clips at the channel boundary, so it buys a stall and no bounce. Checked
   *  here, and swept across every registered recipe by scripts/verify-motion.ts. */
  get motionConsistent(): boolean {
    const m = this.motion;
    if (m.properties === 'colors' || m.properties === 'shadow') {
      return this.transitionFamily === 'effects';
    }
    if (m.properties === 'transform') return this.transitionFamily === 'spatial';
    /* colors-and-transform moves, so it wants a spatial spring; the colour riding
     * along on an overshooting curve is a real but invisible cost, and the
     * alternative — two springs — is worse. */
    if (m.properties === 'colors-and-transform') return this.transitionFamily === 'spatial';
    return true;
  }

  /** The class string. See the note at the top of the file for the two modes. */
  classes({ variant, size, corner, force, className }: ClassArgs<V, S, C> = {}): string {
    const v = variant ?? this.defaultVariant;
    const s = size ?? this.defaultSize;
    const c = corner ?? this.defaultCorner;
    const b = this.bindings[v];
    /* Joined into `sized` rather than carried separately so both branches below
     * pick it up without either having to remember to. */
    const sized = cx(
      s !== undefined ? this.sizeClasses[s] : '',
      c !== undefined ? this.cornerClasses[c] ?? '' : '',
    );

    if (force) {
      /* Forced: merge base with the target state and emit unprefixed, so the
       * appearance is visible without interaction. Focus is the exception — it is
       * a ring, not a colour swap, so it is emitted as its real classes plus a
       * static twin below in `forcedFocusClasses`. */
      const merged: TokenBinding = { ...b.base, ...(force === 'base' ? {} : b[force] ?? {}) };
      return cx(this.shape, sized, this.compile(merged, ''), className);
    }

    /* Live: base unprefixed, every other bound state behind its real variant.
     *
     * motionClasses joins here rather than in `shape`, which is where every recipe
     * used to hardcode its own `transition-colors duration-fast ease-standard`. Nine
     * copies of a transition is nine chances to drift, and they had already drifted —
     * that is the same argument the colour bindings won, applied to time. Note it is
     * absent from the forced branch above: a grid cell showing what `hover` looks
     * like should not animate into it. */
    const parts = [this.shape, this.motionClasses, sized, this.compile(b.base, '')];
    for (const state of STATE_ORDER) {
      if (state === 'base') continue;
      const binding = b[state as Exclude<StateName, 'base'>];
      if (binding) parts.push(this.compile(binding, STATE_VARIANT[state]));
    }
    parts.push(FOCUS_CLASSES[b.focus]);
    return cx(...parts, className);
  }

  /** Static rendering of the focus ring, for the one grid cell that shows it.
   *  Mirrors FOCUS_CLASSES with the focus-visible: prefix stripped. */
  forcedFocusClasses(variant: V): string {
    const mode = this.focusModeFor(variant);
    if (mode === 'outline') {
      return 'outline outline-ring outline-offset-ring outline-border-focus';
    }
    if (mode === 'inset') {
      return 'shadow-[inset_0_0_0_var(--oz-focus-ring-width)_var(--oz-color-border-focus-inverse)]';
    }
    return '';
  }

  protected compile(binding: TokenBinding, prefix: string): string {
    const out: string[] = [];
    for (const role of Object.keys(ROLE_UTILITY) as TokenRole[]) {
      const token = binding[role];
      if (!token) continue;
      out.push(prefix + ROLE_UTILITY[role](token));
    }
    return out.join(' ');
  }

  /** variants × states, each cell carrying the classes that render that state.
   *  Cells whose variant does not bind the state are marked `defined: false` and
   *  rendered greyed — an unbound state is information, not a gap to fill in. */
  matrix(size?: S, corner?: C): MatrixCell[] {
    const cells: MatrixCell[] = [];
    for (const variant of this.variants) {
      const bound = new Set(this.statesFor(variant));
      for (const state of this.allStates) {
        cells.push({
          variant,
          state,
          className: this.classes({ variant, size, corner, force: state }),
          defined: bound.has(state),
        });
      }
    }
    return cells;
  }

  /** Every token this recipe names, resolved in one mode, ready to tabulate.
   *  `inherited` marks a role a state does not override, which is how the table
   *  shows that e.g. `hover` keeps `content/on-brand` rather than changing it. */
  bindingRows(mode: Mode): BindingRow[] {
    const rows: BindingRow[] = [];
    for (const variant of this.variants) {
      const b = this.bindings[variant];
      for (const state of this.statesFor(variant)) {
        const own = state === 'base' ? b.base : b[state as Exclude<StateName, 'base'>] ?? {};
        const merged: TokenBinding = { ...b.base, ...own };
        for (const role of Object.keys(ROLE_UTILITY) as TokenRole[]) {
          const token = merged[role];
          if (!token) continue;
          /* Role-aware, because a shadow token is named by elevation step and lives
           * outside the colour namespace. */
          const path = rolePath(role, token);
          const t = resolveRole(role, token, mode);
          rows.push({
            variant,
            state,
            role,
            token,
            path,
            value: cssValue(t),
            primitive: t?.target ?? '—',
            alpha: t?.alpha ?? 1,
            inherited: state !== 'base' && own[role] === undefined,
          });
        }
      }
    }
    return rows;
  }

  /** Distinct role/token pairs this recipe names. Carries the role, which the token
   *  name alone does not imply — 'medium' is a shadow step, not a colour — so tooling
   *  can resolve each one in the right namespace. */
  get bindingRoles(): Array<{ role: TokenRole; token: string }> {
    const seen = new Map<string, { role: TokenRole; token: string }>();
    for (const variant of this.variants) {
      const b = this.bindings[variant];
      for (const state of this.statesFor(variant)) {
        const binding = state === 'base' ? b.base : b[state as Exclude<StateName, 'base'>] ?? {};
        for (const role of Object.keys(ROLE_UTILITY) as TokenRole[]) {
          const token = binding[role];
          if (token) seen.set(`${role}:${token}`, { role, token });
        }
      }
    }
    return [...seen.values()];
  }

  /** Distinct token names this recipe touches. Used for the "N tokens" count and
   *  to prove a component is not quietly reaching outside the system. */
  get tokensUsed(): string[] {
    const seen = new Set<string>();
    for (const variant of this.variants) {
      const b = this.bindings[variant];
      for (const state of this.statesFor(variant)) {
        const binding = state === 'base' ? b.base : b[state as Exclude<StateName, 'base'>] ?? {};
        for (const token of Object.values(binding)) if (token) seen.add(token);
      }
    }
    return [...seen].sort();
  }

  /** Copy-pasteable usage. Generated, so it cannot describe a prop that no longer
   *  exists — the primary thing someone opens a design system reference to get. */
  usage(variant?: V, size?: S, corner?: C): string {
    const v = variant ?? this.defaultVariant;
    const s = size ?? this.defaultSize;
    const c = corner ?? this.defaultCorner;
    const attrs = [`variant="${v}"`];
    if (s !== undefined && this.sizes.length > 1) attrs.push(`size="${s}"`);
    if (c !== undefined && this.corners.length > 1) attrs.push(`shape="${c}"`);
    return `<${this.meta.tag} ${attrs.join(' ')}>${this.sampleChildren(v)}</${this.meta.tag}>`;
  }

  /** Realistic child content for the usage snippet and the live row. Overridden
   *  per component — never "Label", never lorem. Real copy surfaces real problems
   *  like truncation and mixed label lengths. */
  protected sampleChildren(_variant: V): string {
    return 'Generate';
  }

  /** Public accessor for the demo layer. */
  sampleFor(variant: V): string {
    return this.sampleChildren(variant);
  }
}
