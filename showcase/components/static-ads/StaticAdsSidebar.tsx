'use client';

import {
  AgentIcon,
  AssetsIcon,
  AudienceIcon,
  BrandDnaIcon,
  CalendarIcon,
  CampaignsIcon,
  ChevronRightIcon,
  CompetitorsIcon,
  HomeIcon,
  ImageIcon,
  PlaybookIcon,
  ProductsIcon,
  SparkIcon,
  TemplatesIcon,
  VideoIcon,
  type IconProps,
} from './icons';

/* ---------------------------------------------------------------------------
 * The /static-ads rail.
 *
 * Thirteen destinations is too many for a flat list, which is the one structural
 * difference from StudioSidebar's seven: this one is grouped, and the groups are
 * labelled. The labels are the same `font-mono` uppercase micro-type the showcase uses
 * for a column heading — a group label is not a nav item and should not be able to be
 * mistaken for one, so it gets a different family rather than just a lighter grey.
 *
 * Measured off the reference: rail 240px, rows 32px on an 8px radius, a 16px glyph box
 * 8px from its label. Those are the `ads` grid column, space-9-worth of padding,
 * rounded-4, space-5 and space-3 — the mock was drawn on this scale.
 *
 * No `dark:` anywhere. Every colour is a semantic token, so the two modes are one
 * implementation.
 * ------------------------------------------------------------------------- */

type NavItem = {
  label: string;
  Icon: (props: IconProps) => React.ReactElement;
};

type NavGroup = {
  /** Absent on the first group: Home and Assets are the app itself, not a phase of it,
   *  and a heading over them would have to be invented. */
  heading?: string;
  items: NavItem[];
};

const NAV: NavGroup[] = [
  {
    items: [
      { label: 'Home', Icon: HomeIcon },
      { label: 'Assets', Icon: AssetsIcon },
    ],
  },
  {
    heading: 'Creation',
    items: [
      { label: 'Image', Icon: ImageIcon },
      { label: 'Video', Icon: VideoIcon },
      { label: 'Agent', Icon: AgentIcon },
      { label: 'Templates', Icon: TemplatesIcon },
    ],
  },
  {
    heading: 'Strategy',
    items: [
      { label: 'Brand DNA', Icon: BrandDnaIcon },
      { label: 'Products', Icon: ProductsIcon },
      { label: 'Audience', Icon: AudienceIcon },
      { label: 'Playbook', Icon: PlaybookIcon },
      { label: 'Competitors', Icon: CompetitorsIcon },
    ],
  },
  {
    heading: 'Publish',
    items: [
      { label: 'Campaigns', Icon: CampaignsIcon },
      { label: 'Calendar', Icon: CalendarIcon },
    ],
  },
];

