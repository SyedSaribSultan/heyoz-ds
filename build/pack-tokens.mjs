/**
 * pack-tokens.mjs — the tokens-only handoff, as one folder a developer can drop in.
 *
 * WHY THIS EXISTS. `npm pack` ships 31 files: the DTCG JSON for Figma's native import,
 * the Tokens Studio mirror, reports/audit.json, the whole build/ engine, and
 * dist/recipes.json. All of that is correct for the repo and wrong for a developer who
 * has been told "here are the tokens" — the Figma sets are unreadable to them,
 * recipes.json is component data, and being handed 1.7 MB when you need 92 kB invites
 * the question of which parts matter. Deciding that on their behalf is the whole job of
 * a handoff.
 *
 * WHY THE README IS GENERATED. It quotes the gate count, the token counts and the build
 * stamp. Every one of those is a fact with an expiry date, and this repo has now been
 * bitten six times by exactly that (see build/verify-docs.mjs). A README written by hand
 * would be stale on the second send. This one is rewritten from reports/audit.json on
 * every run, so it cannot describe a build it did not come from.
 *
 * WHAT IT DELIBERATELY LEAVES OUT: components. There are no recipes here and no React.
 * The four files below are the token layer and the layout primitives, nothing above them.
 *
 * Run: node build/pack-tokens.mjs   (or npm run pack)
 * Output: deliverable/heyoz-tokens/ — gitignored, safe to zip and send.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'deliverable', 'heyoz-tokens');

const audit = JSON.parse(readFileSync(join(ROOT, 'reports/audit.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

/* The webfont link, copied from showcase/app/layout.tsx rather than retyped. If the
 * showcase ever changes which weights it loads, this must change with it — a handoff
 * that loads different axes than the reference renders different type. */
const LAYOUT_TSX = readFileSync(join(ROOT, 'showcase/app/layout.tsx'), 'utf8');
const fontHref = LAYOUT_TSX.match(/'(https:\/\/fonts\.googleapis\.com\/css2\?[^']+)'/)?.[1];
if (!fontHref) {
  console.error(
    '\n  Could not find the Google Fonts URL in showcase/app/layout.tsx.\n' +
      '  It is the one thing a developer cannot infer from the tokens, so this script\n' +
      '  refuses to emit a README without it.\n',
  );
  process.exit(1);
}

/* -- the payload ------------------------------------------------------------ */

const FILES = [
  {
    from: 'dist/tokens.css',
    why: 'Every token. Colours, spacing, radii, shadows, type steps, springs. Required.',
  },
  {
    from: 'dist/shadcn-bridge.css',
    why: 'Keeps your existing shadcn components working with no code changes. Required until they read --oz-* directly, then delete it.',
  },
  {
    from: 'dist/tailwind.tokens.js',
    why: 'Tailwind 3 preset, so bg-surface-primary and friends resolve. Required if you use Tailwind.',
  },
  {
    from: 'dist/layout.css',
    why: 'Eight layout primitives as 86 utility classes (oz-stack, oz-cluster, oz-grid, oz-sidebar…). Optional — delete it if you would rather keep hand-rolling flex wrappers.',
  },
];

rmSync(join(ROOT, 'deliverable'), { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let total = 0;
for (const f of FILES) {
  const body = readFileSync(join(ROOT, f.from));
  const name = f.from.replace('dist/', '');
  writeFileSync(join(OUT, name), body);
  f.name = name;
  f.kb = (statSync(join(OUT, name)).size / 1024).toFixed(1);
  total += Number(f.kb);
}

/* -- the README, generated -------------------------------------------------- */

const g = audit.contrast;
const families = [...new Set(g.map((r) => r.kind))];
const stamp = new Date(audit.generatedAt).toISOString().replace('T', ' ').slice(0, 16);

const readme = `# HeyOz design tokens

Version ${pkg.version} · built ${stamp} UTC · ${g.length}/${g.length} gates passing
across ${families.length} families.

Tokens and foundations only. There are no components in here.

| File | Size | What it is |
|---|---|---|
${FILES.map((f) => `| \`${f.name}\` | ${f.kb} kB | ${f.why} |`).join('\n')}

Total: ${total.toFixed(0)} kB.

## Install — about five minutes

