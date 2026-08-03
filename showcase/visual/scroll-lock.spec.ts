import { expect, test } from '@playwright/test';

/**
 * Opening an overlay must not move the page.
 *
 * Locking the page behind a modal means turning its scrollbar off, and a classic
 * scrollbar is 15px of real layout width — so the naive lock hands those 15px back to
 * the document and everything reflows sideways underneath the thing that just opened.
 * Measured on this showcase before the fix: layout width 1265 → 1280, with the header's
 * right edge and the sidebar both travelling 14.86px, on every dialog open.
 *
 * The fix is `scrollbar-gutter: stable` on :root in the token layer, so this is really
 * a test of a foundation rather than of Dialog. Dialog is just the only overlay that
 * exists yet; a sheet or a command palette would be checked by the same assertions, and
 * the point of putting the fix in the token layer is that they inherit it.
 *
 * Runs in its own Playwright project. Chromium headless hides scrollbars by default,
 * which would make every assertion below vacuously true — see the config for why that
 * argument is dropped here and only here.
 */

/** What the fix is worth. Not asserted as an exact number anywhere below, because the
 *  scrollbar's width is the platform's business; what is asserted is that it stops
 *  mattering. Used only to reject a vacuous run. */
const MIN_MEANINGFUL_GUTTER = 1;

type Geometry = {
  bodyWidth: number;
  gutter: number;
  headerRight: number;
  navLeft: number;
  scrollY: number;
};

/**
 * What is deliberately NOT measured here: `documentElement.clientWidth`.
 *
 * It looks like the obvious invariant and it is the wrong instrument — it is the one
 * number that legitimately changes. `clientWidth` is the padding box minus the
 * scrollbar, so a reserved-but-empty gutter counts toward it: locking takes the
 * scrollbar away and clientWidth goes 1265 → 1280 while the gutter is still reserved
 * and nothing has moved by a pixel. The first draft of this spec asserted on it and
 * failed against a working fix.
 *
 * `body`'s width is the honest reading, because the gutter is inside the root's
 * padding box and therefore outside the content box its children lay out in. If the
 * gutter is reserved, body stays 1265 through the lock; if it is not, body gains the
 * 15px and every child moves. Measured both ways: `scrollbar-gutter: auto` moves the
 * sidebar 15.00px, `stable` moves it 0.00px.
 */
async function geometry(page: import('@playwright/test').Page): Promise<Geometry> {
  return page.evaluate(() => {
    const root = document.documentElement;
    const header = document.querySelector('header')!;
    const nav = document.querySelector('nav')!;
    return {
      bodyWidth: document.body.getBoundingClientRect().width,
      gutter: window.innerWidth - root.clientWidth,
      /* One fixed-position element and one in-flow element, because the two fail
       * differently. A JS padding-compensation fix moves the document and leaves
       * position: fixed alone, so a check that only watched the sidebar would pass a
       * sticky header that still jumped. */
      headerRight: header.getBoundingClientRect().right,
      navLeft: nav.getBoundingClientRect().left,
      scrollY: window.scrollY,
    };
  });
}

test.describe('page scroll lock', () => {
  test('opening a dialog moves nothing', async ({ page }) => {
    await page.goto('/c/dialog');
    await page.evaluate(() => document.fonts.ready);

    /* Refuse to run without a real scrollbar. If this ever passes with a 0px gutter it
     * is measuring nothing at all, and a green check that proves nothing is the thing
     * this whole spec was written in response to. */
    const scrolled = await geometry(page);
    expect(
      scrolled.gutter,
      'no classic scrollbar in this browser, so this spec cannot test anything — check ' +
        'that the scroll-lock project still drops --hide-scrollbars',
    ).toBeGreaterThanOrEqual(MIN_MEANINGFUL_GUTTER);

    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarGutter),
      'the gutter reservation is the fix; without it every assertion below fails',
    ).toBe('stable');

    /* Part-way down the page, because a lock that silently jumps you back to the top is
     * a different bug and this position is what makes it visible.
     *
     * The trigger has to stay in the viewport while we do it. Playwright scrolls a
     * target into view before clicking, so a trigger that has gone off-screen means the
     * click itself moves the page — which is indistinguishable from the lock moving it,
     * and duly reported a scroll reset that was entirely the test's own doing. Hence a
     * modest nudge and an explicit assertion rather than a bigger scroll and hope. */
    const trigger = page.getByRole('button', { name: 'basic', exact: true }).first();
    await trigger.scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 150);
    await page.waitForFunction(() => window.scrollY > 0);
    await expect(trigger, 'the trigger must stay visible or the click will scroll').toBeInViewport();

    const before = await geometry(page);
    await trigger.click();
    const panel = page.locator('[role="dialog"]');
    await expect(panel).toBeVisible();
    await panel.evaluate((el) =>
      Promise.all(el.getAnimations().map((a) => a.finished.catch(() => undefined))),
    );
    const during = await geometry(page);

    expect(
      during.bodyWidth,
      'the layout width must not change — this is the assertion the bug fails',
    ).toBeCloseTo(before.bodyWidth, 1);
    expect(during.headerRight, 'the fixed header must not move').toBeCloseTo(before.headerRight, 1);
    expect(during.navLeft, 'the in-flow sidebar must not move').toBeCloseTo(before.navLeft, 1);
    expect(during.scrollY, 'the scroll position must survive the lock').toBe(before.scrollY);

    /* The lock still has to lock. It would be trivial to make every assertion above
     * pass by simply not locking, which would trade a visible bug for an invisible
     * one — the page scrolling behind a modal that is asking a question about it. */
    expect(
      await page.evaluate(() => document.documentElement.classList.contains('oz-scroll-lock')),
    ).toBe(true);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(200);
    expect(
      await page.evaluate(() => window.scrollY),
      'the page behind the modal must not scroll',
    ).toBe(before.scrollY);

    /* And release cleanly. A lock that outlives its overlay is the version of this bug
     * that gets reported as "the page is frozen". */
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    const after = await geometry(page);
    expect(
      await page.evaluate(() => document.documentElement.classList.contains('oz-scroll-lock')),
    ).toBe(false);
    expect(after.bodyWidth, 'unlocking must not move anything either').toBeCloseTo(
      before.bodyWidth,
      1,
    );
    expect(after.headerRight).toBeCloseTo(before.headerRight, 1);

    await page.mouse.wheel(0, 300);
    await page.waitForFunction((y) => window.scrollY > y, before.scrollY);
  });
});
