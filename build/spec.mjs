/**
 * spec.mjs — everything that is a decision rather than a computation.
 *
 * The semantic map is the important part of this file. Light and dark are
 * declared ON THE SAME LINE, so the two modes cannot drift apart. That is the
 * structural fix for the three surface bugs found in the shipped globals.css
 * (dark border == card, light sidebar-border brighter than sidebar, and
 * .force-light being a stale third copy of the theme).
 *
 * Reading a semantic entry:  role: ['<light target>', '<dark target>']
 * A target is a primitive path: 'solid/neutral/10' or 'opacity-15/brand/60'.
 */

export const NAMESPACE = 'oz';

/* ================================================================== *
 * NUMBER PRIMITIVES
 * ================================================================== */

export const NUMBERS = [0, 0.5, 1, 1.5, 2, 2.5, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 72, 80, 96, 120, 1000];

/** 0.5 -> "number-005", 1.5 -> "number-105" (matches the proven import format) */
export const numberName = (n) => `number-${String(n).replace('.', '0')}`;

/* ================================================================== *
 * FOUNDATIONS
 * ================================================================== */

/** Layers need distinct values but only number-1000 exists as a primitive, so
 *  they are authored as literals rather than aliases. Declared before
 *  FOUNDATIONS because FOUNDATIONS.layer references this object directly. */
export const LAYER_LITERALS = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  popover: 1400,
  toast: 1500,
  tooltip: 1600,
};

export const FOUNDATIONS = {
  $description:
    'Spacing, roundness, stroke width, focus ring, touch target, icon sizing, z-index layers, breakpoints and containers. Spacing, roundness, stroke, focus, size and icon alias _Number Primitives; layer, breakpoint and container are authored as literals (see LITERAL_GROUPS) because viewport and stacking values are not members of the spacing scale. Spacing and roundness are ordinal (spacing-5 = 16px); the --oz- namespace means the ordinal names cannot collide with Tailwind\'s own spacing scale.',

  spacing: {
    'spacing-1': 4,
    'spacing-2': 6,
    'spacing-3': 8,
    'spacing-4': 12,
    'spacing-5': 16,
    'spacing-6': 20,
    'spacing-7': 24,
    'spacing-8': 28,
    'spacing-9': 32,
    'spacing-10': 36,
    'spacing-11': 40,
    'spacing-12': 48,
    'spacing-13': 56,
    'spacing-14': 64,
    'spacing-15': 72,
    'spacing-16': 80,
    'spacing-17': 96,
    'spacing-18': 120,
  },

  // radius-5 (10px) is the shipped --radius: 0.65rem.
  roundness: {
    'radius-1': 2,
    'radius-2': 4,
    'radius-3': 6,
    'radius-4': 8,
    'radius-5': 10,
    'radius-6': 12,
    'radius-7': 14,
    'radius-8': 16,
    'radius-9': 20,
    'radius-10': 24,
    'radius-11': 32,
    'radius-12': 40,
    'radius-full': 1000,
  },

  'stroke width': {
    'width-1': 0.5,
    'width-2': 1,
    'width-3': 1.5,
    'width-4': 2,
    'width-5': 2.5,
    'width-6': 4,
  },

  // Explicit focus geometry. The shipped file had --ring identical to --primary
  // and no offset token at all, so focus rings were invisible on brand buttons.
  focus: { 'ring-width': 2, 'ring-offset': 2 },

  size: { 'target-min': 44, 'target-comfortable': 48 },

  icon: { 'size-sm': 16, 'size-md': 20, 'size-lg': 24, 'size-xl': 32, stroke: 2 },

  // Not a copy of LAYER_LITERALS — it IS LAYER_LITERALS. This block used to
  // declare all eight layers as 1000, which was never read: build.mjs discards
  // it for `group === 'layer'` and emits LAYER_LITERALS instead. So the file
  // stated eight values it did not ship, and the eight it did ship lived
  // somewhere else. One source, referenced.
  layer: LAYER_LITERALS,

  breakpoint: { sm: 480, md: 768, lg: 1024, xl: 1280 },

  container: { sm: 640, md: 768, lg: 1024, xl: 1280, gutter: 24 },
};

export const FOUNDATION_STRINGS = { 'container/measure': '65ch' };

/** Groups authored as literals rather than aliases. Viewport and stacking values
 *  are not members of the spacing scale, so forcing them through _Number
 *  Primitives would add meaningless primitives (480, 1280, 1600...). */
export const LITERAL_GROUPS = new Set(['layer', 'breakpoint', 'container']);

/* ================================================================== *
 * MOTION
 * ================================================================== */

export const MOTION = {
  $description:
    'Springs, plus the duration and easing scales they supersede. Springs are computed from a declared settle time and bounce by build/motion.mjs and emitted as CSS linear() curves; nothing here is a hand-tuned bezier. easing/entrance is the cubic-bezier already hardcoded in the shipped .fade-in-spring and .cycling-text-char animations, so adopting these tokens changes no existing motion.',

  /* ---------------------------------------------------------------- *
   * Springs — the motion layer proper
   * ---------------------------------------------------------------- *
   *
   * Two families, and the split is the single most important decision here. It is
   * Material 3 Expressive's, arrived at independently by Apple, and it exists
   * because overshoot means different things to different properties:
   *
   *   effects   colour, opacity, shadow. MUST NOT overshoot — the build gates
   *             this by measuring the emitted curve, not by trusting the
   *             declaration. An opacity that overshoots clips at 1 and holds
   *             there, so the bounce is silently swallowed and all you have
   *             bought is a stall. A colour that overshoots goes somewhere the
   *             palette never defined, which in this repo means outside the
   *             gated set entirely.
   *
   *   spatial   transform, size, position, corner radius. SHOULD overshoot. This
   *             is where a spring earns its keep: a panel that arrives, tips
   *             slightly past its mark and settles reads as an object with mass.
   *             The same panel on a bezier reads as a value being interpolated.
   *
   * Getting this backwards is the classic failure — it is what "the whole app
   * feels bouncy and cheap" actually is: effects springs with bounce on them.
   *
   * `settle` is wall-clock milliseconds until motion is visually finished, and it
   * is exact rather than nominal (see motion.mjs on why it is not SwiftUI's
   * `duration`). Bands follow the timing research: micro interactions 100–200ms,
   * standard 200–300ms, complex 300–400ms, and anything past that needs a reason.
   */
  spring: {
    // -- effects: bounce is 0 here and the build will fail if it is not --------
    /** Hover, press, focus. The most-run animation in the system by orders of
     *  magnitude, so it is the one that must not be slow. */
    'effects-fast': { settle: 120, bounce: 0 },
    /** Default crossfade: badge swapping variant, alert appearing in place. */
    'effects-default': { settle: 180, bounce: 0 },
    /** Larger areas, where a fast fade reads as a flicker. */
    'effects-slow': { settle: 280, bounce: 0 },

    // -- spatial: overshoot is the point ---------------------------------------
    /** Small travel: a checkbox tick, a switch thumb, a chevron rotating. Low
     *  bounce because the distance is short — the same bounce fraction over 12px
     *  is a twitch, over 200px it is a flourish.
     *
     *  Declared at 220ms first and the feedback gate rejected it, correctly: this
     *  fires on click, so it is feedback, and 200ms is the ceiling for anything a
     *  user is waiting on. Note that a bouncing spring finishes its *travel* well
     *  before it finishes settling — at 190ms the thumb has arrived by roughly
     *  115ms and the remainder is the overshoot resolving, so this is quicker in
     *  hand than the number suggests. */
    'spatial-fast': { settle: 190, bounce: 0.12 },
    /** The workhorse: cards, rows, popovers, anything entering a layout. */
    'spatial-default': { settle: 340, bounce: 0.18 },
    /** Sheets, drawers, full-panel movement across the viewport. */
    'spatial-slow': { settle: 480, bounce: 0.22 },

    // -- expressive: rationed on purpose --------------------------------------
    /** Hero moments only — a first successful render, an onboarding reveal. One
     *  per screen at most. Its bounce is loud enough that a second instance on
     *  the same screen turns the first one into noise, which is the same argument
     *  the accent colour gets in CLAUDE.md. */
    expressive: { settle: 520, bounce: 0.38 },
  },

  /* Distance multiplier, and the mechanism by which reduced motion is honoured
   * without any component knowing it happened.
   *
   * Every spatial translation in the system is authored as
   * `translateY(calc(6px * var(--oz-motion-spatial-scale)))`. Normally the
   * multiplier is 1 and nothing is different. Under prefers-reduced-motion the
   * emitted stylesheet redefines it to 0, so the movement collapses to nothing
   * while the opacity transition on the same element keeps running — the element
   * still announces itself, it just no longer travels.
   *
   * That is deliberately not the usual blanket `* { animation: none }` reset. The
   * blanket version removes colour fades too, which carry no vestibular risk
   * whatsoever, and leaves those users with an interface that snaps between states
   * — worse to use, for no accessibility gain. What this system removes is
   * movement, which is the thing actually being asked about.
   */
  scale: { 'spatial-scale': 1 },

  /* ---------------------------------------------------------------- *
   * Durations and beziers — retained, no longer the recommended path
   * ---------------------------------------------------------------- *
   * Kept because dist/shadcn-bridge.css and the app's pre-migration CSS read
   * them, and because DECISIONS B14 turns on easing/entrance being byte-identical
   * to what already shipped. New component work should reach for a spring.
   * `duration/ambient` is the exception with no spring equivalent: a pulse loop is
   * not a spring, it has no target to settle toward.
   */
  duration: {
    instant: '0ms',
    fast: '150ms',
    base: '250ms',
    slow: '420ms',
    slower: '720ms',
    ambient: '1500ms',
  },
  easing: {
    entrance: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
  },
};

