import audit from '../../../reports/audit.json';

/* ---------------------------------------------------------------------------
 * GET /audit — the machine-readable artifact, handed over rather than described.
 *
 * The Verification route names `reports/audit.json` in three places and, until this
 * route existed, could not give it to anyone: `reports/` is a sibling of `showcase/`,
 * and Next serves static assets only from inside `showcase/public/`. So the two ways
 * out are to copy the file into `public/` on every build, or to serve the module the
 * app already imports. A copy is the exact failure this repo is organised against —
 * a second place a number can be wrong, kept in step by someone remembering — so
 * this is the module.
 *
 * And it is literally the same module. `../../../reports/audit.json` from here
 * resolves to the same absolute file as the identical specifier in
 * `lib/core/audit.ts` and `lib/core/gates.ts`, and a bundler keys modules by resolved
 * path: the download and the page are one parsed object rendered two ways, not two
 * reads that can disagree. That is the whole point of the route. If a figure on the
 * page is wrong, the file a reviewer downloaded is wrong in the same way, which is
 * the only honest arrangement.
 *
 * Imported rather than read with `node:fs`, and that is not a style preference. An
 * import is an edge in the module graph that the production trace follows; a runtime
 * `readFileSync('../../reports/audit.json')` depends on a relative path surviving the
 * deploy layout, which is a different and worse thing to be betting on.
 * next.config.mjs already points `outputFileTracingRoot` at the repo root for exactly
 * these parent imports.
 *
 * Two-space JSON with a trailing newline is not cosmetic either. build/build.mjs
 * writes this file with `JSON.stringify(…, null, 2) + '\n'`, so the response below is
 * byte-identical to what is on disk rather than merely equivalent to it — checked
 * against the file, not assumed. If the writer in build.mjs ever changes shape, this
 * stays valid JSON and stops being byte-identical, which is a small enough loss to be
 * worth the reproducibility while it holds.
 *
 * `attachment`, not `inline`: the link sits in a footer paragraph on a long page, and
 * a reviewer clicking it should end up with the file without losing their place.
 * inline replaces the page with a JSON dump and makes Back the only way home. The
 * filename carries the build date the audit reports for itself, so two downloads a
 * fortnight apart are two files rather than `audit.json` and `audit (1).json`.
 * ------------------------------------------------------------------------- */

/* The audit is a build artifact: nothing here reads the request, and it would be a
 * bug if the answer varied by who asked. Explicit rather than relying on Next's
 * inference, so the intent survives someone later adding a header read. */
export const dynamic = 'force-static';

export function GET() {
  const body = JSON.stringify(audit, null, 2) + '\n';
  const built = audit.generatedAt.slice(0, 10);

  return new Response(body, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="heyoz-audit-${built}.json"`,
    },
  });
}
