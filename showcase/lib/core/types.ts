/* Shared vocabulary for the recipe layer.
 *
 * A recipe never contains a colour. It contains the *name* of a semantic token,
 * exactly as the Tailwind preset exposes it — 'fill-brand-hover', not '#D53100'.
 * CLAUDE.md rule 2 forbids hand-typed colour above tier 1, and this is how that
 * rule reaches the component layer: there is nowhere in a recipe a hex could go. */

/** The five things a state can change. Maps to one utility each — see ROLE_UTILITY. */
export type TokenRole = 'bg' | 'fg' | 'border' | 'shadow';

/** The interaction states this system recognises. CLAUDE.md: a sixth goes in
 *  build/spec.mjs first, never invented at a call site — and never here either. */
export type StateName = 'base' | 'hover' | 'active' | 'disabled' | 'selected';

/** Which of the two documented focus treatments a variant uses.
 *
 *  'outline'  — outward ring in border/focus. For anything on a neutral surface.
 *  'inset'    — inset ring in border/focus-inverse. For saturated fills ONLY.
 *
 *  This is the one focus rule the build cannot gate, because it can assert the
 *  contrast of both tokens but cannot see which one a component reached for
 *  (docs/DEV-GUIDE.md, "The two focus rings"). Encoding it as a required field on
 *  every variant is the closest thing to a gate available at this layer: a new
 *  variant cannot be added without answering the question. */
export type FocusMode = 'outline' | 'inset' | 'none';

/** A set of token names to apply together. Partial because a state usually
 *  overrides one or two roles and inherits the rest from base. */
export type TokenBinding = Partial<Record<TokenRole, string>>;

/**
 * What a border is FOR. Required wherever one is bound.
 *
 * A stroke does exactly one of four jobs, and only two of them need a stroke:
 *
 *   affordance  The boundary IS the control. An input field is a box you type
 *               into and the box is the whole affordance; a secondary button is
 *               distinguished from a primary one by having an outline at all.
 *               Removing it removes the thing itself. KEEP.
 *
 *   state       A focus ring, a selected row. Discrete, must be unambiguous, and
 *               must not be confusable with the resting appearance. KEEP.
 *
 *   separation  Two adjacent regions that would otherwise run together — a card
 *               against the page, a row against the next row. A surface step or
 *               plain space does this without adding a line. BANNED.
 *
 *   elevation   "This floats above that." Shadow says it in light; surface
 *               lightness says it in dark. A stroke says only "there is an edge
 *               here", which is the one thing about a floating panel nobody
 *               needed told. BANNED.
 *
 * The last two are build errors, and that is the whole mechanism by which this
 * system got its strokes back under control: at the start of this work there were
 * 39 border declarations, all at one weight, and the page read as boxes inside
 * boxes. Most were separation, and separation had a cheaper answer the whole time.
 *
 * `elevation` in particular was load-bearing for a real reason and is not any
 * more. In dark mode `surface/elevated` used to be byte-identical to
 * `surface/secondary`, so a popover genuinely had no boundary except its stroke —
 * the border was paying for a ladder that did not express depth. DECISIONS B18
 * fixed the ladder; the borders it was propping up come off here.
 */
export type BorderJob = 'affordance' | 'state' | 'separation' | 'elevation';

/** The springs the token layer emits. Names match `--oz-spring-*` exactly, and the
 *  build gates their properties: anything `effects-*` is measured to confirm it does
 *  not overshoot, anything `spatial-*` is measured to confirm it does. */
export type SpringName =
  | 'effects-fast'
  | 'effects-default'
  | 'effects-slow'
  | 'spatial-fast'
  | 'spatial-default'
  | 'spatial-slow'
  | 'expressive';

/** The four entrance animations shipped by the token layer as `.oz-enter-*`.
 *
 *  Each multiplies its travel by `--oz-motion-spatial-scale`, which is how reduced
 *  motion is honoured — a hand-written keyframe would not be. `'none'` is a real
 *  answer, not an omission: a component that only ever exists inside an already-
 *  animated parent should not animate again on its own. */