/* ------------------------------------------------------------------ *
 * Motion gates
 * ------------------------------------------------------------------ *
 *
 * CLAUDE.md rule 4 says: when you add a token, add its gate, and write the gate by
 * family. Motion shipped for months with ten tokens and zero gates, which is how a
 * `linear` easing ends up on a transition despite the docs saying never — prose is
 * not a gate. These are written as families for the same reason the disabled-fill
 * sweep is: naming one spring and forgetting its three siblings is the documented
 * failure mode of this repo.
 *
 * Each entry names a family by prefix and asserts a measured property of the
 * emitted curve. The build measures; the declaration is not consulted.
 */
/**
 * The surface ladder, ordered from deepest to highest.
 *
 * Elevation in this system is carried by the surface itself, not by a border. That
 * is only true if the ladder is monotonic, and for the whole life of the repo it was
 * not: in dark, `surface/tertiary` sat lighter than both floating surfaces and
 * `surface/elevated` was byte-identical to `surface/secondary`. Nothing caught it.
 * The elevation gates measure whether a drop shadow moves the page enough, which is
 * a different question — and in dark mode it is close to the wrong question, because
 * a shadow on a near-black page barely reads and lightness is doing the work.
 *
 * Direction is mode-dependent and that is the point. Light builds depth by going
 * UP toward white (a popover is brighter than the page it floats over); dark builds
 * it by going up in lightness too, because there is nowhere below near-black to go.
 * So the assertion is not "darker each step" — it is "monotonic away from the page,
 * in whichever direction that mode's page sits".
 *
 * `MIN_STEP` is the separation each rung needs from the next for the surface alone
 * to carry the boundary. Below roughly ΔL 3 a large flat area stops reading as a
 * distinct plane and the border has to come back.
 */
export const SURFACE_LADDER = {
  /* Rungs, deepest first. `elevated` and `overlay` are ONE rung — they share a
   * value in both modes, so listing them as two levels would assert a step between
   * two names for the same plane. `elevated` stands for the pair; the collision
   * list holds them equal to each other and separate from everything below. */
  order: [
    'color/background',
    'color/surface/primary',
    'color/surface/secondary',
    'color/surface/tertiary',
    'color/surface/elevated',
  ],
  /** Light is exempt: white is the top of the ramp, so `elevated` and `overlay` both
   *  sit at neutral/white and separate by shadow instead. Asserting light would force
   *  a grey popover onto a white page to satisfy a gate — H1's rule that a gate may
   *  veto a colour but may never choose one. */
  modes: ['dark'],
  minStep: 0.03,
};

export const MOTION_ASSERTIONS = {
  /** Springs whose name starts with this must never cross their target. Measured
   *  as peak overshoot on the emitted linear() stops. */
  noOvershoot: ['effects-'],

  /** Springs whose name starts with this are expected to overshoot. A spatial
   *  spring with bounce accidentally zeroed is not a crash, it is a silent
   *  downgrade to the thing this whole layer replaced, so it is asserted in the
   *  positive direction too. */
  mustOvershoot: ['spatial-', 'expressive'],

  /** Nothing that runs on hover, press or focus may settle slower than this. It is
   *  the most-executed animation in any interface and the one where latency is
   *  read as the product being slow rather than as the animation being long. */
  feedbackCeilingMs: 200,
  feedbackFamilies: ['effects-fast', 'spatial-fast'],

  /** Ceiling for everything else. Past this an animation is holding the interface
   *  hostage; the timing research puts complex transitions at 300–400ms and treats
   *  beyond that as needing justification. `expressive` is the documented
   *  exception and is allowed its own, higher, ceiling.  */
  generalCeilingMs: 500,
  expressiveCeilingMs: 600,

  /** Peak overshoot above this reads as a toy rather than as mass. 0.38 bounce
   *  measures ~9.5%; the gate is set where a reviewer would start calling it
   *  bouncy, not at the current value, so there is room to tune without moving
   *  the gate. */
  maxOvershoot: 0.2,
};

/* ================================================================== *
 * TYPOGRAPHY
 * ================================================================== */

/**
 * Every fluid size, keyed by the clamp string it produced, so a consumer can recover the
 * endpoints without parsing CSS.
 *
 * Figma has no fluid type — a variable is one number — so the Figma emitter needs the DESKTOP
 * CEILING. The alternative was a regex over the emitted `clamp(...)`, which is a parser for a
 * string this file generates three lines below: it would work until someone changed the
 * expression, and then it would return a number that was silently wrong rather than fail.
 */
export const FLUID_RANGE = new Map();

const fluid = (min, max) => {
  const s = `clamp(${min}px, calc(${min}px + (${max} - ${min}) * (100vw - 360px) / 880), ${max}px)`;
  FLUID_RANGE.set(s, { min, max });
  return s;
};

export const TYPOGRAPHY = {
  $description:
    'Fifteen size steps across four roles, five weights, five Figma font styles. Bricolage Grotesque carries display and heading; Geist carries body and label. Line heights are unitless ratios so they survive the fluid clamp() on display/heading; on the fixed body and label sizes the ratio still lands on the 4px grid (16 x 1.5 = 24, 14 x 1.4286 = 20, 12 x 1.3333 = 16). Letter spacing is unitless and emitted as em.',

  // The bare family name is what Figma binds to. FONT_STACKS below is what CSS
  // gets, because a CSS font-family with no fallback means one failed webfont
  // request drops the whole product to Times New Roman.
  'font family': {
    display: 'Bricolage Grotesque',
    heading: 'Bricolage Grotesque',
    body: 'Geist',
    label: 'Geist',
    mono: 'Geist Mono',
  },

  // Numeric weights: correct for CSS.
  'font weight': { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },

  // String styles: what Figma actually binds to a text layer's weight field.
  // Both sets exist so a weight is usable on BOTH ends. Numbers alone import
  // fine but cannot be applied to a Figma text layer.
  //
  // FIGMA ONLY — see CSS_EXCLUDED_TYPE_GROUPS. These were also being emitted as
  // CSS custom properties, producing `--oz-style-regular: Regular`, which is not
  // a legal value for any CSS property. Five dead, invalid variables.
  'font style': {
    regular: 'Regular',
    medium: 'Medium',
    semibold: 'SemiBold',
    bold: 'Bold',
    extrabold: 'ExtraBold',
  },

  // display + the three largest headings are fluid; body and label never resize.
  'font size': {
    'display lg': fluid(40, 64),
    'display md': fluid(34, 52),
    'display sm': fluid(28, 40),
    'heading xl': fluid(26, 36),
    'heading lg': fluid(24, 30),
    'heading md': fluid(20, 24),
    'heading sm': 20,
    'heading xs': 18,
    'body lg': 18,
    'body md': 16,
    'body sm': 14,
    'body xs': 12,
    'label md': 14,
    'label sm': 12,
    'label xs': 10, // = the shipped .text-2xs, preserved exactly
  },

  'line height': {
    'display lg': 1.0625,
    'display md': 1.0769,
    'display sm': 1.1,
    'heading xl': 1.1111,
    'heading lg': 1.2,
    'heading md': 1.3333,
    'heading sm': 1.4,
    'heading xs': 1.3333,
    'body lg': 1.5556,
    'body md': 1.5,
    'body sm': 1.4286,
    'body xs': 1.3333,
    'label md': 1.1429,
    'label sm': 1.3333,
    'label xs': 1.2,
  },

  // Tightens as size grows, opens as it shrinks. Emitted as em.
  'letter spacing': {
    'display lg': -0.02,
    'display md': -0.02,
    'display sm': -0.015,
    'heading xl': -0.015,
    'heading lg': -0.01,
    'heading md': -0.01,
    'heading sm': -0.005,
    'heading xs': 0,
    'body lg': 0,
    'body md': 0,
    'body sm': 0,
    'body xs': 0.005,
    'label md': 0.005,
    'label sm': 0.01,
    'label xs': 0.02,
  },

  // Documented default pairing. Guidance, not a lock — every size accepts
  // every weight, which was the explicit requirement.
  //
  // Emitted to CSS as the NUMERIC weight, not this key. `--oz-default-weight-
  // display: extrabold` is not a legal font-weight value; `800` is. See
  // TYPE_STRING_TO_WEIGHT in build.mjs.
  'default weight': {
    display: 'extrabold',
    heading: 'semibold',
    body: 'regular',
    label: 'medium',
  },
};

/**
 * CSS font stacks. `font family` above carries the bare family name because that
 * is what Figma binds a text layer to; CSS needs the fallbacks.
 *
 * dist/tokens.css shipped `--oz-font-display: 'Bricolage Grotesque';` with no
 * fallback at all, on all five families, and the generated type utilities
 * consume those variables directly — so a single failed webfont request took the
 * whole product to the browser default serif.
 *
 * Bricolage is a grotesque with tall x-height, so the display fallbacks lead with
 * the system UI stack rather than Arial. Geist is close to Inter metrically.
 */
export const FONT_STACKS = {
  display:
    "'Bricolage Grotesque', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  heading:
    "'Bricolage Grotesque', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  body:
    "'Geist', 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  label:
    "'Geist', 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "'Geist Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
};

/** Typography groups that exist for Figma and must NOT reach CSS. */
export const CSS_EXCLUDED_TYPE_GROUPS = new Set(['font style']);

/* ================================================================== *
 * SEMANTIC MAP  —  [light, dark]
 * ================================================================== */

const S = (p) => `solid/${p}`;
const A15 = (p) => `opacity-15/${p}`;
const A30 = (p) => `opacity-30/${p}`;
const A50 = (p) => `opacity-50/${p}`;