export function StaticAdsSidebar({
  /** Which row reads as the current page. Undefined by default because the reference
   *  highlights nothing — this screen is reached from the composer rather than from a
   *  rail item, so no row is honestly "current". Wired as a prop so a host app that
   *  does have an answer can pass one. */
  current,
}: {
  current?: string;
} = {}) {
  return (
    /* Sticky and full-height only once there is a column to be sticky in. Below lg the
       grid collapses to one column, and an h-screen sticky rail there would be a full
       viewport of navigation to scroll past before reaching the headline. */
    /* oz-stack rather than a hand-rolled flex column plus gap: the primitive also sets
       min-width:0 on its children, and a rail full of truncating labels is exactly where
       a child that cannot shrink produces horizontal overflow. */
    <aside className="oz-stack oz-stack-5 border-b-2 border-border-secondary bg-surface-secondary p-space-4 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r-2">
      {/* Wordmark. A near-black tile with a white spark, and it must NOT invert with the
          theme — a logo that flips is a logo somebody eventually has to explain.

          THE TILE READS A CONTENT TOKEN AS A BACKGROUND, WHICH IS A ROLE CROSSING AND IS
          DELIBERATE. The system has a fixed WHITE fill (`fill/fixed`) and both fixed
          content roles (`content/fixed-primary` #070605, `content/fixed-inverse` #FFFFFF),
          but no fixed DARK fill — so there is no `bg-*` that is near-black in both modes.
          `fill/inverse` is the obvious reach and it is wrong: it inverts, so in dark it
          would paint a white tile with a dark glyph, the exact opposite of the reference.

          Hand-typing #070605 would break rule 2. So this borrows the fixed content value,
          which is the right colour under a slightly wrong name. The real fix is one line in
          build/spec.mjs — a `fill/fixed-inverse` declared `[black, black]`, completing a
          pair the set is already half of, since `content/fixed-inverse` exists precisely to
          sit on a dark fixed ground that does not exist yet. Swap to it when it lands. */}
      <div className="flex items-center gap-space-3 px-space-1 pt-space-1">
        <span className="grid h-space-8 w-space-8 place-items-center rounded-4 bg-content-fixed-primary text-content-fixed-inverse">
          <SparkIcon className="h-space-5 w-space-5" />
        </span>
        <span className="font-display text-heading-xs font-bold text-content-primary">HeyOz</span>
      </div>

      {/* Workspace switcher. A button, not a link: it opens a picker, and the chevron is
          the only thing saying so. */}
      <button
        type="button"
        className="flex w-full items-center gap-space-2 rounded-9 border-2 border-border-secondary bg-fill-elevated px-space-2 py-space-1 text-left transition-colors duration-effects-fast ease-effects-fast hover:bg-fill-elevated-hover focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
        aria-label="Switch workspace, currently Simplist skincare"
      >
        <span
          aria-hidden="true"
          className="grid h-space-6 w-space-6 shrink-0 place-items-center rounded-full bg-fill-info-secondary text-label-sm font-semibold text-content-info-hover"
        >
          S
        </span>
        <span className="min-w-0 flex-1 truncate text-label-sm text-content-primary">
          Simplist skincare
        </span>
        <span aria-hidden="true" className="text-content-secondary">
          <ChevronRightIcon className="h-space-4 w-space-4" />
        </span>
      </button>

      {NAV.map((group, i) => (
        <nav
          key={group.heading ?? 'primary'}
          aria-label={group.heading ?? 'Primary'}
          /* The ungrouped first block sits tighter to the workspace switcher above it
             than a labelled group would, because it has no heading to do that spacing. */
          className={i === 0 ? undefined : 'oz-stack oz-stack-1'}
        >
          {group.heading && (
            <h2 className="px-space-2 pb-space-1 font-mono text-label-xs uppercase tracking-[0.12em] text-content-tertiary">
              {group.heading}
            </h2>
          )}

          <ul className="oz-stack">
            {group.items.map(({ label, Icon }) => {
              const on = label === current;
              return (
                <li key={label}>
                  <a
                    href="#static-ads-main"
                    aria-current={on ? 'page' : undefined}
                    /* No min-h utility: the preset's minHeight scale carries only
                       `target` and `target-comfortable`, so `min-h-space-9` would emit
                       nothing at all and fail silently. The row is 4px + 16px glyph + 4px
                       = 24px, which this padding already produces.

                       24px is UNDER the 44px pointer-target floor, and that is the density
                       the reference asks for rather than an oversight. It is defensible
                       here and only here: these are rail rows in a vertical list with no
                       adjacent destructive action, which is the exemption WCAG 2.5.8
                       carries for inline lists — but it is the reason not to reuse this
                       padding on anything that deletes something. */
                    className={`flex items-center gap-space-3 rounded-4 px-space-2 py-space-1 text-body-xs transition-colors duration-effects-fast ease-effects-fast focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus ${
                      /* A neutral fill for the current row, not the brand-tinted
                       * sidebar/item-selected pair. Chrome.tsx and StudioSidebar.tsx both
                       * carry the long version of this argument: a salmon tile in a column
                       * of grey text competes with the one real primary action on screen,
                       * and here that action is the Generate button in the composer.
                       *
                       * REVERTIBLE IN ONE LINE: swap for
                       * `bg-fill-selected font-medium text-content-selected`. */
                      on
                        ? 'bg-fill-secondary-active font-medium text-content-primary'
                        : 'text-content-secondary hover:bg-fill-secondary-hover hover:text-content-primary'
                    }`}
                  >
                    <Icon />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      ))}
    </aside>
  );
}
