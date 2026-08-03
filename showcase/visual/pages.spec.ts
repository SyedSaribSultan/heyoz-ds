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

    /**
     * The one component whose real appearance no other check can reach.
     *
     * Dialog's specimen is its Live row — four buttons — because the variant grid is
     * suppressed, so the panel itself had no baseline in either mode, and the scrim had
     * nothing at all: a closed dialog renders `null`, so it is absent from the
     * prerender verify-classes reads and absent from every screenshot here.
     *
     * That blind spot is not hypothetical. The backdrop shipped as an opacity modifier
     * on a token colour, which the preset cannot express, so the element painted
     * nothing and the panel appeared to sit on the page — through a full release, past
     * every check in the repo. Both assertions below are aimed squarely at that.
     */
    test(`dialog open — ${mode}`, async ({ page }) => {
      await withMode(page, mode);
      await page.goto('/c/dialog');
      await settle(page);

      await page.getByRole('button', { name: 'basic', exact: true }).first().click();
      const panel = page.locator('[role="dialog"]');
      await expect(panel).toBeVisible();

      /* Let the entrance land before anything is measured. `oz-enter-rise` travels 6px
       * over 340ms, and toHaveScreenshot disables animations — which snaps the panel to
       * its final position AFTER the clip below has been computed from wherever it
       * happened to be mid-flight. That produced a whole-panel offset that passed when
       * this test ran alone and failed in the full suite, i.e. the worst kind of flake:
       * one that looks like a real regression and is really a race. */
      await panel.evaluate((el) =>
        Promise.all(el.getAnimations().map((a) => a.finished.catch(() => undefined))),
      );

      /* Resolve the two scrim tokens by painting them on a throwaway probe and reading
       * the value back. That pins the scrim to `overlay/dimness` and `overlay/blur`
       * without restating either colour here — a hex in this file would have to be
       * updated by hand for each mode, which is the drift the whole repo is built to
       * avoid, and it would keep passing if someone swapped the token for a literal. */
      const expected = await page.evaluate(() => {
        const probe = document.createElement('div');
        probe.style.backgroundColor = 'var(--oz-overlay-dimness)';
        document.documentElement.appendChild(probe);
        const background = getComputedStyle(probe).backgroundColor;
        probe.remove();
        const blur = getComputedStyle(document.documentElement)
          .getPropertyValue('--oz-overlay-blur')
          .trim();
        return { background, blur: `blur(${blur})` };
      });

      const scrim = panel.locator('..');
      const got = await scrim.evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          background: cs.backgroundColor,
          /* getPropertyValue for the prefixed twin — the typed CSSStyleDeclaration has
           * no `webkitBackdropFilter` member, and reading it as a property is a
           * compile error rather than a graceful fallback. */
          blur: cs.backdropFilter || cs.getPropertyValue('-webkit-backdrop-filter'),
        };
      });

      expect(got.background, 'the scrim must be overlay/dimness, and must paint').toBe(
        expected.background,
      );
      expect(got.blur, 'the scrim must carry overlay/blur').toBe(expected.blur);

      /* Translucent in both directions. Fully transparent is the bug that shipped;
       * fully opaque would hide the context the scrim exists to keep visible. */
      const alpha = Number(/rgba?\([^)]*?,\s*([\d.]+)\)$/.exec(got.background)?.[1] ?? '1');
      expect(alpha, 'a scrim is see-through by definition').toBeGreaterThan(0);
      expect(alpha).toBeLessThan(1);

      /* Clipped to the panel plus a margin rather than the viewport. The page behind is
       * blurred prose, and a full-viewport baseline would fail on every wording change
       * — the brittleness the note above this loop describes. This margin is wide
       * enough that the scrim, the panel's shadow and its radius are all inside it. */
      const box = (await panel.boundingBox())!;
      const margin = 64;
      await expect(page).toHaveScreenshot(`dialog-open-${mode}.png`, {
        clip: {
          x: box.x - margin,
          y: box.y - margin,
          width: box.width + margin * 2,
          height: box.height + margin * 2,
        },
      });
    });
  });
}
