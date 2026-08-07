/**
 * verify-docs.mjs — the gate for numbers written in prose.
 *
 * WHY THIS EXISTS. CLAUDE.md rule 5 says "verify numbers, do not restate them", and for
 * a year nothing enforced it. The result was found in one sweep:
 *
 *   docs/FIGMA-GUIDE.md   "655 / 29 / 64 / 64 / 208 / 208"   colour primitives were 665
 *   docs/FIGMA-GUIDE.md   "_Colors Primitives | 655"          same, in the table below it
 *   docs/HANDOFF.md       "655 colour primitives ... 246 gates"  665 and 256
 *   docs/TESTING.md       "504 of 655 primitives unused"      511 of 665
 *   CLAUDE.md             "across 276 pairings"               408
 *   CLAUDE.md             "the count fell from 34 to 21"      63 bindings over 25 variants
 *
 * Every one of those was read by somebody evaluating the system, and every one was
 * wrong. The FIGMA-GUIDE table had already been wrong twice before and carried a note
 * saying so — a note is not a gate. This is the gate.
 *
 * WHAT IT CHECKS. Only figures that are DERIVABLE. A number this script cannot compute
 * from `reports/audit.json` or the emitted `tokens/` files has no business being asserted
 * here, and the honest fix for one of those is to delete the numeral from the prose and
 * name the command that prints it — which is what CLAUDE.md and DECISIONS.md now do for
 * the border and composite counts.
 *
 * WHAT IT DOES NOT CHECK. Ratios quoted in DECISIONS.md arguments (4.39:1 over the old
 * hero glow, 3.55:1 on the destructive fill). Those are historical measurements attached
 * to a decision — the record of what was true when the call was made. Re-pinning them to
 * today's build would erase the argument, which is the opposite of the point. §G's live
 * open questions are a different case and are checked.
 *
 * Run: node build/verify-docs.mjs   (or npm run verify:docs)
 */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/* -- the truth, computed ---------------------------------------------------- */

const audit = JSON.parse(read('reports/audit.json'));

/** Count DTCG leaves — a node carrying $value — the same walk the emitters produce. */
const countTokens = (node) => {
  let n = 0;
  const walk = (x) => {
    if (!x || typeof x !== 'object') return;
    if ('$value' in x || 'value' in x) {
      n++;
      return;
    }
    for (const k of Object.keys(x)) if (!k.startsWith('$')) walk(x[k]);
  };
  walk(node);
  return n;
};