/** Static backgrounds. No interaction states. */
const SURFACE = {
  primary: [S('neutral/10'), S('neutral/130')],
  'primary-variant': [S('neutral/white'), S('neutral/140')],
  secondary: [S('neutral/20'), S('neutral/120')],
  'secondary-variant': [S('neutral/10'), S('neutral/130')],
  // tertiary is the shadcn --muted target. Light moved 30 -> 35 so it clears
  // --border (border/primary, neutral/30); at 30 they were byte-identical and a
  // Separator or bordered input inside a muted panel had no edge at all.
  tertiary: [S('neutral/35'), S('neutral/110')],
  'tertiary-variant': [S('neutral/20'), S('neutral/120')],
  // elevated and overlay were BOTH neutral/120 in dark and both white in light,
  // so a popover sitting on a card had no boundary in either mode. Dark overlay
  // moves off 120; it is also the shadcn --popover target, which at 120 collided
  // with --secondary as well. Light keeps both at white: white is the top of the
  // ramp and a popover on an off-white page separates by shadow, not by hue — so
  // only the light pair is exempt, and the collision gate below asserts the dark
  // pair.
  //
  // DARK ELEVATION, SECOND PASS. Moving overlay to 115 fixed overlay-vs-elevated
  // and left the real problem standing: elevated was still neutral/120, which is
  // byte-identical to secondary, so a popover on a nested surface had no boundary
  // except its border. That is why every floating thing in this system was
  // outlined — the stroke was compensating for a ladder that did not express
  // elevation. Measured in dark, the old order was
  //
  //     tertiary 29.5  >  overlay 26.6  >  elevated 24.1  ==  secondary 24.1
  //
  // i.e. a muted panel read as MORE elevated than a dialog, and a popover read as
  // exactly as elevated as the input background beneath it.
  //
  // In dark mode lightness is the elevation signal — there is nowhere below
  // near-black to go, so depth has to be built upward, which is the model Material
  // uses and the reason its dark surfaces get lighter with every step. The
  // floating pair therefore moves above tertiary rather than below it:
  //
  //     overlay 38.1 > elevated 33.8 > tertiary 29.5 > secondary 24.1 > primary 18.9 > page 12.3
  //
  // Every rung is now ΔL 4.3–6.6 clear of the next, which is enough for the
  // surface alone to carry the boundary and is what lets the borders come off.
  // The monotonicity gate in build.mjs holds this ordering so a future step cannot
  // quietly re-invert it.
  //
  // BOTH land on 105 in dark, and there is exactly one rung available. Finding
  // that took two wrong attempts worth recording, because the constraint is not
  // obvious and the next person to raise this ladder will hit it again.
  //
  // The ceiling is set by text, not by taste. content/tertiary is gated at 4.5:1
  // against every surface, and it clears that floor only up to L* 36.3 — so no dark
  // surface may be lighter than that, full stop. Measured at the candidate rungs:
  //
  //     neutral/95  L* 42.9   tertiary 3.40   fails
  //     neutral/100 L* 38.1   tertiary 4.17   fails
  //     neutral/105 L* 33.8   tertiary 4.95   passes
  //
  // The floor under it is surface/tertiary at neutral/110 (L* 29.5). So the whole
  // available window for a floating surface is 29.5 < L* <= 36.3, and neutral/105
  // is the only rung inside it. One rung, two tokens.
  //
  // They therefore share it, exactly as they share neutral/white in light — and
  // for the same reason the light exemption already gives: at the top of the usable
  // ramp a popover separates from what is under it by shadow and elevation, not by
  // hue. The dark pair was only ever forced apart because both sat at 120 and
  // collided with surface/secondary; moving both above tertiary fixes that
  // collision properly, and the pair-wise assertion between them was standing in
  // for it. See COLLISION_ASSERTIONS.
  //
  // The other wrong attempt: taking 105 for a surface and pushing the disabled
  // fills off it. neutral/105 dark is one of two rungs in the ramp that no enabled
  // surface and no enabled fill occupies, FILL_DISABLED_OVERRIDE took three
  // attempts to find it, and a disabled fill that collides with an enabled one
  // reads as a live control. Surfaces do not get to evict it — but they do get to
  // sit on it, because a disabled fill inside a popover is still distinguishable
  // from the popover by its own label and border, and the collision sweep asserts
  // the pair explicitly.
  //
  //     elevated == overlay 105 (33.8) > tertiary 110 (29.5) > secondary 120 (24.1)
  //       > primary 130 (18.9) > page 150 (12.3)
  elevated: [S('neutral/white'), S('neutral/105')],
  overlay: [S('neutral/white'), S('neutral/105')],
  inverse: [S('neutral/150'), S('neutral/10')],
  fixed: [S('neutral/white'), S('neutral/white')],
  brand: [S('brand/10'), A15('brand/60')],
  success: [S('success/10'), A15('success/60')],
  warning: [S('warning/10'), A15('warning/60')],
  critical: [S('error/10'), A15('error/60')],
  info: [S('info/10'), A15('info/60')],
  // Opaque status containers. The translucent fill/*-secondary tokens are the
  // modern option; these exist because an HSL channel triplet cannot carry
  // alpha, so the shadcn bridge needs an opaque target for --success-soft etc.
  'brand-flat': [S('brand/10'), S('brand/100')],
  'success-flat': [S('success/10'), S('success/100')],
  'warning-flat': [S('warning/10'), S('warning/100')],
  'critical-flat': [S('error/10'), S('error/100')],
  'info-flat': [S('info/10'), S('info/100')],
};

/**
 * Interactive fills. Each track is [base, hover, active] per mode; `disabled`
 * is generated as opacity-50 of the base.
 *
 * Dark hover/active move UP the ramp (lighter) while light moves DOWN (darker).
 * The dark ladder only works because neutral 90 and 100 exist — the shipped
 * ramp had nothing between L 58 and L 29, which is why dark hover and active
 * were byte-identical in the current Figma file.
 *
 * THE FIVE STATUS TRACKS CARRY A WHITE LABEL, so on those the dark ladder is
 * bounded: every step it climbs costs contrast against `content/on-*`. It used
 * to run 60 -> 50 -> 40, which put white at Lc 58.8 on brand hover and Lc 49.9
 * on brand active — beneath the Lc 60 floor this system sets for itself, on the
 * single most-observed state in the product. Only the base fill was gated, so
 * nothing caught it.
 *
 * Now it runs 60 -> 55 -> 50, with step 55 added and 50 nudged down where it
 * overshot. White holds Lc 60.4-66.7 across all three dark states and 66.7-88.1
 * across all three light states, and APCA_ASSERTIONS gates all thirty pairs
 * rather than the five bases. The direction is unchanged and deliberate: a
 * surface a user is pressing should move away from the page, which means darker
 * on a light page and lighter on a dark one.
 */
const FILL = {
  primary: [
    ['neutral/10', 'neutral/20', 'neutral/30'],
    ['neutral/130', 'neutral/120', 'neutral/110'],
  ],
  'primary-variant': [
    ['neutral/white', 'neutral/10', 'neutral/20'],
    ['neutral/140', 'neutral/130', 'neutral/120'],
  ],
  secondary: [
    ['neutral/20', 'neutral/30', 'neutral/40'],
    ['neutral/120', 'neutral/110', 'neutral/100'],
  ],
  'secondary-variant': [
    ['neutral/10', 'neutral/20', 'neutral/30'],
    ['neutral/130', 'neutral/120', 'neutral/110'],
  ],
  tertiary: [
    ['neutral/30', 'neutral/40', 'neutral/50'],
    ['neutral/110', 'neutral/100', 'neutral/90'],
  ],
  'tertiary-variant': [
    ['neutral/20', 'neutral/30', 'neutral/40'],
    ['neutral/120', 'neutral/110', 'neutral/100'],
  ],
  elevated: [
    ['neutral/white', 'neutral/10', 'neutral/20'],
    ['neutral/120', 'neutral/110', 'neutral/100'],
  ],
  inverse: [
    ['neutral/150', 'neutral/140', 'neutral/130'],
    ['neutral/10', 'neutral/20', 'neutral/30'],
  ],
  // Dark stops at 50, not 40. 40 is ~L 0.755 and white dies there (Lc 45-50).
  brand: [
    ['brand/60', 'brand/70', 'brand/80'],
    ['brand/60', 'brand/55', 'brand/50'],
  ],
  success: [
    ['success/60', 'success/70', 'success/80'],
    ['success/60', 'success/55', 'success/50'],
  ],
  warning: [
    ['warning/60', 'warning/70', 'warning/80'],
    ['warning/60', 'warning/55', 'warning/50'],
  ],
  critical: [
    ['error/60', 'error/70', 'error/80'],
    ['error/60', 'error/55', 'error/50'],
  ],
  info: [
    ['info/60', 'info/70', 'info/80'],
    ['info/60', 'info/55', 'info/50'],
  ],
};

/** Translucent "soft" fills — replaces the shipped -soft tokens with a
 *  consistent alpha ladder instead of four one-off pastel hexes. */
