import { defineConfig } from '@playwright/test';

/**
 * Visual regression, and the reason it exists.
 *
 * Six suites measure this system and none of them can see the page. That is not a
 * gap anyone chose — a contrast ratio is measurable and "does the dot grid read as
 * texture or as noise" is not — but it has a cost, and the cost was paid twice in
 * one session.
 *
 * The borders were stripped from the recipes AFTER the written guidance was drafted
 * and reviewed twice. Every gate stayed green, because every gate was measuring
 * something true: the strokes that remained were legal, the contrast held, the
 * classes all had rules. What was wrong was that four pages described a component
 * that no longer existed, and nothing in the build could compare a sentence to a
 * rendering. It took an adversarial reviewer reading recipe comments against page
 * prose to find it.
 *
 * A committed screenshot would have shown a bordered Badge becoming an unbordered
 * one on the commit that did it. That is the whole argument: these baselines are not
 * about catching a shifted pixel, they are about making a change to the *rendering*
 * as reviewable as a change to the source.
 *
 * Run against a built server, deliberately — `next dev` differs enough from `next
 * start` in font loading and hydration timing to produce diffs that are about the
 * dev server rather than about the design.
 *
 *   npm run build && npm start &
 *   npm run visual            compare against the committed baselines
 *   npm run visual:update     accept the current rendering as the new baseline
 */
export default defineConfig({
  testDir: './visual',
  /* Serial. These share one server and the shots are cheap; parallel workers buy
   * nothing and make a flake harder to reproduce. */
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],

  use: {
    baseURL: process.env.VISUAL_BASE ?? 'http://localhost:3000',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  },

  expect: {
    toHaveScreenshot: {
      /* Antialiasing differs by a hair between runs on the same machine and by more
       * across machines. 0.2% of pixels is loose enough to survive that and tight
       * enough that a removed border — which changes an outline all the way around a
       * component — fails immediately. */
      maxDiffPixelRatio: 0.002,
      /* Every entrance animation in the system is `both`-filled and settles well
       * inside a second, and .oz-ambient loops forever. Disabling animations pins
       * the loop and lands every entrance on its final frame. */
      animations: 'disabled',
      caret: 'hide',
    },
  },

  /* One directory, flat, named by what it shows. Playwright's default nests by test
   * file and platform, which buries the thing a reviewer wants to look at. */
  snapshotPathTemplate: '{testDir}/baselines/{arg}{ext}',

  /* Two projects, because one spec needs a browser configured differently and must not
   * be allowed to reconfigure the other. The template above takes no {projectName}, so
   * the baselines stay flat and the existing filenames are untouched. */
  projects: [
    {
      name: 'visual',
      testMatch: /pages\.spec\.ts$/,
    },
    {
      name: 'scroll-lock',
      testMatch: /scroll-lock\.spec\.ts$/,
      use: {
        /* Chromium headless passes --hide-scrollbars, so the page's scrollbar occupies
         * no layout width and the exact condition that spec exists to measure — a
         * classic scrollbar being taken away — cannot occur at all. Under the default
         * launch it would pass while testing nothing, which is worse than not having
         * it. Dropping that one default argument produces a real 15px scrollbar.
         *
         * Scoped to this project deliberately: a 15px scrollbar changes the layout
         * width of every page, so switching it on globally would invalidate all 34
         * committed baselines to gain one behavioural check. */
        launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] },
      },
    },
  ],
});
