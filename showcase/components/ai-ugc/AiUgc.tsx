'use client';

import { ThemeProvider, useTheme, type ThemePreference } from '@/components/showcase/ThemeProvider';
import { UgcFooter, UgcHeader } from './UgcChrome';
import { UgcHero } from './UgcHero';
import { HowItWorks, KeyFeatures, UseCases, WhyChoose } from './UgcBody';
import { Faq, FinalCta, Pricing, RelatedTools } from './UgcClose';

/* ---------------------------------------------------------------------------
 * /ai-ugc — the UGC feature page, built from the design system.
 *
 * WHAT THIS IS AND IS NOT. The Figma links are one page at five widths — 390, 768, 1024,
 * 1440 and 1920, all light — plus ten "Design tags" marker instances, which are canvas
 * furniture rather than designs. So this is one responsive page, not fifteen. The copy is
 * verbatim from heyoz.com/features/ugc except where the improvement brief asked for it to
 * change; content.ts marks every string LIVE, NEW or PLACEHOLDER.
 *
 * It is improvements-led rather than a faithful port, which was the explicit instruction.
 * Where the brief and the Figma disagree the brief wins: an outcome headline instead of
 * "Create UGC Ads", one CTA phrase instead of five, a real video where the placeholder
 * box was, a monthly/annual toggle, grouped FAQs, and a closing block on the inverse
 * surface so the page ends somewhere different from where it started.
 *
 * BOTH MODES, from one implementation. The Figma has no dark variant, so dark is an
 * extrapolation — but a nearly free one, because every colour here is a semantic token
 * and the gradient rungs already invert. There is no `dark:` anywhere in this folder.
 *
 * FOUR BRIEF ITEMS ARE NOT DONE, and each is a content problem rather than a code one:
 *   - Social proof, testimonials and customer logos. Built as a gated slot with obviously
 *     false figures; see SOCIAL_PROOF in content.ts. Inventing a rating or a quote is not
 *     a design decision, it is a false statement rendered at 14px.
 *   - A gallery of example output videos near the top. There is exactly one video asset
 *     on the live page and it is already used twice here.
 *   - Autoplaying clips per how-it-works step. The four step assets are .webp stills.
 *   - Per-use-case thumbnails. No such imagery exists in the file or on the live page.
 * ------------------------------------------------------------------------- */

export function AiUgc() {
  return (
    <ThemeProvider>
      <a
        href="#ugc-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-space-4 focus:top-space-4 focus:z-tooltip focus:rounded-4 focus:bg-fill-inverse focus:px-space-4 focus:py-space-3 focus:text-label-sm focus:text-content-on-inverse"
      >
        Skip to content
      </a>

      <div className="bg-background">
        <UgcHeader />

        {/* tabIndex -1 so the skip link has somewhere to land — a skip link pointing at a
            container that cannot hold focus moves the viewport and leaves the caret
            behind. */}
        <main id="ugc-main" tabIndex={-1} className="focus:outline-none">
          <UgcHero />
          <WhyChoose />
          <KeyFeatures />
          <UseCases />
          <HowItWorks />
          <Pricing />
          <RelatedTools />
          <Faq />
          <FinalCta />
        </main>

        <UgcFooter />
      </div>

      <ModeSwitcher />
    </ThemeProvider>
  );
}

const PREFERENCES: ThemePreference[] = ['light', 'dark', 'system'];

/** Scaffolding, exactly as on /studio: the Figma is light-only, so the only way to judge
 *  the dark extrapolation is to be able to flip it. Not part of the design. */
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
            {p === 'system' ? `system · ${mode}` : p}
          </button>
        );
      })}
    </div>
  );
}
