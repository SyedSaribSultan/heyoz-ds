#!/usr/bin/env node
/**
 * serve.mjs — free the port, start a built server, wait until it actually answers.
 *
 * Three separate debugging detours in one session came from the same thing: a Next
 * server left holding :3000 while a new one silently failed with EADDRINUSE, so
 * every subsequent check ran against a stale build. Once that meant a visual suite
 * reporting "22 passed" against week-old HTML, which is the worst possible outcome
 * for a check whose entire job is noticing that the page changed.
 *
 * Two things make it stubborn on Windows. `pkill -f "next start"` does not match the
 * process, and shell job control does not survive between tool invocations, so
 * `kill %1` in one command cannot stop a server started by another. The reliable
 * handle is the port.
 *
 * Also waits for a real 200 rather than sleeping a guessed number of seconds. A
 * fixed sleep is either too short — and the failure looks like a broken page — or
 * too long, on every single run.
 *
 *   node scripts/serve.mjs [port]
 */

import { execSync } from 'node:child_process';
import { spawn } from 'node:child_process';

const PORT = Number(process.argv[2] ?? 3000);
const DEADLINE_MS = 60_000;

/** Whatever is listening on PORT, whoever started it. */
function killPort(port) {
  try {
    const out = execSync(
      `powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue).OwningProcess"`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    const pids = [...new Set(out.split(/\s+/).filter(Boolean))];
    for (const pid of pids) {
      execSync(`powershell -NoProfile -Command "Stop-Process -Id ${pid} -Force"`, {
        stdio: 'ignore',
      });
      console.log(`  killed pid ${pid} on :${port}`);
    }
    return pids.length;
  } catch {
    return 0;
  }
}

async function waitForOk(url, deadline) {
  const started = Date.now();
  for (;;) {
    try {
      const res = await fetch(url);
      if (res.ok) return Date.now() - started;
      /* A 500 here is the stale-chunk failure — `next build` output referencing a
       * chunk an npm install invalidated. Worth naming, because the fix is not
       * "wait longer". */
      if (res.status >= 500) {
        throw new Error(
          `${url} returned ${res.status}. If this persists, the build is stale: rm -rf .next && npm run build`,
        );
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('returned')) throw e;
      /* Not up yet. */
    }
    if (Date.now() - started > deadline) throw new Error(`${url} never answered within ${deadline}ms`);
    await new Promise((r) => setTimeout(r, 400));
  }
}

killPort(PORT);
await new Promise((r) => setTimeout(r, 1500));

/* Output is captured rather than discarded so a startup failure says what it was.
 * The first version used stdio:'ignore' and reported only "never answered within
 * 60000ms" while the child was printing "Could not find a production build in the
 * '.next' directory" — a message that names its own fix, thrown away. A wrapper that
 * hides the error it exists to surface is worse than no wrapper. */
const child = spawn('npx', ['next', 'start', '-p', String(PORT)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: true,
  shell: true,
});
child.unref();

let childOutput = '';
child.stdout?.on('data', (d) => (childOutput += d));
child.stderr?.on('data', (d) => (childOutput += d));

try {
  const ms = await waitForOk(`http://localhost:${PORT}/`, DEADLINE_MS);
  console.log(`  :${PORT} ready in ${ms}ms`);
} catch (e) {
  console.error(`\n${e.message}\n`);
  if (childOutput.trim()) {
    console.error('server said:\n');
    console.error(
      childOutput
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => `  ${l}`)
        .join('\n'),
    );
    console.error('');
  }
  process.exit(1);
}