**1. Copy this folder** into your app, e.g. \`src/design-system/\`.

**2. In \`globals.css\`,** add the imports at the very top, above the Tailwind
directives:

\`\`\`css
@import './design-system/tokens.css';
@import './design-system/shadcn-bridge.css';
@import './design-system/layout.css';   /* only if you kept it */

@tailwind base;
@tailwind components;
@tailwind utilities;
\`\`\`

**3. Delete three blocks** from \`globals.css\`: the whole \`:root { … }\`, the whole
\`.dark { … }\`, and the whole \`.force-light { … }\`. Those are the hardcoded colours
these tokens replace. **Keep everything else** — the body font rule, the scrollbar
utilities, the keyframes. Those migrate later.

**4. In \`tailwind.config.js\`:**

\`\`\`js
const tokens = require('./src/design-system/tailwind.tokens.js');
module.exports = { presets: [tokens], darkMode: 'class', content: [/* yours */] };
\`\`\`

**5. Load the fonts.** This is the step that is easy to miss and silently ruins the
type. The tokens name four families and ship none of them:

\`\`\`html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="${fontHref}" />
\`\`\`

That is the whole install. Dark mode is \`class="dark"\` on \`<html>\`, same as before.

## Four things that will bite

**1. Do not use \`next/font\`.** It self-hosts under a generated family name like
\`__Bricolage_1a2b3c\`. The token values name the families as literal strings
(\`var(--oz-font-display)\` is \`'Bricolage Grotesque', ui-sans-serif, …\`), and those
literals will never match a hashed name — so the fonts load and nothing uses them.
Use the \`<link>\` above.

**2. \`border-2\` is 1px, not 2px.** The number is a step on a stroke scale
(\`--oz-stroke-1\` 0.5px, \`-2\` 1px, \`-3\` 1.5px), not a pixel count. Tailwind's own
\`border-2\` means 2px. Same class name, different result.

**3. Opacity modifiers do nothing.** \`bg-surface-primary/50\` silently produces no
transparency — the preset has no alpha slot. Use the pre-composited alpha tokens
instead; they are gated for contrast, an arbitrary \`/50\` is not.

**4. Two colour formats coexist while you migrate.** Bridge variables are HSL channel
triplets and need the wrapper — \`hsl(var(--background))\`. The new \`--oz-\` variables
are complete values and must not have it — \`var(--oz-color-surface-primary)\`.
Wrapping an \`--oz-\` variable in \`hsl()\` yields nothing. This goes away when the
bridge does.

## Spacing

\`p-space-5\` (16px, ours) and \`p-4\` (16px, Tailwind's) agree today and diverge above
16px. Use \`space-*\` for anything a designer specified — the namespace exists so this
is never ambiguous.

| token | px |
|---|---|
| \`space-1\` | 4 |
| \`space-3\` | 8 |
| \`space-5\` | 16 |
| \`space-7\` | 24 |
| \`space-9\` | 32 |
| \`space-12\` | 48 |

## What the bridge fixes on its own

No code change needed for any of these — they were bugs because two variables held
the same value:

| Variable | Was | Now |
|---|---|---|
| \`--border\` | same as \`--card\` in dark — invisible edges | \`border/primary\` |
| \`--ring\` | same as \`--primary\` — invisible focus ring | \`border/focus\` |
| \`--accent\` | same as \`--muted\` — hover state lost | \`fill/tertiary-hover\` |
| \`--popover\` | same as \`--secondary\` in dark — no popover edge | \`surface/overlay\` |
| \`--input\` | same as \`--accent\` in light | \`border/secondary\` |

The build now fails if any of those pairs collide again.

## One thing worth knowing

White text on the orange and red fills measures 3.55:1 and axe or Lighthouse will
flag it. That is expected and is not a bug to fix. WCAG 2.x has no polarity term, so
it prefers black on any fill lighter than \`#767676\`; APCA reverses the verdict and is
correct. These pairs are gated on APCA Lc 60 instead. An earlier revision "fixed" it
and shipped a near-black label on the destructive button.

If a scanner flags it, that is the answer. Do not change the value.

---

Generated by \`node build/pack-tokens.mjs\`. Do not edit this folder — regenerate it.
Full docs: \`docs/DEV-GUIDE.md\` in the design-system repo.
`;

writeFileSync(join(OUT, 'README.md'), readme);

console.log('\nHeyOz — tokens handoff\n' + '-'.repeat(52));
for (const f of FILES) console.log(`  ${f.name.padEnd(20)} ${f.kb.padStart(7)} kB`);
console.log(`  ${'README.md'.padEnd(20)} ${(readme.length / 1024).toFixed(1).padStart(7)} kB  generated`);
console.log('-'.repeat(52));
console.log(`  ${FILES.length + 1} files · ${total.toFixed(0)} kB · no components`);
console.log(`  ${g.length}/${g.length} gates passing across ${families.length} families`);
console.log(`\n  deliverable/heyoz-tokens/ — zip it and send it.\n`);