const FILL_SOFT = {
  'brand-secondary': [
    [A15('brand/50'), A30('brand/50'), A30('brand/60')],
    [A15('brand/60'), A30('brand/60'), A30('brand/50')],
  ],
  'success-secondary': [
    [A15('success/50'), A30('success/50'), A30('success/60')],
    [A15('success/60'), A30('success/60'), A30('success/50')],
  ],
  'warning-secondary': [
    [A15('warning/50'), A30('warning/50'), A30('warning/60')],
    [A15('warning/60'), A30('warning/60'), A30('warning/50')],
  ],
  'critical-secondary': [
    [A15('error/50'), A30('error/50'), A30('error/60')],
    [A15('error/60'), A30('error/60'), A30('error/50')],
  ],
  'info-secondary': [
    [A15('info/50'), A30('info/50'), A30('info/60')],
    [A15('info/60'), A30('info/60'), A30('info/50')],
  ],
  // SELECTED is a tier-2 role now. It only existed as sidebar/item-selected, so a
  // selected table row, tab, list item, calendar day, segmented-control segment or
  // combobox option had no token and had to reach into the sidebar's tier-3
  // namespace or hardcode. Same brand tint the sidebar uses, so nothing changes
  // visually there; it simply stops being a sidebar-only idea.
  selected: [
    [A15('brand/50'), A30('brand/50'), A30('brand/60')],
    [A15('brand/60'), A30('brand/60'), A30('brand/50')],
  ],
};

/** Borders. [base, hover] per mode; `disabled` generated as opacity-50 of base.
 *  border/primary in dark is neutral/120 against a neutral/130 card — the
 *  shipped file had both at the same value, so card edges were invisible. */
const BORDER = {
  // Dark borders sit HIGHER on the ramp than any dark surface, and land heavier
  // than their light counterparts (1.85:1 vs 1.20:1 against their own card).
  // That asymmetry is deliberate: the dark surface steps are compressed, so a
  // light-weight border disappears. neutral/100 (#444241) is the value that
  // earlier dark-mode testing landed on after neutral/80 overshot at 4.32:1.
  // Dark primary moved 100 -> 95. At 100 it was byte-identical to
  // fill/tertiary-hover, which the bridge maps to --accent, so a hovered table
  // row or dropdown item erased its own divider. That is the same failure as A6
  // and it was live. 95 keeps the border heavier than every dark surface while
  // clearing the hover fill.
  primary: [
    ['neutral/30', 'neutral/40'],
    ['neutral/95', 'neutral/90'],
  ],
  // Light secondary moved 40 -> 45, clearing --accent (fill/tertiary-hover,
  // neutral/40). secondary is the shadcn --input target, so at 40 an input
  // border vanished against a hovered row. 45 also lifts the input edge from
  // 1.37:1 to 1.58:1 against a card, which is the direction 1.4.11 wants.
  secondary: [
    ['neutral/45', 'neutral/50'],
    ['neutral/90', 'neutral/80'],
  ],
  tertiary: [
    ['neutral/50', 'neutral/60'],
    ['neutral/80', 'neutral/70'],
  ],
  elevated: [
    ['neutral/30', 'neutral/40'],
    ['neutral/100', 'neutral/90'],
  ],
  inverse: [
    ['neutral/150', 'neutral/140'],
    ['neutral/10', 'neutral/20'],
  ],
  brand: [
    ['brand/60', 'brand/70'],
    ['brand/60', 'brand/50'],
  ],
  success: [
    ['success/60', 'success/70'],
    ['success/60', 'success/50'],
  ],
  warning: [
    ['warning/60', 'warning/70'],
    ['warning/60', 'warning/50'],
  ],
  critical: [
    ['error/60', 'error/70'],
    ['error/60', 'error/50'],
  ],
  info: [
    ['info/60', 'info/70'],
    ['info/60', 'info/50'],
  ],
};

/**
 * Focus is its own token, distinct from brand fill. Dark uses brand/50 so the
 * ring stays visible against a brand-filled button on a dark page.
 *
 * LIGHT MOVED brand/60 -> brand/70. At brand/60 `border/focus` was byte-identical
 * to `fill/brand`, so the bridge emitted `--ring` and `--primary` as the same
 * value and the focus ring on a brand button was invisible. That is bug A4,
 * which DECISIONS.md records as mechanically enforced — it was not: the gate list
 * asserted ring-vs-border and never ring-vs-primary. brand/70 is the next step
 * down, so the ring reads as a deeper edge of the same hue, and its contrast
 * against the page improves (3.26:1 -> 5.13:1 on surface/primary) rather than
 * regressing. Dark already differed (brand/50 vs brand/60) and is unchanged.
 *
 * A ring drawn ON a brand fill still uses `focus-inverse`; one CSS variable
 * cannot express both, which is why that token exists and is separately gated.
 */
const BORDER_SINGLE = {
  // focus gets its OWN ramp step in each mode — brand/75 light, brand/45 dark —
  // occupied by nothing else in the system. First attempt at fixing A4 moved light
  // focus from brand/60 to brand/70, which cleared `--primary` but landed it
  // byte-identical to border/brand-hover, border/selected and content/brand. That
  // is the same bug one layer down: no visible ring on a selected or hovered
  // brand-bordered control. A ring is the one token that must not share a value
  // with anything it can be drawn against, so it gets a dedicated rung.
  //   light brand/75 -> #C22B00, 5.2:1 worst case against the four light surfaces
  //   dark  brand/45 -> #FF7B5C, 7.6:1 against the dark page
  focus: [S('brand/75'), S('brand/45')],
  // focus-inverse IS AN INSET RING. Draw it inside the element's edge, never with
  // `--oz-focus-ring-offset`, because it is byte-identical to `color/background` in
  // both modes (white on a white page; neutral/150 on a neutral/150 page) — an
  // outward-offset inverse ring puts its own colour in the offset gap and
  // disappears at 1.00:1. That is not a bug in the value: the token exists to sit
  // ON a saturated fill, where it measures 3.55:1 and is gated, and there is no
  // colour that can be both readable on brand orange and readable on the white
  // page it sits on. The constraint is on how it is used, which a gate cannot
  // check, so it is stated here and in DEV-GUIDE.
  'focus-inverse': [S('neutral/white'), S('neutral/150')],
  'brand-secondary': [A30('brand/50'), A30('brand/60')],
  // Edge of a selected row / tab / segment. Pairs with fill/selected above.
  selected: [S('brand/70'), S('brand/50')],
};

/** Text and icons. */
const CONTENT_SINGLE = {
  primary: [S('neutral/150'), S('neutral/20')],
  secondary: [S('neutral/110'), S('neutral/50')],
  // tertiary moved 80 -> 90 light and 70 -> 60 dark. It was gated at 3:1 against
  // the PAGE only, and measured 3.93:1 on a card, 3.66:1 on surface/secondary and
  // 3.07:1 on surface/tertiary in light — i.e. it failed 4.5:1 on every surface an
  // app actually puts text on, while the one gate it had passed. It is the token a
  // timestamp, caption or helper string lands on, so it is body text under 1.4.3.
  // Now 4.70:1 worst case in light and 5.80:1 in dark, on all four surfaces, and
  // gated against each of them rather than against the page.
  tertiary: [S('neutral/90'), S('neutral/60')],
  // No placeholder token existed, so placeholders had to borrow content/tertiary
  // — which at the time failed 4.5:1. Placeholder text is text under 1.4.3, so it
  // gets its own role at a value that passes. Same target as tertiary today; it
  // exists so a component author reaching for "placeholder" does not have to know
  // that, and so the two can diverge without a refactor.
  placeholder: [S('neutral/90'), S('neutral/60')],
  'primary-disabled': [A50('neutral/150'), A50('neutral/20')],
  'secondary-disabled': [A50('neutral/110'), A50('neutral/50')],
  'tertiary-disabled': [A50('neutral/90'), A50('neutral/60')],
  // Links. The most-used interactive text role in any product UI had no token at
  // all, so every link in the app was either hardcoded or borrowed content/brand
  // (which at brand/70 measures 3.53:1 on surface/tertiary and fails AA). All
  // three states clear 4.5:1 on all four surfaces and on the selected tint.
  link: [S('brand/80'), S('brand/50')],
  'link-hover': [S('brand/90'), S('brand/40')],
  'link-visited': [S('spectrum-purple/80'), S('spectrum-purple/50')],
  // Label of a selected row / tab / segment, readable on fill/selected.
  selected: [S('brand/80'), S('brand/50')],
  'inverse-primary': [S('neutral/20'), S('neutral/150')],
  'inverse-secondary': [S('neutral/50'), S('neutral/110')],
  'inverse-primary-disabled': [A50('neutral/20'), A50('neutral/150')],
  'inverse-secondary-disabled': [A50('neutral/50'), A50('neutral/110')],
  'fixed-primary': [S('neutral/150'), S('neutral/150')],
  'fixed-inverse': [S('neutral/white'), S('neutral/white')],
  'fixed-primary-disabled': [A50('neutral/150'), A50('neutral/150')],
  'fixed-inverse-disabled': [A50('neutral/white'), A50('neutral/white')],
};

/**
 * Coloured text. [base, hover, active] per mode; disabled generated.
 *
 * LIGHT MOVED 70/80/90 -> 80/90/100. At step 70 these measured 3.53-4.38:1 on
 * `surface/tertiary` — all five failed 4.5:1 on a muted panel, and two of them
 * (warning, info) only crossed below when `surface/tertiary` moved to the
 * neutral/35 half-step to clear `--border`. They were gated against
 * `color/background` alone, so nothing noticed either before or after.
 *
 * This is the same mistake as `content/tertiary`, made in the same file, and the
 * fix for that one did not generalise because the gate list named one token
 * instead of a category. All five now clear 4.5:1 on all four light surfaces
 * (5.11-6.03:1 worst case) and are gated on the two that bind.
 */
const CONTENT_ROLE = {
  brand: [
    ['brand/80', 'brand/90', 'brand/100'],
    ['brand/50', 'brand/40', 'brand/30'],
  ],
  success: [
    ['success/80', 'success/90', 'success/100'],
    ['success/50', 'success/40', 'success/30'],
  ],
  warning: [
    ['warning/80', 'warning/90', 'warning/100'],
    ['warning/50', 'warning/40', 'warning/30'],
  ],
  critical: [
    ['error/80', 'error/90', 'error/100'],
    ['error/50', 'error/40', 'error/30'],
  ],
  info: [
    ['info/80', 'info/90', 'info/100'],
    ['info/50', 'info/40', 'info/30'],
  ],
};

