'use client';

import { CopyIcon, RecreateIcon } from './icons';
import type { Recent } from './fixtures';

/* ---------------------------------------------------------------------------
 * A generated result, with its hover overlay.
 *
 * THE OVERLAY IS ON `group-hover` AND `group-focus-within`, AND THE SECOND HALF IS THE POINT.
 * The sheet shows a hover state, and hover-only would make Recreate and Copy Prompt reachable
 * by pointer and by nothing else — every result on the page would have two controls a
 * keyboard could tab into but never see. So the same rule paints them on focus-within, which
 * is what makes tabbing through a row of results legible.
 *
 * THE CARD IS NOT A BUTTON, and that is why the two controls can be. A card wrapping two
 * buttons in a button is invalid HTML that browsers resolve by dropping one of them — the same
 * trap TouchpointSlot's header describes, resolved the other way round here: there the badge
 * became decoration because the square already did its job, and here the card stays inert
 * because the two pills are the job.
 *
 * THE METADATA CHIPS ARE HOVER-ONLY, which is a decision the brief left open — it says
 * "visible always or on hover — clarify with designer". They are on the overlay because the
 * sheet's own frame shows them over a darkened image rather than over the artwork, and because
 * `ar 2:3 · v 7 · style standard · stylize 2` at 10px over an arbitrary photograph is
 * illegible in the general case: there is no ground under them until the scrim arrives. If a
 * designer wants them always-on they need their own scrim strip, not just a class change.
 * ------------------------------------------------------------------------- */

const GROUND_CLASS: Record<Recent['ground'], string> = {
  brand: 'bg-fill-brand',
  'brand-hover': 'bg-fill-brand-hover',
  'brand-active': 'bg-fill-brand-active',
};

export function ResultCard({ recent }: { recent: Recent }) {
  const [line1, line2] = recent.headline;
  const { ar, version, style, stylize } = recent.meta;

  return (
    <article
      className={`group relative aspect-square w-[176px] shrink-0 overflow-hidden rounded-6 text-content-on-brand ${GROUND_CLASS[recent.ground]}`}
    >
      <span className="sr-only">
        Placeholder creative — {line1} {line2}. Not a real generated ad.
      </span>

      {/* ---- the creative ---- */}

      {/* The product. A tinted SHADOW rather than a brand rung, and the first version got this
          wrong in a way the row made obvious: `fill/brand-active` looked right on the `brand`
          cards and vanished on the two whose ground IS brand-active — the same token on both
          sides of the pairing. `content/fixed-primary` at low opacity is near-black in both
          modes, so it darkens whatever it sits on and cannot collide with its own ground
          however the ramp moves. */}
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-[44%] h-[124px] w-[124px] -translate-x-1/2 rounded-full bg-content-fixed-primary opacity-[0.22]"
      />
      <span
        aria-hidden="true"
        className="absolute left-[34%] top-[50%] h-[34px] w-[34px] rounded-full bg-content-on-brand opacity-[0.18]"
      />

      <div aria-hidden="true" className="relative flex h-full flex-col justify-between p-space-3">
        {/* leading-none because two stacked display lines at their own leading open a gap the
            reference does not have — an ad headline is set tight. */}
        <p className="font-display text-heading-lg font-extrabold uppercase leading-none">
          {line1}
          <br />
          {line2}
        </p>

        <div className="flex items-end justify-between gap-space-3">
          <span className="oz-stack oz-stack-1">
            {/* Bars rather than text: real small print at 4px is unreadable noise, and lorem
                at 8px is a sentence nobody wrote. */}
            <span className="flex gap-[2px]">
              {[3, 1, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1].map((w, i) => (
                <span
                  key={i}
                  className="block h-space-4 bg-content-on-brand"
                  style={{ width: `${w}px` }}
                />
              ))}
            </span>
            <span className="block h-[2px] w-[54px] bg-content-on-brand" />
            <span className="block h-[2px] w-[38px] bg-content-on-brand" />
          </span>

          <span className="font-display text-label-xs font-bold uppercase tracking-[0.1em]">
            Simplist
          </span>
        </div>
      </div>

      {/* ---- the overlay ---- */}

      <div
        /* pointer-events-none while hidden so the inert overlay cannot swallow a click meant
           for the card, and re-enabled with the same rule that reveals it. Without this the
           two pills are clickable while invisible. */
        className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-0 transition-opacity duration-effects-default ease-effects-default group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
      >
        {/* Top scrim + metadata. */}
        <div
          className="flex flex-wrap gap-x-space-3 gap-y-space-1 p-space-2 pb-space-6"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, var(--oz-color-content-fixed-primary) 0%, transparent 100%)',
          }}
        >
          {[ar, version, style, stylize].map((chip) => (
            <span
              key={chip}
              className="font-mono text-label-xs uppercase tracking-[0.06em] text-content-fixed-inverse opacity-[0.86]"
            >
              {chip}
            </span>
          ))}
        </div>

        {/* Bottom scrim + actions. */}
        <div
          className="flex items-center justify-center gap-space-1 p-space-2 pt-space-8"
          style={{
            backgroundImage:
              'linear-gradient(to top, var(--oz-color-content-fixed-primary) 0%, transparent 100%)',
          }}
        >
          <OverlayButton tone="light" icon={<RecreateIcon />}>
            Recreate
          </OverlayButton>
          <OverlayButton tone="dark" icon={<CopyIcon />}>
            Copy Prompt
          </OverlayButton>
        </div>
      </div>
    </article>
  );
}

/** The two pills.
 *
 *  `fill/fixed` and `content/fixed-*` rather than the page's fills, because these sit on a
 *  scrim over arbitrary artwork in both modes — a pill painted from `fill/elevated` would
 *  invert with the theme while the scrim under it did not, and one of the two modes would
 *  lose it.
 */
function OverlayButton({
  tone,
  icon,
  children,
}: {
  tone: 'light' | 'dark';
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`inline-flex h-space-6 shrink-0 items-center gap-space-1 rounded-full px-space-2 text-label-xs font-medium shadow-small transition-transform duration-effects-fast ease-effects-fast focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus-inverse ${
        tone === 'light'
          ? 'bg-fill-fixed text-content-fixed-primary'
          : 'bg-content-fixed-primary text-content-fixed-inverse'
      }`}
    >
      <span aria-hidden="true">{icon}</span>
      {children}
    </button>
  );
}
