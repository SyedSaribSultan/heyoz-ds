'use client';

import { Badge, Button, IconButton } from '@/components/ui';
import {
  BrandIcon,
  CampaignsIcon,
  CharactersIcon,
  ChevronRightIcon,
  ContentStudioIcon,
  CreationsIcon,
  OzMarkIcon,
  PlusIcon,
  PublishIcon,
  SupportIcon,
  TemplatesIcon,
} from './icons';

/* ---------------------------------------------------------------------------
 * The Content Studio rail.
 *
 * Everything here reads the sidebar/* token group rather than surface/* and
 * content/*. That group exists precisely so a sidebar is not a special case of a
 * card: it carries its own background, border, three item states and three content
 * roles, which is why this file names no colour outside that group and needs no
 * `dark:` variant anywhere.
 *
 * Measured against the reference screenshots at a 1920px viewport: the rail is 200px
 * (grid-cols-app), rows are 32px tall on an 8px radius, and the 20px glyph box sits
 * 8px from its label. Those are space-9, rounded-4, space-5 and space-3 — the mock
 * was drawn on this scale, so nothing here is an arbitrary value.
 * ------------------------------------------------------------------------- */

type NavEntry = {
  label: string;
  Icon: (props: { className?: string }) => React.ReactElement;
  /** Renders the NEW pill. */
  isNew?: boolean;
  /** Renders a right chevron: this row opens a sub-tree rather than a page. */
  expandable?: boolean;
};

const NAV: NavEntry[] = [
  { label: 'Content Studio', Icon: ContentStudioIcon },
  { label: 'Creations', Icon: CreationsIcon },
  { label: 'Templates', Icon: TemplatesIcon, isNew: true },
  { label: 'Campaigns', Icon: CampaignsIcon, isNew: true },
  { label: 'Characters', Icon: CharactersIcon },
  { label: 'Brand', Icon: BrandIcon, expandable: true },
  { label: 'Publish', Icon: PublishIcon, expandable: true },
];

