'use client';

import { ThemeProvider, useTheme, type ThemePreference } from '@/components/showcase/ThemeProvider';
import { StaticAdsSidebar } from './StaticAdsSidebar';
import { StaticAdsHero } from './StaticAdsHero';

/* ---------------------------------------------------------------------------
 * /static-ads — the static-advertising Content Studio screen.
 *
 * This route replaced /ai-ugc, and the replacement was a swap rather than a rename: the
 * old route was a nine-section marketing page and this is an app screen. Nothing of the
 * UGC page survives in it.
 *
 * WHAT IT ADDS OVER /studio, which is the nearest thing to it. /studio proves the tokens
 * survive a product surface. This one is narrower and harder: one screen, one control, and
 * the control is a dense bar carrying five pickers, a stepper, two attachment tiles and the
 * only brand-filled button below the fold. A composer is where a token set either has
 * enough neutral fills to separate nine nested controls from each other and from the card
 * they sit in, or does not — and it has to do it on a saturated gradient ground.
 *
 * WHAT IS AND IS NOT DRAWN. The reference is one screenshot, dark, at roughly a 1920px
 * viewport, plus 27 Figma node links for the composer's controls that could not be
 * retrieved — the Figma connector is unauthorised and this session cannot run its OAuth
 * flow. So the frame and the five controls are measured off the screenshot and everything
 * behind them is a documented guess; Composer.tsx carries the table of exactly which parts
 * are which. Light mode is an extrapolation for the reason /studio's was: every colour is
 * a semantic token and the gradient rungs already invert, so it comes out free.
 *
 * GEOMETRY, measured off the screenshot and where the scale did and did not land:
 *
 *   rail 240px           grid-cols-ads        exact — a new key; grid-cols-app is 200px
 *   content inset 20px   px-space-6           exact
 *   composer 772px       max-w-[772px]        exact, and arbitrary on purpose: a measured
 *                                            box, not a spacing step
 *   card radius 16px     rounded-8            exact
 *   tile radius 12px     rounded-6            exact
 *   chip radius 8px      rounded-4            exact
 *   chip height 28px     h-space-8            2px over a 26px reference
 *   headline ~46px       text-display-sm      40px. display-md clamps to 52px here, which
 *                                            overshoots badly in uppercase
 *   tiles 92 / 116px     w-[92px] / w-[116px] same reasoning as the composer width
 *
 * No `dark:` variant in this folder except the two glow layers, which exist because an
 * inline style cannot carry one — see StaticAdsHero. The two modes are one implementation.
 *
 * The mode switcher at the bottom right is NOT part of the reference. It is scaffolding,
 * and it looks like scaffolding: the reference is dark-only, and there is no other way to
 * judge the light extrapolation.
 * ------------------------------------------------------------------------- */

export function StaticAds() {
  return (
    <ThemeProvider>
      <a
        href="#static-ads-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-space-4 focus:top-space-4 focus:z-tooltip focus:rounded-4 focus:bg-fill-inverse focus:px-space-4 focus:py-space-3 focus:text-label-sm focus:text-content-on-inverse"
      >
        Skip to content
      </a>

      <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-ads">
        <StaticAdsSidebar />

        {/* tabIndex -1 so the skip link has somewhere to land. A skip link pointing at a
            container that cannot hold focus moves the viewport and leaves the caret
            behind, which is the failure mode that makes people think skip links do not
            work. */}
        <main id="static-ads-main" tabIndex={-1} className="min-w-0 focus:outline-none">
          <StaticAdsHero />
        </main>
      </div>

      <ModeSwitcher />
    </ThemeProvider>
  );
}

const PREFERENCES: ThemePreference[] = ['light', 'dark', 'system'];

/** Scaffolding, exactly as on /studio. Three-way rather than a binary toggle because
 *  ThemeProvider models a preference distinct from the resolved mode, and a two-state
 *  control cannot express "follow the OS" — the state this screen is in before anybody
 *  touches it. */
function ModeSwitcher() {
  const { preference, setPreference, mode } = useTheme();

  return (
    <div
      role="group"
      aria-label="Colour mode"
      className="fixed bottom-space-5 right-space-5 z-sticky flex gap-space-1 rounded-full border-2 border-border-secondary bg-surface-elevated p-space-1 shadow-medium"
    >
      {PREFERENCES.map((p) => {
        const on = preference === p;
        return (
          <button
            key={p}
            type="button"
            aria-pressed={on}
            onClick={() => setPreference(p)}
            className={`rounded-full px-space-4 py-space-2 text-label-sm transition-colors duration-effects-fast ease-effects-fast focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus ${
              on
                ? 'bg-fill-brand font-medium text-content-on-brand'
                : 'text-content-tertiary hover:text-content-primary'
            }`}
          >
            {/* The resolved mode is appended to `system` so the control says what the OS
                actually chose. "system" alone leaves the reader to infer it from the page,
                which is the thing they are trying to check. */}
            {p === 'system' ? `system · ${mode}` : p}
          </button>
        );
      })}
    </div>
  );
}
