/**
 * palette.mjs — OKLCH colour engine + the authored HeyOz palette.
 *
 * Every primitive hex in this design system is COMPUTED from the OKLCH spec
 * below. No hex is ever hand-typed. That is what keeps the ramps perceptually
 * even, which is what fixes the two ramp problems in the shipped globals.css:
 *   1. the neutral ramp used four different hues (0 / 20 / 30 / 40)
 *   2. dark mode ran out of steps, so hover and active collapsed onto one value
 *
 * ANCHORS. Where a step corresponds to a colour already shipping in HeyOz, the
 * L value is pinned to that colour's measured OKLCH lightness, so the new ramp
 * is perceptually identical to what is in production today. Anchored steps are
 * marked `// = #HEX (role)` below.
 */

/* ------------------------------------------------------------------ *
 * 1. Colour conversion
 * ------------------------------------------------------------------ */

const clamp01 = (n) => Math.min(1, Math.max(0, n));

/** linear-light channel -> sRGB gamma-encoded channel */
function gamma(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/** OKLCH -> linear sRGB triplet (may be out of gamut) */
function oklchToLinearSrgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = ([r, g, b]) =>
  r >= -1e-4 && r <= 1 + 1e-4 && g >= -1e-4 && g <= 1 + 1e-4 && b >= -1e-4 && b <= 1 + 1e-4;

/**
 * OKLCH -> sRGB, reducing chroma until the colour fits in sRGB.
 * Preserves L and H exactly; only C is sacrificed. This is the standard
 * "chroma-clip" gamut mapping and it is why heavy tints never go muddy.
 */
export function oklch(L, C, h) {
  let lo = 0;
  let hi = C;
  let lin = oklchToLinearSrgb(L, C, h);

  if (!inGamut(lin)) {
    for (let i = 0; i < 28; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinearSrgb(L, mid, h))) lo = mid;
      else hi = mid;
    }
    lin = oklchToLinearSrgb(L, lo, h);
  }

  const rgb = lin.map((c) => clamp01(gamma(c)));
  const hex =
    '#' +
    rgb
      .map((c) =>
        Math.round(c * 255)
          .toString(16)
          .padStart(2, '0')
          .toUpperCase()
      )
      .join('');

  return { components: rgb, hex };
}

/** sRGB hex -> OKLCH, used by the audit report */
export function hexToOklch(hex) {
  const lin = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const [r, g, b] = lin;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
}