/**
 * Status text on an INVERTED surface — `surface/inverse` and `surface/fixed`.
 *
 * These are the one place each mode carries a panel of the opposite polarity: in
 * light mode `surface/inverse` is `neutral/150`, a near-black card on a white page.
 * A dark status label on it cannot work, and there was no token that could: moving
 * the light `CONTENT_ROLE` ramp from 70 to 80 to clear `surface/tertiary` dropped
 * all five roles from 3.3–4.1:1 to 2.4–2.9:1 against `surface/inverse`, taking
 * brand below the 1.4.11 3:1 floor it had previously cleared. Ungated, so silent.
 *
 * The fix is a token rather than a compromise on the main ramp, because the two
 * requirements genuinely conflict — one wants darker, the other lighter. Modes are
 * deliberately INVERTED here relative to CONTENT_ROLE: light mode reaches for the
 * step dark mode uses, and vice versa. That is what "inverse" means, and it is why
 * this cannot be derived by a rule.
 *
 * 6.64–6.97:1 in light, 6.55–7.73:1 in dark. Gated on both inverted surfaces.
 */
const CONTENT_ROLE_INVERSE = {
  'brand-inverse': [S('brand/50'), S('brand/80')],
  'success-inverse': [S('success/50'), S('success/80')],
  'warning-inverse': [S('warning/50'), S('warning/80')],
  'critical-inverse': [S('error/50'), S('error/80')],
  'info-inverse': [S('info/50'), S('info/80')],
};

/**
 * content/on-* — text that sits ON a coloured fill.
 *
 * WHITE. Always, on every filled colour, in both modes. This is not a close
 * call and it is not up for renegotiation by a validator:
 *
 *   white on #FF3D01        WCAG 3.55:1 (fail)   APCA Lc 66.7  ← readable
 *   near-black on #FF3D01   WCAG 5.71:1 (pass)   APCA Lc 42.7  ← below any floor
 *
 * Those two numbers read 4.91:1 and Lc 41.0 until this revision, here and in
 * palette.mjs and DECISIONS.md H1. Both wrong: 4.91 appears to be white-on-
 * #D53100 (the light hover fill, 4.92:1) transcribed into the near-black row.
 * Recomputed independently, near-black #070605 on the brand is 5.71:1 / Lc 42.74
 * and pure #000000 is 5.92:1 / Lc 42.80. The argument is unchanged and in fact
 * stronger on the WCAG side, which is exactly why the error mattered — 4.91 is
 * the figure a procurement reviewer would have been handed. The fill is also
 * #FF3D01, not #FF3D00; the brand guide value has never been what this system
 * emits. See palette.mjs FAMILIES.
 *
 * An earlier revision of this file asserted WCAG 4.5:1 here and let the build
 * fail if it regressed. Since fill/brand is fixed by the brand, the only free
 * variable was the text, so the generator "solved" the gate by putting near-black
 * on all five filled colours — including destructive, i.e. a red button with
 * black text. It looked terrible, and it was a validator making a brand
 * decision. The gate was wrong, not the colour.
 *
 * The root cause is structural, so it is worth naming: WCAG 2.x's black/white
 * crossover is Y = 0.179 (#767676). Any brand fill lighter than that mid-grey
 * scores better with black, which is why automated tooling reliably puts black
 * text on saturated oranges, yellows, greens and cyans. See apca() in
 * palette.mjs. These pairs are now gated on APCA Lc instead — APCA_ASSERTIONS.
 *
 * Identical in both modes, because fill/{role} is identical in both modes.
 */
const CONTENT_ON = {
  'on-brand': [S('neutral/white'), S('neutral/white')],
  'on-success': [S('neutral/white'), S('neutral/white')],
  'on-warning': [S('neutral/white'), S('neutral/white')],
  'on-critical': [S('neutral/white'), S('neutral/white')],
  'on-info': [S('neutral/white'), S('neutral/white')],
  'on-inverse': [S('neutral/10'), S('neutral/150')],
  // DISABLED IS NEUTRAL, NOT A FADED BRAND. These were opacity-50 white, paired
  // with an opacity-50 fill, so BOTH layers faded toward the same page and the
  // label converged on its own background: white-on-brand-disabled measured
  // 1.43:1 in light. Fading two stacked layers independently does not behave like
  // fading the composited element, which is what `opacity: .5` on a button does
  // and what the author of those tokens was reaching for.
  //
  // A disabled control is exempt from 1.4.3, so this was never a violation — it
  // was simply unusable, and nothing gated it. Now an opaque neutral label on an
  // opaque neutral fill (see FILL_DISABLED_OVERRIDE): 3.47:1 light, 3.82:1 dark.
  // Legible, unmistakably inactive, identical across all five roles because a
  // control you cannot act on has no reason to keep its role colour.
  //
  // The label is neutral/80 in light and neutral/70 in dark — not the same step in
  // both, because the disabled fills are not mirror images of each other on the
  // ramp. An earlier revision used neutral/80 for both and this comment claimed
  // "3.84:1 dark", which was the measurement for a fill that had already been
  // replaced two edits earlier. Recompute the number when you move the fill.
  'on-brand-disabled': [S('neutral/80'), S('neutral/70')],
  'on-success-disabled': [S('neutral/80'), S('neutral/70')],
  'on-warning-disabled': [S('neutral/80'), S('neutral/70')],
  'on-critical-disabled': [S('neutral/80'), S('neutral/70')],
  'on-info-disabled': [S('neutral/80'), S('neutral/70')],
};

/**
 * Fill tracks whose disabled state is NOT opacity-50 of their own base.
 *
 * The generic rule (opacity-50 of the base) is right for the neutral tracks: a
 * faded grey on the page still reads as a recessed grey. It is wrong for the five
 * status tracks, where it fades a saturated fill toward the page at the same time
 * as its white label fades toward the fill. See CONTENT_ON above.
 */
// A disabled fill must equal NO enabled surface and NO enabled fill, in either
// mode. It took three attempts to get that right, so the reasoning is worth
// keeping:
//   neutral/120 dark  == surface/elevated and surface/secondary. A dead control
//                        read as a card.
//   neutral/110 dark  == surface/tertiary AND six enabled interactive fills
//                        (fill/tertiary, fill/primary-active, fill/secondary-hover
//                        and three -variant states). A dead control read as a LIVE
//                        control, which is worse than reading as a card, and the
//                        comment here excused it by naming only surface/tertiary —
//                        a token list where a category was meant, which is the
//                        exact failure I11c describes.
//   neutral/30 light  == fill/tertiary. Same problem, other mode, unnoticed
//                        because only the dark collision was reported.
//   neutral/105 dark  == surface/elevated and surface/overlay, once the dark
//                        ladder was raised so a floating surface sits above the
//                        muted one. 105 was chosen here precisely because nothing
//                        occupied it, and raising the ladder occupied it — the
//                        fourth attempt, and the first one caused by a change
//                        somewhere else in the file.
//   neutral/100 dark  == nine enabled fills, including secondary-active,
//                        tertiary-hover and elevated-active. The fifth attempt,
//                        and the same failure as 110: a dead control reading as a
//                        live one.
// neutral/25 light and neutral/115 dark are the rungs nothing else occupies.
// Verified against every surface and fill value in both modes by the assertions
// below, which now enumerate the whole surface family rather than two members.
//
// 115 is DARKER than every surface it sits on, and that direction is the decision
// rather than an accident of what was free. neutral/95 was also unoccupied and was
// the other candidate; it is rejected because in dark mode lighter reads as more
// prominent, so a disabled fill above the surfaces would look more actionable than
// the enabled controls beside it — misleading in exactly the direction that
// matters. A disabled control has to recede.
//
// It sits ΔL 2.9 from the enabled fills at neutral/110, which is close, and is
// accepted only because the pair is never distinguished by fill alone: a disabled
// control also carries content/on-*-disabled at neutral/70 against content/primary
// at neutral/20, and that gap is enormous. Note also that WCAG 1.4.3 exempts
// disabled controls from any contrast floor, so nothing here is constrained by the
// L* 36.3 text ceiling the surfaces are held under — only by collision.
export const FILL_DISABLED_OVERRIDE = {
  brand: [S('neutral/25'), S('neutral/115')],
  success: [S('neutral/25'), S('neutral/115')],
  warning: [S('neutral/25'), S('neutral/115')],
  critical: [S('neutral/25'), S('neutral/115')],
  info: [S('neutral/25'), S('neutral/115')],
};

/** Tier 3 — data visualisation. Per-mode, unlike the shipped --chart-* which
 *  were byte-identical in light and dark (chart-4 glared on dark). */
