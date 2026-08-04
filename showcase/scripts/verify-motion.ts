/**
 * verify-motion.ts — the motion checks that belong at the component layer.
 *
 * The token build gates the springs themselves: it measures every emitted linear()
 * curve and proves that an `effects-*` spring does not overshoot and a `spatial-*`
 * one does. What it cannot see is which spring a component reached for. Deciding to
 * put `spatial-slow` on a colour-only transition happens here, in a recipe, and
 * `build/spec.mjs` has no way to know it happened — the same shape of gap that
 * `verify-contrast.ts` exists to close for colour pairings.
 *
 * This is the check that makes "good motion in every component" a property of the
 * build rather than an intention. Three things are asserted:
 *
 *   1. Every registered recipe declares motion. Enforced by the type system too —
 *      `motion` is abstract on ComponentRecipe — but asserted here as well, because
 *      the type only proves the field exists and this proves it was thought about.
 *
 *   2. The spring family matches the properties. Overshoot on a colour is the single
 *      most common way a design system ends up feeling cheap: an opacity that
 *      overshoots clips at 1 and holds there, so the bounce is swallowed and all it
 *      bought was a stall.
 *
 *   3. Nothing that responds to a pointer is silent. A component with bound hover
 *      or active states and `properties: 'none'` is a component whose states snap,
 *      which is the exact thing this layer was built to remove.
 */

/* allRecipes, not the registry — the same choice verify-contrast.ts makes and for
 * the reason stated in lib/recipes/index.ts: the registry lives in a .tsx file with
 * JSX demos in it, which a Node script cannot load, and it would only cover recipes
 * somebody remembered to register. A sweep that skips unregistered recipes is a
 * sweep with a hole in exactly the place a mistake would be. */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { allRecipes } from '../lib/recipes';
import { report } from './report';

const FAIL: string[] = [];
const exempted: string[] = [];
const rows: Array<{
  id: string;
  spring: string;
  family: string;
  properties: string;
  enter: string;
  press: string;
}> = [];

/** States that mean "a pointer or a key did something to this". */
const INTERACTIVE_STATES = ['hover', 'active', 'selected'] as const;

for (const recipe of allRecipes) {
  const m = recipe.motion;
  const id = recipe.meta.id;

  if (!m) {
    FAIL.push(`${id}: declares no motion`);
    continue;
  }

  /* 1. Intent has to say something. A one-word intent is a field filled in to make
   *    the type checker stop talking. */
  if (!m.intent || m.intent.trim().split(/\s+/).length < 8) {
    FAIL.push(`${id}: motion.intent is missing or too short to be a reason`);
  }

  /* 2. Family must match the properties being animated. */
  if (!recipe.motionConsistent) {
    FAIL.push(
      `${id}: ${m.transition} is a ${recipe.transitionFamily} spring but properties is '${m.properties}' — ` +
        `colour and shadow want effects (no overshoot), anything that moves wants spatial`,
    );
  }

  /* 3. An interactive component may not be motionless. Swept across every bound
   *    state rather than checked on hover alone, because CLAUDE.md rule 4 is
   *    specifically about the sibling nobody named. */
  const bound = recipe.allStates.filter((s) =>
    (INTERACTIVE_STATES as readonly string[]).includes(s),
  );
  if (bound.length > 0 && m.properties === 'none') {
    FAIL.push(
      `${id}: binds ${bound.join(', ')} but declares properties: 'none' — those states will snap`,
    );
  }

  /* 4. A press-scale on a text input moves the caret the user is aiming at. */
  if (m.press && id === 'input') {
    FAIL.push(`${id}: press scale on a text field moves the caret being aimed at`);
  }

  rows.push({
    id,
    spring: m.transition,
    family: recipe.transitionFamily,
    properties: m.properties,
    enter: m.enter,
    press: m.press ?? '—',
  });
}

/* ---------------------------------------------------------------------------
 * 5. Every spatial transform must route through --oz-motion-spatial-scale.
 *
 * A source sweep rather than a property check, because this bug is invisible to
 * the type system and to the recipe object: `active:scale-[0.98]` is a perfectly
 * valid class that simply ignores the reduced-motion multiplier, so the component
 * keeps moving for a user who asked it not to while every other spatial movement
 * in the system correctly collapses.
 *
 * This is not hypothetical. It shipped in ComponentRecipe.motionClasses in the same
 * change that added the rule to CLAUDE.md, and it survived four gate suites — the
 * token build measured the springs, verify:motion checked the families, and neither
 * could see a literal transform in a class string. Card's lift was written
 * correctly and the button's press was not, which is CLAUDE.md rule 4 in miniature:
 * one member of a family got the treatment and its sibling did not.
 *
 * Scoped to the files that compile appearance. A transform inside a showcase
 * section is that section's business.
 * ------------------------------------------------------------------------- */

const MOTION_SOURCES = [
  'lib/core/Recipe.ts',
  ...readdirSync('lib/recipes')
    .filter((f) => f.endsWith('.recipe.ts'))
    .map((f) => join('lib/recipes', f)),
];

/** Transform utilities that move something. `scale-x`/`scale-y` included; rotate is
 *  deliberately absent — a rotating chevron is an orientation change rather than
 *  travel, and it stays legible at any angle. */
const TRANSFORM_UTILITY =
  /\b(?:hover:|active:|focus:|focus-visible:|group-hover:|aria-selected:)?(?:-)?(?:translate-[xy]|scale|scale-[xy])-\[([^\]]+)\]/g;

