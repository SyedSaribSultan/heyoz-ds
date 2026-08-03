/**
 * The component-layer check results, read from reports/showcase-verify.json.
 *
 * Written by scripts/report.ts on each verify run and gitignored, so a fresh clone
 * has none until the suite runs once. That is deliberate: an empty list renders as
 * "no results recorded yet" with the command to produce them, which is honest, where
 * a committed file would show whoever-ran-it-last's numbers as though they were this
 * checkout's.
 */

import type { SuiteResult } from '../../scripts/report';

/* eslint-disable @typescript-eslint/no-var-requires */
let loaded: SuiteResult[] = [];
try {
  /* Required rather than imported, because the file legitimately may not exist and a
   * static import of a missing module is a build failure rather than an empty page. */
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  loaded = (require('../../reports/showcase-verify.json') as { suites: SuiteResult[] }).suites;
} catch {
  loaded = [];
}

export const suites: SuiteResult[] = loaded;