export function StudioSidebar({ current = 'Content Studio' }: { current?: string }) {
  return (
    /* Sticky and full-height only once there is a column to be sticky in. Below lg the
       grid is one column, so an h-screen sticky rail would be a full viewport of
       navigation the reader has to scroll past before reaching the hero. */
    /* oz-stack, not the hand-rolled flex-column-plus-gap it started as.
       verify:coverage's RAW_LAYOUT sweep fails on that pair, because the primitive also
       sets min-width:0 on its children — and a rail full of truncating labels is
       precisely where a child that cannot shrink produces the horizontal overflow
       dist/layout.css exists to prevent. The `mt-auto` on the account block still
       works: oz-stack is a flex column, so the free space collects above it.

       The offending class string is deliberately NOT quoted anywhere in this comment.
       The sweep is a regex over the file's text, not over its emitted classes, so a
       comment naming the pattern fails the gate exactly as loudly as the bug would —
       which is how this comment's first draft kept the build red after the code was
       already fixed. */
    <aside className="oz-stack oz-stack-5 border-b-2 border-sidebar-border bg-sidebar-background p-space-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r-2">
      {/* Wordmark. The tile is fill/fixed with a content/fixed-primary glyph — the two
          tokens that mean the same thing in both modes — because a logo that inverts
          with the theme is a logo somebody will eventually have to explain. It is the
          one element on this screen deliberately exempt from the mode switch. */}
      <div className="flex items-center gap-space-3 px-space-1 pt-space-1">
        <span className="grid h-space-8 w-space-8 place-items-center rounded-4 bg-fill-fixed text-content-fixed-primary">
          <OzMarkIcon />
        </span>
        <span className="font-display text-heading-xs font-bold text-sidebar-content">HeyOz</span>
      </div>

      {/* Workspace switcher. A button, not a link: it opens a picker, and the chevron
          is the only thing saying so. */}
      <button
        type="button"
        className="flex w-full items-center gap-space-3 rounded-5 border-2 border-sidebar-border bg-fill-elevated px-space-3 py-space-2 text-left transition-colors duration-effects-fast ease-effects-fast hover:bg-fill-elevated-hover focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
        aria-label="Switch workspace, currently Apple"
      >
        <span
          aria-hidden="true"
          className="h-space-6 w-space-6 shrink-0 rounded-3 bg-fill-inverse"
        />
        <span className="min-w-0 flex-1 truncate text-label-md text-sidebar-content">Apple</span>
        <span className="text-sidebar-content-muted">
          <ChevronRightIcon />
        </span>
      </button>

      <nav aria-label="Studio sections">
        <ul className="oz-stack oz-stack-1">
          {NAV.map(({ label, Icon, isNew, expandable }) => {
            const on = label === current;
            return (
              <li key={label}>
                <a
                  href="#studio-main"
                  aria-current={on ? 'page' : undefined}
                  /* No min-h utility: the minHeight scale in the preset carries only
                     `target` and `target-comfortable`, so `min-h-space-9` would emit
                     nothing at all and fail silently. The 32px row in the mock is
                     6px + 20px glyph + 6px, which the padding already produces. */
                  className={`flex items-center gap-space-3 rounded-4 px-space-3 py-space-2 text-body-sm transition-colors duration-effects-fast ease-effects-fast focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus ${
                    /* The current row is a neutral fill, which is what the reference
                     * screenshots show. The system's own answer for a selected rail
                     * item is sidebar/item-selected — brand at 15% — paired with
                     * sidebar/content-selected, and it is louder: Chrome.tsx carries a
                     * long note about removing exactly that treatment from the
                     * showcase rail because a salmon tile in a column of grey text was
                     * competing with the one real primary action on screen. Here the
                     * primary action is the brand-filled New Chat button directly
                     * below, so the same argument applies with more force.
                     *
                     * REVERTIBLE IN ONE LINE: swap for
                     * `bg-sidebar-item-selected font-medium text-sidebar-content-selected`.
                     * Both pairs are gated; this one is quieter and matches the mock. */
                    on
                      ? 'bg-sidebar-item-active font-medium text-sidebar-content'
                      : 'text-sidebar-content-muted hover:bg-sidebar-item-hover hover:text-sidebar-content'
                  }`}
                >
                  <Icon />
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {isNew && <Badge variant="brand">NEW</Badge>}
                  {expandable && (
                    <span aria-hidden="true" className="text-sidebar-content-muted">
                      <ChevronRightIcon />
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <Button variant="primary" size="sm" leadingIcon={<PlusIcon />} className="w-full">
        New Chat
      </Button>

      <div>
        <p className="px-space-1 pb-space-2 font-mono text-label-xs uppercase text-sidebar-content-muted">
          Recent chats
        </p>
        {/* An empty state that states the fact and stops. There is no action to offer
            that the New Chat button above does not already carry, and an empty state
            repeating the button beside it is an empty state apologising. */}
        <p className="px-space-1 text-body-sm text-sidebar-content-muted">No conversations yet</p>
      </div>

      {/* Account. mt-auto rather than a fixed offset, so the rail's own content decides
          where the floor is and a fifteenth nav row cannot push this off-screen. */}
      <div className="mt-auto flex items-center gap-space-2">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-space-3 rounded-5 border-2 border-sidebar-border bg-fill-elevated px-space-2 py-space-2 text-left transition-colors duration-effects-fast ease-effects-fast hover:bg-fill-elevated-hover focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
          aria-label="Account: Syed Sarib S"
        >
          <span
            aria-hidden="true"
            className="h-space-7 w-space-7 shrink-0 rounded-full bg-fill-brand-secondary"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-label-md text-sidebar-content">Syed Sarib S…</span>
            <span className="block truncate text-label-sm text-sidebar-content-muted">
              sadakhan2002…
            </span>
          </span>
        </button>
        <IconButton variant="ghost" size="sm" label="Support" icon={<SupportIcon />} />
      </div>
    </aside>
  );
}
