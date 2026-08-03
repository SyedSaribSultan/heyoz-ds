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
    ...file.suites.filter((s) => s.suite !== r.suite),
    { ...r, at: new Date().toISOString() },
  ].sort((a, b) => a.suite.localeCompare(b.suite));

  writeFileSync(PATH, `${JSON.stringify(file, null, 2)}\n`);
}
