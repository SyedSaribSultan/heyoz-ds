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

/** 0.5 -> "number-05", 1.5 -> "number-105" (matches the proven import format) */
export const numberName = (n) => `number-${String(n).replace('.', '0')}`;

/* ================================================================== *
 * FOUNDATIONS
 * ================================================================== */

export const FOUNDATIONS = {
  $description:
    'Spacing, roundness, stroke width, focus ring, touch target, icon sizing, z-index layers, breakpoints and containers. Every value aliases _Number Primitives. Spacing and roundness are ordinal (spacing-5 = 16px); the --oz- namespace means the ordinal names cannot collide with Tailwind\'s own spacing scale.',

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

  layer: {
    base: 0,
    dropdown: 1000,
    sticky: 1000,
    overlay: 1000,
    modal: 1000,
    popover: 1000,
    toast: 1000,
    tooltip: 1000,
  },

  breakpoint: { sm: 480, md: 768, lg: 1024, xl: 1280 },

  container: { sm: 640, md: 768, lg: 1024, xl: 1280, gutter: 24 },
};

/** Layers need distinct values but only number-1000 exists as a primitive, so
 *  they are authored as literals rather than aliases. Kept separate for clarity. */
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
    'Durations and easing curves. easing/entrance is the cubic-bezier already hardcoded in the shipped .fade-in-spring and .cycling-text-char animations, so adopting these tokens changes no existing motion.',
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

/* ================================================================== *
 * TYPOGRAPHY
 * ================================================================== */

const fluid = (min, max) =>
  `clamp(${min}px, calc(${min}px + (${max} - ${min}) * (100vw - 360px) / 880), ${max}px)`;

export const TYPOGRAPHY = {
  $description:
    'Fifteen size steps across four roles, five weights, five Figma font styles. Bricolage Grotesque carries display and heading; Geist carries body and label. Line heights are unitless ratios so they survive the fluid clamp() on display/heading; on the fixed body and label sizes the ratio still lands on the 4px grid (16 x 1.5 = 24, 14 x 1.4286 = 20, 12 x 1.3333 = 16). Letter spacing is unitless and emitted as em.',

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
  'default weight': {
    display: 'extrabold',
    heading: 'semibold',
    body: 'regular',
    label: 'medium',
  },
};

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
  // moves to the 115 half-step; it is also the shadcn --popover target, which at
  // 120 collided with --secondary as well. Light keeps both at white: white is
  // the top of the ramp and a popover on an off-white page separates by shadow,
  // not by hue — so only the light pair is exempt, and the collision gate below
  // asserts the dark pair.
  elevated: [S('neutral/white'), S('neutral/120')],
  overlay: [S('neutral/white'), S('neutral/115')],
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
  focus: [S('brand/70'), S('brand/50')],
  'focus-inverse': [S('neutral/white'), S('neutral/150')],
  'brand-secondary': [A30('brand/50'), A30('brand/60')],
};

/** Text and icons. */
const CONTENT_SINGLE = {
  primary: [S('neutral/150'), S('neutral/20')],
  secondary: [S('neutral/110'), S('neutral/50')],
  tertiary: [S('neutral/80'), S('neutral/70')],
  'primary-disabled': [A50('neutral/150'), A50('neutral/20')],
  'secondary-disabled': [A50('neutral/110'), A50('neutral/50')],
  'tertiary-disabled': [A50('neutral/80'), A50('neutral/70')],
  'inverse-primary': [S('neutral/20'), S('neutral/150')],
  'inverse-secondary': [S('neutral/50'), S('neutral/110')],
  'inverse-primary-disabled': [A50('neutral/20'), A50('neutral/150')],
  'inverse-secondary-disabled': [A50('neutral/50'), A50('neutral/110')],
  'fixed-primary': [S('neutral/150'), S('neutral/150')],
  'fixed-inverse': [S('neutral/white'), S('neutral/white')],
  'fixed-primary-disabled': [A50('neutral/150'), A50('neutral/150')],
  'fixed-inverse-disabled': [A50('neutral/white'), A50('neutral/white')],
};

/** Coloured text. [base, hover, active] per mode; disabled generated. */
const CONTENT_ROLE = {
  brand: [
    ['brand/70', 'brand/80', 'brand/90'],
    ['brand/50', 'brand/40', 'brand/30'],
  ],
  success: [
    ['success/70', 'success/80', 'success/90'],
    ['success/50', 'success/40', 'success/30'],
  ],
  warning: [
    ['warning/70', 'warning/80', 'warning/90'],
    ['warning/50', 'warning/40', 'warning/30'],
  ],
  critical: [
    ['error/70', 'error/80', 'error/90'],
    ['error/50', 'error/40', 'error/30'],
  ],
  info: [
    ['info/70', 'info/80', 'info/90'],
    ['info/50', 'info/40', 'info/30'],
  ],
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
  'on-brand-disabled': [A50('neutral/white'), A50('neutral/white')],
  'on-success-disabled': [A50('neutral/white'), A50('neutral/white')],
  'on-warning-disabled': [A50('neutral/white'), A50('neutral/white')],
  'on-critical-disabled': [A50('neutral/white'), A50('neutral/white')],
  'on-info-disabled': [A50('neutral/white'), A50('neutral/white')],
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
  //          light (L*)            dark (L*)
  // Dark moved brand/50 -> brand/55. At brand/50 series 1 was byte-identical to
  // border/focus in dark, so a focus ring drawn on that series was invisible.
  // 55 keeps series 1 mode-distinct (which is the whole point of B11) and clears
  // both the focus ring and the brand fill.
  '1': [S('brand/60'), S('brand/55')], //                      65 / 70
  '2': [S('spectrum-blue/70'), S('spectrum-blue/60')], //       54 / 62
  '3': [S('spectrum-teal/50'), S('spectrum-teal/40')], //       70 / 78
  '4': [S('spectrum-purple/80'), S('spectrum-purple/70')], //   46 / 54
  '5': [S('spectrum-yellow/40'), S('spectrum-yellow/30')], //   78 / 85
};

