/* Structural checks on the primitive palette.
 *
 * The Primitives section makes four assumptions that hold today and would break
 * quietly if build/palette.mjs changed. Each is asserted here rather than trusted:
 *
 *   1. Every tier carries exactly the same families and step keys, in the same order.
 *      The section renders one shared step-label row per family for all five tiers and
 *      relies on column alignment to label them. If a tier gained a step, the labels
 *      would silently point at the wrong swatches.
 *
 *   2. Every family in FAMILY_ORDER exists, and no family is missing from it. A family
 *      absent from that list would render nowhere at all.
 *
 *   3. Within a family, solid steps descend in lightness monotonically. The step number
 *      is meant to *be* the position on the ramp; a step out of order means the number
 *      no longer means what the name implies.
 *
 *   4. Every primitive a semantic token names actually exists. This is CLAUDE.md rule 2
 *      read from the other end — the build asserts semantics resolve to primitives, and
 *      this asserts nothing resolves to a primitive that is not in the palette.
 *
 * Usage:  npx tsx scripts/verify-primitives.ts
 */

import {
  FAMILY_ORDER,
  allPrimitives,
  primitiveSummary,
  primitiveTiers,
} from '../lib/core/primitives';
import { audit } from '../lib/core/audit';
import { report } from './report';

const errors: string[] = [];
const notes: string[] = [];

/* -- 1. tier shapes agree -------------------------------------------------- */

const reference = primitiveTiers[0];
const shapeOf = (tierIndex: number) =>
  primitiveTiers[tierIndex].families
    .map((f) => `${f.family}:${f.steps.map((s) => s.step).join(',')}`)
    .join('|');

const referenceShape = shapeOf(0);
for (let i = 1; i < primitiveTiers.length; i++) {
  if (shapeOf(i) !== referenceShape) {
    errors.push(
      `tier '${primitiveTiers[i].tier}' has a different family/step shape than ` +
        `'${reference.tier}'. The shared step-label row in PrimitiveRamp would mislabel it.`,
    );
  }
}

/* -- 2. FAMILY_ORDER is complete ------------------------------------------- */

const actual = new Set(reference.families.map((f) => f.family));
const ordered = new Set(FAMILY_ORDER);
for (const f of actual) {
  if (!ordered.has(f)) errors.push(`family '${f}' exists but is missing from FAMILY_ORDER — it would render nowhere.`);
}
for (const f of ordered) {
  if (!actual.has(f)) errors.push(`FAMILY_ORDER names '${f}', which is not in the palette.`);
}

/* -- 3. ramps are monotonic ------------------------------------------------ */

for (const family of reference.families) {
  /* white and black are absolutes rather than ramp positions, so they sit outside the
   * ordering by design — neutral/white is L* 100 and neutral/black is 0. */
  const numbered = family.steps.filter((s) => !Number.isNaN(Number(s.step)));
  for (let i = 1; i < numbered.length; i++) {
    const prev = numbered[i - 1];
    const cur = numbered[i];
    if (cur.lightness > prev.lightness) {
      errors.push(
        `${family.family}: step ${cur.step} (L* ${cur.lightness.toFixed(1)}) is lighter than ` +
          `step ${prev.step} (L* ${prev.lightness.toFixed(1)}). The ramp is not monotonic.`,
      );
    }
  }
  const span = numbered[0].lightness - numbered[numbered.length - 1].lightness;
  notes.push(
    `${family.family.padEnd(17)} ${String(numbered.length).padStart(2)} numbered steps · ` +
      `L* ${numbered[numbered.length - 1].lightness.toFixed(0)}–${numbered[0].lightness.toFixed(0)} ` +
      `(span ${span.toFixed(0)}) · ${family.usedCount} referenced`,
  );
}

/* -- 4. every named target exists ----------------------------------------- */

const paths = new Set(allPrimitives.map((p) => p.path));
const missing = new Set<string>();
for (const mode of ['light', 'dark'] as const) {
  for (const [token, resolved] of Object.entries(audit[mode])) {
    const target = resolved.target;
    if (target && !paths.has(target)) missing.add(`${token} (${mode}) → ${target}`);
  }
}
for (const m of missing) errors.push(`semantic token names a primitive that does not exist: ${m}`);

/* -- report --------------------------------------------------------------- */

console.log(
  `${primitiveSummary.total} primitives · ${primitiveSummary.tiers} tiers × ` +
    `${primitiveSummary.families} families · ${primitiveSummary.used} referenced, ` +
    `${primitiveSummary.unused} not`,
);
console.log();
for (const n of notes) console.log('  ' + n);

/* The count the build reports, and why it differs. Printed on every run so the gap
 * cannot quietly become folklore. */
if (primitiveSummary.unused !== primitiveSummary.auditUnused) {
  console.log(
    `\nnote: build/build.mjs reports ${primitiveSummary.auditUnused} unused, this reports ` +
      `${primitiveSummary.unused}.`,
  );
  const elevationOnly = allPrimitives.filter(
    (p) => p.consumers.length > 0 && p.consumers.every((c) => c.startsWith('elevation/')),
  );
  for (const p of elevationOnly) {
    console.log(
      `      ${p.path} is reached only through elevation tokens ` +
        `(${p.consumers.length}), which that counter's 'used' set omits.`,
    );
  }
}

report({
  suite: 'primitives',
  blurb:
    'Tier shapes, ramp monotonicity, and that every primitive a semantic token names ' +
    'actually exists — the check that the three tiers have not drifted apart.',
  passed: allPrimitives.length - errors.length,
  total: allPrimitives.length,
  detail: [`${allPrimitives.length} primitives checked for tier shape, ordering and existence`],
  ok: errors.length === 0,
});

if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log('\nOK — tier shapes agree, ramps are monotonic, every named primitive exists.');
