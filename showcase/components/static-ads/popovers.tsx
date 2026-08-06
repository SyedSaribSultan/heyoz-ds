'use client';

import { useState } from 'react';
import { ListboxEmpty, ListboxOption } from '@/components/ui';
import { Popover } from '@/components/ui';
import { useRovingFocus } from '@/lib/core/useRovingFocus';
import {
  ASPECT_MORE,
  ASPECT_PRIMARY,
  MODELS,
  QUALITIES,
  type Ratio,
} from './fixtures';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CreditIcon,
  DropletIcon,
  RatioIcon,
  SearchIcon,
  SparkIcon,
} from './icons';

/* ---------------------------------------------------------------------------
 * The three value pickers in the prompt box's control row.
 *
 * WHAT THIS IS COMPOSED OF, because none of it is new and that is the point. The brief asks
 * for `ModelsPopover`, `AspectRatioPopover` and `QualityPopover`; all three are
 * `ui/Popover` + `ui/ListboxOption` + `lib/core/useRovingFocus`, which between them already
 * carry every behaviour the sheet implies:
 *
 *   Popover          anchoring, Escape, outside-pointerdown, focus into the panel and back
 *                    to the trigger, Tab leaves without trapping
 *   ListboxOption    the row itself — leading glyph, label, second line, selected ground and
 *                    check, all gated
 *   useRovingFocus   one tab stop for the list, arrows to move, wrapping at both ends
 *
 * WHY POPOVER AND NOT MENU, which was the first attempt and is the more obvious reach for a
 * dropdown. `MenuItem` wraps its label in a `truncate` span, so it is a single-line row by
 * construction — and every row here except Quality's has a second line. Menu's roving focus
 * and its close-on-click also both key off `[role="menuitem"]`, so a `role="option"` row
 * inside a Menu gets neither. The two do not compose, and the row shape is what decided it.
 *
 * ONE DEVIATION FROM THE SHEET, STATED. The sheet's model rows have no check glyph — the
 * brief reads "no checkboxes — likely single-select with active-state highlight". Every
 * selected `ListboxOption` in this system draws a check, and `Select` does the same. Keeping
 * the check is the deliberate choice: the brief hedges with "likely", the row already gets
 * the selected ground as well, and a list that looks like every other single-select list in
 * the app is worth more than matching a sheet on one glyph. Removing it is deleting
 * `selected` from the option and painting the ground by hand — do that if a designer asks,
 * not because this comment sounds uncertain.
 * ------------------------------------------------------------------------- */

/** The panel's own padding is `p-space-5` (16px) and the rows want to sit nearer the edge, so
 *  the list is pulled back out by 8px. A negative margin rather than a padding override
 *  because two competing `p-*` utilities resolve by Tailwind's output order, not by which one
 *  is written last in the class string — a coin flip dressed as a fix. */
const LIST_BLEED = '-mx-space-3';

/** Shared shell: a `role="listbox"` with one tab stop and arrow-key movement.
 *
 *  Generic over the row so all three pickers get identical keyboard behaviour from one place.
 *  `onPick` closes the panel — a single-select list that stays open after a pick makes the
 *  reader check whether the click registered. */
function SingleSelectList<T extends { id: string }>({
  items,
  value,
  onPick,
  label,
  row,
}: {
  items: T[];
  value: string;
  onPick: (id: string) => void;
  label: string;
  row: (item: T, selected: boolean) => { icon: React.ReactNode; label: React.ReactNode; description?: string };
}) {
  const roving = useRovingFocus({ orientation: 'vertical', loop: true });

  if (items.length === 0) return <ListboxEmpty />;

  return (
    <div
      ref={roving.containerRef}
      role="listbox"
      aria-label={label}
      onKeyDown={roving.onKeyDown}
      className={LIST_BLEED}
    >
      {items.map((item, i) => {
        const selected = item.id === value;
        const { icon, label: rowLabel, description } = row(item, selected);
        return (
          <ListboxOption
            key={item.id}
            selected={selected}
            icon={icon}
            description={description}
            {...roving.itemProps(i)}
            onClick={() => onPick(item.id)}
            /* A div with role="option" has no implicit activation, so Enter and Space are
               wired by hand. Space is preventDefault'd or it scrolls the page behind the
               panel — which, since a popover is not scroll-locked, it otherwise would. */
            onKeyDown={(e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return;
              e.preventDefault();
              onPick(item.id);
            }}
            className="cursor-pointer"
          >
            {rowLabel}
          </ListboxOption>
        );
      })}
    </div>
  );
}

/* -- models ---------------------------------------------------------------- */

/** Which accent a tier's spark takes. `content/brand-hover` and not `content/brand` per
 *  CLAUDE.md 4b: these rows sit on `surface/overlay`, the top rung of the ladder, where every
 *  accent content role is under 4.5:1 in dark — `content/brand` measures 4.02 there. */
const TONE_CLASS = {
  neutral: 'text-content-primary',
  brand: 'text-content-brand-hover',
  spectrum: 'text-content-info-hover',
} as const;