export type EnterAnimation = 'none' | 'fade' | 'rise' | 'pop' | 'hero';

/** What a component's motion is.
 *
 *  Required on every recipe, which is the point. Motion shipped in this repo for
 *  months as ten ungated tokens and a paragraph of prose, and the result was what
 *  prose always gets: `transition-colors duration-fast` copied between components,
 *  a `duration-base` somewhere nobody meant, and three components with no
 *  transition at all. The `focus` field on VariantBinding solved the same problem
 *  the same way — the build cannot see which ring a component reached for, so the
 *  type system asks. This asks about motion.
 *
 *  One spring per component, not one per property. If hovering a card changes both
 *  its shadow and its position, those should arrive together; two springs on one
 *  interaction reads as two things happening and is almost always a mistake rather
 *  than a texture. Where a component genuinely needs a second, it declares `press`. */
export type MotionSpec = {
  /** Drives state transitions: hover, active, selected, disabled.
   *
   *  Must be an `effects-*` spring when the state changes only colour, which is the
   *  common case — a spatial spring on a colour is overshoot that clips at the
   *  channel boundary and stalls there. The recipe layer asserts this. */
  transition: SpringName;

  /** Which CSS properties the transition covers. `colors` is Tailwind's
   *  transition-colors set; `transform` and `all` are the escapes for components
   *  that move. Deliberately not free-form: an arbitrary property list is how a
   *  `transition: all` ends up animating layout and dropping frames. */
  properties: 'colors' | 'transform' | 'colors-and-transform' | 'shadow' | 'none';

  /** How it arrives. */
  enter: EnterAnimation;

  /** Optional second spring for a press-scale, on components where the press is
   *  meant to feel physical. Spatial by definition — it is a transform. */
  press?: Extract<SpringName, 'spatial-fast' | 'spatial-default'>;

  /** True for a decorative loop. Only the skeleton, and the reduced-motion block
   *  switches it off. */
  ambient?: boolean;

  /** Why this component moves the way it does. Shown in the showcase next to the
   *  spring names, because "spatial-fast" says what and never says why. */
  intent: string;
};

/** Everything one variant does, across every state it supports.
 *  `base` is required; the rest are optional and merge over it. */
export type VariantBinding = {
  base: TokenBinding;
  hover?: TokenBinding;
  active?: TokenBinding;
  disabled?: TokenBinding;
  selected?: TokenBinding;
  focus: FocusMode;
  /** Why this variant has a border, if it has one.
   *
   *  Required whenever any state of the variant binds `border` — asserted by
   *  scripts/verify-borders.ts rather than by the type system, because the border
   *  can appear on any of five state objects and a conditional required field is
   *  not expressible here. Same device as `focus` and `motion`: the build cannot
   *  see intent, so the author states it and the sweep holds them to it.
   *
   *  Only 'affordance' and 'state' are legal. See BorderJob. */
  borderJob?: BorderJob;
  /** One line explaining the variant's job. Shown in the showcase; also the place
   *  a reviewer finds out whether two variants are actually the same idea. */
  intent: string;
};

/** One row of the generated binding table in the showcase. */
export type BindingRow = {
  variant: string;
  state: StateName;
  role: TokenRole;
  /** Tailwind key, e.g. 'fill-brand-hover'. */
  token: string;
  /** DTCG path the audit knows it by, e.g. 'color/fill/brand-hover'. */
  path: string;
  /** Resolved value in the requested mode, e.g. '#D53100'. */
  value: string;
  /** Tier-1 primitive it came from, e.g. 'solid/brand/70'. */
  primitive: string;
  alpha: number;
  /** True when the state inherits this role from base rather than overriding it. */
  inherited: boolean;
};

/** A cell of the variant × state matrix the showcase renders. */
export type MatrixCell = {
  variant: string;
  state: StateName;
  /** Classes that make the component *look* like it is in that state, statically. */
  className: string;
  /** False when the variant does not bind this state at all. */
  defined: boolean;
};

export type Mode = 'light' | 'dark';
