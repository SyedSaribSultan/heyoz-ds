'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Chip, IconButton, SegmentedControl } from '@/components/ui';
import { dialogRecipe } from '@/lib/recipes';
import { useScrollLock } from '@/lib/core/scrollLock';
import { PlaceholderArt } from './PlaceholderArt';
import {
  AVATARS,
  AVATAR_ETHNICITIES,
  AVATAR_TYPES,
  PICKER_TABS,
  PRODUCTS,
  type Asset,
  type PickerTab,
} from './fixtures';
import {
  AudienceIcon,
  CloseIcon,
  HeartOutlineIcon,
  PinIcon,
  PlusIcon,
  ProductsIcon,
  SearchIcon,
} from './icons';

/* ---------------------------------------------------------------------------
 * One modal for the Product picker and the Avatar picker, per the brief: "build one
 * AssetPickerModal component and pass a defaultTab prop rather than duplicating the modal".
 *
 * WHY THIS ONE IS NOT ui/Dialog, when CtaModal beside it is entirely Dialog. `dialogRecipe`
 * pins `max-w-[460px]` on the panel, in the recipe rather than behind a prop, and a four-tab
 * card grid with a filter sidebar needs about three times that. Widening Dialog would mean
 * either a size the rest of the system does not have or an override that fights its own
 * recipe — so the shell is local and everything INSIDE it is borrowed:
 *
 *   useScrollLock            lib/core — the same hook Dialog uses, including its
 *                            measure-before-you-apply scrollbar handling
 *   SegmentedControl         the tab row. A radiogroup, not a tablist — see below
 *   Chip                     every filter pill, `variant="selected"` when on
 *   IconButton               the close control
 *   PlaceholderArt           the card artwork
 *
 * The focus trap, Escape and the scrim are reimplemented here, which is the real cost of not
 * being able to use Dialog. They are the four behaviours that make a modal modal, and a
 * "modal" missing any of them is a div over the page.
 *
 * THE TAB ROW IS A RADIOGROUP, NOT A TABLIST, and that is a deliberate call against the
 * obvious reading. ui/Tabs exists but is a stepped sequence — a per-tab progress rail bound
 * to the inverse content ramp for a video chrome — so it is the wrong component twice over.
 * SegmentedControl is the pill row the sheet draws, and its own header argues the semantics:
 * a tablist announces that the selected item OWNS the region below it, while this changes a
 * value the grid reads. Uploads and Generations are not panels that exist independently of
 * the grid; they are filters on it.
 *
 * UPLOADS AND GENERATIONS ARE EMPTY ON PURPOSE. The sheet only draws the Products and
 * Avatars tabs. Inventing an upload history would mean inventing files; both tabs render the
 * empty state instead, which is the honest thing a picker with no data shows.
 * ------------------------------------------------------------------------- */

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export type AssetPickerModalProps = {
  open: boolean;
  onClose: () => void;
  /** Which tab the modal opens on. The only difference between "the Product Modal" and "the
   *  Avatar Modal" in the sheet. */
  defaultTab: PickerTab;
  /** Fires with the chosen asset and the tab it came from, so a caller can route a product
   *  to one slot and an avatar to another. */
  onSelect: (asset: Asset, tab: PickerTab) => void;
  /** The currently chosen asset id, if the caller has one. Draws the selected ring. */
  selectedId?: string;
};