/**
 * Transforms that encode STATE rather than decoration, and must therefore NOT route
 * through the multiplier.
 *
 * The distinction the first version of this gate missed. `--oz-motion-spatial-scale`
 * removes travel that exists to be noticed — an entrance, a lift, a press. It must
 * not remove a transform that encodes *where something is*, because position is
 * meaning: a switch thumb multiplied to zero sits in the same place whether the
 * switch is on or off, and the component stops saying anything. That is a worse
 * outcome for the same user than the movement was.
 *
 * The animation is still graded for them — the thumb's transition runs on
 * `spring/spatial-fast`, which the reduced-motion block repoints to `effects-fast`,
 * so the travel loses its overshoot and keeps its ~20px path. Twenty pixels inside a
 * 44px control is not what the preference is about; large-area travel and parallax
 * are.
 *
 * An explicit list with a stated reason, not a magic comment, on the same principle
 * as COLLISION_ASSERTIONS in spec.mjs: an exemption written down beats a hole. Adding
 * one is a deliberate act that shows up in review.
 */
const STATE_TRANSFORMS: Array<{ file: string; match: string; reason: string }> = [
  {
    file: 'switch.recipe.ts',
    match: 'translate-x-[22px]',
    reason: 'lg thumb position IS the on/off state — zeroing it makes both states identical',
  },
  {
    file: 'switch.recipe.ts',
    match: 'translate-x-[18px]',
    reason: 'md thumb position IS the on/off state — same argument, narrower track',
  },
  {
    file: 'switch.recipe.ts',
    match: 'translate-x-[2px]',
    reason: 'thumb resting position, the other half of the same state pair (both sizes)',
  },
];

for (const rel of MOTION_SOURCES) {
  let src: string;
  try {
    src = readFileSync(rel, 'utf8');
  } catch {
    FAIL.push(`${rel}: motion source listed but not readable`);
    continue;
  }

  /* Strip block comments first — the explanation of this very bug quotes the bad
   * class, and a gate that fails on its own documentation is a gate nobody keeps. */
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  for (const m of code.matchAll(TRANSFORM_UTILITY)) {
    if (m[1].includes('--oz-motion-spatial-scale')) continue;

    const exempt = STATE_TRANSFORMS.find(
      (e) => rel.endsWith(e.file) && m[0].includes(e.match),
    );
    if (exempt) {
      exempted.push(`${exempt.file} ${exempt.match} — ${exempt.reason}`);
      continue;
    }

    FAIL.push(
      `${rel}: \`${m[0]}\` is a literal transform — multiply it by var(--oz-motion-spatial-scale) ` +
        `or it keeps moving under prefers-reduced-motion. If it encodes state rather than ` +
        `decoration, add it to STATE_TRANSFORMS with a reason.`,
    );
  }
}

/* An exemption that stops being reached is an exemption that should be deleted, so
 * a stale entry is itself a failure rather than dead weight nobody notices. */
for (const e of STATE_TRANSFORMS) {
  if (!exempted.some((x) => x.startsWith(`${e.file} ${e.match}`))) {
    FAIL.push(
      `STATE_TRANSFORMS lists ${e.file} \`${e.match}\` but nothing matches it any more — delete the exemption`,
    );
  }
}

/* ---- report ---- */

const w = (s: string, n: number) => s.padEnd(n);
console.log(`\n${allRecipes.length} components · motion declared by every recipe\n`);
console.log(
  `  ${w('component', 12)}${w('transition', 18)}${w('family', 10)}${w('properties', 22)}${w('enter', 7)}press`,
);
for (const r of rows) {
  console.log(
    `  ${w(r.id, 12)}${w(r.spring, 18)}${w(r.family, 10)}${w(r.properties, 22)}${w(r.enter, 7)}${r.press}`,
  );
}

const enterCount = rows.filter((r) => r.enter !== 'none').length;
const pressCount = rows.filter((r) => r.press !== '—').length;
console.log(
  `\n  ${enterCount} of ${rows.length} animate in · ${pressCount} carry a press spring · ` +
    `${rows.filter((r) => r.family === 'effects').length} effects / ${rows.filter((r) => r.family === 'spatial').length} spatial`,
);

report({
  suite: 'motion',
  blurb:
    'Every recipe declares motion, the spring family matches the properties it animates, ' +
    'nothing interactive is silent, and every decorative transform routes through the ' +
    'reduced-motion multiplier.',
  passed: rows.length - FAIL.length,
  total: rows.length,
  detail: [
    `${rows.filter((r) => r.family === 'effects').length} effects / ${rows.filter((r) => r.family === 'spatial').length} spatial springs across ${rows.length} recipes`,
    `${exempted.length} state transform(s) exempt from the multiplier, each with a stated reason`,
  ],
  ok: FAIL.length === 0,
});

if (FAIL.length) {
  console.error(`\nFAILED — ${FAIL.length} motion problem${FAIL.length === 1 ? '' : 's'}:\n`);
  for (const f of FAIL) console.error(`  x ${f}`);
  console.error('');
  process.exit(1);
}

if (exempted.length) {
  console.log(`\n  ${exempted.length} state transform${exempted.length === 1 ? '' : 's'} exempt from the multiplier:`);
  for (const e of exempted) console.log(`    · ${e}`);
}

console.log(
  '\nOK — every recipe declares motion, every spring matches what it animates,\n' +
    '     and every decorative transform routes through --oz-motion-spatial-scale.\n',
);
