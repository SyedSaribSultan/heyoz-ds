/**
 * shoot.mjs — screenshot both routes in both modes.
 *
 * Not a gate and not part of `npm run verify`. This exists because everything else
 * in this folder verifies by measurement — the token build measures contrast, the
 * scripts measure pairings and curves and classes — and none of that can tell you
 * whether a dot grid reads as texture or as noise. Some questions are only
 * answerable by looking.
 *
 * Run against a built server:
 *   npm run build && npm start &
 *   node scripts/shoot.mjs
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000';
const OUT = process.env.SHOOT_OUT ?? '.shots';

/* Sections worth a close look rather than a full-page dump. A 14-section page
 * screenshotted whole is 12000px tall and unreadable at any scale that fits. */
const TARGETS = [
  { route: '/', name: 'hero', clip: { x: 0, y: 0, width: 1440, height: 900 } },
  { route: '/', name: 'button', anchor: '#button' },
  { route: '/', name: 'badge', anchor: '#badge' },
  { route: '/', name: 'alert', anchor: '#alert' },
  { route: '/', name: 'card', anchor: '#card' },
  { route: '/', name: 'assembled', anchor: '#assembled' },
  { route: '/verify', name: 'verify-hero', clip: { x: 0, y: 0, width: 1440, height: 900 } },
  { route: '/verify', name: 'verify-gates', anchor: '#gate-contrast' },
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

for (const mode of ['light', 'dark']) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: mode,
  });

  /* The no-flash script in app/layout.tsx reads localStorage before React, so
   * seeding it is how the mode is chosen — matching the real user path rather than
   * forcing a class onto <html> and hoping the two agree. */
  await ctx.addInitScript(`localStorage.setItem('oz-theme', '${mode}')`);

  const page = await ctx.newPage();

  for (const t of TARGETS) {
    await page.goto(`${BASE}${t.route}`, { waitUntil: 'networkidle' });
    /* Webfonts come from a <link>, so a shot taken before they land judges the
     * fallback stack — the exact failure the Typography section warns about. */
    await page.evaluate(() => document.fonts.ready);

    const file = `${OUT}/${mode}-${t.name}.png`;

    if (t.anchor) {
      const el = page.locator(t.anchor);
      if ((await el.count()) === 0) {
        console.log(`  skip ${file} — no ${t.anchor}`);
        continue;
      }
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await el.screenshot({ path: file });
    } else {
      await page.screenshot({ path: file, clip: t.clip });
    }
    console.log(`  ${file}`);
  }

  await ctx.close();
}

await browser.close();
console.log('\ndone');