/** WCAG 2.x relative luminance + contrast ratio, for the audit */
export function relLuminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    // 0.04045 is the corrected WCAG 2.1 breakpoint. This read 0.03928 (the
    // WCAG 2.0 erratum value) and disagreed with hexToOklch above, which used
    // 0.04045. Provably zero-impact at 8-bit depth — no k/255 falls between the
    // two — but the file should not contain two different sRGB curves.
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [relLuminance(a), relLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * APCA (Accessible Perceptual Contrast Algorithm), W3C draft 0.1.9 — the model
 * headed into WCAG 3, and the reason content/on-* is white rather than near-black.
 *
 * WCAG 2.x is polarity-blind: it is a pure luminance ratio, so its black/white
 * crossover sits at Y = 0.179 (the grey #767676). EVERY brand fill lighter than
 * that mid-grey scores higher with black text — which is why a WCAG-2 maximiser
 * puts black on every orange, yellow, green and cyan in existence. On the brand
 * fill #FF3D01 (Y = 0.246) it scores near-black 5.71:1 and white 3.55:1, and it
 * is wrong: APCA scores white Lc 66.7 and near-black Lc 42.7, i.e. the near-black
 * is below the floor for text of any size. Saturated warm hues read brighter than
 * their measured luminance (Helmholtz–Kohlrausch), so near-black goes muddy.
 *
 * The 5.71 and 42.7 figures above were previously stated as 4.91 and 41.0, in
 * this file, in spec.mjs and in DECISIONS.md H1. Both were wrong — 4.91 looks
 * like white-on-#D53100 (the hover fill, 4.92:1) transcribed into the near-black
 * row. Recomputed: near-black #070605 on #FF3D01 = 5.71:1 / Lc 42.74, and pure
 * #000000 = 5.92:1 / Lc 42.80. The conclusion is unchanged and in fact stronger
 * on the WCAG side, which is precisely why the wrong number mattered: it was the
 * figure a procurement VPAT reviewer would have read.
 *
 * Returned Lc is unsigned. Rough thresholds: 45 = large/bold text minimum,
 * 60 = body text, 75 = thin or small text.
 */
export function apca(txtHex, bgHex) {
  // APCA uses a simple 2.4 power curve, NOT the WCAG piecewise sRGB transform.
  const y = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.4));
    return 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
  };
  // Soft-clamp near-black, so deep values don't run away
  const clamp = (Y) => (Y > 0.022 ? Y : Y + Math.pow(0.022 - Y, 1.414));
  const Yt = clamp(y(txtHex));
  const Yb = clamp(y(bgHex));
  let C;
  if (Yb > Yt) {
    const S = (Math.pow(Yb, 0.56) - Math.pow(Yt, 0.57)) * 1.14; // dark text on light bg
    C = S < 0.1 ? 0 : S - 0.027;
  } else {
    const S = (Math.pow(Yb, 0.65) - Math.pow(Yt, 0.62)) * 1.14; // light text on dark bg
    C = S > -0.1 ? 0 : S + 0.027;
  }
  return Math.abs(C * 100);
}

/** Composite a translucent hex over an opaque hex (for alpha-token auditing) */
export function composite(fgHex, alpha, bgHex) {
  const ch = (hex, i) => parseInt(hex.slice(i, i + 2), 16);
  const out = [1, 3, 5].map((i) => Math.round(ch(fgHex, i) * alpha + ch(bgHex, i) * (1 - alpha)));
  return '#' + out.map((c) => c.toString(16).padStart(2, '0').toUpperCase()).join('');
}

/* ------------------------------------------------------------------ *
 * 2. The authored palette
 * ------------------------------------------------------------------ */

/**
 * Neutral. One hue, one smooth chroma taper, 15 steps.
 *
 * Hue 50 is the most common hue already present in the shipped neutrals
 * (it occurs in 5 of 12 values); the rest scattered between 48 and 85 with no
 * intent behind it. Chroma is tiny (0.0026 - 0.0043) and tapers with lightness,
 * matching the measured behaviour of the shipped set.
 *
 * Steps 60, 70, 90 and 100 are NEW. The shipped ramp jumped from L 80.9 to
 * L 58.0 to L 29.5 with nothing in between, which is precisely why dark mode
 * had no room for hover and active states.
 */
const NEUTRAL_HUE = 50;
const neutralChroma = (L) => 0.0045 - 0.002 * L;

/**
 * HALF-STEPS (25, 35, 45, 95, 115, 135) exist for the same reason 60/70/90/100
 * did: a ladder ran out of room.
 *
 * The shadcn bridge has to seat ten structurally distinct roles — background,
 * card, popover, secondary, muted, accent, border, input, sidebar, sidebar-border
 * — and in light mode it only had white/10/20/30/40 to seat them in. Six pairs
 * collided at exactly 1.00:1, including `--accent` === `--border` in dark, which
 * is the same class of bug as A6 and made a hovered row erase its own divider.
 *
 * Adding steps rather than compressing roles is the cheap direction: the grid is
 * generated, so six steps cost six lines here and nothing to maintain (see D7).
 * L values are the midpoints of their neighbours, so the ramp stays perceptually
 * even and no existing step moves.
 */