export function ModelsPopover({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (id: string) => void;
  children: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const matches = q
    ? MODELS.filter((m) => `${m.name} ${m.description}`.toLowerCase().includes(q))
    : MODELS;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        /* Reset on close, not on open. Reopening a picker that still holds the last search
           shows a filtered list the reader did not filter. */
        if (!next) setQuery('');
      }}
      title="Model"
      titleHidden
      side="top"
      align="start"
      size="md"
      content={
        <div className="oz-stack oz-stack-4">
          {/* A raw input rather than ui/Input, and this is the one place on the route that is
              a real gap rather than a preference: Input renders through Field, which owns a
              label row and a message row, and inside a 320px popover that is two rows of
              chrome for a filter that needs none. `labelHidden` removes the label from the
              layout but not Field's structure. A search row inside a panel is its own
              pattern and the system does not have it yet. */}
          <div className="flex items-center gap-space-3 rounded-5 border-2 border-border-secondary bg-fill-secondary px-space-3 py-space-2 focus-within:border-border-focus">
            <span aria-hidden="true" className="text-content-tertiary">
              <SearchIcon className="h-space-4 w-space-4" />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models"
              aria-label="Search models"
              className="min-w-0 flex-1 bg-transparent text-body-sm text-content-primary placeholder:text-content-placeholder focus:outline-none"
            />
          </div>

          <SingleSelectList
            items={matches}
            value={value}
            label="Model"
            onPick={(id) => {
              onChange(id);
              setOpen(false);
            }}
            row={(model) => ({
              icon: <SparkIcon className={`h-space-4 w-space-4 ${TONE_CLASS[model.tone]}`} />,
              description: model.description,
              label: (
                <span className="flex items-center gap-space-3">
                  <span className="min-w-0 flex-1 truncate font-medium">{model.name}</span>
                  <span className="flex shrink-0 items-center gap-space-1 rounded-3 bg-fill-secondary px-space-2 py-[1px] text-label-xs text-content-secondary">
                    <CreditIcon />
                    {model.credits}
                  </span>
                </span>
              ),
            })}
          />
        </div>
      }
    >
      {children}
    </Popover>
  );
}

/* -- aspect ratio ---------------------------------------------------------- */

export function AspectRatioPopover({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (id: string) => void;
  children: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const ratioRow = (r: Ratio) => ({
    icon: <RatioIcon w={r.w} h={r.h} />,
    description: r.hint,
    label: r.name ? (
      <span>
        <span className="font-medium">{r.name}</span>
        <span className="text-content-tertiary"> · {r.ratio}</span>
      </span>
    ) : (
      <span className="font-medium tabular-nums">{r.ratio}</span>
    ),
  });

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        /* Collapse on close so the panel reopens at the four named crops. The eleven-row
           version is a detour the reader chose, not a state to be returned to. */
        if (!next) setExpanded(false);
      }}
      title="Aspect ratio"
      titleHidden
      side="top"
      align="start"
      size="md"
      content={
        <div className="oz-stack oz-stack-2">
          <SingleSelectList
            items={ASPECT_PRIMARY}
            value={value}
            label="Aspect ratio"
            onPick={pick}
            row={ratioRow}
          />

          {/* `More` expands IN PLACE. The sheet draws the extra ratios as a second floating
              panel below the first, which is a second anchored surface to position, dismiss
              and keyboard — for seven rows that belong to the list above them. Inline keeps
              one panel, one tab stop per list and one Escape target, and the brief only asks
              that they appear when More is clicked. */}
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className={`${LIST_BLEED} flex w-full items-center gap-space-3 rounded-4 px-space-3 py-space-2 text-body-sm text-content-secondary transition-colors duration-effects-fast ease-effects-fast hover:bg-fill-secondary-hover hover:text-content-primary focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus`}
          >
            <span className="min-w-0 flex-1 text-left">More</span>
            <span aria-hidden="true">
              {expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
            </span>
          </button>

          {expanded && (
            <SingleSelectList
              items={ASPECT_MORE}
              value={value}
              label="More aspect ratios"
              onPick={pick}
              row={ratioRow}
            />
          )}
        </div>
      }
    >
      {children}
    </Popover>
  );
}

/* -- quality --------------------------------------------------------------- */

export function QualityPopover({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (id: string) => void;
  children: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      title="Resolution"
      titleHidden
      side="top"
      align="start"
      /* sm, not md: three rows reading "1K" need 240px like they need a second column.
         The sheet draws this one visibly narrower than its two siblings. */
      size="sm"
      content={
        <SingleSelectList
          items={QUALITIES}
          value={value}
          label="Resolution"
          onPick={(id) => {
            onChange(id);
            setOpen(false);
          }}
          row={(quality) => ({
            icon: <DropletIcon />,
            label: <span className="font-medium">{quality.label}</span>,
          })}
        />
      }
    >
      {children}
    </Popover>
  );
}
