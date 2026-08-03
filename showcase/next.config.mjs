import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */

// The showcase deliberately reads three files from the repo root rather than
// vendoring copies of them:
//
//   ../dist/tokens.css           imported by app/layout.tsx
//   ../dist/tailwind.tokens.js   required by tailwind.config.js
//   ../reports/audit.json        imported by lib/core/audit.ts
//
// That is the whole point: `node build/build.mjs` regenerates all three, and the
// showcase picks the change up on the next dev reload. A vendored copy would be a
// fourth place a colour could be wrong.
//
// Because of those parent imports, the project boundary is the REPO, not showcase/,
// and two separate settings have to be told so — one for the production trace, one
// for Turbopack's module graph.
//
// fileURLToPath, NOT `new URL(...).pathname`. On Windows `pathname` returns
// `/C:/Users/...` with a leading slash, which is not a valid path on that platform:
// webpack tolerated it, and Turbopack died on it with `The filename, directory name,
// or volume label syntax is incorrect. (os error 123)` before it served a single
// request. fileURLToPath is the documented conversion and is correct on both.
const repoRoot = fileURLToPath(new URL('..', import.meta.url));

const nextConfig = {
  outputFileTracingRoot: repoRoot,

  // Turbopack resolves nothing above its root, so without this the three parent
  // imports above are unreachable and `next dev --turbopack` cannot start.
  turbopack: {
    root: repoRoot,
  },
};

export default nextConfig;