/**
 * ANCHOR NOTATION. `-> #HEX` is the value this L actually COMPUTES to, verified
 * against the emitted palette. Where the anchor colour that motivated the step
 * differs, it is given as `(shipped #HEX)`. Nine of these comments previously
 * stated the shipped hex as though it were the computed one and were wrong by
 * one 8-bit unit; the round-trip through OKLCH and back is not bit-exact, and
 * pretending otherwise is how `#FF3D00` ended up asserted four times in a
 * system that has never emitted it.
 */
const NEUTRAL_STEPS = [
  ['10', 0.9714], // -> #F7F5F4  (shipped: light --card)
  ['20', 0.9474], // -> #EFEDEC  (shipped: light --secondary / --sidebar)
  ['25', 0.9287], // -> #E9E7E6  NEW half-step - light sidebar item hover
  ['30', 0.9100], // -> #E3E1E0  (shipped #E2E1DF: light --muted / --accent)
  ['35', 0.8890], // -> #DCDAD9  NEW half-step - light --muted, clears --border
  ['40', 0.8679], // -> #D5D3D2  (shipped #D5D3D1: Figma neutral/350)
  ['45', 0.8385], // -> #CBC9C8  NEW half-step - light --input, clears --accent
  ['50', 0.8091], // -> #C2C0BF  (shipped: dark --muted-foreground)
  ['60', 0.7300], // -> #A9A7A6  NEW - fills the light/mid gap
  ['70', 0.6600], // -> #939190  NEW
  ['80', 0.5798], // -> #7C7A78  (shipped #7B7A78: Figma neutral/500)
  ['90', 0.4800], // -> #5F5D5C  NEW - real dark hover/active headroom
  ['95', 0.4300], // -> #515050  NEW half-step - dark --border, clears --accent
  ['100', 0.3800], // -> #444241 NEW
  ['110', 0.2949], // -> #2E2C2B (shipped: light --muted-fg, dark --muted)
  ['115', 0.2673], // -> #272524 NEW half-step - dark --popover, clears --secondary
  ['120', 0.2396], // -> #211F1D (shipped #201F1D: dark --popover / --secondary)
  ['130', 0.1887], // -> #151312 (shipped: dark --card)
  ['135', 0.1717], // -> #121110 NEW half-step - dark sidebar item hover
  ['140', 0.1547], // -> #0E0C0B (shipped #0D0C0A: dark --sidebar)
  ['150', 0.1232], // -> #070605 (shipped: light --foreground, dark --background)
];

/**
 * Chromatic families. `mid` is the step that carries the canonical brand or
 * status colour; L is pinned to the shipped value so production does not shift.
 *
 * As with the neutrals, `-> #HEX` is what the L/C pair actually computes to.
 * The brand mid is `#FF3D01`, one unit off the `#FF3D00` in the brand guide.
 * That is a round-trip artifact and is imperceptible (white-on-brand moves from
 * 3.547:1 to 3.548:1), but it is the emitted value and every doc now says so.
 * Do NOT "fix" it by hand-typing the hex — that would make brand the only
 * colour in the system outside the OKLCH engine, which is the mistake D6 is
 * about. If the exact byte ever matters, move L, don't override the output.
 */