const CHART = {
  // Series are staggered in LIGHTNESS as well as hue (L 46 -> 78 in light,
  // L 54 -> 85 in dark) so they survive greyscale printing and the common forms
  // of colour blindness. The shipped --chart-1..5 were byte-identical in both
  // modes and clustered in one lightness band, so chart-4 glared on dark and
  // four of five series were indistinguishable without colour.
  // Five series, matching the shipped count. Each hue sits at the step where
  // that hue actually reads well — yellow high, purple and blue low — while the
  // set still spans ~32 L* points so the greyscale test passes. Forcing yellow
  // down to L 46 to even out the ladder just makes it look like mud.
  //
  // LIGHT SERIES ALL MOVED DOWN THE RAMP. A chart series is a graphical object
  // under WCAG 1.4.11 and needs 3:1 against the page it is drawn on. Series 3
  // measured 2.54:1 and series 5 measured 2.01:1 on the white page — the two
  // lightest, and neither was gated. On a white page NO hue in this palette
  // clears 3:1 above step 60, so the light band is necessarily L 38-68 rather
  // than the L 46-78 it used to claim.
  //
  // Hue-to-series mapping is unchanged; only the steps move. Each hue still sits
  // as light as it can while clearing the gate, so yellow stays at 60 and purple
  // takes the darkest rung — forcing yellow down to L 38 is exactly the mud the
  // original note warned about. The set still spans 30 L* in light and 31 in
  // dark, in even ~8-point rungs, so the greyscale separation improves.
  //
  //          light (L*)            dark (L*)
  '1': [S('brand/55'), S('brand/50')], //                      68 / 70
  '2': [S('spectrum-blue/80'), S('spectrum-blue/60')], //       46 / 62
  '3': [S('spectrum-teal/70'), S('spectrum-teal/40')], //       54 / 78
  '4': [S('spectrum-purple/90'), S('spectrum-purple/70')], //   38 / 54
  '5': [S('spectrum-yellow/60'), S('spectrum-yellow/30')], //   62 / 85
};

/* Tier 3 — sidebar: DELETED, and the deletion is the point.
 *
 * There were eight tokens here: background, border, item-hover, item-active, item-selected,
 * content, content-muted, content-selected. They came across from the shipped shadcn setup,
 * which ships a `--sidebar-*` group by convention, and the migration rebuilt their VALUES off
 * the neutral ramp without ever asking whether the namespace should exist. The old comment on
 * this block said as much — "the shipped file gave the sidebar nine component tokens while no
 * other surface got any" — and then kept all nine anyway.
 *
 * Four of the eight resolved to the same primitive and alpha as an existing tier-2 token, in
 * BOTH modes. They were aliases with a second name:
 *
 *   sidebar/content           == content/primary
 *   sidebar/content-muted     == content/secondary
 *   sidebar/item-selected     == fill/selected
 *   sidebar/content-selected  == content/selected
 *
 * The other four encoded one real decision — that in dark the sidebar sat BELOW the page
 * instead of above it (background neutral/140 against a neutral/150 page) so the nav receded
 * and the content column read as lit. That is a defensible idea and it is not what the rest of
 * the system does: every other surface goes lighter as it comes forward, which is the whole
 * elevation ladder. Keeping it meant one region permanently exempt from the ladder, expressed
 * as a private namespace rather than as a stated rule, with nothing to tell the next reader
 * that was the intent.
 *
 * So the sidebar now uses the ladder like everything else:
 *
 *   sidebar/background   -> surface/secondary        exact in light, one rung UP in dark
 *   sidebar/border       -> border/secondary
 *   sidebar/item-hover   -> fill/secondary-hover
 *   sidebar/item-active  -> fill/secondary-active    exact in light
 *
 * The visible consequence is in dark only: the sidebar goes #0E0C0B -> #211F1D, so it is
 * lighter than the page rather than nearly identical to it. That is the ladder being applied
 * rather than an accident.
 *
 * PRECEDENT: `fill/selected` was already promoted out of this namespace for the same reason —
 * see the SELECTED comment above, which notes a combobox option "had no token and had to reach
 * into the sidebar's tier-3 namespace or hardcode". This finishes that move.
 */

/** Tier 3 — gradient and mesh stops. Replaces the hardcoded rgb() literals in
 *  .onboarding-gradient, .brand-mesh-border, .brand-mesh-thumb and
 *  vtr-halo-pulse (which used a fifth, undocumented orange). */
const GRADIENT = {
  'mesh-1': [S('brand/40'), S('brand/70')],
  'mesh-2': [S('spectrum-purple/30'), S('spectrum-purple/70')],
  // dark was brand/80, byte-identical to onboarding-1, which flattened the mesh.
  'mesh-3': [S('brand/20'), S('brand/90')],
  'mesh-4': [S('brand/30'), S('brand/60')],
  'mesh-base': [S('neutral/white'), S('neutral/130')],
  'onboarding-1': [S('brand/60'), S('brand/80')],
  'onboarding-2': [S('spectrum-pink/60'), S('spectrum-pink/80')],
  'onboarding-3': [S('spectrum-purple/60'), S('spectrum-purple/80')],
  'halo': [A30('brand/60'), A30('brand/50')],
};

/**
 * Elevation. Light shadows are a tinted warm grey rather than pure black, so
 * they read as shadow instead of dirt. Dark shadows go black AND dark mode leans
 * on surface + border for elevation as well, because a shadow cast on a
 * neutral/150 page has only L 0.123 of room to darken into.
 *
 * TARGETS ARE PRIMITIVE PATHS, NOT HEXES. These were the last literals above
 * tier 1 — ten of them — which made README rule 1 ("zero literals above tier 1")
 * false and left 6 of 201 semantic tokens with no alias metadata for Figma. Two
 * of the three hexes were already primitives spelled out longhand (#070605 is
 * neutral/150, #000000 is neutral/black). The third, #9F9E9C, was the only
 * colour in the entire system outside the OKLCH engine: hue 84.6 against a
 * NEUTRAL_HUE of 50, so it was not even on the neutral ramp it appeared to
 * belong to. It is now neutral/60, the nearest ramp step at ΔL 0.030 — a
 * difference no one can see through an 8-20% alpha.
 *
 * `alpha` stays a local property. It is a property of the shadow, not a colour
 * choice, and the 8/15/30/50 ladder is for fills.
 *
 * DARK ALPHAS RAISED from 0.24/0.32/0.40/0.48 to 0.45/0.60/0.75/0.90. The old
 * set moved the page by ΔL 0.009-0.024 where light moved it 0.027-0.066, so dark
 * elevation was roughly a third of the strength of light and the large shadow was
 * weaker than the light x-small. Now 0.024-0.058 on the page and 0.041-0.104 on a
 * card, which is parity or better.
 *
 * A note on how that went unnoticed: measured by WCAG ratio the dark shadows
 * scored 1.007-1.017, which reads as "inert" and overstates it — that formula's
 * +0.05 flare term swamps everything near black, exactly the way its missing
 * polarity term misjudges white-on-orange in H1. ΔL is the honest instrument at
 * this end of the ramp. The shadows were genuinely too weak; they were never
 * doing literally nothing.
 */
const ELEVATION = {
  'overlay/dimness': [
    { target: 'solid/neutral/150', alpha: 0.4 },
    { target: 'solid/neutral/black', alpha: 0.6 },
  ],
  'overlay/blur': [4, 4],
  'drop shadow/x-small': [
    { target: 'solid/neutral/60', alpha: 0.08 },
    { target: 'solid/neutral/black', alpha: 0.45 },
  ],
  'drop shadow/small': [
    { target: 'solid/neutral/60', alpha: 0.12 },
    { target: 'solid/neutral/black', alpha: 0.6 },
  ],
  'drop shadow/medium': [
    { target: 'solid/neutral/60', alpha: 0.16 },
    { target: 'solid/neutral/black', alpha: 0.75 },
  ],
  'drop shadow/large': [
    { target: 'solid/neutral/60', alpha: 0.2 },
    { target: 'solid/neutral/black', alpha: 0.9 },
  ],
};

export const SEMANTIC = {
  SURFACE,
  FILL,
  FILL_SOFT,
  BORDER,
  BORDER_SINGLE,
  CONTENT_SINGLE,
  CONTENT_ROLE,
  CONTENT_ROLE_INVERSE,
  CONTENT_ON,
  CHART,
  GRADIENT,
  ELEVATION,
};

/* ================================================================== *
 * SHADCN BRIDGE
 * ================================================================== */

/**
 * Maps every variable the existing shadcn components already consume onto a new
 * semantic token. Emitted as HSL channel triplets so `hsl(var(--background))`
 * keeps working untouched — no component has to change on day one.
 *
 * Where the shipped file had a bug, the bridge points at the CORRECT token, so
 * dropping the bridge in fixes the bug without a code change:
 *   --border  now resolves to border/primary, not the card colour
 *   --ring    now resolves to border/focus, not --primary
 *   --accent  now resolves to fill/tertiary-hover, not --muted
 *
 * That third line said `fill/secondary-hover` while the map below has always
 * said `fill/tertiary-hover`. The map was right.
 *
 * A WARNING FROM THIS FILE'S OWN HISTORY. Claiming a bug is fixed here is not
 * the same as fixing it. Three of the bugs this comment block advertises as
 * resolved were still byte-identical in the emitted CSS, because the values
 * happened to collide again one ramp step later and BRIDGE_COLLISIONS did not
 * name the pair. Every claim above is now backed by an entry in that list; if
 * you add a mapping here, add its collision constraint too.
 */
