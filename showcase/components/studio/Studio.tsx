'use client';

import { ThemeProvider, useTheme, type ThemePreference } from '@/components/showcase/ThemeProvider';
import { StudioSidebar } from './StudioSidebar';
import { StudioHero } from './StudioHero';
import { AdStudioRow, PromoRow } from './StudioRows';

/* ---------------------------------------------------------------------------
 * HeyOz Content Studio — the product screen, built from the design system.
 *
 * The point of this route is the same as Assembled's, one level up in scale: that
 * section proves the tokens survive a dashboard, and this one proves they survive a
 * whole product surface with a saturated hero on it. Everything visible is either an
 * exported component from components/ui or a layout element whose colour comes from a
 * token — there is no hex, no rgba, and no `dark:` variant in this folder, which is why
 * the two modes are one implementation rather than two.
 *
 * GEOMETRY, measured off the reference at a 1920px viewport, and where the scale did
 * and did not land on it:
 *
 *   rail 200px           grid-cols-app        exact
 *   content inset 20px   px-space-6           exact
 *   hero full-bleed      no inset             exact — the hero meets the rail border,
 *                                             and only the rows below it are padded
 *   panel radius 16px    rounded-8            exact
 *   card radius 12px     rounded-6            exact
 *   row radius 8px       rounded-4            exact
 *   hero → promo 32px    space-9              exact
 *   promo → strip 68px   space-14 (64px)      4px under
 *   headline ~53px       text-display-md      52px. display-lg clamps to 64px at this
 *                                             viewport, which overshoots by 11px — so
 *                                             the biggest step is not the right step
 *   composer 673px       max-w-[672px]        1px, and an arbitrary value on purpose:
 *                                             it is a measured box, not a spacing step
 *   card height 198px    h-[198px]            same reasoning
 *
 * The mode switcher at the bottom right is NOT part of the mock. It is scaffolding, and
 * it looks like scaffolding for the same reason Assembled's force-state row does: this
 * screen has to be judged in both modes, and there is no other way to flip it.
 * ------------------------------------------------------------------------- */

export function Studio() {
  return (
    <ThemeProvider>
      <a
        href="#studio-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-space-4 focus:top-space-4 focus:z-tooltip focus:rounded-4 focus:bg-fill-inverse focus:px-space-4 focus:py-space-3 focus:text-label-sm focus:text-content-on-inverse"
      >
        Skip to content
      </a>

      <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-app">
        <StudioSidebar />

        {/* tabIndex -1 so the skip link has somewhere to land. A skip link pointing at
            a container that cannot hold focus moves the viewport and leaves the caret
            behind, which is the failure mode that makes people think skip links do not
            work. */}
        <main id="studio-main" tabIndex={-1} className="min-w-0 pb-space-14 focus:outline-none">
          <StudioHero />

          <div className="px-space-6">
            <div className="pt-space-9">
              <PromoRow />
            </div>
            <div className="pt-space-14">
              <AdStudioRow />
            </div>
          </div>
        </main>
      </div>

      <ModeSwitcher />
    </ThemeProvider>
  );
}

const PREFERENCES: ThemePreference[] = ['light', 'dark', 'system'];

/** Scaffolding. Three-way rather than a binary toggle because ThemeProvider models a
 *  preference distinct from the resolved mode, and a two-state control cannot express
 *  "follow the OS" — the state this screen is in before anybody touches it. */
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
            {/* The resolved mode is appended to `system` so the control says what the
                OS actually chose. "system" alone leaves the reader to infer it from the
                page, which is the thing they are trying to check. */}
            {p === 'system' ? `system · ${mode}` : p}
          </button>
        );
      })}
    </div>
  );
}
