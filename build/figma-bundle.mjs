/**
 * figma-bundle.mjs — the designer leg. One file, for the Tokens Studio plugin.
 *
 * ==================================================================================
 * WHY THIS IS A SEPARATE FILE FROM tokens/, AND WHY IT IS ONE DOCUMENT
 * ==================================================================================
 *
 * `tokens/*.json` is DTCG-2024 for Figma's NATIVE Variables importer: seven files, and a
 * colour's `$value` is an object — `{ colorSpace, components, alpha, hex }`.
 *
 * Tokens Studio cannot read any of that. It wants `value` as a string, its own `type` names
 * (`fontSizes`, not `dimension`), and — the part that actually decides the shape of this file —
 * it has no way to open a folder. The plugin's local paths are "load one JSON file" and "paste
 * into the JSON editor". A directory of token sets is only readable through a **sync provider**
 * (GitHub/GitLab/…), which is configuration the designer may not have and may not be entitled
 * to.
 *
 * So this emits ONE document with the sets as top-level keys and `$themes` / `$metadata`
 * inline. Paste it, export, done. That is the shape of the reference implementation this was
 * rebuilt against, and it is the only shape that needs nothing set up first.
 *
 * ==================================================================================
 * THE FOUR THINGS FIGMA CANNOT DO, AND WHAT HAPPENS TO THEM HERE
 * ==================================================================================
 *
 * 1. NO FLUID TYPE. A Figma variable is one number; `clamp(40px, …, 64px)` would import as a
 *    String variable that cannot be applied to a text layer's size. Every fluid step ships its
 *    DESKTOP CEILING, read from `FLUID_RANGE` rather than parsed back out of the CSS.
 *
 * 2. NO UNITLESS LINE HEIGHT. The system authors leading as a ratio so it survives the clamp;
 *    Figma text styles need px. Converted here: `round(ratio × ceiling)`. Letter spacing is
 *    authored in em and becomes px the same way.
 *
 * 3. NO MOTION VARIABLE TYPE. Figma variables are Color, Number, String, Boolean — there is no
 *    duration and no easing. Twenty-five motion tokens are deliberately ABSENT rather than
 *    shipped as strings that would import as meaningless text. They live in `dist/tokens.css`
 *    and the showcase; a designer does not bind them to anything.
 *
 * 4. NO COMPOSITE STYLES FROM ATOMIC TOKENS. Atomic size/leading/tracking variables give a
 *    designer four numbers to set by hand. So this also emits 75 `typography` tokens — every
 *    step × every weight — which Tokens Studio turns into 75 Figma TEXT STYLES. That is the
 *    difference between a usable type system and a pile of numbers.
 *
 * ==================================================================================
 * NAMING
 * ==================================================================================
 *
 * Everything is hyphenated: `font-size/display-lg`, not `font size/display lg`. Two reasons —
 * it matches the CSS custom property names exactly, and a reference containing spaces
 * (`{font size.display lg}`) is a fragile thing to ask a plugin to resolve.
 */

/** `font size` / `display lg` -> `font-size` / `display-lg`. */
export const hyphen = (s) => s.replace(/\s+/g, '-');

/** A path with every segment hyphenated. */
const hyphenPath = (p) => p.split('/').map(hyphen).join('/');

/** `solid/brand/60` -> `{solid.brand.60}` — a Tokens Studio reference. */
const ref = (target) => `{${hyphenPath(target).replace(/\//g, '.')}}`;

/** Literal colour. 8-digit hex when translucent; Tokens Studio reads `#RRGGBBAA`. */
function hexa(hex, alpha = 1) {
  if (alpha >= 1) return hex;
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0').toUpperCase();
  return `${hex}${a}`;
}

/** deep-set a `{ value, type }` leaf. Legacy keys, not `$value`/`$type` — both are accepted
 *  and this pair is what the reference implementation uses, so it is the better-tested path. */
function put(root, path, type, value) {
  const parts = hyphenPath(path).split('/');
  let o = root;
  for (const p of parts.slice(0, -1)) o = o[p] ??= {};
  o[parts.at(-1)] = { value, type };
}

/**
 * Tokens Studio type for a foundations group.
 *
 * Not cosmetic: the type decides which Figma fields the variable can be bound to, so a radius
 * typed `spacing` will not appear in the corner-radius picker. Anything without a natural
 * mapping stays `number`, which binds to everything numeric.
 */