const tokenFiles = Object.fromEntries(
  readdirSync(join(ROOT, 'tokens'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => [f, countTokens(JSON.parse(read(join('tokens', f))))]),
);

const byPrefix = (p) => {
  const hit = Object.entries(tokenFiles).find(([f]) => f.startsWith(p));
  if (!hit) throw new Error(`no emitted token file starting '${p}'`);
  return hit[1];
};

const truth = {
  colorPrimitives: audit.counts.colorPrimitives,
  numberPrimitives: audit.counts.numberPrimitives,
  semanticPerMode: audit.counts.semanticPerMode,
  unusedPrimitives: audit.counts.unusedPrimitives,
  gates: audit.contrast.length,
  foundations: byPrefix('03'),
  motion: byPrefix('04'),
  typography: byPrefix('05'),
  semanticFile: byPrefix('06'),
};

/* Cross-check the two independent sources before trusting either. audit.counts is
 * written by validate(); the file counts are walked off the emitted JSON. They describe
 * the same thing by different routes, so a disagreement means the emitter and the
 * validator have drifted and every assertion below is measuring the wrong thing. */
if (byPrefix('01') !== truth.colorPrimitives) {
  console.error(
    `\n  audit.counts.colorPrimitives is ${truth.colorPrimitives} but ` +
      `tokens/01-*.json holds ${byPrefix('01')}. The validator and the emitter disagree — ` +
      `fix that before trusting any doc figure.\n`,
  );
  process.exit(1);
}

/* -- the claims ------------------------------------------------------------- */

/**
 * Each claim is a regex with ONE capture group holding the number, and the value that
 * group must equal. The regex has to be specific enough to match one place: a bare \d+
 * would pass against any number on the page and assert nothing.
 */
const CLAIMS = [
  {
    file: 'docs/FIGMA-GUIDE.md',
    what: 'guaranteed token-for-token list, colour primitives',
    re: /token for token\*\*: (\d+) \/ \d+ \/ \d+ \/ \d+ \/ \d+ \/ \d+/,
    want: truth.colorPrimitives,
  },
  {
    file: 'docs/FIGMA-GUIDE.md',
    what: 'guaranteed token-for-token list, number primitives',
    re: /token for token\*\*: \d+ \/ (\d+) \/ \d+ \/ \d+ \/ \d+ \/ \d+/,
    want: truth.numberPrimitives,
  },
  {
    file: 'docs/FIGMA-GUIDE.md',
    what: 'guaranteed token-for-token list, foundations',
    re: /token for token\*\*: \d+ \/ \d+ \/ (\d+) \/ \d+ \/ \d+ \/ \d+/,
    want: truth.foundations,
  },
  {
    file: 'docs/FIGMA-GUIDE.md',
    what: 'guaranteed token-for-token list, typography',
    re: /token for token\*\*: \d+ \/ \d+ \/ \d+ \/ (\d+) \/ \d+ \/ \d+/,
    want: truth.typography,
  },
  {
    file: 'docs/FIGMA-GUIDE.md',
    what: 'guaranteed token-for-token list, semantic light',
    re: /token for token\*\*: \d+ \/ \d+ \/ \d+ \/ \d+ \/ (\d+) \/ \d+/,
    want: truth.semanticFile,
  },
  {
    file: 'docs/FIGMA-GUIDE.md',
    what: 'guaranteed token-for-token list, semantic dark',
    re: /token for token\*\*: \d+ \/ \d+ \/ \d+ \/ \d+ \/ \d+ \/ (\d+)/,
    want: truth.semanticFile,
  },
  {
    file: 'docs/FIGMA-GUIDE.md',
    what: '"What you get" table — _Colors Primitives',
    re: /\|\s*_Colors Primitives\s*\|\s*Value\s*\|\s*(\d+)\s*\|/,
    want: truth.colorPrimitives,
  },
  {
    file: 'docs/FIGMA-GUIDE.md',
    what: '"What you get" table — _Number Primitives',
    re: /\|\s*_Number Primitives\s*\|\s*Value\s*\|\s*(\d+)\s*\|/,
    want: truth.numberPrimitives,
  },
  {
    file: 'docs/FIGMA-GUIDE.md',
    what: '"What you get" table — Foundations',
    re: /\|\s*Foundations\s*\|\s*Value\s*\|\s*(\d+)\s*\|/,
    want: truth.foundations,
  },
  {
    file: 'docs/FIGMA-GUIDE.md',
    what: '"What you get" table — Motion',
    re: /\|\s*Motion\s*\|\s*Value\s*\|\s*(\d+)\s*\|/,
    want: truth.motion,
  },
  {
    file: 'docs/FIGMA-GUIDE.md',
    what: '"What you get" table — Typography',
    re: /\|\s*Typography\s*\|\s*Value\s*\|\s*(\d+)\s*\|/,
    want: truth.typography,
  },
  {
    file: 'docs/FIGMA-GUIDE.md',
    what: '"What you get" table — HeyOz Semantic',
    re: /\|\s*HeyOz Semantic\s*\|\s*Light, Dark\s*\|\s*(\d+) each\s*\|/,
    want: truth.semanticFile,
  },
  {
    file: 'docs/FIGMA-GUIDE.md',
    what: 'HeyOz Semantic composition — colour tokens',
    re: /`HeyOz Semantic` is (\d+) colour tokens plus \d+ elevation tokens/,
    want: truth.semanticPerMode,
  },
  {
    file: 'docs/HANDOFF.md',
    what: 'token layer summary — colour primitives',
    re: /\*\*The token layer\.\*\* (\d+) colour primitives/,
    want: truth.colorPrimitives,
  },
  {
    file: 'docs/HANDOFF.md',
    what: 'token layer summary — semantic per mode',
    re: /\*\*The token layer\.\*\*[^.]*?, (\d+) semantic tokens per mode/,
    want: truth.semanticPerMode,
  },
  {
    file: 'docs/HANDOFF.md',
    what: 'token layer summary — gate total',
    re: /`linear\(\)` curves\. (\d+) gates\./,
    want: truth.gates,
  },
  {
    file: 'docs/TESTING.md',
    what: 'trade-off table — unused primitives',
    re: /\| (\d+) of \d+ primitives unused \|/,
    want: truth.unusedPrimitives,
  },
  {
    file: 'docs/TESTING.md',
    what: 'trade-off table — total primitives',
    re: /\| \d+ of (\d+) primitives unused \|/,
    want: truth.colorPrimitives,
  },
];

/* -- run -------------------------------------------------------------------- */

const cache = new Map();
const src = (f) => {
  if (!cache.has(f)) cache.set(f, read(f));
  return cache.get(f);
};

const FAIL = [];
for (const c of CLAIMS) {
  const m = src(c.file).match(c.re);
  if (!m) {
    FAIL.push(
      `${c.file} — ${c.what}: the sentence this gate checks is GONE. Either restore it or ` +
        `delete this claim from build/verify-docs.mjs. A gate matching nothing passes ` +
        `silently, which is the failure mode it exists to prevent.`,
    );
    continue;
  }
  if (Number(m[1]) !== c.want) {
    FAIL.push(`${c.file} — ${c.what}: reads ${m[1]}, build says ${c.want}`);
  }
}

/* A doc must not point a reader at an artifact that no longer exists. `test/index.html`
 * was archived and three steps of TESTING.md went on telling a reviewer to open it. The
 * historical mentions in DECISIONS.md B22 and the archive/ notes are the RECORD of that
 * removal and are allowed; a live instruction is not. */
const DELETED = [
  { path: 'test/index.html', why: 'archived — the /verify route replaced it' },
  { path: '/ai-ugc', why: 'route deleted — /static-ads took its slot' },
  { path: 'verify:glow', why: 'gate retired with the route it measured' },
  { path: 'verify-glow.ts', why: 'gate retired with the route it measured' },
];
const LIVE_DOCS = ['docs/TESTING.md', 'docs/DEV-GUIDE.md', 'docs/FIGMA-GUIDE.md'];

/* A dead artifact may be NAMED, but only on a line that says it is dead. "Open
 * test/index.html by double-clicking it" fails; "There is no standalone HTML rig any
 * more — test/index.html is archived in archive/" passes. The distinction is the whole
 * point: a reader who remembers the old rig is well served by being told where it went,
 * and badly served by being told to open it. Naming the file is how they find that
 * sentence, so a gate that banned the string outright would push the docs into vagueness
 * to stay green. */
const RETIRED_MARKERS = [
  'archived',
  'archive/',
  'deleted',
  'retired',
  'no longer',
  'is gone',
  'was gone',
  'used to',
  'replaced',
  'does not exist',
];

for (const f of LIVE_DOCS) {
  src(f)
    .split('\n')
    .forEach((line, i) => {
      for (const d of DELETED) {
        if (!line.includes(d.path)) continue;
        const lower = line.toLowerCase();
        if (RETIRED_MARKERS.some((m) => lower.includes(m))) continue;
        FAIL.push(
          `${f}:${i + 1} points a reader at '${d.path}', which does not exist — ${d.why}.\n` +
            `      These docs are instructions somebody follows. Either drop the reference, or ` +
            `keep it and\n      say on the same line that it is gone (one of: ${RETIRED_MARKERS.slice(0, 4).join(', ')}…).`,
        );
      }
    });
}

console.log('\nHeyOz — docs gate\n' + '-'.repeat(52));
console.log(`  ${CLAIMS.length} numeric claims checked against reports/audit.json`);
console.log(`  ${LIVE_DOCS.length} instruction docs swept for ${DELETED.length} retired artifacts`);
console.log('-'.repeat(52));

if (FAIL.length) {
  console.error(`\n  ${FAIL.length} stale:\n`);
  for (const f of FAIL) console.error(`  ✗ ${f}\n`);
  console.error(
    `  Rebuild first (node build/build.mjs), then correct the prose — never the other way.\n`,
  );
  process.exit(1);
}

console.log('\n  OK — every figure quoted in the docs matches the build that produced it.\n');
