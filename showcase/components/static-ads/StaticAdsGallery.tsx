'use client';

import { ScrollRegion } from '@/components/showcase/ScrollRegion';
import { PlaceholderArt } from './PlaceholderArt';
import { ResultCard } from './ResultCard';
import { RECENTS, TEMPLATES } from './fixtures';

/* ---------------------------------------------------------------------------
 * Recents and Templates for you — the two card rows below the prompt box.
 *
 * Both rows are thin now: the creative and its hover overlay moved into ResultCard, and the
 * drawn artwork into PlaceholderArt, because the picker grids and the prompt box's filled
 * slots need the same stand-ins. What is left here is the section pattern — a heading, a
 * scroller, a card size — which is the part the brief calls "the same card component pattern".
 *
 * BOTH ROWS SCROLL HORIZONTALLY, per the brief. The reference's Templates block is a masonry
 * grid — its second column is visibly taller than its neighbours — but the brief asks for
 * "the same card component pattern … horizontal scroll if content overflows", and a written
 * instruction beats a cropped screenshot. Masonry would be a change here and nowhere else.
 *
 * ScrollRegion rather than a bare `overflow-x-auto`, for the two reasons its own header gives:
 * a scroll container with no focusable child cannot be scrolled without a pointer (WCAG
 * 2.1.1), and an overflow with no visible edge reads as content that simply ends. It also
 * earns its keep now that ResultCard puts real controls inside the row.
 * ------------------------------------------------------------------------- */

export function Recents() {
  return (
    <Section heading="Recents">
      {/* No cross-axis escape needed: ResultCard's overlay is `absolute inset-0` inside the
          card's own rounded, clipped box, so it never reaches the scroller's edges. A hover
          treatment that grew OUTSIDE the card would need one. */}
      <ScrollRegion label="Recent generations" className="pb-space-2">
        <ul className="flex gap-space-3">
          {RECENTS.map((recent) => (
            <li key={recent.id}>
              <ResultCard recent={recent} />
            </li>
          ))}
        </ul>
      </ScrollRegion>
    </Section>
  );
}

export function TemplatesForYou() {
  return (
    <Section heading="Templates for you">
      <ScrollRegion label="Suggested templates" className="pb-space-2">
        <ul className="flex gap-space-4">
          {TEMPLATES.map((template) => (
            <li key={template.id}>
              <TemplateCard name={template.name} seed={template.seed} />
            </li>
          ))}
        </ul>
      </ScrollRegion>
    </Section>
  );
}

/** One portrait template.
 *
 *  A button, not an article: a template is something you apply, and the whole card is the
 *  target. The prompt box's TEMPLATE slot is the other way into the same choice.
 */
function TemplateCard({ name, seed }: { name: string; seed: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <button
      type="button"
      className="relative block aspect-[3/4] w-[268px] shrink-0 overflow-hidden rounded-6 text-left transition-shadow duration-effects-default ease-effects-default hover:shadow-large focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
    >
      <span className="sr-only">Placeholder template thumbnail. Not a real image.</span>
      <PlaceholderArt seed={seed} kind="template" />

      {/* The name on a scrim. Not a bare label: the grounds run from a pale gold to a deep
          blue, and white text is legible on one and marginal on the other — a scrim is the
          only thing that makes one text token correct on all five. */}
      <span
        className="absolute inset-x-0 bottom-0 p-space-3 pt-space-8 text-label-sm font-medium text-content-fixed-inverse"
        style={{
          backgroundImage:
            'linear-gradient(to top, var(--oz-color-content-fixed-primary) 0%, transparent 100%)',
        }}
      >
        {name}
      </span>
    </button>
  );
}

/** Heading plus row. Both sections use it, which is what makes them "the same card component
 *  pattern" the brief asks for — the pattern is the section, not just the card. */
function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="pt-space-12">
      <h2 className="px-space-6 pb-space-5 text-heading-sm font-semibold text-content-primary">
        {heading}
      </h2>
      {/* Padded on the left only. A right pad would put a gutter between the last card and the
          viewport edge, and the whole point of a scroller is that the content runs off the
          edge — a gap there reads as "this is all of it". */}
      <div className="pl-space-6">{children}</div>
    </section>
  );
}