export const SHADCN_BRIDGE = {
  background: 'color/background',
  foreground: 'color/content/primary',
  card: 'color/surface/primary',
  'card-foreground': 'color/content/primary',
  popover: 'color/surface/overlay',
  'popover-foreground': 'color/content/primary',
  primary: 'color/fill/brand',
  'primary-foreground': 'color/content/on-brand',
  // secondary / muted / accent must land on THREE different ramp steps.
  // In the shipped file --accent and --muted were byte-identical, so hovered
  // rows were indistinguishable from muted surfaces.
  secondary: 'color/fill/secondary',           // neutral 20 / 120
  'secondary-foreground': 'color/content/primary',
  muted: 'color/surface/tertiary',             // neutral 30 / 110
  'muted-foreground': 'color/content/secondary',
  accent: 'color/fill/tertiary-hover',         // neutral 40 / 100
  'accent-foreground': 'color/content/primary',
  destructive: 'color/fill/critical',
  'destructive-foreground': 'color/content/on-critical',
  'destructive-soft': 'color/surface/critical-flat',
  success: 'color/fill/success',
  'success-foreground': 'color/content/on-success',
  'success-soft': 'color/surface/success-flat',
  warning: 'color/fill/warning',
  'warning-foreground': 'color/content/on-warning',
  'warning-soft': 'color/surface/warning-flat',
  info: 'color/fill/info',
  'info-foreground': 'color/content/on-info',
  'info-soft': 'color/surface/info-flat',
  border: 'color/border/primary',
  input: 'color/border/secondary',
  ring: 'color/border/focus',
  'chart-1': 'color/chart/1',
  'chart-2': 'color/chart/2',
  'chart-3': 'color/chart/3',
  'chart-4': 'color/chart/4',
  'chart-5': 'color/chart/5',
  sidebar: 'color/surface/secondary',
  'sidebar-foreground': 'color/content/primary',
  'sidebar-primary': 'color/fill/brand',
  'sidebar-primary-foreground': 'color/content/on-brand',
  'sidebar-accent': 'color/fill/secondary-hover',
  'sidebar-accent-foreground': 'color/content/primary',
  'sidebar-border': 'color/border/secondary',
  'sidebar-ring': 'color/border/focus',
};

/**
 * Contrast gates. The build FAILS if any of these regress, in either mode.
 * That is the guarantee: nobody can quietly reintroduce the white-on-orange bug.
 *
 * Entries are `[foreground, background, minRatio]`, or
 * `[foreground, background, minRatio, 'light'|'dark']` to restrict a pair to one
 * mode — needed where a role only exists in one polarity.
 *
 * WRITE THESE BY FAMILY, NOT BY TOKEN. Every contrast bug this repo has had came
 * from gating one member of a group: content/tertiary against the page but not the
 * three surfaces, on-brand against the base fill but not hover and active,
 * content/brand against the page while its four status siblings went unchecked.
 * If you add a gate for one token, ask what else is in its family.
 */
export const CONTRAST_ASSERTIONS = [
  // AA 4.5:1 — normal-size text.
  //
  // NOTE: text-on-saturated-fill is deliberately NOT in this list. WCAG 2.x is
  // the wrong instrument for those pairs and asserting it here is what produced
  // black-on-orange buttons. They live in APCA_ASSERTIONS below.
  ['color/content/primary', 'color/background', 4.5],
  ['color/content/secondary', 'color/background', 4.5],
  ['color/content/primary', 'color/surface/primary', 4.5],
  ['color/content/secondary', 'color/surface/primary', 4.5],
  ['color/content/primary', 'color/surface/secondary', 4.5],
  ['color/content/primary', 'color/surface/tertiary', 4.5],
  // All five status text roles, on the page AND on the two surfaces that bind.
  // These were gated against the page only, and all five failed 4.5:1 on
  // surface/tertiary. Enumerated rather than looped so the failure message names
  // the pair, but if you add a sixth role, add its three lines.
  ['color/content/brand', 'color/background', 4.5],
  ['color/content/brand', 'color/surface/secondary', 4.5],
  ['color/content/brand', 'color/surface/tertiary', 4.5],
  ['color/content/critical', 'color/background', 4.5],
  ['color/content/critical', 'color/surface/secondary', 4.5],
  ['color/content/critical', 'color/surface/tertiary', 4.5],
  ['color/content/success', 'color/background', 4.5],
  ['color/content/success', 'color/surface/tertiary', 4.5],
  ['color/content/warning', 'color/background', 4.5],
  ['color/content/warning', 'color/surface/tertiary', 4.5],
  ['color/content/info', 'color/background', 4.5],
  ['color/content/info', 'color/surface/tertiary', 4.5],
  ['color/content/primary', 'color/surface/brand-flat', 4.5],
  ['color/content/primary', 'color/surface/critical-flat', 4.5],

  // The fixed pair, which had no gate at all until the icon button needed one.
  // `fixed` is the pair that does not invert: white fill, near-black label, in both
  // modes, for a control sitting on an image whose mode is unknowable. Both members
  // are mode-independent, so one assertion covers both modes.
  //
  // Purely additive — it gates two tokens that already shipped and were simply never
  // measured against each other. Nothing here changes a value.
  ['color/content/fixed-primary', 'color/fill/fixed', 4.5],

  // Quiet text, on EVERY surface it can land on rather than only the page.
  // content/tertiary was gated at 3:1 against the page alone and measured
  // 3.93 / 3.66 / 3.07:1 on the three surfaces in light — it failed 4.5:1
  // everywhere an app actually draws text, while its single gate passed.
  ['color/content/tertiary', 'color/background', 4.5],
  ['color/content/tertiary', 'color/surface/primary', 4.5],
  ['color/content/tertiary', 'color/surface/secondary', 4.5],
  ['color/content/tertiary', 'color/surface/tertiary', 4.5],
  ['color/content/placeholder', 'color/surface/primary', 4.5],
  ['color/content/placeholder', 'color/surface/tertiary', 4.5],
  // Links, on the page and on a card.
  ['color/content/link', 'color/background', 4.5],
  ['color/content/link', 'color/surface/primary', 4.5],
  ['color/content/link', 'color/surface/tertiary', 4.5],
  ['color/content/link-hover', 'color/surface/primary', 4.5],
  ['color/content/link-visited', 'color/surface/primary', 4.5],
  ['color/content/link-visited', 'color/surface/tertiary', 4.5],
  // Selected row / tab label on its own tint, tier 2 and tier 3.
  ['color/content/selected', 'color/fill/selected', 4.5],
  ['color/content/selected', 'color/surface/secondary', 4.5],
  // Secondary text on the surfaces, not just the page.
  ['color/content/secondary', 'color/surface/secondary', 4.5],
  ['color/content/secondary', 'color/surface/tertiary', 4.5],
  // The two members of the surface family this list never reached. content/* was
  // gated against the page and three surfaces and stopped there, so the two
  // floating surfaces — the ones a popover and a dialog are made of — were the
  // only places text could be set without a floor. Exactly the shape of I-series
  // bug CLAUDE.md rule 4 describes, and it went unnoticed while both were dark
  // enough to pass by luck. Raising the dark ladder is what surfaced it: at
  // neutral/95 the secondary pair measured 4.49:1 against a 4.5 floor, which is a
  // fail nothing would have reported.
  ['color/content/primary', 'color/surface/elevated', 4.5],
  ['color/content/primary', 'color/surface/overlay', 4.5],
  ['color/content/secondary', 'color/surface/elevated', 4.5],
  ['color/content/secondary', 'color/surface/overlay', 4.5],
  ['color/content/tertiary', 'color/surface/elevated', 4.5],
  ['color/content/tertiary', 'color/surface/overlay', 4.5],

  // AA 3:1 — large text and meaningful non-text boundaries (WCAG 1.4.11)
  ['color/border/focus', 'color/background', 3],
  ['color/border/focus', 'color/surface/primary', 3],
  // A focus ring ON a brand-filled button must use focus-inverse, not focus.
  // This is why border/focus-inverse exists.
  ['color/border/focus-inverse', 'color/fill/brand', 3],
  // Chart series are graphical objects under 1.4.11 and were entirely ungated
  // against the page they sit on. Series 3 measured 2.54:1 and series 5 measured
  // 2.01:1 in light before the light band was moved down the ramp.
  ['color/chart/1', 'color/background', 3],
  ['color/chart/2', 'color/background', 3],
  ['color/chart/3', 'color/background', 3],
  ['color/chart/4', 'color/background', 3],
  ['color/chart/5', 'color/background', 3],
  // Disabled controls are exempt from 1.4.3, so this is a self-imposed floor
  // rather than a conformance one. It exists because the previous treatment
  // faded label and fill independently and landed at 1.43:1.
  ['color/content/on-brand-disabled', 'color/fill/brand-disabled', 3],
  ['color/content/on-critical-disabled', 'color/fill/critical-disabled', 3],
  ['color/content/on-success-disabled', 'color/fill/success-disabled', 3],
  ['color/content/on-warning-disabled', 'color/fill/warning-disabled', 3],
  ['color/content/on-info-disabled', 'color/fill/info-disabled', 3],

  // Status text on the INVERTED surfaces. Each mode has exactly one panel of the
  // opposite polarity, and until content/*-inverse existed there was no token that
  // could sit on it — the main ramp measured 2.4-2.9:1 there after being darkened
  // to clear surface/tertiary, with brand below the 3:1 floor it used to clear.
  ['color/content/brand-inverse', 'color/surface/inverse', 4.5],
  ['color/content/success-inverse', 'color/surface/inverse', 4.5],
  ['color/content/warning-inverse', 'color/surface/inverse', 4.5],
  ['color/content/critical-inverse', 'color/surface/inverse', 4.5],
  ['color/content/info-inverse', 'color/surface/inverse', 4.5],
  ['color/content/inverse-primary', 'color/surface/inverse', 4.5],
  // The inverse focus ring is what belongs on an inverted panel. Gating it here
  // makes the intended pairing explicit rather than leaving it to be inferred:
  // border/focus itself measures 2.4-2.6:1 on these two surfaces and must not be
  // used on them.
  ['color/border/focus-inverse', 'color/surface/inverse', 3],
  // surface/fixed is white in BOTH modes — that is what "fixed" means. So the
  // inverse ring belongs on it only in dark, where focus-inverse is near-black
  // (20.25:1). In light, focus-inverse is white and would be invisible on it at
  // 1.00:1; the ordinary brand ring is the correct one there, asserted on the next
  // line. This gate caught that the moment it was added.
  ['color/border/focus-inverse', 'color/surface/fixed', 3, 'dark'],
  ['color/border/focus', 'color/surface/fixed', 3, 'light'],
];

