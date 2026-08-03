import 'server-only';
import { statSync } from 'node:fs';
import { auditSummary } from './audit';

/**
 * Is this audit still describing the files it was built from?
 *
 * `node build/build.mjs` records each authored source's mtime into `audit.sources`.
 * This compares them against disk.
 *
 * The problem it solves: edit `spec.mjs`, forget to rebuild, and the page carries on
 * reporting "250/250 gates · no build errors · built <date>". That reads as "current".
 * It means "current as of whenever someone last remembered", and a confident stale
 * figure is worse than an absent one because nobody thinks to question it.
 *
 * `server-only` is load-bearing. This has to touch the filesystem, `audit.ts` is
 * imported by client components, and putting the two together broke the build with
 * UnhandledSchemeError on "node:fs" — webpack resolves the import whether or not a
 * `typeof window` guard would have skipped it at runtime. So the check lives here,
 * the routes call it, and the result travels into the client tree as a plain array.
 */
export function staleSources(): string[] {
  const recorded = auditSummary.sources;
  const stale: string[] = [];

  for (const [rel, was] of Object.entries(recorded)) {
    if (was == null) continue;
    try {
      /* 1s tolerance for filesystem timestamp granularity — a source touched in the
       * same second as the build IS the build, not a change after it. */
      if (statSync(`../${rel}`).mtimeMs > was + 1000) stale.push(rel);
    } catch {
      /* Source gone. The import would have failed long before this mattered. */
    }
  }
  return stale;
}
