'use client';

/* The section shell every part of the page uses, so the rhythm cannot drift from
 * one section to the next. Spacing is relational: the gap that separates sections
 * (space-17) is much larger than the gap that binds a heading to its body
 * (space-4), which is the whole mechanism by which the page reads as grouped.
 *
 * Scale is relational too, and that is the part this file gets wrong if it is not
 * watched. The type scale carries display-lg through label-xs; an earlier revision
 * of this page set every section heading at heading-lg and every sub-label at
 * uppercase mono label-xs in content/tertiary, which put ~110 of its text nodes at
 * the smallest size and lowest contrast available and exactly one above them. A
 * scale used across two steps is not a hierarchy. Section headings now take
 * heading-xl in the display face, and SubHead is a readable label rather than a
 * micro-caption — see the note there. */

export function Section({
  id,
  index,
  title,
  tag,
  blurb,
  children,
}: {
  id: string;
  index: string;
  title: string;
  tag?: string;
  blurb?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-[88px] pt-space-17 first:pt-space-9">
      <header className="border-b-2 border-border-primary pb-space-5">
        <div className="flex items-baseline gap-space-5">
          {/* Tabular so 01 and 14 occupy the same width and the headings align down
              the page rather than drifting a fraction with each numeral. */}
          <span className="font-mono text-label-md tabular-nums text-content-tertiary">
            {index}
          </span>
          {/* No tracking- or leading- utility here on purpose: every step in this
              scale ships its own letter-spacing and line-height, so adding one would
              override the token with a hardcoded value. Six such classes were removed
              from this folder once already. */}
          <h2 className="font-display text-heading-xl font-bold text-content-primary">
            {title}
          </h2>
          {tag && (
            <span className="ml-auto hidden shrink-0 font-mono text-label-sm text-content-tertiary sm:block">
              {tag}
            </span>
          )}
        </div>
        {blurb && (
          <p className="mt-space-4 max-w-[58ch] text-body-md text-content-secondary">{blurb}</p>
        )}
      </header>
      <div className="pt-space-8">{children}</div>
    </section>
  );
}

/** The label on a sub-region within a section.
 *
 *  Not uppercase mono in content/tertiary, which is what this was. Three reasons it
 *  changed: it is the most repeated text style on the page (~50 instances), so
 *  whatever it is becomes the page's dominant voice; uppercase mono is unreadable in
 *  volume at label-xs and several of these labels are five words long; and tertiary
 *  is the quietest content role, so the thing labelling every region was fainter than
 *  the regions. Medium weight at label-md in content/secondary keeps it clearly
 *  subordinate to the h2 without making the reader work for it.
 *
 *  Mono survives where the content is genuinely code — token names, hex values,
 *  paths — and nowhere else. */
export function SubHead({
  children,
  tag,
}: {
  children: React.ReactNode;
  tag?: React.ReactNode;
}) {
  return (
    <div className="mb-space-5 flex flex-wrap items-baseline gap-x-space-5 gap-y-space-1">
      <h3 className="text-label-md font-medium text-content-secondary">{children}</h3>
      {tag && (
        <span className="ml-auto text-label-sm text-content-tertiary">{tag}</span>
      )}
    </div>
  );
}

/** A framed area holding live components. Uses the page background rather than a
 *  card surface so a component's own surface token is judged against the surface it
 *  is actually specified for — putting a card on surface/primary inside a stage that
 *  is also surface/primary would measure the token against itself.
 *
 *  That constraint is why the stage cannot be tinted, and it used to leave the region
 *  defined by nothing but a 1px outline: a page-coloured box on a page-coloured page.
 *  The .oz-canvas dot grid resolves it without touching the colour under the specimen
 *  — see the note in globals.css. The frame drops to border/secondary now that the
 *  texture is doing the defining, because an edge and a fill announcing the same
 *  boundary twice is where this page's box-in-a-box density came from. */
export function Stage({
  children,
  label,
  flush = false,
  className = '',
}: {
  children: React.ReactNode;
  label?: string;
  /** Drop the inset so a child can meet the frame — a full screen mock rather than a
   *  specimen. An explicit prop because the caller that needed this was passing
   *  `className="p-0"` to fight the padding utility, and which of two same-property
   *  utilities wins is decided by their order in the compiled stylesheet rather than
   *  by the order they appear in the attribute. It happened to resolve correctly.
   *  That is not a thing to leave in place. */
  flush?: boolean;
  className?: string;
}) {
  return (
    /* data-specimen is the visual suite's hook, and it is an attribute rather than a
     * class because a class is styling and would eventually be refactored out from
     * under the test. The first version of visual/pages.spec.ts targeted
     * `main section > div > div` and silently captured the entire 8,000px component
     * page instead of this box — so a deliberately removed border changed far less
     * than the diff threshold and the suite passed. A visual test that cannot fail is
     * worse than none, because it is also a claim. */
    <div
      data-specimen=""
      className="overflow-hidden rounded-6 border-2 border-border-secondary"
    >
      {label && (
        <div className="border-b-2 border-border-secondary bg-surface-secondary px-space-4 py-space-3 font-mono text-label-sm text-content-tertiary">
          {label}
        </div>
      )}
      <div className={`oz-canvas ${flush ? '' : 'p-space-8'} ${className}`}>{children}</div>
    </div>
  );
}

/** A documented subtlety. Deliberately plain: these are facts, and dressing them
 *  as callouts with icons would make them look decorative.
 *
 *  Plain is not the same as small, though, and these were set at body-sm — the notes
 *  are the densest reasoning on the page and were rendering a step below the blurb
 *  that introduces them. body-md at a 68ch measure, with the numeral held in a fixed
 *  column so the text edge is straight down the list. */
export function Notes({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="oz-stack oz-stack-4">
      {items.map((n, i) => (
        <li key={i} className="flex gap-space-5 text-body-md text-content-secondary">
          <span
            aria-hidden="true"
            className="w-[2ch] shrink-0 select-none font-mono tabular-nums text-content-tertiary"
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="max-w-[68ch]">{n}</span>
        </li>
      ))}
    </ul>
  );
}
