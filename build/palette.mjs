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
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
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
 * puts black on every orange, yellow, green and cyan in existence. On #FF3D00
 * (Y = 0.246) it scores black 4.91:1 and white 3.55:1, and it is wrong: APCA
 * scores white Lc 66.7 and black Lc 41.0, i.e. black is below the floor for text
 * of any size. Saturated warm hues read brighter than their measured luminance
 * (Helmholtz–Kohlrausch), so near-black on them goes muddy.
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

const NEUTRAL_STEPS = [
  ['10', 0.9714], // = #F7F5F4  (shipped: light --card)
  ['20', 0.9474], // = #EFEDEC  (shipped: light --secondary / --sidebar)
  ['30', 0.9100], // = #E2E1DF  (shipped: light --muted / --accent)
  ['40', 0.8679], // = #D5D3D1  (shipped: Figma neutral/350)
  ['50', 0.8091], // = #C2C0BF  (shipped: dark --muted-foreground)
  ['60', 0.7300], //   NEW - fills the light/mid gap
  ['70', 0.6600], //   NEW
  ['80', 0.5798], // = #7B7A78  (shipped: Figma neutral/500)
  ['90', 0.4800], //   NEW - gives dark mode real hover/active headroom
  ['100', 0.3800], //  NEW
  ['110', 0.2949], // = #2E2C2B (shipped: light --muted-foreground, dark --muted)
  ['120', 0.2396], // = #201F1D (shipped: dark --popover / --secondary)
  ['130', 0.1887], // = #151312 (shipped: dark --card)
  ['140', 0.1547], // = #0D0C0A (shipped: dark --sidebar)
  ['150', 0.1232], // = #070605 (shipped: light --foreground, dark --background)
];

/**
 * Chromatic families. `mid` is the step that carries the canonical brand or
 * status colour; L is pinned to the shipped value so production does not shift.
 */
const FAMILIES = {
  brand: {
    hue: 34.0, // measured from #FF3D00
    peak: 0.2348, // measured max chroma
    mid: '60', // = #FF3D00  (shipped --primary)
    steps: {
      10: [0.9560, 0.028],
      20: [0.9122, 0.0463], // = #FFD8CD (shipped .brand-mesh)
      30: [0.8336, 0.0941], // = #FFB39E (shipped .brand-mesh)
      40: [0.7556, 0.1491], // = #FF8A6B (shipped .brand-mesh)
      50: [0.7050, 0.1900],
      60: [0.6535, 0.2348], // = #FF3D00
      70: [0.5700, 0.2150],
      80: [0.4800, 0.1780],
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
      50: [0.6880, 0.1820],
      60: [0.6206, 0.2056], // = #E63C65 (shipped --destructive)
      70: [0.5400, 0.1940],
      80: [0.4550, 0.1660],
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
      50: [0.6700, 0.1210],
      60: [0.5807, 0.1340], // = #1D9156 (HeyOz Figma success/500)
      70: [0.5050, 0.1240],
      80: [0.4300, 0.1070],
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
      50: [0.6720, 0.1160],
      60: [0.5795, 0.1203], // = #A36E07 (HeyOz Figma warning/500)
      70: [0.5000, 0.1080],
      80: [0.4250, 0.0920],
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
      50: [0.6700, 0.1720],
      60: [0.5812, 0.1925], // = #2C74EA (HeyOz Figma info/500)
      70: [0.5050, 0.1820],
      80: [0.4300, 0.1580],
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

/** Alpha groups. One ladder for the whole system — 15 / 30 / 50. */
export const ALPHA_GROUPS = [15, 30, 50];

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