/** Tier 3 — sidebar. The shipped file gave the sidebar nine component tokens
 *  while no other surface got any, and light --sidebar-border was BRIGHTER
 *  than the sidebar it divided. Rebuilt off the same ramp as everything else. */
const SIDEBAR = {
  background: [S('neutral/20'), S('neutral/140')],
  border: [S('neutral/30'), S('neutral/120')],
  // item-hover used to equal border exactly, in BOTH modes (30 / 120), so
  // hovering an item erased the sidebar's own divider across that item's height.
  // The half-steps give it its own rung one notch off the background: 25 in
  // light, 135 in dark. Both now clear border and background.
  'item-hover': [S('neutral/25'), S('neutral/135')],
  'item-active': [S('neutral/40'), S('neutral/110')],
  'item-selected': [A15('brand/50'), A15('brand/60')],
  content: [S('neutral/150'), S('neutral/20')],
  'content-muted': [S('neutral/110'), S('neutral/50')],
  // content-selected is a selected nav LABEL, so it needs 4.5:1 on both the
  // sidebar background and the selected item tint. brand/70 measured 4.22:1 on
  // both in light — ungated and failing. brand/80 clears it at 6.09:1.
  'content-selected': [S('brand/80'), S('brand/50')],
};

/** Tier 3 — gradient and mesh stops. Replaces the hardcoded rgb() literals in
 *  .onboarding-gradient, .brand-mesh-border, .brand-mesh-thumb and
 *  vtr-halo-pulse (which used a fifth, undocumented orange). */
const GRADIENT = {
  'mesh-1': [S('brand/40'), S('brand/70')],
  'mesh-2': [S('spectrum-purple/30'), S('spectrum-purple/70')],
  'mesh-3': [S('brand/20'), S('brand/80')],
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
  CONTENT_ON,
  CHART,
  SIDEBAR,
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
  sidebar: 'color/sidebar/background',
  'sidebar-foreground': 'color/sidebar/content',
  'sidebar-primary': 'color/fill/brand',
  'sidebar-primary-foreground': 'color/content/on-brand',
  'sidebar-accent': 'color/sidebar/item-hover',
  'sidebar-accent-foreground': 'color/sidebar/content',
  'sidebar-border': 'color/sidebar/border',
  'sidebar-ring': 'color/border/focus',
};

/**
 * Contrast gates. The build FAILS if any of these regress, in either mode.
 * That is the guarantee: nobody can quietly reintroduce the white-on-orange bug.
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
  ['color/content/brand', 'color/background', 4.5],
  ['color/content/critical', 'color/background', 4.5],
  ['color/sidebar/content', 'color/sidebar/background', 4.5],
  ['color/content/primary', 'color/surface/brand-flat', 4.5],
  ['color/content/primary', 'color/surface/critical-flat', 4.5],

  // AA 3:1 — large text and meaningful non-text boundaries (WCAG 1.4.11)
  ['color/content/tertiary', 'color/background', 3],
  ['color/border/focus', 'color/background', 3],
  ['color/border/focus', 'color/surface/primary', 3],
  // A focus ring ON a brand-filled button must use focus-inverse, not focus.
  // This is why border/focus-inverse exists.
  ['color/border/focus-inverse', 'color/fill/brand', 3],
];

/**
 * Text on saturated fills, gated on APCA Lc instead of WCAG 2.x ratio.
 *
 * Lc 60 is the body-text threshold. Button labels ship at 14–16px semibold, so
 * 60 is the right floor; the white-on-fill pairs land 63–70, with headroom.
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
 * The flagged range was stated as 3.1–3.7:1. Measured across the ten gated pairs
 * it is 3.55–4.38:1; nothing in this system is at 3.1. The competitor figures are
 * correct and all five reproduce to 2 dp.
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
  ['color/sidebar/border', 'color/sidebar/background', 1.1],
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
  ['color/sidebar/border', 'color/sidebar/background'],
  ['color/surface/primary', 'color/background'],
  // A popover on a card needs an edge. Both were neutral/120 in dark, so there
  // was no boundary at all. DARK ONLY: in light both are correctly neutral/white,
  // because white is the top of the ramp and the page itself is white — a popover
  // there separates by shadow and border, not by fill. Asserting light would
  // force a grey popover onto a white page to satisfy a gate, which is the exact
  // failure mode H1 is about: a gate may veto a colour, it may never choose one.
  ['color/surface/elevated', 'color/surface/overlay', 'dark'],
  // A hovered sidebar item must not erase the sidebar's divider. Both 30 / 120.
  ['color/sidebar/item-hover', 'color/sidebar/border'],
  ['color/sidebar/item-hover', 'color/sidebar/background'],
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
