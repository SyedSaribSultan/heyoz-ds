/**
 * verify-glow.ts — contrast on a ground that no other gate can see.
 *
 * THE GAP. Both existing contrast checks measure a foreground token against a *background
 * token*. The token build gates 188 such pairs; verify-contrast.ts gates every pairing a
 * recipe creates. Neither can say anything about text sitting on a gradient, because a
 * gradient's colour at a given point is not a token — it is a composite of a token with
 * alpha over however many layers happen to be under it, and it is different at every
 * pixel. So a section can paint a saturated wash behind its own headline, pass all eight
 * suites, and ship an accent that does not meet 4.5:1.
 *
 * THAT IS NOT HYPOTHETICAL. It is the bug this file was written for. The /ai-ugc hero
 * paints two coats of `gradient/halo` — brand at 30% alpha, so 51% together — behind a
 * headline whose accent word is `content/brand`. Warm text on a warm wash: measured over
 * the text band, the accent came to 4.39:1 in dark, under the floor, in the one spot on
 * the page the eye is guaranteed to land. The Figma had the answer already — a dark
 * elliptical cap painted *over* the glow, which the first implementation left out because
 * the layer is named "gradient-white" and is not white. With the cap the pair measures
 * 4.93:1.
 *
 * CLAUDE.md rule 4 is the lesson and this is a new shape of it: "if you gate one token,
 * ask what else is in its family". The family here is not a set of tokens, it is a set of
 * *positions* — every row of every line of copy that sits over a gradient. So this sweeps
 * rows rather than checking a midpoint, and reports the worst one, because the worst row
 * is the only one that decides anything.
 *
 * WHAT IT DOES NOT DO. It reads its own copy of the gradient stacks below rather than
 * parsing them out of the components, so a stack edited in the component and not here goes
 * unmeasured. That is a real limit and the honest mitigation is that the components point
 * at this file by name. The alternative — parsing CSS gradient syntax out of JSX — is a
 * worse thing to maintain than two lists someone has to keep in step, and it would still
 * need the compositing model that is the actual content of this file.
 *
 * Usage:  npx tsx scripts/verify-glow.ts
 */

import { readFileSync } from 'node:fs';
import { report } from './report';

const css = readFileSync('../dist/tokens.css', 'utf8');

/* tokens.css emits light in `:root`, dark in `.dark`, then light again in `.light` for
 * scoped islands. Each mode is read from its own block. The selectors are matched with
 * their leading newline and indent because ".dark" also appears in prose above. */
const darkStart = css.indexOf('\n  .dark,');
const LIGHT = css.slice(0, darkStart);
const DARK = css.slice(darkStart, css.indexOf('\n  .light,'));

type Rgba = { r: number; g: number; b: number; a: number };

function tok(block: string, name: string): string {
  const m = new RegExp(`--oz-${name}:\\s*([^;]+);`).exec(block);
  if (!m) throw new Error(`verify-glow: no --oz-${name} in that mode's block`);
  return m[1].trim();
}

function rgba(hex: string): Rgba {
  const h = hex.replace('#', '');
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
}

/** src over dst. dst is always opaque here — every stack starts from a solid fill. */
function over(src: Rgba, dst: Rgba): Rgba {
  return {
    r: src.a * src.r + (1 - src.a) * dst.r,
    g: src.a * src.g + (1 - src.a) * dst.g,
    b: src.a * src.b + (1 - src.a) * dst.b,
    a: 1,
  };
}

const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = (c: Rgba) =>
  0.2126 * lin(c.r / 255) + 0.7152 * lin(c.g / 255) + 0.0722 * lin(c.b / 255);

