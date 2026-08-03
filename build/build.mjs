#!/usr/bin/env node
/**
 * build.mjs — one command, everything regenerated.
 *
 *   tokens/   DTCG JSON, imported into Figma (source of truth for designers)
 *   dist/     CSS + Tailwind config (source of truth for developers)
 *   reports/  audit data, rendered by the showcase /verify route
 *
 * Nothing in tokens/ or dist/ is ever hand-edited. Both come from
 * build/palette.mjs (values) and build/spec.mjs (decisions).
 */

import { mkdirSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildPalette, oklch, hexToOklch, contrast, apca, composite, ALPHA_GROUPS } from './palette.mjs';
import { resolveSprings } from './motion.mjs';
import { LAYOUTS, GUARDS, renderLayoutCss, inspectLayouts } from './layout.mjs';
import {
  NAMESPACE,
  NUMBERS,
  numberName,
  FOUNDATIONS,
  LAYER_LITERALS,
  FOUNDATION_STRINGS,
  LITERAL_GROUPS,
  MOTION,
  MOTION_ASSERTIONS,
  SURFACE_LADDER,
  TYPOGRAPHY,
  FONT_STACKS,
  CSS_EXCLUDED_TYPE_GROUPS,
  SEMANTIC,
  FILL_DISABLED_OVERRIDE,
  SHADCN_BRIDGE,
  CONTRAST_ASSERTIONS,
  APCA_ASSERTIONS,
  VISIBILITY_ASSERTIONS,
  COLLISION_ASSERTIONS,
  BRIDGE_COLLISIONS,
} from './spec.mjs';
/* harnessHtml is archived — see the note where test/index.html used to be emitted.
 * The module now lives at archive/harness.mjs and is imported by nothing. */
import { SHIPPED } from './shipped.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = (p, s) => {
  mkdirSync(dirname(join(ROOT, p)), { recursive: true });
  writeFileSync(join(ROOT, p), s);
  return p;
};
/**
 * Every emitted JSON file gets this as its first key, so a human or an assistant
 * that opens a token file — rather than the README — is told immediately that
 * editing it is pointless. tokens/*.json and reports/ previously carried no
 * generated-file marker at all, which makes hand-editing them a silent no-op:
 * the change looks applied and disappears on the next build.
 */
const GENERATED_NOTE =
  'GENERATED FILE — DO NOT EDIT. Overwritten by `node build/build.mjs`. ' +
  'Change build/spec.mjs or build/palette.mjs and rebuild. See CLAUDE.md.';

const json = (p, o) => out(p, JSON.stringify({ $generated: GENERATED_NOTE, ...o }, null, 2) + '\n');

const COLLECTION = { colors: '_Colors Primitives', numbers: '_Number Primitives' };
const errors = [];
const warnings = [];

/* ================================================================== *
 * CSS variable naming
 * ================================================================== */