const FAMILIES = {
  brand: {
    hue: 34.0, // measured from #FF3D00
    peak: 0.2348, // measured max chroma
    mid: '60', // -> #FF3D01  (shipped --primary #FF3D00)
    steps: {
      10: [0.9560, 0.028],
      20: [0.9122, 0.0463], // -> #FFD8CE (shipped #FFD8CD, .brand-mesh)
      30: [0.8336, 0.0941], // -> #FFB3A0 (shipped #FFB39E, .brand-mesh)
      40: [0.7556, 0.1491], // -> #FF8A6F (shipped #FF8A6B, .brand-mesh)
      // 50 was L 0.7050 (-> #FF6A49). Lowered to 0.6950 because it is now the
      // DARK ACTIVE fill and white on it measured Lc 58.8 — under the Lc 60
      // floor this system sets for itself. ΔL 0.010 is imperceptible.
      // 45 and 75 exist ONLY for border/focus, one per mode. The focus ring is the
      // one token that must not share a value with any fill or border it can be
      // drawn against, and 60/70/80 are all occupied by fill and border states —
      // which is how `--ring` === `--primary` shipped in the first place. Giving
      // focus its own rung is cheaper than arguing about which neighbour to move.
      45: [0.7250, 0.1700], // -> #FF7B5C  DARK FOCUS ONLY
      50: [0.6950, 0.1900], // -> #FC6645  dark active,  white Lc 60.4
      55: [0.6743, 0.2124], // -> #FE542D  NEW - dark hover, white Lc 63.6
      60: [0.6535, 0.2348], // -> #FF3D01  the brand,    white Lc 66.7
      70: [0.5700, 0.2150], // -> #D53100  light hover,  white Lc 77.8
      75: [0.5250, 0.1980], // -> #C22B00  LIGHT FOCUS ONLY
      80: [0.4800, 0.1780], // -> #A92500  light active, white Lc 88.1
      90: [0.3900, 0.1400],
      100: [0.3000, 0.1050],
    },
  },

  /**
   * error keeps the shipped --destructive exactly (#E63C65). Note this puts
   * error/60 at L 62.1 while success/warning/info sit at L 58.1. Preserved
   * deliberately: zero visual regression on a colour already in production.
   */
  error: {
    hue: 11.9,
    peak: 0.2056,
    mid: '60',
    steps: {
      10: [0.9550, 0.0260],
      20: [0.9080, 0.0520],
      30: [0.8350, 0.1000],
      40: [0.7550, 0.1480],
      50: [0.6880, 0.1820], // -> #F5617D  dark active,  white Lc 61.9
      55: [0.6543, 0.1938], // -> #EE5071  NEW - dark hover, white Lc 66.9
      60: [0.6206, 0.2056], // -> #E63C65 (shipped --destructive), white Lc 71.8
      70: [0.5400, 0.1940], // -> #C52450  light hover
      80: [0.4550, 0.1660], // -> #9D183E  light active
      90: [0.3700, 0.1330],
      100: [0.2900, 0.1000],
    },
  },

  success: {
    hue: 155.0,
    peak: 0.134,
    mid: '60',
    steps: {
      10: [0.9560, 0.0200],
      20: [0.9100, 0.0400],
      30: [0.8380, 0.0720],
      40: [0.7560, 0.1000],
      // 50 was L 0.6700 (-> #4FAB74). Lowered to 0.6640 for the same reason as
      // brand/50: it is now the dark active fill and white measured Lc 59.4.
      50: [0.6640, 0.1210], // -> #4DA972  dark active,  white Lc 60.4
      55: [0.6223, 0.1275], // -> #389D64  NEW - dark hover, white Lc 66.6
      60: [0.5807, 0.1340], // -> #1D9156 (HeyOz Figma success/500), white Lc 72.4
      70: [0.5050, 0.1240], // -> #037944  light hover
      80: [0.4300, 0.1070], // -> #006035  light active
      90: [0.3500, 0.0870],
      100: [0.2750, 0.0670],
    },
  },

  warning: {
    hue: 75.0,
    peak: 0.1203,
    mid: '60',
    steps: {
      10: [0.9600, 0.0280],
      20: [0.9180, 0.0530],
      30: [0.8450, 0.0900],
      40: [0.7600, 0.1080],
      50: [0.6720, 0.1160], // -> #BF8B39  dark active,  white Lc 62.0
      55: [0.6258, 0.1182], // -> #B17C25  NEW - dark hover, white Lc 69.2
      60: [0.5795, 0.1203], // -> #A36E07 (HeyOz Figma warning/500), white Lc 75.6
      70: [0.5000, 0.1080], // -> #865900  light hover
      80: [0.4250, 0.0920], // -> #6B4600  light active
      90: [0.3450, 0.0740],
      100: [0.2700, 0.0570],
    },
  },

  info: {
    hue: 260.0,
    peak: 0.1925,
    mid: '60',
    steps: {
      10: [0.9530, 0.0250],
      20: [0.9060, 0.0500],
      30: [0.8320, 0.0950],
      40: [0.7500, 0.1400],
      50: [0.6700, 0.1720], // -> #5292FD  dark active,  white Lc 62.4
      55: [0.6256, 0.1822], // -> #4083F4  NEW - dark hover, white Lc 69.0
      60: [0.5812, 0.1925], // -> #2C74EA (HeyOz Figma info/500), white Lc 75.3
      70: [0.5050, 0.1820], // -> #195DCA  light hover
      80: [0.4300, 0.1580], // -> #1049A4  light active
      90: [0.3500, 0.1280],
      100: [0.2750, 0.0980],
    },
  },
};

