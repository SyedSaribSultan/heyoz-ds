/**
 * emit-recipes.ts — the component contract, as data.
 *
 * Every recipe in this system is already a complete machine-readable description of
 * a component: its variants, every state, which token each state binds for each
 * role, how it moves, which focus ring it uses, why its border exists. The React
 * component compiles from it and so does the documentation, which is what stops the
 * two drifting.
 *
 * And it could only ever be read from inside this React app. That is the one place
 * the repo's own thesis — generate everything from one source — stops halfway: the
 * recipe layer generates a website and nothing else.
 *
 * This emits it, so the same source can reach:
 *
 *   a Figma plugin      build components whose bindings match the code exactly,
 *                       rather than a designer rebuilding them by eye
 *   an ESLint rule      reject `className="bg-fill-brand"` in app code and name the
 *                       recipe instead — making the wrong thing hard rather than
 *                       merely documented
 *   an agent            read the real bindings instead of inferring them from HTML
 *   a diff              `git diff dist/recipes.json` is a readable answer to "what
 *                       changed about the components", which no other artifact gives
 *
 * Resolved values are deliberately included alongside token names. A consumer that
 * only gets `fill-brand` has to reimplement the resolver and will eventually
 * disagree with the build; one that gets `#FF3D01` next to it cannot.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { allRecipes } from '../lib/recipes';
import { resolveRole, rolePath, cssValue } from '../lib/core/audit';
import { content } from '../lib/content';
import type { Mode, StateName, TokenRole } from '../lib/core/types';

const OUT = '../dist/recipes.json';
const MODES: Mode[] = ['light', 'dark'];
const ROLES: TokenRole[] = ['bg', 'fg', 'border', 'shadow'];

type EmittedBinding = {
  role: TokenRole;
  token: string;
  /** DTCG path, e.g. `color/fill/brand-hover`. */
  path: string;
  /** Resolved per mode, so a consumer never has to resolve anything itself. */
  values: Record<Mode, { value: string; primitive: string; alpha: number }>;
  /** True when this state inherits the role from base rather than overriding it. */
  inherited: boolean;
};

const recipes = allRecipes.map((recipe) => {
  const guidance = content[recipe.meta.id];

  return {
    id: recipe.meta.id,
    title: recipe.meta.title,
    tag: recipe.meta.tag,
    /* The written definition where one exists — it was authored to survive being read
     * alone, which is what a plugin's component description and a lint message both
     * need. The recipe blurb is the fallback. */
    description: guidance?.definition ?? recipe.meta.blurb,

    variants: recipe.variants.map((variant) => ({
      name: variant,
      intent: recipe.intentFor(variant),
      focus: recipe.focusModeFor(variant),
      states: recipe.statesFor(variant).map((state: StateName) => ({
        name: state,
        bindings: recipe
          .bindingRows(MODES[0])
          .filter((r) => r.variant === variant && r.state === state)
          .map((r): EmittedBinding => {
            const values = Object.fromEntries(
              MODES.map((mode) => {
                const t = resolveRole(r.role, r.token, mode);
                return [
                  mode,
                  { value: cssValue(t), primitive: t?.target ?? '—', alpha: t?.alpha ?? 1 },
                ];
              }),
            ) as EmittedBinding['values'];

            return {
              role: r.role,
              token: r.token,
              path: rolePath(r.role, r.token),
              values,
              inherited: r.inherited,
            };
          }),
      })),
    })),

    sizes: recipe.sizes,
    motion: recipe.motion,
    /** Every distinct token the recipe names — the honest answer to "what does this
     *  component depend on", and what a lint rule would check an import against. */
    tokensUsed: recipe.tokensUsed,
  };
});

/* Guard the shape rather than trusting it. This file is the interface other tools
 * will build against, so an empty variant list or a component with no bindings is a
 * broken contract shipped silently. */
const problems: string[] = [];
for (const r of recipes) {
  if (r.variants.length === 0) problems.push(`${r.id}: no variants`);
  for (const v of r.variants) {
    if (v.states.length === 0) problems.push(`${r.id}/${v.name}: no states`);
    const base = v.states.find((s) => s.name === 'base');
    if (!base || base.bindings.length === 0) {
      problems.push(`${r.id}/${v.name}: base state binds nothing`);
    }
  }
}

if (problems.length) {
  console.error(`\nFAILED — recipes.json would ship a broken contract:\n`);
  for (const p of problems) console.error(`  x ${p}`);
  console.error('');
  process.exit(1);
}

mkdirSync('../dist', { recursive: true });
writeFileSync(
  OUT,
  `${JSON.stringify(
    {
      $generated: 'by showcase/scripts/emit-recipes.ts — do not edit',
      $description:
        'The HeyOz component contract. One entry per component: variants, states, the token each state binds per role, and the value that token resolves to in each mode. Generated from the same recipe objects the components compile from, so this cannot describe a component that does not exist.',
      generatedAt: new Date().toISOString(),
      components: recipes,
    },
    null,
    2,
  )}\n`,
);

const bindings = recipes.reduce(
  (n, r) => n + r.variants.reduce((m, v) => m + v.states.reduce((k, s) => k + s.bindings.length, 0), 0),
  0,
);

console.log(
  `\nwrote dist/recipes.json — ${recipes.length} components · ` +
    `${recipes.reduce((n, r) => n + r.variants.length, 0)} variants · ${bindings} resolved bindings\n`,
);