const RENAME = [
  [/^spacing\/spacing-/, 'space-'],
  [/^roundness\/radius-/, 'radius-'],
  [/^stroke width\/width-/, 'stroke-'],
  [/^focus\//, 'focus-'],
  [/^size\//, ''],
  [/^icon\/size-/, 'icon-'],
  [/^icon\//, 'icon-'],
  [/^layer\//, 'layer-'],
  [/^breakpoint\//, 'bp-'],
  [/^container\//, 'container-'],
  [/^duration\//, 'duration-'],
  [/^easing\//, 'ease-'],
  /* Springs emit two variables per token — the curve and the settle time it was
   * solved for — because a CSS transition needs both and splitting them across
   * naming schemes would let a caller pair one spring's curve with another's
   * duration. `spring/spatial-default` becomes --oz-spring-spatial-default and
   * --oz-spring-spatial-default-ms. */
  [/^spring\//, 'spring-'],
  [/^scale\//, 'motion-'],
  [/^font family\//, 'font-'],
  [/^font weight\//, 'weight-'],
  [/^font style\//, 'style-'],
  [/^font size\//, 'text-'],
  [/^line height\//, 'leading-'],
  [/^letter spacing\//, 'tracking-'],
  [/^default weight\//, 'default-weight-'],
  [/^elevation\/drop shadow\//, 'shadow-'],
  [/^elevation\/overlay\//, 'overlay-'],
];

function cssName(path) {
  let s = path;
  for (const [re, rep] of RENAME) if (re.test(s)) { s = s.replace(re, rep); break; }
  s = s.replace(/[\/\s]+/g, '-').toLowerCase();
  return `--${NAMESPACE}-${s}`;
}
const cssRef = (path) => `var(${cssName(path)})`;

/* ================================================================== *
 * Token builders (proven DTCG shape — matches the files that imported)
 * ================================================================== */

const round6 = (n) => Number(n.toFixed(6));

function colorToken({ components, hex, alpha = 1, code, alias }) {
  const t = {
    $type: 'color',
    $value: { colorSpace: 'srgb', components: components.map(round6), alpha, hex },
    $extensions: {},
  };
  if (code) t.$extensions['com.figma.codeSyntax'] = { WEB: code };
  if (alias) t.$extensions['com.figma.aliasData'] = { targetVariableName: alias.name, targetVariableSetName: alias.set };
  return t;
}

function scalarToken(type, value, { code, alias, description } = {}) {
  const t = { $type: type, $value: value, $extensions: {} };
  if (description) t.$description = description;
  if (code) t.$extensions['com.figma.codeSyntax'] = { WEB: code };
  if (alias) t.$extensions['com.figma.aliasData'] = { targetVariableName: alias.name, targetVariableSetName: alias.set };
  return t;
}

/** deep-set "a/b/c" into a nested object */
function put(root, path, node) {
  const parts = path.split('/');
  let o = root;
  for (const p of parts.slice(0, -1)) o = o[p] ??= {};
  o[parts.at(-1)] = node;
}

/* ================================================================== *
 * 1. Colour primitives
 * ================================================================== */

const palette = buildPalette();

/** Full lookup for every primitive path, solid + alpha, used by the semantic layer. */
const PRIM = new Map();
for (const [path, v] of palette) {
  PRIM.set(`solid/${path}`, { ...v, alpha: 1 });
  for (const a of ALPHA_GROUPS) PRIM.set(`opacity-${a}/${path}`, { ...v, alpha: a / 100 });
}

function emitColorPrimitives() {
  const doc = {
    $description:
      'Primitive colour tokens. Every value is computed from the OKLCH spec in build/palette.mjs — no hex is hand-typed. solid/ and opacity-8|15|30|50/ are SIBLING top-level groups, never nested, because a DTCG node cannot be both a token and a group: nesting alpha under a step is what silently dropped 34 base steps and broke 115 alias references in the previous export. opacity-8 is the disabled rung for translucent fills. spectrum-* are Tier-3 artwork and data-viz hues, not UI roles.',
  };
  for (const [path, v] of PRIM) {
    put(doc, path, colorToken({ components: v.components, hex: v.hex, alpha: v.alpha }));
  }
  doc.$extensions = { 'com.figma.modeName': 'Value' };
  return json('tokens/01-colors-primitives.tokens.json', doc);
}

/* ================================================================== *
 * 2. Number primitives
 * ================================================================== */

function emitNumberPrimitives() {
  const doc = { $description: 'Raw numbers consumed by every spacing, radius, stroke and sizing alias in Foundations.' };
  for (const n of NUMBERS) doc[numberName(n)] = scalarToken('number', n);
  doc.$extensions = { 'com.figma.modeName': 'Value' };
  return json('tokens/02-number-primitives.tokens.json', doc);
}
const NUMBER_SET = new Set(NUMBERS);

/* ================================================================== *
 * 3. Foundations
 * ================================================================== */

const cssVars = { root: [], light: [], dark: [] };
const seenNames = new Set();

function declare(bucket, path, value) {
  const name = cssName(path);
  if (bucket === 'root' && seenNames.has(name)) errors.push(`duplicate CSS variable: ${name}`);
  seenNames.add(name);
  cssVars[bucket].push([name, value, path]);
}

function emitFoundations() {
  const doc = { $description: FOUNDATIONS.$description };

  for (const [group, entries] of Object.entries(FOUNDATIONS)) {
    if (group.startsWith('$')) continue;
    for (const [key, val] of Object.entries(entries)) {
      const path = `${group}/${key}`;
      const literal = LITERAL_GROUPS.has(group);
      const num = group === 'layer' ? LAYER_LITERALS[key] : val;

      if (!literal && !NUMBER_SET.has(val)) {
        errors.push(`Foundations ${path} = ${val} has no matching number primitive`);
      }

      put(
        doc,
        path,
        scalarToken('number', num, {
          code: cssRef(path),
          alias: literal ? undefined : { name: numberName(val), set: COLLECTION.numbers },
        })
      );

      declare('root', path, `${num}${group === 'layer' ? '' : 'px'}`);
    }
  }

  for (const [path, val] of Object.entries(FOUNDATION_STRINGS)) {
    put(doc, path, scalarToken('string', val, { code: cssRef(path) }));
    declare('root', path, val);
  }

  doc.$extensions = { 'com.figma.modeName': 'Value' };
  return json('tokens/03-foundations.tokens.json', doc);
}

/* ================================================================== *
 * 4. Motion
 * ================================================================== */

/** Every spring in the spec, resolved to a curve. Computed once at module scope
 *  because the gates, the CSS emitter and the report all need the same objects —
 *  resolving twice would let a rounding difference put two different curves in two
 *  places that claim to be the same token. */
const SPRINGS = resolveSprings(MOTION.spring);

function emitMotion() {
  const doc = { $description: MOTION.$description };

  /* Springs first: they are the recommended path, and DTCG files are read top to
   * bottom by a human at least as often as by Figma. */
  for (const [key, s] of Object.entries(SPRINGS)) {
    const path = `spring/${key}`;
    put(
      doc,
      path,
      /* 'string', not DTCG's cubicBezier — that type is four numbers and this is a
       * linear() stop list. Matches how easing/* has always been emitted. */
      scalarToken('string', s.css, {
        code: cssRef(path),
        description:
          `Computed spring: settles in ${s.settleMs}ms, damping ratio ${s.zeta.toFixed(3)}, ` +
          `overshoot ${(s.peak * 100).toFixed(2)}%. Declared as ` +
          `{ settle: ${s.params.settle}, bounce: ${s.params.bounce ?? 0} } in spec.mjs MOTION.spring ` +
          `and generated by build/motion.mjs — do not hand-edit the stop list.`,
      }),
    );
    declare('root', path, s.css);

    /* The settle time as its own variable, so a consumer writes
     * `transition: transform var(--oz-spring-spatial-default-ms) var(--oz-spring-spatial-default)`
     * and cannot mismatch the pair. */
    const msPath = `spring/${key}-ms`;
    put(doc, msPath, scalarToken('string', `${s.settleMs}ms`, { code: cssRef(msPath) }));
    declare('root', msPath, `${s.settleMs}ms`);
  }

  for (const group of ['scale', 'duration', 'easing']) {
    for (const [key, val] of Object.entries(MOTION[group])) {
      const path = `${group}/${key}`;
      const type = typeof val === 'number' ? 'number' : 'string';
      put(doc, path, scalarToken(type, val, { code: cssRef(path) }));
      declare('root', path, val);
    }
  }

  doc.$extensions = { 'com.figma.modeName': 'Value' };
  return json('tokens/04-motion.tokens.json', doc);
}

/* ================================================================== *
 * 5. Typography
 * ================================================================== */

const TYPE_STEPS = Object.keys(TYPOGRAPHY['font size']);

function emitTypography() {
  const doc = { $description: TYPOGRAPHY.$description };

  const groups = ['font family', 'font weight', 'font style', 'font size', 'line height', 'letter spacing', 'default weight'];
  for (const group of groups) {
    for (const [key, val] of Object.entries(TYPOGRAPHY[group])) {
      const path = `${group}/${key}`;
      const type = typeof val === 'number' ? 'number' : 'string';
      put(doc, path, scalarToken(type, val, { code: cssRef(path) }));

      // 'font style' is Figma-only ('Regular', 'SemiBold'...). Emitting it as CSS
      // produced five variables whose values are not legal in any CSS property.
      if (CSS_EXCLUDED_TYPE_GROUPS.has(group)) continue;

      let css = val;
      if (group === 'font size' && typeof val === 'number') css = `${val}px`;
      if (group === 'letter spacing') css = `${val}em`;
      // Full stack with fallbacks, not the bare Figma family name.
      if (group === 'font family') css = FONT_STACKS[key];
      // 'extrabold' is not a font-weight; 800 is.
      if (group === 'default weight') css = TYPOGRAPHY['font weight'][val];
      declare('root', path, String(css));
    }
  }

  // sanity: the three size-linked groups must cover exactly the same steps
  for (const g of ['line height', 'letter spacing']) {
    const a = TYPE_STEPS.join('|');
    const b = Object.keys(TYPOGRAPHY[g]).join('|');
    if (a !== b) errors.push(`typography step mismatch: 'font size' vs '${g}'`);
  }

  doc.$extensions = { 'com.figma.modeName': 'Value' };
  return json('tokens/05-typography.tokens.json', doc);
}

/* ================================================================== *
 * 6-7. Semantic modes
 * ================================================================== */

/** Expand the compact spec into a flat { path -> [lightTarget, darkTarget] } */
function flattenSemantic() {
  const map = new Map();
  const add = (p, l, d) => {
    if (map.has(p)) errors.push(`semantic token declared twice: ${p}`);
    map.set(p, [l, d]);
  };

  add('color/background', 'solid/neutral/white', 'solid/neutral/150');

  for (const [k, [l, d]] of Object.entries(SEMANTIC.SURFACE)) add(`color/surface/${k}`, l, d);

  const states = ['', '-hover', '-active'];
  for (const [k, [L, D]] of Object.entries(SEMANTIC.FILL)) {
    states.forEach((s, i) => add(`color/fill/${k}${s}`, `solid/${L[i]}`, `solid/${D[i]}`));
    // The five status tracks override this; see FILL_DISABLED_OVERRIDE.
    const ov = FILL_DISABLED_OVERRIDE[k];
    add(`color/fill/${k}-disabled`, ov ? ov[0] : `opacity-50/${L[0]}`, ov ? ov[1] : `opacity-50/${D[0]}`);
  }
  for (const [k, [L, D]] of Object.entries(SEMANTIC.FILL_SOFT)) {
    states.forEach((s, i) => add(`color/fill/${k}${s}`, L[i], D[i]));
    // opacity-8, NOT opacity-15. The soft-fill bases are already opacity-15, so
    // rewriting the prefix to opacity-15 — which is what this line used to do —
    // was a no-op, and all ten soft disabled tokens shipped byte-identical to
    // their enabled state in both modes. 8 is half of 15, matching the solid
    // fills, which derive disabled as opacity-50 of an opaque base.
    add(`color/fill/${k}-disabled`, L[0].replace(/^opacity-\d+/, 'opacity-8'), D[0].replace(/^opacity-\d+/, 'opacity-8'));
  }
  add('color/fill/fixed', 'solid/neutral/white', 'solid/neutral/white');
  add('color/fill/fixed-disabled', 'opacity-50/neutral/white', 'opacity-50/neutral/white');

  for (const [k, [L, D]] of Object.entries(SEMANTIC.BORDER)) {
    ['', '-hover'].forEach((s, i) => add(`color/border/${k}${s}`, `solid/${L[i]}`, `solid/${D[i]}`));
    add(`color/border/${k}-disabled`, `opacity-50/${L[0]}`, `opacity-50/${D[0]}`);
  }
  for (const [k, [l, d]] of Object.entries(SEMANTIC.BORDER_SINGLE)) add(`color/border/${k}`, l, d);

  for (const [k, [l, d]] of Object.entries(SEMANTIC.CONTENT_SINGLE)) add(`color/content/${k}`, l, d);
  for (const [k, [L, D]] of Object.entries(SEMANTIC.CONTENT_ROLE)) {
    states.forEach((s, i) => add(`color/content/${k}${s}`, `solid/${L[i]}`, `solid/${D[i]}`));
    add(`color/content/${k}-disabled`, `opacity-50/${L[0]}`, `opacity-50/${D[0]}`);
  }
  for (const [k, [l, d]] of Object.entries(SEMANTIC.CONTENT_ROLE_INVERSE)) add(`color/content/${k}`, l, d);
  for (const [k, [l, d]] of Object.entries(SEMANTIC.CONTENT_ON)) add(`color/content/${k}`, l, d);

  for (const [k, [l, d]] of Object.entries(SEMANTIC.CHART)) add(`color/chart/${k}`, l, d);
  for (const [k, [l, d]] of Object.entries(SEMANTIC.SIDEBAR)) add(`color/sidebar/${k}`, l, d);
  for (const [k, [l, d]] of Object.entries(SEMANTIC.GRADIENT)) add(`color/gradient/${k}`, l, d);

  return map;
}

const semantic = flattenSemantic();
/** resolved[mode][path] = { hex, alpha, target } */
const resolved = { light: {}, dark: {} };

function emitSemantic() {
  const files = [];

  ['light', 'dark'].forEach((mode, mi) => {
    const doc = {
      $description: `Semantic colour + elevation for HeyOz ${mode === 'light' ? 'Light' : 'Dark'}. Role names are identical in both modes, so every component is theme-agnostic. All colour aliases resolve to _Colors Primitives. CSS namespace --${NAMESPACE}-.`,
    };

    for (const [path, targets] of semantic) {
      const target = targets[mi];
      const prim = PRIM.get(target);
      if (!prim) {
        errors.push(`${mode}: ${path} -> missing primitive '${target}'`);
        continue;
      }
      resolved[mode][path] = { hex: prim.hex, alpha: prim.alpha, target };
      put(
        doc,
        path,
        colorToken({
          components: prim.components,
          hex: prim.hex,
          alpha: prim.alpha,
          code: cssRef(path),
          alias: { name: target, set: COLLECTION.colors },
        })
      );
    }

    for (const [path, vals] of Object.entries(SEMANTIC.ELEVATION)) {
      const v = vals[mi];
      const full = `elevation/${path}`;
      if (typeof v === 'number') {
        put(doc, full, scalarToken('number', v, { code: cssRef(full) }));
        resolved[mode][full] = { hex: null, alpha: 1, number: v };
      } else {
        // Derived from a primitive path rather than a hand-typed hex, which is what
        // rule 1 actually requires — see the literal check in validate().
        //
        // aliasData is emitted ONLY when the alpha matches too. Figma ignores a
        // variable's local $value once it is bound to an alias, so aliasing a 0.08
        // shadow to an opaque primitive would import as a solid slab and the modal
        // scrim would import as an opaque black rectangle. An alias that lies about
        // alpha is worse than no alias: dist/ would still be correct and only the
        // designer's file would be wrong, which is the half of the pipeline nobody
        // would think to re-check. The alpha-matching invariant is asserted in
        // validate() so this cannot be reintroduced.
        const prim = PRIM.get(v.target);
        if (!prim) {
          errors.push(`${mode}: ${full} -> missing primitive '${v.target}'`);
          continue;
        }
        const aliasable = prim.alpha === v.alpha;
        put(
          doc,
          full,
          colorToken({
            components: prim.components,
            hex: prim.hex,
            alpha: v.alpha,
            code: cssRef(full),
            alias: aliasable ? { name: v.target, set: COLLECTION.colors } : undefined,
          })
        );
        resolved[mode][full] = { hex: prim.hex, alpha: v.alpha, target: v.target, aliased: aliasable };
      }
    }

    doc.$extensions = { 'com.figma.modeName': mode === 'light' ? 'HeyOz Light' : 'HeyOz Dark' };
    files.push(json(`tokens/0${6 + mi}-heyoz-${mode}.tokens.json`, doc));
  });

  const lk = Object.keys(resolved.light).join('|');
  const dk = Object.keys(resolved.dark).join('|');
  if (lk !== dk) errors.push('light and dark do not declare the same token names');

  return files;
}

/* ================================================================== *
 * CSS emitters
 * ================================================================== */

/** shadcn v3 consumes `hsl(var(--x))`, so the bridge must emit channel triplets. */
const hexToTriplet = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let hh = 0;
  if (d !== 0) {
    if (max === r) hh = ((g - b) / d) % 6;
    else if (max === g) hh = (b - r) / d + 2;
    else hh = (r - g) / d + 4;
    hh *= 60;
    if (hh < 0) hh += 360;
  }
  return `${+hh.toFixed(2)} ${+(s * 100).toFixed(2)}% ${+(l * 100).toFixed(2)}%`;
};

const colorCss = (r) => (r.alpha === 1 ? r.hex : `${r.hex}${Math.round(r.alpha * 255).toString(16).padStart(2, '0').toUpperCase()}`);

const SHADOW_GEOMETRY = {
  'x-small': '0 1px 2px 0',
  small: '0 1px 3px 0, 0 1px 2px -1px',
  medium: '0 4px 6px -1px, 0 2px 4px -2px',
  large: '0 10px 15px -3px, 0 4px 6px -4px',
};

function modeBlock(mode, indent = '  ') {
  const lines = [];
  for (const [path, r] of Object.entries(resolved[mode])) {
    if (r.number !== undefined) lines.push(`${indent}${cssName(path)}: ${r.number}px;`);
    else lines.push(`${indent}${cssName(path)}: ${colorCss(r)};`);
  }
  lines.push('');
  lines.push(`${indent}/* ready-to-use box-shadow composites */`);
  for (const [k, geom] of Object.entries(SHADOW_GEOMETRY)) {
    const c = colorCss(resolved[mode][`elevation/drop shadow/${k}`]);
    const value = geom.split(', ').map((g) => `${g} ${c}`).join(', ');
    lines.push(`${indent}--${NAMESPACE}-elevation-${k}: ${value};`);
  }
  return lines.join('\n');
}

function emitTokensCss() {
  const head = `/* GENERATED by build/build.mjs — do not edit.
 * HeyOz design tokens. Import once, before Tailwind.
 * Light is the default; add class="dark" (or data-theme="dark") to flip.
 */`;

  const rootLines = cssVars.root.map(([n, v]) => `    ${n}: ${v};`).join('\n');

  const typeUtilities = TYPE_STEPS.map((step) => {
    const role = step.split(' ')[0];
    const cls = `.${NAMESPACE}-text-${step.replace(/\s+/g, '-')}`;
    return [
      `${cls} {`,
      `  font-family: var(--${NAMESPACE}-font-${role === 'display' || role === 'heading' ? role : role});`,
      `  font-size: var(--${NAMESPACE}-text-${step.replace(/\s+/g, '-')});`,
      `  line-height: var(--${NAMESPACE}-leading-${step.replace(/\s+/g, '-')});`,
      `  letter-spacing: var(--${NAMESPACE}-tracking-${step.replace(/\s+/g, '-')});`,
      `}`,
    ].join('\n');
  }).join('\n');

  return out(
    'dist/tokens.css',
    `${head}

@layer base {
  :root {
    color-scheme: light;

    /* ---- foundations, motion, typography (mode-independent) ---- */
${rootLines}

    /* ---- semantic: light ---- */
${modeBlock('light', '    ')}
  }

  /* color-scheme is what tells the browser to render its OWN chrome dark:
     scrollbars, <input type="date"> pickers, form control defaults, spellcheck
     underlines, the canvas behind an overscroll. The .light block declared it
     and this one did not, so a dark-themed app kept light scrollbars and a
     blinding white date picker. */
  .dark,
  [data-theme='dark'] {
    color-scheme: dark;
${modeBlock('dark', '    ')}
  }

  /* Scoped light island inside a dark app. Replaces .force-light, which was a
     hand-maintained third copy of the theme and had already drifted. */
  .light,
  [data-theme='light'] {
    color-scheme: light;
${modeBlock('light', '    ')}
  }
}

/* Type steps. Weight is deliberately NOT baked in — every step accepts every
   weight via --${NAMESPACE}-weight-* or Tailwind's font-* utilities. */
@layer utilities {
${typeUtilities}

${motionUtilities()}
}

${reducedMotionBlock()}`
  );
}

/**
 * Entrance animations and the ambient loop.
 *
 * These ship as classes rather than as Tailwind keyframes because every one of them
 * multiplies its travel by --oz-motion-spatial-scale, and that multiplier is the
 * entire reduced-motion mechanism (see reducedMotionBlock below). A consumer writing
 * their own `translateY(6px)` keyframe gets motion that ignores the preference; one
 * using these cannot.
 *
 * The distances are small on purpose. A 6px rise reads as "this arrived" without
 * being a journey — the research is consistent that entrance travel wants to be
 * short and the easing wants to do the expressive work, which is what the spring is
 * for. Long slides are the most common way motion starts feeling slow.
 */
function motionUtilities() {
  const v = (n) => `var(--${NAMESPACE}-${n})`;

  /* Each entrance is a name, the transform it starts from, and the spring that
   * drives it. Declared as data so a new one cannot forget the scale multiplier. */
  const ENTRANCES = [
    { name: 'fade', from: 'none', spring: 'effects-default', why: 'Opacity only. The safe default, and the only one that is identical under reduced motion.' },
    { name: 'rise', from: `translateY(calc(6px * ${v('motion-spatial-scale')}))`, spring: 'spatial-default', why: 'Content arriving in place: a row, a card, a result.' },
    { name: 'pop', from: `scale(calc(1 - 0.04 * ${v('motion-spatial-scale')}))`, spring: 'spatial-fast', why: 'Something that appeared because you acted: a popover, a menu, a toast.' },
    { name: 'hero', from: `translateY(calc(10px * ${v('motion-spatial-scale')})) scale(calc(1 - 0.02 * ${v('motion-spatial-scale')}))`, spring: 'expressive', why: 'One per screen. The moment worth noticing.' },
  ];

  const keyframes = ENTRANCES.map(
    (e) => `@keyframes ${NAMESPACE}-enter-${e.name} {
  from { opacity: 0; transform: ${e.from}; }
  to   { opacity: 1; transform: none; }
}`,
  ).join('\n\n');

  const classes = ENTRANCES.map(
    (e) => `/* ${e.why} */
.${NAMESPACE}-enter-${e.name} {
  animation: ${NAMESPACE}-enter-${e.name} ${v(`spring-${e.spring}-ms`)} ${v(`spring-${e.spring}`)} both;
}`,
  ).join('\n\n');

  /* Transition-property sets.
   *
   * Real classes rather than Tailwind arbitrary properties, because
   * `[transition-property:color,background-color,…]` does not survive Tailwind's
   * content scanner — its candidate extractor treats commas as delimiters, so the
   * class appears in the HTML and no rule is ever generated for it. Silent: the
   * build passes, the type checks pass, and the transition simply does not happen.
   * Caught by showcase/scripts/verify-classes.mjs.
   *
   * `visual` deliberately excludes width, height, inset and margin. Animating a
   * layout property forces reflow on every frame, and `transition: all` is how that
   * gets in by accident — it is the difference between motion that is smooth and
   * motion that is janky on a mid-range phone. */
  const transitionSets = `/* Every visual property, and nothing that triggers layout. */
.${NAMESPACE}-transition-visual {
  transition-property: color, background-color, border-color, outline-color, fill,
    stroke, opacity, box-shadow, transform, filter;
}

/* Depth alone, for a surface that lifts without changing colour. */
.${NAMESPACE}-transition-depth {
  transition-property: box-shadow, transform;
}`;

  return `${transitionSets}

${keyframes}

@keyframes ${NAMESPACE}-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.45; }
}

${classes}

/* The one loop in the system. Not a spring — a pulse has no target to settle
   toward, so it keeps the ambient duration and a symmetric curve. Carries the
   .oz-ambient marker that the reduced-motion block switches off, because an endless
   decorative loop is the clearest case of what that preference is asking about. */
.${NAMESPACE}-ambient {
  animation: ${NAMESPACE}-pulse ${v('duration-ambient')} ${v('ease-standard')} infinite;
}`;
}

/**
 * The reduced-motion tier.
 *
 * This ships in dist/tokens.css, which is the point. The policy used to live only
 * in the showcase's own globals.css, so the demo honoured the preference and every
 * app that installed the token layer exactly as docs/DEV-GUIDE.md prescribes did
 * not. The layer that defines the motion is the layer that has to define what
 * happens when someone asks for less of it.
 *
 * It is deliberately NOT the usual reset:
 *
 *     * { animation: none !important; transition: none !important }
 *
 * That removes colour and opacity transitions along with movement. Neither carries
 * any vestibular risk — what triggers motion sickness is large travel and parallax,
 * not a background fading from one grey to another — so the blanket version costs
 * those users a snapping, cheaper-feeling interface and buys them nothing. This one
 * removes travel and keeps the fade:
 *
 *   1. --oz-motion-spatial-scale → 0. Every spatial translate in the system is
 *      authored as `calc(<distance> * var(--oz-motion-spatial-scale))`, so all
 *      travel collapses to zero while the opacity on the same element still runs.
 *      No component has to know; the multiplier does it.
 *
 *   2. Spatial spring curves → their effects equivalents. Overshoot is oscillation,
 *      and a bounce is the one part of a spring that is unambiguously "motion" even
 *      when the distance is small — a scale or a corner radius still springs
 *      visibly at zero translation. Repointing the variable removes the ring
 *      without any component changing which token it names.
 *
 *   3. The ambient pulse stops. A loop that never ends is the clearest case in the
 *      whole system: it is decoration, it repeats forever, and it is exactly what
 *      someone with vestibular sensitivity means. Skeletons keep their shape, which
 *      was doing the communicating anyway.
 *
 *   4. Smooth scrolling off. Programmatic smooth scroll is large-viewport travel,
 *      which is the single most reliable trigger there is.
 */
function reducedMotionBlock() {
  const s = (name) => `--${NAMESPACE}-spring-${name}`;

  /* Which effects spring each spatial one falls back to. Paired by speed so a
   * fast spatial transition stays fast rather than being flattened to one value —
   * the timing is not the accessibility problem, the movement is. */
  const FALLBACK = {
    'spatial-fast': 'effects-fast',
    'spatial-default': 'effects-default',
    'spatial-slow': 'effects-slow',
    expressive: 'effects-slow',
  };

  const remaps = Object.entries(FALLBACK)
    .map(([from, to]) => {
      if (!SPRINGS[from] || !SPRINGS[to])
        errors.push(`reduced-motion: cannot remap spring '${from}' → '${to}', one of them does not exist`);
      return `    ${s(from)}: var(${s(to)});`;
    })
    .join('\n');

  return `/* Someone asked their operating system for less movement. Honour it here, in the
   layer that defines the movement — not in whichever app happens to remember. See
   reducedMotionBlock() in build/build.mjs for why this is not \`animation: none\`. */
@media (prefers-reduced-motion: reduce) {
  :root,
  .dark,
  [data-theme='dark'],
  .light,
  [data-theme='light'] {
    /* 1. All spatial travel collapses; fades are untouched. */
    --${NAMESPACE}-motion-spatial-scale: 0;

    /* 2. Spatial springs lose their overshoot, keeping their speed. */
${remaps}
  }

  /* 3. Ambient loops stop. \`.oz-ambient\` is the opt-in marker for a decorative
        loop; the attribute selector catches anything driving one from the token
        directly. Not a universal selector — a functional transition is not the
        thing being objected to. */
  .${NAMESPACE}-ambient,
  [style*='--${NAMESPACE}-duration-ambient'] {
    animation: none !important;
  }

  /* 4. Programmatic smooth scroll is large-viewport travel. */
  html {
    scroll-behavior: auto !important;
  }
}
`;
}

/**
 * dist/layout.css — the layout primitives.
 *
 * A separate file from tokens.css, deliberately. tokens.css is values: a consumer
 * imports it and gets colours and sizes, and it imposes no structure. These are
 * behaviour — eight classes that decide how boxes relate — and a consumer with its
 * own layout system should be able to take the tokens without them. Two imports is
 * the honest shape of that, and docs/DEV-GUIDE.md says so.
 *
 * Ordered after tokens.css because every knob defaults to a token.
 */
function emitLayoutCss() {
  return out(
    'dist/layout.css',
    `/* GENERATED by build/build.mjs from build/layout.mjs — do not edit.
 *
 * HeyOz layout primitives. Import after tokens.css:
 *
 *   @import '.../dist/tokens.css';
 *   @import '.../dist/layout.css';
 *
 * ${LAYOUTS.length} layouts, ${GUARDS.length} overflow guards. Not one media query and not one
 * breakpoint: every primitive reads its own container, so the same element is
 * correct in a 200px sidebar and a 900px column without being told which it is in.
 *
 * Each class exposes its knobs as custom properties, so an instance is tuned in
 * place rather than by adding a variant:
 *
 *   <div class="oz-grid" style="--grid-min: 12rem">
 *
 * See build/layout.mjs for the five ways adaptive layout fails and which primitive
 * answers each.
 */

@layer components {
${renderLayoutCss()
  .split('\n')
  .map((l) => (l.trim() ? `  ${l}` : l))
  .join('\n')}
}
`,
  );
}

function emitBridge() {
  const rows = (mode) =>
    Object.entries(SHADCN_BRIDGE)
      .map(([shad, tokenPath]) => {
        const r = resolved[mode][tokenPath];
        if (!r) { errors.push(`bridge: '${shad}' -> unknown token '${tokenPath}'`); return null; }
        if (r.alpha !== 1) warnings.push(`bridge: --${shad} maps to a translucent token; emitted as its opaque base`);
        return `    --${shad}: ${hexToTriplet(r.hex)};`;
      })
      .filter(Boolean)
      .join('\n');

  const radius = `    --radius: var(--${NAMESPACE}-radius-5);`;

  return out(
    'dist/shadcn-bridge.css',
    `/* GENERATED by build/build.mjs — do not edit.
 *
 * Keeps every existing shadcn/ui component working with zero code changes.
 * Values are HSL channel triplets, so hsl(var(--background)) still resolves.
 *
 * Three of these silently FIX shipped bugs:
 *   --border  -> border/primary      (was identical to --card in dark: invisible edges)
 *   --ring    -> border/focus        (was identical to --primary: invisible focus ring)
 *   --accent  -> fill/tertiary-hover  (was identical to --muted: hover state lost)
 *
 * secondary / muted / accent now land on three different ramp steps
 * (neutral 20 / 35 / 40 in light, 120 / 110 / 100 in dark) and the build
 * asserts they stay distinct. Light --muted is the neutral/35 half-step, not 30:
 * at 30 it was byte-identical to --border.
 *
 * Delete this file once every component reads --${NAMESPACE}-* directly.
 */

@layer base {
  :root {
${rows('light')}
${radius}
  }

  .dark,
  [data-theme='dark'] {
${rows('dark')}
  }

  .light,
  [data-theme='light'] {
${rows('light')}
  }
}
`
  );
}

function emitTailwind() {
  const colors = {};
  for (const path of Object.keys(resolved.light)) {
    if (!path.startsWith('color/')) continue;
    const [, family, ...rest] = path.split('/');
    const leaf = rest.join('-') || 'DEFAULT';
    (colors[family] ??= {})[leaf] = `var(${cssName(path)})`;
  }

  const fontSize = {};
  for (const step of TYPE_STEPS) {
    const k = step.replace(/\s+/g, '-');
    fontSize[k] = [
      `var(--${NAMESPACE}-text-${k})`,
      { lineHeight: `var(--${NAMESPACE}-leading-${k})`, letterSpacing: `var(--${NAMESPACE}-tracking-${k})` },
    ];
  }

  const spacing = {};
  for (const k of Object.keys(FOUNDATIONS.spacing)) {
    const n = k.replace('spacing-', '');
    spacing[`space-${n}`] = `var(--${NAMESPACE}-space-${n})`;
  }

  const borderRadius = {};
  for (const k of Object.keys(FOUNDATIONS.roundness)) {
    const n = k.replace('radius-', '');
    borderRadius[n] = `var(--${NAMESPACE}-radius-${n})`;
  }

  const cfg = {
    theme: {
      extend: {
        colors,
        fontSize,
        spacing,
        borderRadius,
        borderWidth: Object.fromEntries(
          Object.keys(FOUNDATIONS['stroke width']).map((k) => [k.replace('width-', ''), `var(--${NAMESPACE}-stroke-${k.replace('width-', '')})`])
        ),
        fontFamily: Object.fromEntries(
          Object.keys(TYPOGRAPHY['font family']).map((k) => [k, [`var(--${NAMESPACE}-font-${k})`]])
        ),
        fontWeight: Object.fromEntries(
          Object.entries(TYPOGRAPHY['font weight']).map(([k, v]) => [k, String(v)])
        ),
        zIndex: Object.fromEntries(Object.keys(LAYER_LITERALS).map((k) => [k, `var(--${NAMESPACE}-layer-${k})`])),
        screens: Object.fromEntries(Object.entries(FOUNDATIONS.breakpoint).map(([k, v]) => [k, `${v}px`])),
        maxWidth: Object.fromEntries(Object.entries(FOUNDATIONS.container).map(([k, v]) => [`container-${k}`, `${v}px`])),
        /* Springs land in both scales under the same key, so `duration-spatial-default
         * ease-spatial-default` is the pair and mismatching them is visible at the
         * call site. The legacy duration/easing keys stay alongside for the bridge. */
        transitionDuration: {
          ...Object.fromEntries(Object.keys(MOTION.duration).map((k) => [k, `var(--${NAMESPACE}-duration-${k})`])),
          ...Object.fromEntries(Object.keys(SPRINGS).map((k) => [k, `var(--${NAMESPACE}-spring-${k}-ms)`])),
        },
        transitionTimingFunction: {
          ...Object.fromEntries(Object.keys(MOTION.easing).map((k) => [k, `var(--${NAMESPACE}-ease-${k})`])),
          ...Object.fromEntries(Object.keys(SPRINGS).map((k) => [k, `var(--${NAMESPACE}-spring-${k})`])),
        },
        /* Same keys again for animation-* so a keyframed enter can use a spring
         * without restating the variable. */
        animationDuration: Object.fromEntries(Object.keys(SPRINGS).map((k) => [k, `var(--${NAMESPACE}-spring-${k}-ms)`])),
        animationTimingFunction: Object.fromEntries(Object.keys(SPRINGS).map((k) => [k, `var(--${NAMESPACE}-spring-${k})`])),
        boxShadow: Object.fromEntries(Object.keys(SHADOW_GEOMETRY).map((k) => [k, `var(--${NAMESPACE}-elevation-${k})`])),
        ringWidth: { DEFAULT: `var(--${NAMESPACE}-focus-ring-width)` },
        ringOffsetWidth: { DEFAULT: `var(--${NAMESPACE}-focus-ring-offset)` },
        minHeight: { target: `var(--${NAMESPACE}-target-min)`, 'target-comfortable': `var(--${NAMESPACE}-target-comfortable)` },
        minWidth: { target: `var(--${NAMESPACE}-target-min)` },
      },
    },
  };

  return out(
    'dist/tailwind.tokens.js',
    `/* GENERATED by build/build.mjs — do not edit.
 *
 * Tailwind v3. In tailwind.config.js:
 *   const tokens = require('./design-system/dist/tailwind.tokens.js');
 *   module.exports = { presets: [tokens], content: [...] };
 *
 * Spacing is namespaced (space-5, not 5) so token spacing can never be confused
 * with Tailwind's own numeric scale: p-space-5 is 16px, p-4 is still 16px but is
 * NOT a token. Use the space-* utilities for anything token-driven.
 */
module.exports = ${JSON.stringify(cfg, null, 2)};
`
  );
}

/* ================================================================== *
 * Validation
 * ================================================================== */

function validate() {
  const resolveOver = (mode, path, bgPath) => {
    const pageBg = resolved[mode]['color/background'].hex;
    const r = resolved[mode][path];
    if (!r) return null;
    const under = bgPath ? resolved[mode][bgPath] : null;
    const underHex = under ? (under.alpha === 1 ? under.hex : composite(under.hex, under.alpha, pageBg)) : pageBg;
    return r.alpha === 1 ? r.hex : composite(r.hex, r.alpha, underHex);
  };

  const results = [];
  const check = (list, kind, metric = 'wcag') => {
    const measure = metric === 'apca' ? apca : contrast;
    const unit = metric === 'apca' ? (v) => `Lc ${v.toFixed(1)}` : (v) => `${v.toFixed(2)}:1`;
    for (const mode of ['light', 'dark']) {
      // A pair may carry an optional fourth element restricting it to one mode,
      // for roles that only exist meaningfully in one polarity. Same rationale as
      // the mode-scoped collision pairs: an exemption written down beats a hole.
      for (const [fgPath, bgPath, min, onlyMode] of list) {
        if (onlyMode && onlyMode !== mode) continue;
        const fgHex = resolveOver(mode, fgPath, bgPath);
        const bgHex = resolveOver(mode, bgPath, null);
        if (!fgHex || !bgHex) { errors.push(`${kind} check references unknown token: ${fgPath} / ${bgPath}`); continue; }
        const ratio = measure(fgHex, bgHex);
        const pass = ratio >= min;
        results.push({ kind, metric, mode, fg: fgPath, bg: bgPath, ratio: +ratio.toFixed(2), min, pass });
        if (!pass) errors.push(`${kind.toUpperCase()} ${mode}: ${fgPath} on ${bgPath} = ${unit(ratio)}, need ${unit(min)}`);
      }
    }
  };
  check(CONTRAST_ASSERTIONS, 'contrast');
  check(VISIBILITY_ASSERTIONS, 'visibility');
  check(APCA_ASSERTIONS, 'apca', 'apca');

  // pairs that must never be equal
  const mustDiffer = [...COLLISION_ASSERTIONS];
  const tracks = [...new Set([...Object.keys(SEMANTIC.FILL), ...Object.keys(SEMANTIC.FILL_SOFT)])];
  for (const t of tracks) {
    mustDiffer.push([`color/fill/${t}`, `color/fill/${t}-hover`]);
    mustDiffer.push([`color/fill/${t}-hover`, `color/fill/${t}-active`]);
  }
  for (const t of Object.keys(SEMANTIC.BORDER)) mustDiffer.push([`color/border/${t}`, `color/border/${t}-hover`]);

  /* A disabled fill must not equal ANY enabled surface or ANY enabled fill.
   * Generated rather than enumerated, because this constraint has now been got
   * wrong three times by listing the two or three members someone happened to
   * think of: neutral/120 cleared the surfaces it was checked against and matched
   * surface/elevated; neutral/110 cleared those and matched surface/tertiary plus
   * six enabled interactive fills; neutral/30 did the same in light and went
   * unreported because only dark had been looked at.
   *
   * A dead control that looks like a live control is worse than one that looks
   * like a card, and no hand-written list reliably covers 40+ fills. */
  const enabledSurfaces = ['color/background', ...Object.keys(SEMANTIC.SURFACE).map((k) => `color/surface/${k}`)];
  const enabledFills = [];
  for (const k of Object.keys(SEMANTIC.FILL)) for (const s of ['', '-hover', '-active']) enabledFills.push(`color/fill/${k}${s}`);
  for (const role of Object.keys(FILL_DISABLED_OVERRIDE)) {
    for (const other of [...enabledSurfaces, ...enabledFills]) mustDiffer.push([`color/fill/${role}-disabled`, other]);
  }
  // A pair may carry an optional third element restricting it to one mode, for
  // the cases where two roles legitimately share a value in one mode only. The
  // restriction has to be written down rather than left as a silent omission —
  // that is the difference between an exemption and a hole.
  for (const mode of ['light', 'dark']) {
    for (const [a, b, onlyMode] of mustDiffer) {
      if (onlyMode && onlyMode !== mode) continue;
      const ra = resolved[mode][a], rb = resolved[mode][b];
      if (!ra || !rb) continue;
      if (colorCss(ra) === colorCss(rb)) errors.push(`COLLISION ${mode}: ${a} === ${b} (${colorCss(ra)})`);
    }
  }

  // shadcn bridge distinctness
  for (const mode of ['light', 'dark']) {
    for (const [a, b] of BRIDGE_COLLISIONS) {
      const ra = resolved[mode][SHADCN_BRIDGE[a]], rb = resolved[mode][SHADCN_BRIDGE[b]];
      if (!ra || !rb) continue;
      if (ra.hex === rb.hex) errors.push(`BRIDGE COLLISION ${mode}: --${a} === --${b} (${ra.hex})`);
    }
  }

  // every alias must point at a primitive that exists in the emitted file
  for (const [path, targets] of semantic) {
    for (const t of targets) if (!PRIM.has(t)) errors.push(`unresolvable alias: ${path} -> ${t}`);
  }

  /* README rule 1, "zero literals above tier 1", is now ENFORCED rather than
   * asserted in prose. Every colour-valued semantic token must name a primitive.
   * The rule was false for the whole life of the repo — ten elevation literals,
   * six tokens per mode with no alias — and nothing detected it because nothing
   * looked. A rule the build cannot check is a comment. */
  for (const mode of ['light', 'dark']) {
    for (const [path, r] of Object.entries(resolved[mode])) {
      if (r.hex && !r.target) errors.push(`LITERAL above tier 1: ${mode} ${path} = ${r.hex} names no primitive`);
    }
  }

  /* Every aliasData relationship emitted into tokens/ must agree with its target
   * on ALPHA as well as hue. Figma discards a variable's local value once it is
   * bound to an alias, so a translucent token aliased to an opaque primitive
   * imports as opaque — silently, and only on the designer's side, because dist/
   * carries the correct composed value either way. That is a bug this build
   * shipped for exactly one commit. */
  for (const mode of ['light', 'dark']) {
    for (const [path, r] of Object.entries(resolved[mode])) {
      if (!r.target || r.aliased === false) continue;
      const prim = PRIM.get(r.target);
      if (prim && prim.alpha !== r.alpha)
        errors.push(`ALIAS ALPHA MISMATCH: ${mode} ${path} is alpha ${r.alpha} but aliases ${r.target} at alpha ${prim.alpha}`);
    }
  }

  /* Elevation has to be perceptible. The dark drop shadows shipped at ΔL
   * 0.009-0.024 against their own page — the large shadow was weaker than the
   * light x-small — and no gate covered elevation at all. ΔL, not WCAG ratio:
   * near black the ratio's flare term swamps the signal and reports 1.01 for
   * everything, which is why this went unseen. */
  const SHADOW_MIN_DL = 0.02;
  for (const mode of ['light', 'dark']) {
    const pageL = hexToOklch(resolved[mode]['color/background'].hex).L;
    for (const k of Object.keys(SHADOW_GEOMETRY)) {
      const r = resolved[mode][`elevation/drop shadow/${k}`];
      if (!r) continue;
      const cast = composite(r.hex, r.alpha, resolved[mode]['color/background'].hex);
      const dL = Math.abs(pageL - hexToOklch(cast).L);
      results.push({ kind: 'elevation', metric: 'dL', mode, fg: `elevation/drop shadow/${k}`, bg: 'color/background', ratio: +dL.toFixed(4), min: SHADOW_MIN_DL, pass: dL >= SHADOW_MIN_DL });
      if (dL < SHADOW_MIN_DL) errors.push(`ELEVATION ${mode}: drop shadow/${k} moves the page only ΔL ${dL.toFixed(4)}, need ${SHADOW_MIN_DL}`);
    }
  }

  /* Every primitive that some emitted token resolves to.
   *
   * Read from `resolved`, which carries every token in both modes, NOT from
   * `semantic`, which carries only the colour-valued ones. Elevation tokens name
   * primitives too, and `solid/neutral/black` is reached exclusively through them —
   * it is the drop-shadow colour at all four steps in dark mode and the scrim colour
   * as well. Counting from `semantic` reported it unused, which put 504 instead of
   * 503 in the build output, in reports/audit.json, and on the verdict card in
   * test/index.html.
   *
   * Nothing was gated on this, so no emitted value was ever wrong — but the number is
   * read by a human deciding what is dead, and `solid/neutral/black` appearing on
   * that list is how every dark-mode shadow gets deleted by someone tidying up.
   *
   * Iterating `resolved` rather than adding a second loop for elevation is the point:
   * a future token family cannot reintroduce the same undercount. Rule 4 — count the
   * group, not one member of it. */
  const used = new Set();
  for (const mode of ['light', 'dark'])
    for (const r of Object.values(resolved[mode]))
      if (r.target) used.add(r.target);
  const unused = [...PRIM.keys()].filter((k) => !used.has(k));

  /* Chart series must be mutually distinguishable WITHOUT colour — greyscale
   * printing, and the ~8% of men with a red-green deficiency.
   *
   * This was a warning gated on `ΔL < 0.03 AND contrast < 1.08`, which is two
   * thresholds ANDed so tightly that nothing could trip it: the pairs that were
   * actually too close (light 3-vs-5 at 1.26:1, dark 1-vs-2 at 1.28:1) failed the
   * first condition and so were never reported. Greyscale separation is a pure
   * lightness question, so it is now one threshold on ΔL, and it is an error
   * rather than a warning. */
  const CHART_MIN_DL = 0.05;
  for (const mode of ['light', 'dark']) {
    const keys = Object.keys(SEMANTIC.CHART).map((k) => `color/chart/${k}`);
    for (let i = 0; i < keys.length; i++)
      for (let j = i + 1; j < keys.length; j++) {
        const a = resolved[mode][keys[i]].hex, b = resolved[mode][keys[j]].hex;
        if (a === b) { errors.push(`chart collision ${mode}: ${keys[i]} === ${keys[j]}`); continue; }
        const dL = Math.abs(hexToOklch(a).L - hexToOklch(b).L);
        results.push({ kind: 'greyscale', metric: 'dL', mode, fg: keys[i], bg: keys[j], ratio: +dL.toFixed(4), min: CHART_MIN_DL, pass: dL >= CHART_MIN_DL });
        if (dL < CHART_MIN_DL)
          errors.push(`GREYSCALE ${mode}: ${keys[i]} vs ${keys[j]} differ by only ΔL ${dL.toFixed(4)}, need ${CHART_MIN_DL} — indistinguishable without colour`);
      }
  }

  /* ---------------------------------------------------------------- *
   * Surface ladder
   * ---------------------------------------------------------------- *
   *
   * Each rung must sit further from the page than the one below it, by at least
   * SURFACE_LADDER.minStep. See the declaration in spec.mjs for why this is
   * dark-only and why direction is derived from the page rather than assumed. */
  {
    const { order, modes, minStep } = SURFACE_LADDER;
    for (const mode of modes) {
      const pageL = hexToOklch(resolved[mode][order[0]].hex).L;
      /* Which way is "up" here: away from the page. Dark pages are near black, so
       * elevation climbs; a light page would make it descend. Derived rather than
       * hardcoded so the gate stays correct if a mode's polarity ever changes. */
      const sign = pageL < 0.5 ? 1 : -1;

      for (let i = 1; i < order.length; i++) {
        const lo = resolved[mode][order[i - 1]];
        const hi = resolved[mode][order[i]];
        if (!lo || !hi) { errors.push(`ladder: unknown token ${order[i - 1]} / ${order[i]}`); continue; }
        const step = sign * (hexToOklch(hi.hex).L - hexToOklch(lo.hex).L);
        const pass = step >= minStep;
        results.push({
          kind: 'ladder', metric: 'dL', mode,
          fg: order[i], bg: order[i - 1],
          ratio: +step.toFixed(4), min: minStep, pass,
        });
        if (!pass)
          errors.push(
            `LADDER ${mode}: ${order[i]} is only ΔL ${step.toFixed(4)} above ${order[i - 1]}, need ${minStep} — ` +
              `at that separation the surface cannot carry the boundary and a border has to come back`,
          );
      }
    }
  }

  /* ---------------------------------------------------------------- *
   * Motion
   * ---------------------------------------------------------------- *
   *
   * Generated as a sweep over every spring rather than as a list of named
   * assertions, for the reason CLAUDE.md rule 4 gives: a hand-written list of
   * motion checks would gate the spring someone was thinking about and miss its
   * siblings, which is precisely how `content/brand` got gated while its four
   * status siblings did not. Add a spring to spec.mjs and it is gated by existing.
   *
   * Every check reads the emitted curve — `peak` is the measured maximum of the
   * linear() stops that ship, not a restatement of the declared bounce. A spring
   * whose declaration and curve disagreed would be caught here. */
  const M = MOTION_ASSERTIONS;
  const startsAny = (name, prefixes) => prefixes.some((p) => name.startsWith(p));

  for (const [name, s] of Object.entries(SPRINGS)) {
    const path = `spring/${name}`;

    /* 1. Effects springs must not overshoot. An opacity that overshoots clips at 1
     *    and stalls there; a colour that overshoots leaves the gated palette. */
    if (startsAny(name, M.noOvershoot)) {
      const pass = s.peak === 0;
      results.push({ kind: 'motion', metric: 'overshoot', token: path, ratio: +s.peak.toFixed(5), min: 0, pass });
      if (!pass)
        errors.push(
          `MOTION ${path}: effects spring overshoots by ${(s.peak * 100).toFixed(2)}% — must be 0. ` +
            `Set bounce to 0 in spec.mjs MOTION.spring, do not relax the gate.`,
        );
    }

    /* 2. Spatial springs must overshoot. Zeroing the bounce here is a silent
     *    downgrade to the bezier system this layer replaced, so it fails loudly. */
    if (startsAny(name, M.mustOvershoot)) {
      const pass = s.peak > 0;
      results.push({ kind: 'motion', metric: 'overshoot', token: path, ratio: +s.peak.toFixed(5), min: 1e-5, pass });
      if (!pass)
        errors.push(
          `MOTION ${path}: spatial spring does not overshoot (bounce ${s.params.bounce ?? 0}) — ` +
            `a spatial spring without overshoot is a bezier with extra steps.`,
        );
    }

    /* 3. And not so far that it reads as a toy. */
    if (s.peak > M.maxOvershoot)
      errors.push(
        `MOTION ${path}: overshoots ${(s.peak * 100).toFixed(2)}%, ceiling ${(M.maxOvershoot * 100).toFixed(0)}% — ` +
          `lower bounce.`,
      );

    /* 4. Settle-time ceilings, tightest for the springs that run on every hover. */
    const ceiling = M.feedbackFamilies.includes(name)
      ? M.feedbackCeilingMs
      : name.startsWith('expressive')
        ? M.expressiveCeilingMs
        : M.generalCeilingMs;
    const timePass = s.settleMs <= ceiling;
    results.push({ kind: 'motion', metric: 'settle', token: path, ratio: s.settleMs, min: ceiling, pass: timePass });
    if (!timePass)
      errors.push(`MOTION ${path}: settles in ${s.settleMs}ms, ceiling ${ceiling}ms`);

    /* 5. The curve has to be a legal linear() that starts at 0 and ends at 1. A
     *    curve ending at 0.9997 leaves every property permanently short of its
     *    token value — on a colour that is a different hex than the token claims. */
    const ends = s.samples[0] === 0 && s.samples[s.samples.length - 1] === 1;
    results.push({ kind: 'motion', metric: 'endpoints', token: path, ratio: ends ? 1 : 0, min: 1, pass: ends });
    if (!ends) errors.push(`MOTION ${path}: curve does not run exactly 0 → 1`);
  }

  /* 6. The reduced-motion contract. The whole policy rests on one multiplier being
   *    redefinable to 0, so assert it exists and is 1 by default — if it were
   *    renamed, every spatial translate would keep moving under reduced motion and
   *    nothing else would fail. */
  const scale = MOTION.scale['spatial-scale'];
  const scalePass = scale === 1;
  results.push({ kind: 'motion', metric: 'spatial-scale', token: 'scale/spatial-scale', ratio: scale, min: 1, pass: scalePass });
  if (!scalePass)
    errors.push(`MOTION scale/spatial-scale must be 1 by default (got ${scale}) — the reduced-motion override sets it to 0`);

  /* ---------------------------------------------------------------- *
   * Layout
   * ---------------------------------------------------------------- *
   *
   * Static checks on the emitted stylesheet — see inspectLayouts() in
   * build/layout.mjs for what each one is defending against and why a regex is
   * enough to catch it. No browser is involved, which bounds what these prove:
   * they cannot tell you a layout looks right, only that it has not lost one of
   * the four properties that make it unable to overflow. */
  for (const f of inspectLayouts()) {
    results.push({ kind: 'layout', metric: f.check, token: f.subject, ratio: f.pass ? 1 : 0, min: 1, pass: f.pass });
    if (!f.pass) errors.push(`LAYOUT ${f.check} — ${f.subject}: ${f.why}`);
  }

  return { results, unused, primitiveCount: PRIM.size, semanticCount: semantic.size, springs: SPRINGS };
}

/* ================================================================== *
 * Run
 * ================================================================== */

const written = [
  emitColorPrimitives(),
  emitNumberPrimitives(),
  emitFoundations(),
  emitMotion(),
  emitTypography(),
  ...emitSemantic(),
  emitTokensCss(),
  emitLayoutCss(),
  emitBridge(),
  emitTailwind(),
];

const v = validate();

/**
 * Modification times of every file this build reads its decisions from.
 *
 * The staleness problem this solves: edit `spec.mjs`, forget to rebuild, and the
 * page carries on reporting "250/250 gates · no build errors · built <date>". That
 * reads as "everything is current". It actually means "everything was current when
 * somebody last remembered to run this", and a confident stale number is worse than
 * no number, because nobody thinks to question it. It is also the one figure a
 * reviewer is most likely to take at face value.
 *
 * Recorded here rather than checked here, deliberately. The build cannot detect its
 * own staleness — it is running, so by definition it is current. Only a later reader
 * can, by comparing these against the files on disk, which is what
 * `lib/core/audit.ts` does on every page load.
 */
const SOURCES = ['build/palette.mjs', 'build/motion.mjs', 'build/layout.mjs', 'build/spec.mjs', 'build/build.mjs'];

const sourceStamps = Object.fromEntries(
  SOURCES.map((rel) => {
    try {
      return [rel, statSync(join(ROOT, rel)).mtimeMs];
    } catch {
      /* A missing source is a real problem, but not this file's to report — the
       * import would already have failed. Record it as absent rather than crash the
       * emit. */
      return [rel, null];
    }
  }),
);

const audit = {
  generatedAt: new Date().toISOString(),
  /** Epoch millis per authored source, for the staleness check. See SOURCES above. */
  sources: sourceStamps,
  namespace: NAMESPACE,
  counts: {
    colorPrimitives: v.primitiveCount,
    numberPrimitives: NUMBERS.length,
    semanticPerMode: v.semanticCount,
    typeSteps: TYPE_STEPS.length,
    unusedPrimitives: v.unused.length,
  },
  contrast: v.results,
  light: resolved.light,
  dark: resolved.dark,
  bridge: SHADCN_BRIDGE,
  typography: {
    steps: TYPE_STEPS,
    size: TYPOGRAPHY['font size'],
    lineHeight: TYPOGRAPHY['line height'],
    letterSpacing: TYPOGRAPHY['letter spacing'],
    weight: TYPOGRAPHY['font weight'],
    family: TYPOGRAPHY['font family'],
    defaultWeight: TYPOGRAPHY['default weight'],
  },
  errors,
  warnings,
};
json('reports/audit.json', audit);

/* ARCHIVED — the standalone test rig is no longer emitted.
 *
 * `test/index.html` rendered exactly the data now in `reports/audit.json`, and the
 * showcase's /verify route renders the same data from the same file. Two renderings
 * of one dataset is one more than can be kept in step: the rig could only ever show
 * the token gates, and four of the checks that matter most now live at the component
 * layer — verify:contrast measures the pairings the recipes CREATE, which spec.mjs
 * cannot see; verify:motion, verify:borders and verify:classes measure what the
 * recipes compile to. A verification artifact that structurally cannot show half the
 * verification is worse than none, because it looks complete.
 *
 * What is lost is real and was weighed: the rig opened by double-click, with no
 * server and no npm, which is genuinely useful for a reviewer who has neither. The
 * replacement needs `npm run build && npm start` in `showcase/`.
 *
 * The last generated copy is kept at `archive/test-index.html` rather than deleted,
 * and `build/harness.mjs` is kept beside it. Neither is wired to anything. To bring
 * the rig back, restore this call — `harnessHtml` still takes the same four
 * arguments and `SHIPPED` is still exported from build/shipped.mjs.
 */

console.log('\nHeyOz design system — build\n' + '-'.repeat(52));
for (const f of written) console.log('  wrote  ' + f);
console.log('  wrote  reports/audit.json');
console.log('-'.repeat(52));
console.log(`  colour primitives   ${v.primitiveCount}  (${v.unused.length} unused, expected: the grid is generated)`);
console.log(`  semantic per mode   ${v.semanticCount}  x2 modes`);
console.log(`  type steps          ${TYPE_STEPS.length}  x ${Object.keys(TYPOGRAPHY['font weight']).length} weights`);
const ct = v.results.filter((r) => r.kind === 'contrast');
const vt = v.results.filter((r) => r.kind === 'visibility');
const at = v.results.filter((r) => r.kind === 'apca');
console.log(`  contrast gates      ${ct.filter((r) => r.pass).length}/${ct.length} pass   WCAG 2.x ratio`);
// APCA was previously computed and enforced but never printed, so the summary
// under-reported the gate count and the one metric carrying the white-on-fill
// decision was invisible unless it failed.
console.log(`  APCA gates          ${at.filter((r) => r.pass).length}/${at.length} pass   Lc 60 floor`);
const et = v.results.filter((r) => r.kind === 'elevation');
const gt = v.results.filter((r) => r.kind === 'greyscale');
const mt = v.results.filter((r) => r.kind === 'motion');
console.log(`  visibility gates    ${vt.filter((r) => r.pass).length}/${vt.length} pass`);
console.log(`  elevation gates     ${et.filter((r) => r.pass).length}/${et.length} pass   ΔL floor`);
console.log(`  greyscale gates     ${gt.filter((r) => r.pass).length}/${gt.length} pass   chart series ΔL`);
const dt = v.results.filter((r) => r.kind === 'ladder');
console.log(`  ladder gates        ${dt.filter((r) => r.pass).length}/${dt.length} pass   surface elevation ΔL`);
console.log(`  motion gates        ${mt.filter((r) => r.pass).length}/${mt.length} pass   overshoot + settle`);
const lt = v.results.filter((r) => r.kind === 'layout');
console.log(`  layout gates        ${lt.filter((r) => r.pass).length}/${lt.length} pass   overflow safety`);
console.log(`  ${'-'.repeat(50)}`);
console.log(`  total               ${v.results.filter((r) => r.pass).length}/${v.results.length} pass`);

if (warnings.length) {
  console.log('\n  warnings:');
  for (const w of [...new Set(warnings)]) console.log('    ! ' + w);
}
if (errors.length) {
  console.log('\n  FAILED:');
  for (const e of errors) console.log('    x ' + e);
  process.exit(1);
}
console.log('\n  OK — no errors.\n');