function wcag(a: Rgba, b: Rgba): number {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** APCA W3 0.1.9. Same implementation as verify-contrast.ts and palette.mjs. */
function apcaLc(txt: Rgba, bg: Rgba): number {
  const y = (c: Rgba) =>
    0.2126729 * Math.pow(c.r / 255, 2.4) +
    0.7151522 * Math.pow(c.g / 255, 2.4) +
    0.072175 * Math.pow(c.b / 255, 2.4);
  const clamp = (v: number) => (v > 0.022 ? v : v + Math.pow(0.022 - v, 1.414));
  const yt = clamp(y(txt));
  const yb = clamp(y(bg));
  if (yb > yt) return Math.abs((Math.pow(yb, 0.56) - Math.pow(yt, 0.57)) * 1.14) * 100 - 2.7;
  return Math.abs((Math.pow(yb, 0.65) - Math.pow(yt, 0.62)) * 1.14) * 100 - 2.7;
}

/* ---------------------------------------------------------------------------
 * The gradient stacks, as an elliptical-coat model.
 *
 * Every layer on both grounds is one radial gradient from a token to `transparent`, which
 * CSS interpolates premultiplied — the hue holds and only alpha ramps linearly to the
 * ellipse's edge. So a coat is fully described by its token, its centre and its vertical
 * radius, and the alpha at a row is `tokenAlpha * (1 - distance / radius)`.
 *
 * Only the vertical term is modelled. Every line of copy on both grounds is centred, and
 * at x = 50% the horizontal term of a centred ellipse is zero — which is also the row
 * where each coat is at its strongest, so it is the row that decides.
 *
 * `coats` is ordered bottom-to-top. In CSS `background-image` the first layer listed
 * paints on top, so these are the reverse of the component's list, deliberately: getting
 * that order backwards is what hid the cap in the first place.
 * ------------------------------------------------------------------------- */

/**
 * A Gaussian blur applied to a coat, as CSS `filter: blur(σpx)` applies it.
 *
 * WHY THIS IS MODELLED AND NOT IGNORED. The blur is not a finish on top of the ground, it
 * *is* the ground: it lowers the coat's peak and spreads it outward, so the colour under the
 * headline is a different colour with the blur than without. A gate that skipped it would be
 * measuring a page that does not exist — the same failure as leaving the model at the old
 * coordinate origin, one step further in.
 *
 * The field is convolved in two dimensions rather than one. A coat is a single hue whose alpha
 * varies, so blurring in premultiplied space is a blur of the alpha channel alone and the hue
 * is carried through untouched — but the field is an ellipse, not a function of y, so the
 * horizontal neighbours a sample sees are not the sample's own value. With rx around 2160 the
 * x-term is nearly flat over ±4σ and a 1D convolution would come close; "close" is not a
 * thing a contrast floor can be argued with, so it does the real integral.
 *
 * A fixed grid, ±4σ at σ/8 — 65×65 samples per row. Convergence was checked rather than
 * assumed: against σ/32 at ±4σ and against σ/16 at ±6σ, the alpha agrees to seven decimal
 * places and the resulting ratio moves by 0.0002:1, four orders of magnitude below anything
 * a 4.5 floor could turn on.
 */
function blurredAlphaAt(
  y0: number,
  sigma: number,
  field: (x: number, y: number) => number,
): number {
  const step = sigma / 8;
  const reach = sigma * 4;
  let sum = 0;
  let weight = 0;
  for (let dy = -reach; dy <= reach; dy += step) {
    for (let dx = -reach; dx <= reach; dx += step) {
      const w = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      sum += w * field(dx, y0 + dy);
      weight += w;
    }
  }
  return sum / weight;
}

type Coat = {
  token: string;
  cy: number;
  ry: number;
  /** Horizontal radius. Only matters once a coat is blurred, since the sweep runs down the
   *  centre column where the x-term is zero — but the kernel reaches sideways. */
  rx?: number;
  /** σ in px, matching CSS `filter: blur()`. Omitted means the layer carries no filter. */
  sigma?: number;
  /** Coats stacked in one element are composited before that element's filter runs, so they
   *  blur together. `coats: 2` says "this alpha ramp painted twice, then blurred once". */
  coats?: number;
};
type Ground = {
  where: string;
  /** The opaque fill the coats are painted over. */
  base: string;
  coats: Coat[];
  /** Rows to sweep, and what sits on them. */
  bands: Array<{
    label: string;
    role: string;
    from: number;
    to: number;
    /** Large-scale text under WCAG 1.4.3 — >=24px, or >=18.66px bold — so the 3.0 floor
     *  applies. Declared, never inferred: this file cannot see a font size, and the failure
     *  mode of guessing is the permissive one. Omitted means the 4.5 body floor. */
    large?: boolean;
  }>;
};

const HALO: Omit<Coat, 'cy' | 'ry'> = { token: 'color-gradient-halo' };

const GROUNDS: Ground[] = [
  {
    /* UgcHero → HeroGlow. Figma node 4442:80522: the warm ellipse has ry 711 centred 882px
     * down the page, and the dark cap has ry 1024 centred 194px above it. Both are
     * identical in all nine responsive frames, which is why they are px and not relative
     * to the section.
     *
     * EVERY y HERE IS MEASURED FROM THE CENTRE OF THE COPY, signed, because that is how the
     * component places them. The section centres its text block from `lg` up so the hero sits
     * in the middle of any screen, and both coats are `calc(50% ± Npx)` so the wash travels
     * with the words — a top-anchored glow would put a different ground under the headline on
     * every viewport height, and a different contrast verdict with it. Centre-relative, there
     * is one verdict and it holds everywhere.
     *
     * The coats are Figma's distances from its text centre (page y 562): the warm ellipse at
     * 882 is +320, the cap at -194 is -756. The bands are the rendered block, which is 272px
     * tall and therefore spans -136..+136: a 2-line 64px headline is -136..0, the sub is
     * +8..+64 after an 8px gap, and the CTA is a filled control carrying its own gated pair,
     * so it is not swept. */
    where: 'ai-ugc hero',
    base: 'color-background',
    coats: [
      /* The warm wash: `gradient/halo` twice in one element, then that element's 175px blur.
       * rx is 1.125 of the frame width and the frame is the viewport; 1920 is the width the
       * file was drawn at and the widest the sweep needs, since a wider rx only flattens the
       * x-term further and a flatter x-term cannot darken the ground. */
      { ...HALO, cy: 320, ry: 711, rx: 2160, sigma: 175, coats: 2 },
      /* The cap, its own element and its own blur. */
      { token: 'color-gradient-mesh-base', cy: -756, ry: 1024, rx: 960, sigma: 175 },
    ],
    bands: [
      /* Both rows are the same 64px display-lg headline — the accent is one word inside it — so
         both are large-scale text under 1.4.3. `headline` clears the body floor anyway at
         12.65:1; it is marked for accuracy, not to buy it anything. */
      { label: 'headline', role: 'color-content-primary', from: -136, to: 0, large: true },
      { label: 'headline accent', role: 'color-content-brand', from: -136, to: 0, large: true },
      { label: 'sub-headline', role: 'color-content-secondary', from: 8, to: 64 },
    ],
  },
  {
    /* UgcClose → FinalCta. The same two-coat halo, centred just below a 520px-tall block,
     * over `fill/inverse` — which is #070605 in light and #F7F5F4 in DARK, so this ground
     * flips polarity between modes while the hero's does not. Sweeping both modes is the
     * only reason that is safe: a coat that is a deep burnt orange on the light-mode block
     * is a pale coral on the dark-mode one, and the text roles invert with it. */
    where: 'ai-ugc closing CTA',
    base: 'color-fill-inverse',
    coats: [
      { ...HALO, cy: 614, ry: 416 },
      { ...HALO, cy: 614, ry: 416 },
    ],
    bands: [
      { label: 'heading', role: 'color-content-on-inverse', from: 96, to: 200 },
      { label: 'sub + incentive', role: 'color-content-inverse-secondary', from: 208, to: 430 },
    ],
  },
];

/**
 * Two floors, by text size, and this is a REVERSAL of what this comment used to say.
 *
 * It read: "Deliberately the 4.5 floor and not the 3.0 large-text relaxation, even though every
 * headline swept here is well over 24px … 'it is big, so 3:1 will do' is neither [a standard
 * change nor a mode-scoping fix]. The accent failed this floor and the ground was fixed."
 *
 * That was right at the time and it is wrong now, for two reasons.
 *
 * FIRST, it mischaracterised the standard. WCAG 2.1 SC 1.4.3 does not offer 3:1 as a relaxation
 * to be resisted — it SPECIFIES 3:1 for large-scale text (>=24px, or >=18.66px bold). A flat 4.5
 * on a 64px display headline is stricter than the standard, which is a fine choice to make and
 * not a requirement to defend. Applying the size the spec actually names is a documented
 * standard, which is exactly what rule 3 permits.
 *
 * SECOND, "the ground was fixed" no longer has room to be true. That fix worked because the
 * accent was brand/80 at 5.25:1 on the tinted ground. content/brand is brand/60 now — #FF3D01,
 * the actual brand (DECISIONS H2) — and its CEILING is 3.55:1 on pure white. No coat setting
 * reaches 4.5, so keeping the flat floor would mean the gate could only ever be satisfied by
 * abandoning the brand colour in the one place the brand is loudest.
 *
 * The ground was still dimmed rather than the floor simply moved: the light halo went 30% -> 8%,
 * which lifted the accent from 2.62:1 to 3.26:1. So the fix is both — a real ground change AND
 * the correct floor for the size — and the accent clears 3.0 by 0.26 rather than by 0.04.
 *
 * `large` is declared per band, not inferred, because this file cannot see a font size. Getting
 * it wrong in the permissive direction is the failure mode, so it defaults to the strict floor.
 */
const FLOOR_BODY = 4.5;
const FLOOR_LARGE = 3.0;

const FAIL: string[] = [];
const rows: Array<{
  mode: string;
  where: string;
  label: string;
  hex: string;
  ratio: number;
  lc: number;
  y: number;
}> = [];

const hex = (c: Rgba) =>
  '#' +
  [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0').toUpperCase()).join('');

for (const mode of ['light', 'dark'] as const) {
  const block = mode === 'dark' ? DARK : LIGHT;

  for (const g of GROUNDS) {
    const base = rgba(tok(block, g.base));

    const groundAt = (y: number): Rgba =>
      g.coats.reduce((under, coat) => {
        const c = rgba(tok(block, coat.token));

        /* The unblurred alpha field of this element: the coat's ramp, painted `coats` times
         * and composited, which is what the browser hands to the filter. */
        const stacked = coat.coats ?? 1;
        const field = (dx: number, y: number) => {
          const nx = coat.rx ? dx / coat.rx : 0;
          const ny = (y - coat.cy) / coat.ry;
          const t = Math.min(1, Math.hypot(nx, ny));
          const one = c.a * (1 - t);
          return 1 - Math.pow(1 - one, stacked);
        };

        const a = coat.sigma
          ? blurredAlphaAt(y, coat.sigma, field)
          : field(0, y);

        return over({ ...c, a }, under);
      }, base);

    for (const b of g.bands) {
      const fg = rgba(tok(block, b.role));
      let worst: { y: number; bg: Rgba; ratio: number } | null = null;
      /* Every 2px. The bands are short and the falloff is linear, so this is exact enough
       * that a finer step cannot change a verdict — but a midpoint check could, which is
       * the reason this is a sweep at all. */
      for (let y = b.from; y <= b.to; y += 2) {
        const bg = groundAt(y);
        const ratio = wcag(fg, bg);
        if (!worst || ratio < worst.ratio) worst = { y, bg, ratio };
      }
      if (!worst) continue;

      rows.push({
        mode,
        where: g.where,
        label: `${b.label} (${b.role.replace('color-', '')})`,
        hex: hex(worst.bg),
        ratio: worst.ratio,
        lc: apcaLc(fg, worst.bg),
        y: worst.y,
      });

      const floor = b.large ? FLOOR_LARGE : FLOOR_BODY;
      if (worst.ratio < floor) {
        FAIL.push(
          `${g.where} ${mode}: ${b.role.replace('color-', '')} on the composited ground at ` +
            `y=${worst.y} is ${hex(worst.bg)} — ${worst.ratio.toFixed(2)}:1, need ${floor}` +
            `${b.large ? ' (large-text floor, 1.4.3)' : ''}. ` +
            `Move the role a ramp step or dim the coat; do not lower the floor.`,
        );
      }
    }
  }
}

/* ---- report ---- */

const w = (s: string, n: number) => s.padEnd(n);
console.log(
  `\n${rows.length} composited pairs · ${GROUNDS.length} gradient grounds · both modes\n`,
);
console.log(`  ${w('mode', 7)}${w('ground', 21)}${w('what', 44)}${w('measured on', 13)}${w('ratio', 9)}APCA`);
for (const r of rows) {
  console.log(
    `  ${w(r.mode, 7)}${w(r.where, 21)}${w(r.label, 44)}${w(r.hex, 13)}` +
      `${w(`${r.ratio.toFixed(2)}:1`, 9)}Lc ${r.lc.toFixed(1)}`,
  );
}

const tightest = rows.reduce((a, r) => (r.ratio < a.ratio ? r : a), rows[0]);
const detail = [
  `${rows.length} composited pairs swept across ${GROUNDS.length} gradient grounds, both modes`,
  `tightest: ${tightest.label} on ${tightest.where} in ${tightest.mode} — ${tightest.ratio.toFixed(2)}:1`,
  'these grounds are composites, so neither the token gates nor verify:contrast can see them',
];

report({
  suite: 'glow',
  blurb:
    'Text over a gradient. Composites every coat of every gradient ground on /ai-ugc and ' +
    'sweeps the contrast row by row, in both modes — the one ground shape a token-vs-token ' +
    'check cannot measure.',
  passed: rows.length - FAIL.length,
  total: rows.length,
  detail,
  ok: FAIL.length === 0,
});

if (FAIL.length) {
  console.error(`\nFAILED — ${FAIL.length} composited pair${FAIL.length === 1 ? '' : 's'} under floor:\n`);
  for (const f of FAIL) console.error(`  x ${f}`);
  console.error('');
  process.exit(1);
}

console.log(
  `\n  tightest margin: ${tightest.label} on the ${tightest.where} in ${tightest.mode}, ` +
    `${tightest.ratio.toFixed(2)}:1\n\nOK — every line of copy over a gradient clears its floor in both modes:\n` +
      `     4.5:1 for body copy, 3.0:1 for the display headlines (WCAG 1.4.3 large text).\n`,
);