export function AssetPickerModal({
  open,
  onClose,
  defaultTab,
  onSelect,
  selectedId,
}: AssetPickerModalProps) {
  const [tab, setTab] = useState<PickerTab>(defaultTab);
  const [query, setQuery] = useState('');
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [scope, setScope] = useState('all');
  const [types, setTypes] = useState<string[]>([]);
  const [ethnicities, setEthnicities] = useState<string[]>([]);

  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  /* Where focus was before the modal opened, so it can be put back. Restoring to the trigger
     is what stops a keyboard user landing at the top of the document every time they close a
     picker. */
  const returnTo = useRef<HTMLElement | null>(null);

  useScrollLock(open);

  /* Reopening honours the caller's tab. Without this the modal keeps whichever tab was left
     selected, so clicking PRODUCT after having browsed Avatars opens on Avatars. */
  useEffect(() => {
    if (open) setTab(defaultTab);
  }, [open, defaultTab]);

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panelRef.current)?.focus();
    return () => returnTo.current?.focus();
  }, [open]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      /* The trap. Queried per keystroke rather than cached, because the grid's contents
         change with the tab and the filters — a cached list would trap focus against
         elements that are no longer in the DOM. */
      const items = [...(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    },
    [onClose],
  );

  const assets = tab === 'products' ? PRODUCTS : tab === 'avatars' ? AVATARS : [];

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? assets.filter((a) => a.name.toLowerCase().includes(q)) : assets;
  }, [assets, query]);

  if (!open || typeof document === 'undefined') return null;

  const isAvatars = tab === 'avatars';

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center p-space-5">
      {/* The scrim, painted by `dialogRecipe.scrimStyle` — `overlay/dimness` over
          `overlay/blur`, the two tokens that exist for exactly this element and reach CSS as
          `--oz-overlay-dimness` / `--oz-overlay-blur`. Reading the recipe rather than
          restyling means a designer changing the scrim in build/spec.mjs moves this one too.

          The first version here was `bg-surface-overlay opacity-[0.72]`, which was wrong
          twice: `surface/overlay` is a LIFTED neutral, so in dark it lightened the page
          instead of dimming it — and `dialog.recipe.ts` records a shipped bug where a scrim
          written as an opacity modifier on a colour token painted nothing at all, because the
          preset emits bare `var(--oz-…)` with no `<alpha-value>` slot and Tailwind drops the
          declaration silently. `verify:classes` scans source for that pattern now.

          A button so a pointer dismiss is also keyboard-reachable, and aria-hidden so the
          focus trap above does not count it as the first focusable. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        style={dialogRecipe.scrimStyle}
        className="absolute inset-0"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        /* A measured box, and arbitrary on purpose for the reason Studio.tsx gives about its
           composer: 1080px is the sheet's panel, not a step on any scale. min-h keeps the
           grid from collapsing when a filter matches nothing; max-h keeps the panel inside a
           short viewport and hands the overflow to the grid rather than to the page. */
        className="relative flex max-h-[86vh] min-h-[520px] w-full max-w-[1080px] flex-col overflow-hidden rounded-8 border-2 border-border-secondary bg-surface-elevated shadow-large focus:outline-none"
      >
        <h2 id={titleId} className="sr-only">
          {isAvatars ? 'Choose an avatar' : 'Choose a product'}
        </h2>

        {/* Header: the tab row, and the close control. */}
        <div className="flex items-center gap-space-4 border-b-2 border-border-secondary p-space-4">
          {/* min-w-0 on a wrapper rather than on the control: segmented's own track is
              `inline-flex w-full`, so as a direct flex child it fills the row and the four
              pills spread across 1000px. Boxing it lets it size to its content the way the
              sheet draws it. */}
          <div className="min-w-0">
          <SegmentedControl
            label="Asset library"
            options={PICKER_TABS.map((t) => ({ value: t.value, label: t.label }))}
            value={tab}
            onChange={(v) => setTab(v as PickerTab)}
            size="sm"
          />
          </div>
          <span className="ml-auto">
            <IconButton variant="ghost" size="sm" label="Close" icon={<CloseIcon />} onClick={onClose} />
          </span>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* The filter rail. Products get two rows and avatars get five, which is the sheet
              — so the rail's CONTENTS are per-tab and its frame is not. */}
          <div className="oz-stack oz-stack-5 w-[188px] shrink-0 overflow-y-auto border-r-2 border-border-secondary p-space-4">
            <div className="oz-stack oz-stack-1">
              <FilterRow
                icon={isAvatars ? <AudienceIcon className="h-space-4 w-space-4" /> : <ProductsIcon className="h-space-4 w-space-4" />}
                label="All"
                on={scope === 'all'}
                onClick={() => setScope('all')}
              />
              {isAvatars ? (
                <>
                  <FilterRow
                    icon={<PinIcon />}
                    label="Pinned"
                    on={scope === 'pinned'}
                    onClick={() => setScope('pinned')}
                  />
                  <FilterRow
                    icon={<AudienceIcon className="h-space-4 w-space-4" />}
                    label="My Avatars"
                    on={scope === 'mine'}
                    onClick={() => setScope('mine')}
                  />
                </>
              ) : (
                <FilterRow
                  icon={<HeartOutlineIcon />}
                  label="Favourites"
                  on={favouritesOnly}
                  onClick={() => setFavouritesOnly((v) => !v)}
                />
              )}
            </div>

            {isAvatars && (
              <>
                <PillGroup
                  heading="Type"
                  options={AVATAR_TYPES}
                  active={types}
                  onToggle={(v) =>
                    setTypes((t) => (t.includes(v) ? t.filter((x) => x !== v) : [...t, v]))
                  }
                />
                <PillGroup
                  heading="Ethnicity"
                  options={AVATAR_ETHNICITIES}
                  active={ethnicities}
                  onToggle={(v) =>
                    setEthnicities((t) => (t.includes(v) ? t.filter((x) => x !== v) : [...t, v]))
                  }
                />
              </>
            )}
          </div>

          {/* The grid and its search row. */}
          <div className="oz-stack oz-stack-4 min-w-0 flex-1 p-space-4">
            <div className="flex items-center gap-space-3 rounded-5 border-2 border-border-secondary bg-fill-secondary px-space-3 py-space-2 focus-within:border-border-focus">
              <span aria-hidden="true" className="text-content-tertiary">
                <SearchIcon className="h-space-4 w-space-4" />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                aria-label={isAvatars ? 'Search avatars' : 'Search products'}
                className="min-w-0 flex-1 bg-transparent text-body-sm text-content-primary placeholder:text-content-placeholder focus:outline-none"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {assets.length === 0 ? (
                /* Not ui/EmptyState: that component centres an illustration, a heading, a
                   body and an action in a generous block, and this is a pane inside a modal
                   whose height is already spoken for. One sentence is the honest size of
                   "this tab has nothing in it yet". */
                <p className="px-space-2 py-space-9 text-center text-body-sm text-content-secondary">
                  Nothing here yet. {PICKER_TABS.find((t) => t.value === tab)?.label} will appear
                  once you have some.
                </p>
              ) : (
                /* oz-grid drives the column count from --grid-min rather than from a
                   breakpoint, so the pane reflows on ITS OWN width — which is the whole
                   argument in dist/layout.css for why there are no media queries: the same
                   grid is 188px narrower whenever the avatar rail is showing, and a
                   viewport-keyed `lg:grid-cols-4` cannot see that. Hardcoding grid-cols-*
                   here would also override the primitive's own template. */
                <ul
                  className="oz-grid oz-grid-4"
                  style={{ ['--grid-min' as string]: '11rem' } as React.CSSProperties}
                >
                  <li>
                    <CreateCard label={isAvatars ? 'Create Avatar' : 'Add New Product'} />
                  </li>
                  {shown.map((asset) => (
                    <li key={asset.id}>
                      <AssetCard
                        asset={asset}
                        kind={isAvatars ? 'avatar' : 'product'}
                        selected={asset.id === selectedId}
                        onClick={() => onSelect(asset, tab)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* -- the rail's rows -------------------------------------------------------- */

function FilterRow({
  icon,
  label,
  on,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex w-full items-center gap-space-3 rounded-4 px-space-3 py-space-2 text-body-sm transition-colors duration-effects-fast ease-effects-fast focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus ${
        on
          ? 'bg-fill-secondary-active font-medium text-content-primary'
          : 'text-content-secondary hover:bg-fill-secondary-hover hover:text-content-primary'
      }`}
    >
      <span aria-hidden="true">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
    </button>
  );
}

/** A heading and a wrap of Chips.
 *
 *  The chips hold state and filter NOTHING, which is deliberate and is the one place in this
 *  file where the honest thing is to do less. An Asset here has an id, a name and an art
 *  seed; there is no gender or ethnicity field to filter on, and adding one would mean
 *  assigning those attributes to invented people in order to demonstrate a filter. So the
 *  control is real, reviewable and inert until there is data behind it. */
function PillGroup({
  heading,
  options,
  active,
  onToggle,
}: {
  heading: string;
  options: string[];
  active: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="oz-stack oz-stack-2">
      <h3 className="text-label-sm text-content-tertiary">{heading}</h3>
      <div className="oz-cluster oz-cluster-2">
        {options.map((option) => (
          <Chip
            key={option}
            size="sm"
            variant={active.includes(option) ? 'selected' : 'neutral'}
            onClick={() => onToggle(option)}
          >
            {option}
          </Chip>
        ))}
      </div>
    </div>
  );
}

/* -- the grid's cards ------------------------------------------------------- */

/** Same footprint as an asset card, per the brief. It is a button rather than a card with a
 *  button in it, and it does nothing yet: creating a product means an upload flow, and a
 *  control that silently no-ops is worse than one that says it is not built. */
function CreateCard({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      aria-label={`${label} — not available in this prototype`}
      className="flex aspect-square w-full flex-col items-center justify-center gap-space-3 rounded-6 border-2 border-dashed border-border-secondary bg-fill-secondary text-content-tertiary disabled:cursor-not-allowed"
    >
      <span aria-hidden="true" className="grid h-space-9 w-space-9 place-items-center rounded-full bg-fill-elevated">
        <PlusIcon className="h-space-5 w-space-5" />
      </span>
      <span className="px-space-2 text-center text-label-sm">{label}</span>
    </button>
  );
}

function AssetCard({
  asset,
  kind,
  selected,
  onClick,
}: {
  asset: Asset;
  kind: 'product' | 'avatar';
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative block aspect-square w-full overflow-hidden rounded-6 border-2 text-left transition-colors duration-effects-fast ease-effects-fast focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus ${
        selected ? 'border-border-brand' : 'border-border-secondary hover:border-border-primary'
      }`}
    >
      <span className="sr-only">Placeholder {kind} image. Not a real photograph.</span>
      <PlaceholderArt seed={asset.seed as 1 | 2 | 3 | 4 | 5} kind={kind} />

      {/* The name on a scrim rather than in a row below the card. The sheet puts it inside
          the image, and a scrim is the only way one text token stays legible over five
          different grounds. */}
      <span
        className="absolute inset-x-0 bottom-0 truncate p-space-2 pt-space-7 text-label-sm font-medium text-content-fixed-inverse"
        style={{
          backgroundImage:
            'linear-gradient(to top, var(--oz-color-content-fixed-primary) 0%, transparent 100%)',
        }}
      >
        {asset.name}
      </span>

      {/* The selected badge. Orange disc with a white tick, per the sheet, and it pairs with
          the brand border above rather than replacing it — one cue on the edge and one in the
          field, so the state does not rest on a 24px glyph alone. */}
      {selected && (
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 grid h-space-9 w-space-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-fill-brand text-content-on-brand shadow-medium"
        >
          <svg
            viewBox="0 0 16 16"
            className="h-space-4 w-space-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 8.4 6.2 11.6 13 4.8" />
          </svg>
        </span>
      )}
    </button>
  );
}
