/**
 * shoot-crop.mjs — viewport-sized crops at an anchor.
 *
 * The sibling script screenshots whole elements, which stopped being useful the
 * moment the written guidance landed: a component section is now ~16,000px tall and
 * a full-element shot scales to unreadable. This scrolls to the anchor and takes the
 * viewport, which is what a person actually sees.
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000';
const OUT = process.env.SHOOT_OUT ?? '.shots';
const TARGETS = (process.env.SHOOT_TARGETS ?? '').split(',').filter(Boolean);

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

for (const spec of TARGETS) {
  const [mode, route, anchor, name, offsetRaw] = spec.split('|');
  const offset = Number(offsetRaw ?? 0);

  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: mode,
  });
  await ctx.addInitScript(`localStorage.setItem('oz-theme', '${mode}')`);
  const page = await ctx.newPage();

  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  if (anchor) {
    /* Instant, and with smooth scrolling disabled outright for the duration.
     * globals.css sets `html { scroll-behavior: smooth }`, so a plain scrollTo
     * animates — and across a component section that is now ~16,000px tall, a
     * 500ms wait caught the page mid-flight with the sticky header painted
     * halfway down the viewport. The first crop taken this way looked like a
     * layout bug and was not. */
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important }' });
    await page.evaluate(
      ([a, o]) => {
        const el = document.querySelector(a);
        if (el) {
          window.scrollTo({
            top: el.getBoundingClientRect().top + window.scrollY + o,
            behavior: 'instant',
          });
        }
      },
      [anchor, offset],
    );
    await page.waitForTimeout(600);
  }

  const file = `${OUT}/${name}.png`;
  await page.screenshot({ path: file });
  console.log(`  ${file}`);
  await ctx.close();
}

await browser.close();