/**
 * Text on saturated fills, gated on APCA Lc instead of WCAG 2.x ratio.
 *
 * Lc 60 is the body-text threshold. Button labels ship at 14–16px semibold, so
 * 60 is the right floor. Across all thirty gated pairs the white-on-fill values
 * land Lc 60.4–93.3. The tightest are the dark ACTIVE fills at 60.4 (brand) and
 * 60.4 (success) — deliberately close, because those two are the lightest fills
 * white has to sit on anywhere in the system, and moving them further would
 * flatten the dark press state. If you nudge the brand ramp, these are the two
 * that break first.
 *
 * These pairs will be flagged by axe, Lighthouse and any other WCAG-2-based
 * checker, because white on a vivid mid-lightness fill measures 3.5–4.4:1 by
 * that formula. So does every brand shipping this hue — Reddit #FF4500 (3.44),
 * SoundCloud #FF5500 (3.21), Home Depot #F96302 (3.08), Etsy #F1641E (3.19),
 * Ubuntu #E95420 (3.65). This is a known, accepted divergence, not an oversight;
 * docs/DECISIONS.md records it. If a procurement VPAT ever forces the WCAG-2
 * number, the lever is the FILL, not the text: brand → #D62D00 puts white at
 * 4.96:1 and Lc 78. Never solve it by darkening the label.
 *
 * The flagged range was stated as 3.1–3.7:1. Measured on the five resting fills it
 * is 3.55–4.38:1; nothing in this system is at 3.1. Across all fifteen gated states
 * the WCAG formula spans 2.90–8.40:1 while APCA holds them in a Lc 60.4–93.3 band —
 * that spread is the clearest statement of why one of the two instruments is
 * measuring the wrong thing. The competitor figures are correct to 2 dp.
 */
export const APCA_ASSERTIONS = [
  // EVERY state, not just the base. Gating only the base is how white-on-brand
  // shipped at Lc 58.8 on hover and Lc 49.9 on active in dark mode: the label
  // never changes, the fill does, so the base passing tells you nothing about
  // the state a user actually spends time looking at.
  ['color/content/on-brand', 'color/fill/brand', 60],
  ['color/content/on-brand', 'color/fill/brand-hover', 60],
  ['color/content/on-brand', 'color/fill/brand-active', 60],
  ['color/content/on-success', 'color/fill/success', 60],
  ['color/content/on-success', 'color/fill/success-hover', 60],
  ['color/content/on-success', 'color/fill/success-active', 60],
  ['color/content/on-warning', 'color/fill/warning', 60],
  ['color/content/on-warning', 'color/fill/warning-hover', 60],
  ['color/content/on-warning', 'color/fill/warning-active', 60],
  ['color/content/on-critical', 'color/fill/critical', 60],
  ['color/content/on-critical', 'color/fill/critical-hover', 60],
  ['color/content/on-critical', 'color/fill/critical-active', 60],
  ['color/content/on-info', 'color/fill/info', 60],
  ['color/content/on-info', 'color/fill/info-hover', 60],
  ['color/content/on-info', 'color/fill/info-active', 60],
];

/**
 * Visibility floor for decorative edges. Borders in HeyOz are deliberately soft
 * — forcing 3:1 on every card edge would change the brand. The bar here is only
 * "can a human see it at all", which is what the shipped dark theme failed:
 * --border and --card were the same value, so ratio was exactly 1.00.
 */
export const VISIBILITY_ASSERTIONS = [
  ['color/border/primary', 'color/surface/primary', 1.1],
  ['color/border/primary', 'color/background', 1.1],
  ['color/border/secondary', 'color/surface/primary', 1.3],
  ['color/border/tertiary', 'color/surface/primary', 1.6],
  ['color/surface/primary', 'color/background', 1.02],
];

/**
 * Token pairs that must never resolve to the same value.
 *
 * `[a, b]` asserts in both modes. `[a, b, 'dark']` asserts in that mode only,
 * for pairs that legitimately share a value in the other one.
 */
export const COLLISION_ASSERTIONS = [
  ['color/border/primary', 'color/surface/primary'],
  ['color/border/primary', 'color/background'],
  ['color/surface/primary', 'color/background'],
  // A popover on a card needs an edge. Both were neutral/120 in dark, so there
  // was no boundary at all. DARK ONLY: in light both are correctly neutral/white,
  // because white is the top of the ramp and the page itself is white — a popover
  // there separates by shadow and border, not by fill. Asserting light would
  // force a grey popover onto a white page to satisfy a gate, which is the exact
  // failure mode H1 is about: a gate may veto a colour, it may never choose one.
  // elevated vs overlay is NO LONGER asserted, in either mode, and that is a
  // deliberate removal rather than a gate relaxed to make a build pass.
  //
  // It existed because both sat at neutral/120 in dark, where they were also
  // byte-identical to surface/secondary — so a popover on a card had no boundary.
  // The pair-wise assertion was standing in for the real defect, which was that
  // neither surface was above the ladder it floats over. Both now sit at
  // neutral/105, ΔL 4.3 clear of surface/tertiary and 9.7 clear of
  // surface/secondary, and the assertions below hold that. With the real
  // separation asserted, forcing the two floating tokens apart from each other
  // asserts nothing — light has never asserted it, for the reason the original
  // comment gives, and that reason now holds in dark too.
  //
  // The sibling this list forgot for the whole life of the repo: elevated and
  // overlay were gated against each other while elevated sat byte-identical to
  // secondary. Rule 4 — gating one member of a family and not the rest is this
  // repo's most repeated bug, and a surface is in a family with every other
  // surface it can be stacked on.
  ['color/surface/elevated', 'color/surface/secondary', 'dark'],
  ['color/surface/elevated', 'color/surface/tertiary', 'dark'],
  ['color/surface/overlay', 'color/surface/secondary', 'dark'],
  ['color/surface/overlay', 'color/surface/tertiary', 'dark'],
  // Both floating surfaces now sit on the disabled-fill rung, so the pair that
  // FILL_DISABLED_OVERRIDE spent three attempts avoiding has to be asserted
  // directly rather than assumed from "nothing else occupies 105".
  ['color/fill/brand-disabled', 'color/surface/elevated'],
  ['color/fill/brand-disabled', 'color/surface/overlay'],
  // A border must not vanish against the muted surface it is drawn on.
  ['color/border/primary', 'color/surface/tertiary'],
  ['color/border/secondary', 'color/fill/tertiary-hover'],
  // The focus ring must differ from the fill it rings. This is bug A4, and its
  // absence from this list for the whole life of the repo is why A4 was still
  // live while DECISIONS.md recorded it as mechanically enforced.
  ['color/border/focus', 'color/fill/brand'],
  ['color/border/focus', 'color/chart/1'],
  // A hovered row must not erase its own divider (the dark --accent === --border
  // failure). fill/tertiary-hover is the bridge's --accent.
  ['color/border/primary', 'color/fill/tertiary-hover'],
  // The focus ring must not equal anything it can be drawn against. The first
  // attempt at A4 cleared fill/brand and immediately collided with these three
  // instead, which is why focus now owns a dedicated ramp step per mode.
  ['color/border/focus', 'color/border/selected'],
  ['color/border/focus', 'color/border/brand-hover'],
  ['color/border/focus', 'color/fill/brand-hover'],
  ['color/border/focus', 'color/fill/brand-active'],
  ['color/border/focus', 'color/content/brand'],
  // A disabled control must not read as a card, and must not read as a LIVE
  // control. Naming two surfaces here is what let neutral/110 through — it cleared
  // surface/elevated and surface/primary and collided with surface/tertiary plus
  // six enabled fills instead. The whole family is enumerated below, and
  // DISABLED_MUST_DIFFER_FAMILIES generates the rest.
  ['color/fill/brand-disabled', 'color/surface/elevated'],
  ['color/fill/brand-disabled', 'color/surface/primary'],
  ['color/fill/brand-disabled', 'color/surface/secondary'],
  ['color/fill/brand-disabled', 'color/surface/tertiary'],
  ['color/fill/brand-disabled', 'color/surface/overlay'],
  ['color/fill/brand-disabled', 'color/background'],
  // Decorative, but two gradient stops resolving to one colour flattens the mesh.
  ['color/gradient/mesh-3', 'color/gradient/onboarding-1'],
];

/**
 * shadcn variables that must stay distinct from each other.
 *
 * Every entry added below corresponds to a collision that was LIVE in dist/ and
 * that this list was too short to catch. The lesson is in the shape of the list,
 * not the values: three of the six bugs DECISIONS.md §A claims are mechanically
 * enforced were sitting in the emitted CSS, because a gate only guards the pairs
 * you remember to name.
 */
export const BRIDGE_COLLISIONS = [
  ['secondary', 'muted'],
  ['muted', 'accent'],
  ['secondary', 'accent'],
  ['border', 'card'],
  ['input', 'card'],
  ['ring', 'border'],
  ['sidebar', 'sidebar-border'],
  ['ring', 'primary'],              // was 1.00:1 in light — the A4 bug, live
  ['ring', 'sidebar-primary'],
  ['border', 'muted'],              // was 1.00:1 in light
  ['border', 'accent'],             // was 1.00:1 in dark
  ['border', 'input'],
  ['border', 'secondary'],
  ['input', 'accent'],              // was 1.00:1 in light
  ['popover', 'secondary'],         // was 1.00:1 in dark
  ['popover', 'card'],
  ['sidebar-accent', 'sidebar-border'], // was 1.00:1 in both modes
  ['sidebar-accent', 'sidebar'],
];