const FOUNDATION_TYPE = {
  spacing: 'spacing',
  roundness: 'borderRadius',
  'stroke width': 'borderWidth',
  size: 'sizing',
  icon: 'sizing',
  container: 'sizing',
  breakpoint: 'sizing',
  focus: 'borderWidth',
  layer: 'number',
};

/**
 * Build the bundle.
 *
 * Everything comes from the resolved maps the token build has already produced — the same
 * `PRIM`, `resolved` and spec objects `tokens/` was written from — so the two legs cannot
 * disagree about a value.
 */
export function buildFigmaBundle({ PRIM, NUMBERS, numberName, resolved, FOUNDATIONS, FOUNDATION_STRINGS, TYPOGRAPHY, FLUID_RANGE, LITERAL_GROUPS, LAYER_LITERALS }) {
  const SET = {
    colors: '_Colors Primitives',
    numbers: '_Number Primitives',
    nums: 'Numbers Tokens',
    type: 'Typography Tokens',
    light: 'HeyOz Light',
    dark: 'HeyOz Dark',
  };

  const bundle = {};
  const sets = {};
  for (const k of Object.values(SET)) sets[k] = bundle[k] = {};

  /* -- 1. colour primitives: literal, the root of every reference chain ------------ */
  for (const [name, p] of PRIM) put(sets[SET.colors], name, 'color', hexa(p.hex, p.alpha));

  /* -- 2. number primitives ------------------------------------------------------- */
  for (const n of NUMBERS) put(sets[SET.numbers], numberName(n), 'number', n);

  /* -- 3. Numbers Tokens: spacing, radius, stroke … each aliasing a primitive ------ */
  for (const [group, entries] of Object.entries(FOUNDATIONS)) {
    if (group.startsWith('$')) continue;
    const type = FOUNDATION_TYPE[group] ?? 'number';
    for (const [key, val] of Object.entries(entries)) {
      const literal = LITERAL_GROUPS.has(group);
      const num = group === 'layer' ? LAYER_LITERALS[key] : val;
      /* Aliased where the native emitter aliases, literal where it does not — same rule, so
       * the chain in Figma matches the chain in the DTCG files. */
      put(sets[SET.nums], `${group}/${key}`, type, literal ? num : ref(numberName(val)));
    }
  }
  /* The string foundations (font stacks, the reduced-motion scale) are CSS concepts with no
   * Figma binding. Emitted as `other` so they are present and inert rather than absent and
   * quietly missing. */
  for (const [path, val] of Object.entries(FOUNDATION_STRINGS)) {
    put(sets[SET.nums], path, 'other', val);
  }

  /* -- 4. Typography: atomic tokens, converted to what Figma can hold ------------- */
  const T = sets[SET.type];

  /** Desktop ceiling for a size that may be fluid. See note 1 in the header. */
  const px = (v) => (typeof v === 'string' ? (FLUID_RANGE.get(v)?.max ?? null) : v);

  for (const [key, val] of Object.entries(TYPOGRAPHY['font family'])) {
    put(T, `font family/${key}`, 'fontFamilies', val);
  }
  for (const [key, val] of Object.entries(TYPOGRAPHY['font weight'])) {
    put(T, `font weight/${key}`, 'fontWeights', val);
  }
  /* Figma binds a text layer's weight to the STYLE NAME, not the numeric weight, so both exist.
   * `fontWeights` accepts either; these are the strings a text style actually applies. */
  for (const [key, val] of Object.entries(TYPOGRAPHY['font style'])) {
    put(T, `font style/${key}`, 'fontWeights', val);
  }

  const sizePx = {};
  for (const [step, val] of Object.entries(TYPOGRAPHY['font size'])) {
    const n = px(val);
    if (n === null) throw new Error(`figma-bundle: font size '${step}' is fluid but not in FLUID_RANGE`);
    sizePx[step] = n;
    put(T, `font size/${step}`, 'fontSizes', n);
  }

  /* Ratio -> px, against the ceiling the size ships at. Rounded: Figma shows line height to one
   * decimal and a 68.00000000000001 reads as a bug in the export. */
  for (const [step, ratio] of Object.entries(TYPOGRAPHY['line height'])) {
    put(T, `line height/${step}`, 'lineHeights', Math.round(ratio * sizePx[step]));
  }
  /* em -> px. Two decimals, which is the precision Figma itself keeps. */
  for (const [step, em] of Object.entries(TYPOGRAPHY['letter spacing'])) {
    put(T, `letter spacing/${step}`, 'letterSpacing', Number((em * sizePx[step]).toFixed(2)));
  }
  for (const [key, val] of Object.entries(TYPOGRAPHY['default weight'])) {
    put(T, `default weight/${key}`, 'other', val);
  }

  /* -- 5. Typography: the composite text styles ----------------------------------- *
   *
   * Every step × every weight. 15 × 5 = 75, and all of them, because the system's own rule is
   * that a step does not own a weight — `CLAUDE.md`: "Weight is deliberately NOT baked in —
   * every step accepts every weight." Shipping only the default weight per family would be this
   * emitter making a decision the token layer refused to make.
   *
   * fontFamily is chosen by the step's ROLE: display and heading are Bricolage, body and label
   * are Geist. That mapping already exists as the `font family` group keyed by role, and a step
   * name begins with its role. */
  const roleOf = (step) => step.split(' ')[0];
  for (const step of Object.keys(TYPOGRAPHY['font size'])) {
    const role = roleOf(step);
    for (const weight of Object.keys(TYPOGRAPHY['font style'])) {
      put(T, `text/${step}/${weight}`, 'typography', {
        fontFamily: ref(`font family/${role}`),
        fontWeight: ref(`font style/${weight}`),
        fontSize: ref(`font size/${step}`),
        lineHeight: ref(`line height/${step}`),
        letterSpacing: ref(`letter spacing/${step}`),
      });
    }
  }

  /* -- 6. Semantic, one set per mode ---------------------------------------------- */
  for (const [mode, setName] of [['light', SET.light], ['dark', SET.dark]]) {
    const S = sets[setName];
    for (const [path, t] of Object.entries(resolved[mode])) {
      if (t.number !== undefined) {
        put(S, path, 'number', t.number);
        continue;
      }
      /* `aliased === false` marks the ten alpha-carrying elevation tokens. Figma discards a
       * variable's local value once bound to an alias, so a reference would import a 0.08 shadow
       * OPAQUE — the modal scrim as a solid black rectangle. Those stay literal. */
      const literal = t.aliased === false || !t.target;
      put(S, path, 'color', literal ? hexa(t.hex, t.alpha) : ref(t.target));
    }
  }

  /* -- 7. $metadata and $themes, inline ------------------------------------------- *
   *
   * `group` is the Figma COLLECTION name and `name` is the MODE within it — two themes sharing a
   * group become two modes of one collection, which is how Light and Dark end up as modes rather
   * than as separate collections. Getting these two backwards produces five collections each
   * with one mode named after itself, which is the mistake the first version of this made.
   *
   * `enabled` = export as variables. `source` = resolve references from, do not export.
   * `disabled` = ignore. Primitives are `source` wherever something references them and
   * `enabled` only in their own theme, so they exist as a collection AND resolve elsewhere. */
  const ORDER = [SET.colors, SET.numbers, SET.nums, SET.type, SET.light, SET.dark];
  const pick = (enabled, source = []) =>
    Object.fromEntries(
      ORDER.map((s) => [s, enabled.includes(s) ? 'enabled' : source.includes(s) ? 'source' : 'disabled'])
    );

  bundle.$themes = [
    { id: 'colors-primitives', name: 'Mode 1', group: SET.colors, selectedTokenSets: pick([SET.colors]) },
    { id: 'number-primitives', name: 'Mode 1', group: SET.numbers, selectedTokenSets: pick([SET.numbers]) },
    { id: 'numbers-tokens', name: 'Mode 1', group: SET.nums, selectedTokenSets: pick([SET.nums], [SET.numbers]) },
    { id: 'typography-tokens', name: 'Mode 1', group: SET.type, selectedTokenSets: pick([SET.type]) },
    {
      id: 'heyoz-light',
      name: 'HeyOz Light',
      group: 'Colors & Elevations Tokens',
      selectedTokenSets: pick([SET.light], [SET.colors]),
    },
    {
      id: 'heyoz-dark',
      name: 'HeyOz Dark',
      group: 'Colors & Elevations Tokens',
      selectedTokenSets: pick([SET.dark], [SET.colors]),
    },
  ];

  bundle.$metadata = { tokenSetOrder: ORDER };
  return bundle;
}
