#!/usr/bin/env node
/**
 * build.mjs — one command, everything regenerated.
 *
 *   tokens/   DTCG JSON, imported into Figma (source of truth for designers)
 *   dist/     CSS + Tailwind config (source of truth for developers)
 *   reports/  audit data consumed by test/index.html
 *
 * Nothing in tokens/ or dist/ is ever hand-edited. Both come from
 * build/palette.mjs (values) and build/spec.mjs (decisions).
 */

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildPalette, oklch, hexToOklch, contrast, apca, composite, ALPHA_GROUPS } from './palette.mjs';
import {
  NAMESPACE,
  NUMBERS,
  numberName,
  FOUNDATIONS,
  LAYER_LITERALS,
  FOUNDATION_STRINGS,
  LITERAL_GROUPS,
  MOTION,
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
import { harnessHtml } from './harness.mjs';
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

function scalarToken(type, value, { code, alias } = {}) {
  const t = { $type: type, $value: value, $extensions: {} };
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

function emitMotion() {
  const doc = { $description: MOTION.$description };
  for (const group of ['duration', 'easing']) {
    for (const [key, val] of Object.entries(MOTION[group])) {
      const path = `${group}/${key}`;
      put(doc, path, scalarToken('string', val, { code: cssRef(path) }));
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
}
`
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
        transitionDuration: Object.fromEntries(Object.keys(MOTION.duration).map((k) => [k, `var(--${NAMESPACE}-duration-${k})`])),
        transitionTimingFunction: Object.fromEntries(Object.keys(MOTION.easing).map((k) => [k, `var(--${NAMESPACE}-ease-${k})`])),
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

  const used = new Set();
  for (const [, t] of semantic) { used.add(t[0]); used.add(t[1]); }
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

  return { results, unused, primitiveCount: PRIM.size, semanticCount: semantic.size };
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
  emitBridge(),
  emitTailwind(),
];

const v = validate();

const audit = {
  generatedAt: new Date().toISOString(),
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

// Test rig, with the audit and the shipped values inlined so it opens by
// double-click — no server, no CORS.
out(
  'test/index.html',
  harnessHtml({
    audit,
    shipped: SHIPPED,
    tokensCss: readFileSync(join(ROOT, 'dist/tokens.css'), 'utf8'),
    bridgeCss: readFileSync(join(ROOT, 'dist/shadcn-bridge.css'), 'utf8'),
  })
);

console.log('\nHeyOz design system — build\n' + '-'.repeat(52));
for (const f of written) console.log('  wrote  ' + f);
console.log('  wrote  reports/audit.json');
console.log('  wrote  test/index.html');
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
console.log(`  visibility gates    ${vt.filter((r) => r.pass).length}/${vt.length} pass`);
console.log(`  elevation gates     ${et.filter((r) => r.pass).length}/${et.length} pass   ΔL floor`);
console.log(`  greyscale gates     ${gt.filter((r) => r.pass).length}/${gt.length} pass   chart series ΔL`);
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