/**
 * Spectrum — Tier-3 artwork + data-visualisation hues. NOT for UI roles.
 * These exist so charts and the brand-mesh gradients stop being hardcoded
 * rgb() literals inside globals.css.
 *
 * spectrum-purple/30 = #D1C4FD, the lavender already used by .brand-mesh-*.
 * All five are isoluminant at step 60 (L 0.62) so a 5-series chart reads as
 * one family rather than five unrelated colours.
 */
const SPECTRUM_HUES = {
  'spectrum-purple': 295.1,
  'spectrum-blue': 245.0,
  'spectrum-teal': 195.0,
  'spectrum-yellow': 85.0,
  'spectrum-pink': 350.0,
};

const SPECTRUM_STEPS = {
  10: [0.9560, 0.0280],
  20: [0.9000, 0.0560],
  30: [0.8500, 0.0796], // spectrum-purple/30 = #D1C4FD (shipped .brand-mesh)
  40: [0.7800, 0.1100],
  50: [0.7000, 0.1350],
  60: [0.6200, 0.1550],
  70: [0.5400, 0.1500],
  80: [0.4600, 0.1330],
  90: [0.3800, 0.1100],
  100: [0.3000, 0.0850],
};

/**
 * Alpha groups. One ladder for the whole system — 8 / 15 / 30 / 50.
 *
 * 8 exists so a translucent fill has a disabled state. A solid fill derives
 * disabled as opacity-50 of its base — half the presence. The soft fills are
 * already opacity-15, so the same rule wants 7.5%, and the build previously
 * tried to express that by rewriting the alpha prefix to `opacity-15` — which,
 * on a token that was already opacity-15, was a no-op. Ten tokens shipped a
 * disabled state byte-identical to their enabled one. 8 is that missing rung.
 */
export const ALPHA_GROUPS = [8, 15, 30, 50];

/* ------------------------------------------------------------------ *
 * 3. Build the flat primitive table
 * ------------------------------------------------------------------ */

/** @returns {Map<string, {hex:string, components:number[], note?:string}>} */
export function buildPalette() {
  const out = new Map();

  out.set('neutral/white', { ...oklch(1, 0, NEUTRAL_HUE) });
  for (const [step, L] of NEUTRAL_STEPS) {
    out.set(`neutral/${step}`, oklch(L, neutralChroma(L), NEUTRAL_HUE));
  }
  out.set('neutral/black', { ...oklch(0, 0, NEUTRAL_HUE) });

  for (const [name, fam] of Object.entries(FAMILIES)) {
    for (const [step, [L, C]] of Object.entries(fam.steps)) {
      out.set(`${name}/${step}`, oklch(L, C, fam.hue));
    }
  }

  for (const [name, hue] of Object.entries(SPECTRUM_HUES)) {
    for (const [step, [L, C]] of Object.entries(SPECTRUM_STEPS)) {
      out.set(`${name}/${step}`, oklch(L, C, hue));
    }
  }

  return out;
}

export const PALETTE_META = { NEUTRAL_HUE, NEUTRAL_STEPS, FAMILIES, SPECTRUM_HUES, SPECTRUM_STEPS };
