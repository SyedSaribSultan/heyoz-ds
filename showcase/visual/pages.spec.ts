import { expect, test } from '@playwright/test';
import { allRecipes } from '../lib/recipes';

/**
 * One baseline per component per mode, plus the foundations and both route shells.
 *
 * The component list comes from `allRecipes`, so adding a component adds two
 * baselines by existing — the same inversion the registry gives the page. A hand-
 * written list here would be the one place in this repo where the catalogue is
 * maintained twice.
 */

const MODES = ['light', 'dark'] as const;

/** The default ceiling on a specimen's height. See the assertion below for why it
 *  exists at all. */
const SPECIMEN_MAX = 1200;

/**
 * Components whose specimen is legitimately taller than the default ceiling.
 *
 * The ceiling exists because the first version of this test targeted the whole page
 * and therefore diffed 8,000px of prose, which put a deliberately removed border far
 * below the diff threshold and passed a real regression. So "is this the page again?"
 * is a real question worth failing on.
 *
 * But a few components genuinely are tall, and raising the ceiling for all fourteen
 * to accommodate one would give the other thirteen a guard that no longer guards. An
 * explicit allowance with a stated reason is the same device STATE_TRANSFORMS and
 * COLLISION_ASSERTIONS use, for the same reason: an exemption written down beats a
 * hole, and it shows up in review.
 *
 * The allowance is still a number, so an exempted specimen that keeps growing fails
 * anyway — and the assertion below also fails if an exempted component drops back
 * under the default, because a stale exemption is worse than neither.
 */
const TALL_SPECIMENS: Record<string, { max: number; reason: string }> = {
  'pricing-card': {
    max: 1700,
    reason:
      'four plans: three 766px panels in a responsive grid plus the wide Enterprise layout. That is one component rendered four times at its real size, not the page — and a pricing card cannot be shown shorter than its own content without becoming a different specimen.',
  },
};

/* A note on sensitivity, learned by deliberately breaking it.
 *
 * Removing input/default's base border was caught in DARK and passed in LIGHT. The
 * token is border/secondary: #5F5D5C on #211F1D in dark, ΔL 4.5 and unmissable;
 * #CCC9C8 on #EFEDEC in light, ΔL 1.1 and under the diff threshold at this
 * component's size. So the suite is polarity-sensitive, and both modes are shot for
 * that reason rather than for symmetry — a light-only baseline would have passed a
 * real regression.
 *
 * The general shape: this catches changes in COVERAGE (a border appearing or
 * vanishing, a fill changing, a size moving) far more reliably than changes in
 * DEGREE. A token nudged one ramp step will not fail here, and should not — that is
 * what the contrast gates are for. */

/** Seed the mode the way a user picks it. The no-flash script in app/layout.tsx
 *  reads localStorage before React, so setting the class directly would test a state
 *  no real visitor is ever in. */
async function withMode(page: import('@playwright/test').Page, mode: string) {
  await page.addInitScript(`localStorage.setItem('oz-theme', '${mode}')`);
}

/** Webfonts arrive over the network from a <link>. A shot taken before they land is
 *  a shot of the fallback stack, which is the exact failure the Typography section
 *  warns reviewers about — and it would produce a diff on every unrelated run. */
async function settle(page: import('@playwright/test').Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
}

for (const mode of MODES) {
  test.describe(mode, () => {
    test(`index — ${mode}`, async ({ page }) => {
      await withMode(page, mode);
      await page.goto('/');
      await settle(page);
      /* Full page. The index is the one route short enough to shoot whole now that
       * the component sections have moved to their own pages, and shooting it whole
       * is what catches a section that silently stopped rendering. */
      await expect(page).toHaveScreenshot(`index-${mode}.png`, { fullPage: true });
    });

    test(`verify — ${mode}`, async ({ page }) => {
      await withMode(page, mode);
      await page.goto('/verify');
      await settle(page);
      /* Viewport only. The gate tables are data joined from audit.json, so a full-page
       * baseline would fail on every legitimate token change and teach everyone to
       * run `visual:update` without looking — which is how a visual suite stops
       * catching anything. The shell is what is being pinned here. */
      await expect(page).toHaveScreenshot(`verify-${mode}.png`);
    });

    for (const recipe of allRecipes) {
      test(`${recipe.meta.id} — ${mode}`, async ({ page }) => {
        await withMode(page, mode);
        await page.goto(`/c/${recipe.meta.id}`);
        await settle(page);

        /* The specimen, not the page. A component page is ~16,000px of mostly prose,
         * and a full-page baseline would diff on every wording change while burying
         * the rendering it is supposed to be watching.
         *
         * Targeted by `[data-specimen]`, an attribute Stage carries for this. The
         * first version used `main section > div > div` and captured the whole page —
         * 8,000px of it — so a deliberately removed border was far below the diff
         * threshold and the suite passed a real regression. The assertion below is
         * what stops that recurring: if the hook ever stops matching one element, the
         * test fails rather than quietly widening. */
        const stage = page.locator('[data-specimen]').first();
        await expect(stage).toBeVisible();

        const box = await stage.boundingBox();
        expect(box, 'the specimen stage should have a box').not.toBeNull();

        /* A specimen is a component on a canvas. Anything taller than this is the
         * page again, which is the failure mode being guarded. */
        const allowance = TALL_SPECIMENS[recipe.meta.id];
        expect(
          box!.height,
          allowance
            ? `specimen height — exempted to ${allowance.max}px because ${allowance.reason}`
            : 'specimen height — is this the page again?',
        ).toBeLessThan(allowance?.max ?? SPECIMEN_MAX);

        /* And the other direction, so the list cannot rot. If an exempted specimen
         * now fits the default ceiling, the exemption is stale and should go — the
         * same self-cleaning check verify-motion.ts applies to STATE_TRANSFORMS. */
        if (allowance) {
          expect(
            box!.height,
            `${recipe.meta.id} is listed in TALL_SPECIMENS but now fits the ${SPECIMEN_MAX}px default — delete the exemption`,
          ).toBeGreaterThan(SPECIMEN_MAX);
        }

        await expect(stage).toHaveScreenshot(`${recipe.meta.id}-${mode}.png`);
      });
    }
  });
}
