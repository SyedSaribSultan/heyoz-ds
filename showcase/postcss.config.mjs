/** @type {import('postcss-load-config').Config} */

/* postcss-import must run BEFORE tailwindcss, and it is not optional here.
 *
 * dist/tokens.css declares a real CSS cascade layer — `@layer base { :root { … } }`
 * — deliberately, so that the unlayered utilities that consume it always win. If
 * Tailwind's plugin is handed that file on its own it reads the at-rule as its own
 * @layer directive and fails with "`@layer base` is used but no matching
 * `@tailwind base` directive is present".
 *
 * Inlining the import first puts the token declarations into the same file as
 * `@tailwind base`, which is the arrangement docs/DEV-GUIDE.md tells app developers
 * to use, and Tailwind then hoists them into its base layer — ahead of every
 * utility, which is the order the tokens want. */
const config = {
  plugins: {
    'postcss-import': {},
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
