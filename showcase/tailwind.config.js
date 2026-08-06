/* Plain CJS on purpose. dist/tailwind.tokens.js is a CommonJS preset (see the
 * "//type" note in the root package.json for why the repo is not type:module),
 * and requiring it from a .js config is the exact snippet docs/DEV-GUIDE.md tells
 * app developers to write. The showcase should consume the system the same way
 * the product does. */
const tokens = require('../dist/tailwind.tokens.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [tokens],
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],

  /* Recipes compose utility names at runtime — `bg-${binding.bg}` — so Tailwind's
   * content scanner cannot see them as literals. Safelisting by pattern is the
   * supported answer and it is safe here because the token set is closed and
   * generated: every name these patterns can produce exists in the preset.
   *
   * Keep the variant lists in step with STATE_VARIANT in lib/core/Recipe.ts. If a
   * state renders unstyled in the browser, a missing variant here is the first
   * thing to check. */
  safelist: [
    {
      pattern: /^bg-(fill|surface|sidebar|background)(-|$)/,
      variants: [
        'hover',
        'active',
        'disabled',
        'focus-visible',
        'aria-selected',
        'group-hover',
        'peer-checked',
      ],
    },
    {
      pattern: /^text-(content|sidebar)-/,
      variants: [
        'hover',
        'active',
        'disabled',
        'focus-visible',
        'aria-selected',
        'group-hover',
        'placeholder',
      ],
    },
    {
      pattern: /^border-(border|content|fill)-/,
      variants: ['hover', 'active', 'disabled', 'focus-visible', 'aria-selected'],
    },
    { pattern: /^outline-border-/, variants: ['focus-visible'] },

    /* Dropzone's dashed edge is an SVG rect, not a CSS border — a 1px `border-dashed`
     * is drawn by the UA at roughly 2/2 and the Figma dash is 10/10, which no property
     * changes. Its colour is derived from the same binding the zone compiles and
     * remapped `border-*` → `stroke-*` by dropzoneRecipe.frameClasses, so the scanner
     * never sees the literal — same situation as the colour bindings above. */
    {
      pattern: /^stroke-(border|content|fill)-/,
      variants: ['hover', 'group-hover', 'disabled'],
    },
    {
      pattern: /^shadow-(x-small|small|medium|large)$/,
      variants: ['hover', 'active', 'aria-selected'],
    },
    { pattern: /^(from|to|via)-gradient-/ },

    /* Spring pairs. ComponentRecipe.motionClasses builds these as
     * `duration-${spec.transition}` / `ease-${spec.transition}`, so the scanner
     * never sees the literal — same situation as the colour bindings above and the
     * same answer. Safe because the key set is generated: the token build registers
     * every spring under an identical key in both Tailwind scales, so any name these
     * patterns can produce exists in both. */
    { pattern: /^duration-(effects|spatial|expressive)/ },
    { pattern: /^ease-(effects|spatial|expressive)/ },

    /* `bg-transparent` is Tailwind core, but ghost's binding stores the bare word
     * 'transparent' and the class is only assembled at runtime, so the content
     * scanner never sees the literal. */
    'bg-transparent',
  ],

  theme: {
    extend: {
      /* The preset maps the focus geometry onto ringWidth/ringOffsetWidth, which
       * Tailwind implements with box-shadow. Components here need box-shadow free
       * for elevation and for the inset focus ring, so the same two token values
       * are also exposed as outline keys. The values are still the tokens — only
       * the Tailwind key name is local. */
      outlineWidth: { ring: 'var(--oz-focus-ring-width)' },
      outlineOffset: { ring: 'var(--oz-focus-ring-offset)' },

      /* Named rather than written as arbitrary values. `grid-cols-[188px_minmax(0,1fr)]`
       * reads as a bug waiting to happen and Tailwind will not generate it — the
       * comma inside the function ends the arbitrary value. */
      gridTemplateColumns: {
        rail: '188px minmax(0, 1fr)',
        app: '200px minmax(0, 1fr)',
        /* /static-ads. Its own key rather than reusing `app`, because the rail really is
         * wider there and for a reason: thirteen grouped destinations with a heading over
         * each group, against Content Studio's seven flat ones. "Competitors" truncates at
         * 200px. */
        ads: '240px minmax(0, 1fr)',
      },

      /* No keyframes here any more.
       *
       * This block used to define oz-pulse and oz-slide-in locally, reading the
       * duration and easing tokens for their timing. That was half right — the
       * timing came from the system and the movement did not, which had two
       * consequences. The slide hardcoded `translateY(6px)`, so it ignored
       * --oz-motion-spatial-scale and kept moving for anyone who had asked for
       * reduced motion. And the pulse did not carry the .oz-ambient marker the
       * reduced-motion block switches off, so it kept pulsing for them too.
       *
       * Both now come from dist/tokens.css as .oz-enter-* and .oz-ambient, generated
       * by motionUtilities() in build/build.mjs. Defining an animation in the app
       * layer means defining it outside the thing that knows when not to run it. */
    },
  },

  plugins: [],
};
