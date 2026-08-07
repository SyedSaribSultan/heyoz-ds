/**
 * report.ts — a shared sink so the verify scripts leave a trace.
 *
 * Every check in this folder printed to a terminal and vanished. The page then
 * showed the TOKEN build's verdict — "250/250 gates" — as though that were the whole
 * story, while the six checks that measure THIS layer appeared nowhere. A reviewer
 * reading the trust line was being told about the layer below the one they were
 * looking at.
 *
 * Each script now appends its result here, and /verify renders them beside the token
 * gates. The file is generated and gitignored: it is a record of the last run, not a
 * source of truth, and a stale one is visible because it carries its own timestamp.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const PATH = 'reports/showcase-verify.json';

/**
 * The suites that exist. A row for anything else is deleted on the next write.
 *
 * WHY THIS LIST EXISTS: `report()` replaces by name and never used to prune, so a
 * RETIRED script's row survived forever. `glow` was retired when `/ai-ugc` was deleted
 * and its last run sat in this file for weeks afterwards, `ok: true`, rendered by
 * /verify as a seventh live suite with a blurb describing a route that no longer
 * exists. A reviewer counting green checks was counting one that could not have run.
 *
 * The file is gitignored, so a fresh clone never saw it — which is exactly why it went
 * unnoticed. Only a machine that had run verify before the retirement carried the ghost.
 *
 * Adding a suite means adding it here, which is the same one-line tax `ComponentGroup`
 * and `borderJob` charge, and for the same reason: the alternative is a set that grows
 * silently and never shrinks.
 */
const LIVE_SUITES = new Set([
  'borders',
  'classes',
  'composite',
  'contrast',
  'coverage',
  'motion',
  'primitives',
]);

export type SuiteResult = {
  suite: string;
  /** What it measures, in one line, for the page. */
  blurb: string;
  passed: number;
  total: number;
  /** Anything worth showing next to the count — the tightest margins, the exemptions. */
  detail: string[];
  ok: boolean;
  at: string;
};

type File = { suites: SuiteResult[] };

/**
 * Record a suite's outcome.
 *
 * Keyed by suite name and replaced rather than appended, so re-running one script
 * updates its row instead of growing a log. `npm run verify` runs them in sequence,
 * so the file accumulates all six across one pass.
 */
export function report(r: Omit<SuiteResult, 'at'>): void {
  if (!LIVE_SUITES.has(r.suite)) {
    throw new Error(
      `report(): '${r.suite}' is not in LIVE_SUITES. Add it there when you add a suite, ` +
        `so the pruning below cannot silently drop it.`,
    );
  }
  mkdirSync(dirname(PATH), { recursive: true });

  let file: File = { suites: [] };
  if (existsSync(PATH)) {
    try {
      file = JSON.parse(readFileSync(PATH, 'utf8')) as File;
    } catch {
      /* A corrupt file is not worth failing a verification run over — it is a
       * record, not a gate. Start it again. */
      file = { suites: [] };
    }
  }

  file.suites = [
    ...file.suites.filter((s) => s.suite !== r.suite && LIVE_SUITES.has(s.suite)),
    { ...r, at: new Date().toISOString() },
  ].sort((a, b) => a.suite.localeCompare(b.suite));

  writeFileSync(PATH, `${JSON.stringify(file, null, 2)}\n`);
}
