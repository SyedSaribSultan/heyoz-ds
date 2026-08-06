'use client';

import { forwardRef, useId, useState } from 'react';
import { Menu, MenuItem } from '@/components/ui';
import {
  AspectIcon,
  CtaIcon,
  GemIcon,
  MinusIcon,
  PlusIcon,
  SparkIcon,
  type IconProps,
} from './icons';

/* ---------------------------------------------------------------------------
 * The composer — the middle area of /static-ads.
 *
 * ┌──────────────────────────────────────────────┬────────┬────────┬──────────┐
 * │ (+)  Describe your ad                        │   +    │   +    │          │
 * │                                              │        │        │ Generate │
 * │ ✦ Pro   ▯ 4:5   ◈ 4K   − 1/4 +   ≡ CTA       │PRODUCT │TEMPLATE│          │
 * └──────────────────────────────────────────────┴────────┴────────┴──────────┘
 *
 * PROVENANCE, AND THE ONE THING TO KNOW BEFORE EDITING THIS FILE. The reference for this
 * bar is a screenshot plus 27 Figma node links, and the Figma links could not be read —
 * the connector is unauthorised and this session cannot run its OAuth flow. So the frame,
 * the five controls, their glyphs and their geometry are measured off the screenshot,
 * and everything the screenshot cannot show is a GUESS made explicit here:
 *
 *   what the screenshot shows          what is guessed
 *   ─────────────────────────────      ────────────────────────────────────────────
 *   five chips, closed, in order       that four of them open single-select menus
 *   the label on each chip             the option LIST behind each one
 *   "Pro" is accent-coloured           that Pro is a tier and Standard/Draft are its
 *                                        siblings
 *   "− 1/4 +"                          that this is a variation count, max 4, and that
 *                                        the numerator is what the buttons move
 *   two tiles marked PRODUCT/TEMPLATE  that they toggle an attachment rather than open
 *                                        a browser
 *
 * A closed chip tells you nothing about its popover, so those five option lists are the
 * most likely thing here to disagree with the Figma. They are single arrays at the top of
 * this file for exactly that reason — reconciling them should be editing data, not
 * rewriting controls.
 *
 * WHY THESE ARE REAL CONTROLS AND NOT STYLED DIVS. Same argument StudioHero's Composer
 * makes about its textarea: the mock shows a placeholder, and a div cannot have one — it
 * also cannot be typed into, focused or labelled, and this is the primary control on the
 * screen. Applied to the chips it means each one is a <button> that owns state and opens a
 * real Menu, because a chip that cannot be operated cannot be reviewed either.
 *
 * No `dark:` anywhere. Every colour is a semantic token.
 * ------------------------------------------------------------------------- */

/** The four single-select pickers, as data.
 *
 *  `label` is what the closed chip reads when the option is active — deliberately shorter
 *  than `name`, because the chip is a status readout in a 24px row and "3840 × 2160" does
 *  not fit in one. */
type Option = { label: string; name: string; hint?: string };

type Picker = {
  id: string;
  /** Names the control for assistive technology, since the closed chip shows a value
   *  rather than a field name — "4:5" alone does not say "aspect ratio". */
  a11y: string;
  Icon: (props: IconProps) => React.ReactElement;
  options: Option[];
  /** Index into `options`. The reference screenshot's state. */
  initial: number;
  /** Paints the chip in the accent. Only the tier chip does, and only because the
   *  reference does: it is the one chip that says "this costs more". */
  accent?: boolean;
};

const PICKERS: Picker[] = [
  {
    id: 'tier',
    a11y: 'Generation quality',
    Icon: SparkIcon,
    accent: true,
    initial: 0,
    options: [
      { label: 'Pro', name: 'Pro', hint: 'Best quality' },
      { label: 'Standard', name: 'Standard', hint: 'Balanced' },
      { label: 'Draft', name: 'Draft', hint: 'Fastest' },
    ],
  },
  {
    id: 'aspect',
    a11y: 'Aspect ratio',
    Icon: AspectIcon,
    initial: 1,
    options: [
      { label: '1:1', name: '1:1', hint: 'Square' },
      { label: '4:5', name: '4:5', hint: 'Feed portrait' },
      { label: '9:16', name: '9:16', hint: 'Story' },
      { label: '16:9', name: '16:9', hint: 'Landscape' },
      { label: '1.91:1', name: '1.91:1', hint: 'Link preview' },
    ],
  },
  {
    id: 'resolution',
    a11y: 'Output resolution',
    Icon: GemIcon,
    initial: 2,
    options: [
      { label: '1K', name: '1K', hint: '1024 px' },
      { label: '2K', name: '2K', hint: '2048 px' },
      { label: '4K', name: '4K', hint: '4096 px' },
    ],
  },
  {
    id: 'cta',
    a11y: 'Call to action',
    Icon: CtaIcon,
    initial: 0,
    options: [
      { label: 'CTA', name: 'No call to action' },
      { label: 'Shop now', name: 'Shop now' },
      { label: 'Learn more', name: 'Learn more' },
      { label: 'Sign up', name: 'Sign up' },
      { label: 'Get offer', name: 'Get offer' },
    ],
  },
];

/** The variation stepper's ceiling. Named because it appears in the readout, the disabled
 *  test and the aria-valuemax, and three copies of a 4 is how they drift apart. */
const MAX_VARIATIONS = 4;

/** Left-to-right order of the control row, with the stepper as a sentinel.
 *
 *  The stepper sits FOURTH — between the resolution chip and the CTA chip — which is where
 *  the reference puts it and which no amount of mapping over PICKERS produces, since the
 *  stepper is not a picker. Rendering `PICKERS.map(...)` and then appending the stepper is
 *  the obvious thing to write and it puts CTA in the wrong place; this array is here so the
 *  order is stated in one place rather than implied by two. */
const ROW = ['tier', 'aspect', 'resolution', 'variations', 'cta'] as const;

const ATTACHMENTS = [
  { id: 'product', label: 'Product' },
  { id: 'template', label: 'Template' },
];

export function Composer() {
  const promptId = useId();

  /* One record keyed by picker id rather than four useStates, so adding a sixth control is
     a row in PICKERS and nothing else. */
  const [choice, setChoice] = useState<Record<string, number>>(() =>
    Object.fromEntries(PICKERS.map((p) => [p.id, p.initial])),
  );
  const [variations, setVariations] = useState(1);
  const [attached, setAttached] = useState<Record<string, boolean>>({});

  return (
    /* max-w and the two block widths below are arbitrary values on purpose, and for the
       reason Studio.tsx gives about its 673px composer: these are measured boxes off a
       reference, not steps on the spacing scale, and rounding them to the nearest step
       would be inventing a number that matches neither.

       The focus ring is on the WRAPPER via focus-within, not on the textarea, which is how
       the card reads as one control instead of nine. */
    <div className="mx-auto mt-space-8 w-full max-w-[752px] rounded-8 border-2 border-border-secondary bg-surface-elevated p-space-3 text-left shadow-medium focus-within:outline focus-within:outline-ring focus-within:outline-offset-ring focus-within:outline-border-focus">
      {/* min-h, not a height, and it is on the ROW rather than on the card: the two
          attachment tiles and Generate are `self-stretch`, so whatever sets the row's
          height sets theirs, and one number does the work of three. 84px is the second
          reference's 100px card less its two 8px paddings. */}
      <div className="oz-stack oz-stack-3 sm:flex-row sm:items-stretch sm:min-h-[84px]">
        {/* The prompt and its controls. justify-between rather than a gap, so the chip row
            sits on the floor of the card at whatever height the tiles beside it set. */}
        <div className="oz-stack oz-stack-4 min-w-0 flex-1 justify-between">
          <div className="flex items-start gap-space-3">
            {/* A real button, not decoration: this is the attach affordance the tiles on
                the right duplicate for two specific kinds of attachment. */}
            <button
              type="button"
              aria-label="Add a reference file"
              className="grid h-space-7 w-space-7 shrink-0 place-items-center rounded-full border-2 border-border-secondary bg-fill-secondary text-content-secondary transition-colors duration-effects-fast ease-effects-fast hover:bg-fill-secondary-hover hover:text-content-primary focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
            >
              <PlusIcon className="h-space-4 w-space-4" />
            </button>

            <label className="sr-only" htmlFor={promptId}>
              Describe your ad
            </label>
            <textarea
              id={promptId}
              rows={1}
              placeholder="Describe your ad"
              className="block w-full resize-none bg-transparent text-body-sm text-content-primary placeholder:text-content-placeholder focus:outline-none"
            />
          </div>

          {/* oz-cluster, whose whole point is that it wraps: five chips plus a stepper do
              not fit the left column below sm, and with flex-wrap there is no width at which
              the children have nowhere to go. It also sets align-items:center and
              min-width:0 on each child, so the `items-center` this used to carry is
              redundant. verify:coverage fails on the hand-rolled flex-wrap-plus-gap that
              was here, and it is right to — that version left the children unshrinkable. */}
          <div className="oz-cluster oz-cluster-2">
            {ROW.map((id) => {
              if (id === 'variations') {
                return (
                  <VariationStepper key={id} value={variations} onChange={setVariations} />
                );
              }
              const picker = PICKERS.find((p) => p.id === id);
              if (!picker) return null;
              return (
                <PickerChip
                  key={id}
                  picker={picker}
                  index={choice[id]}
                  onPick={(i) => setChoice((c) => ({ ...c, [id]: i }))}
                />
              );
            })}
          </div>
        </div>

        {/* The two attachment tiles and the primary action. Fixed widths off the
            reference; self-stretch so their height is the card's inner height rather than
            a second measured number that has to be kept in step with it. */}
        <div className="flex items-stretch gap-space-2">
          {ATTACHMENTS.map(({ id, label }) => (
            <AttachTile
              key={id}
              label={label}
              on={Boolean(attached[id])}
              onToggle={() => setAttached((a) => ({ ...a, [id]: !a[id] }))}
            />
          ))}

          <button
            type="button"
            className="w-[108px] shrink-0 rounded-6 bg-fill-brand py-space-4 text-label-sm font-semibold text-content-on-brand transition-colors duration-effects-fast ease-effects-fast hover:bg-fill-brand-hover active:bg-fill-brand-active focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * The chip.
 * ------------------------------------------------------------------------- */

/** forwardRef because `Menu` clones its trigger with a ref, `aria-haspopup`,
 *  `aria-expanded`, `aria-controls`, an onClick and an onKeyDown. A trigger that swallows
 *  the ref positions the panel at the origin, and one that drops the props opens a menu no
 *  screen reader announces — so `...rest` is load-bearing, not tidiness. */
const ChipButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: React.ReactNode;
    accent?: boolean;
  }
>(function ChipButton({ icon, accent = false, children, className, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={`inline-flex h-space-7 shrink-0 items-center gap-space-2 rounded-4 border-2 px-space-2 text-label-sm transition-colors duration-effects-fast ease-effects-fast focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus ${
        accent
          ? /* content/brand-HOVER, not content/brand, and this is CLAUDE.md rule 4b rather
             * than a hover state written in the wrong place. This chip sits on
             * surface/elevated, which the composer paints — and in dark mode every accent
             * content role is under 4.5:1 on the top two rungs of the surface ladder
             * (content/brand measures 4.02 there). The -hover step of each clears every
             * rung in both modes, so it is the correct token for accent text on a surface
             * like this one even though the name reads oddly. */
            'border-border-brand bg-fill-brand-secondary text-content-brand-hover hover:bg-fill-brand-secondary-hover'
          : 'border-border-secondary bg-fill-secondary text-content-secondary hover:bg-fill-secondary-hover hover:text-content-primary'
      } ${className ?? ''}`}
      {...rest}
    >
      <span aria-hidden="true" className="shrink-0">
        {icon}
      </span>
      {children}
    </button>
  );
});

/** A tick that always occupies its column.
 *
 *  MenuItem reserves the icon column only when `icon !== undefined`, so passing undefined
 *  on the unselected rows would collapse the column on those rows and ragged the labels.
 *  An always-present, sometimes-invisible glyph is the fix. */
function Tick({ on }: { on: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={`h-space-4 w-space-4 ${on ? '' : 'invisible'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8.4 6.2 11.6 13 4.8" />
    </svg>
  );
}

function PickerChip({
  picker,
  index,
  onPick,
}: {
  picker: Picker;
  index: number;
  onPick: (index: number) => void;
}) {
  const { a11y, Icon, options, accent } = picker;
  const active = options[index] ?? options[0];

  return (
    <Menu
      label={a11y}
      side="top"
      align="start"
      items={options.map((option, i) => (
        <MenuItem key={option.name} icon={<Tick on={i === index} />} onClick={() => onPick(i)}>
          {option.name}
          {option.hint && (
            /* The hint is inside the label rather than in MenuItem's `shortcut` slot.
               That slot renders a keyboard accelerator, and a right-aligned "Feed portrait"
               in accelerator styling claims a key combination that does not exist. */
            <span className="text-content-tertiary"> · {option.hint}</span>
          )}
        </MenuItem>
      ))}
    >
      <ChipButton icon={<Icon />} accent={accent}>
        {/* The accessible name carries the field, the visible text carries the value. Both
            are needed: "4:5" alone does not say aspect ratio, and "Aspect ratio: 4:5"
            does not fit a 28px chip. */}
        <span className="sr-only">{a11y}: </span>
        {active.label}
      </ChipButton>
    </Menu>
  );
}

/* ---------------------------------------------------------------------------
 * The stepper.
 * ------------------------------------------------------------------------- */

/** How many variations to generate, rendered `n/4`.
 *
 *  role="spinbutton" on the readout rather than three unrelated buttons, so a screen
 *  reader announces a value that changes instead of two clicks and some text. The buttons
 *  stay real buttons because a spinbutton is not operable by pointer on its own.
 */
function VariationStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const step = (delta: number) =>
    onChange(Math.min(MAX_VARIATIONS, Math.max(1, value + delta)));

  return (
    <div className="inline-flex h-space-7 shrink-0 items-center rounded-4 border-2 border-border-secondary bg-fill-secondary">
      <StepButton label="One fewer variation" disabled={value <= 1} onClick={() => step(-1)}>
        <MinusIcon className="h-space-4 w-space-4" />
      </StepButton>

      <span
        role="spinbutton"
        tabIndex={0}
        aria-label="Variations to generate"
        aria-valuenow={value}
        aria-valuemin={1}
        aria-valuemax={MAX_VARIATIONS}
        aria-valuetext={`${value} of ${MAX_VARIATIONS}`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
            e.preventDefault();
            step(1);
          } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
            e.preventDefault();
            step(-1);
          }
        }}
        /* tabular-nums for the reason stepper.recipe.ts gives: 1 and 4 have different
           widths in a proportional font, so the readout would shift by that difference on
           every press and drag the + button with it. */
        className="min-w-[34px] text-center text-label-sm tabular-nums text-content-primary focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
      >
        {value}/{MAX_VARIATIONS}
      </span>

      <StepButton
        label="One more variation"
        disabled={value >= MAX_VARIATIONS}
        onClick={() => step(1)}
      >
        <PlusIcon className="h-space-4 w-space-4" />
      </StepButton>
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-full w-space-6 place-items-center rounded-4 text-content-secondary transition-colors duration-effects-fast ease-effects-fast hover:text-content-primary focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus disabled:text-content-secondary-disabled disabled:hover:text-content-secondary-disabled"
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------------------
 * The attachment tiles.
 * ------------------------------------------------------------------------- */

/** PRODUCT and TEMPLATE.
 *
 *  aria-pressed rather than a checkbox, because the reference draws a tile and not a form
 *  row — and a toggle button is the one control that can be a 92px square and still
 *  announce its own on/off state.
 */
function AttachTile({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={`flex w-[86px] shrink-0 flex-col items-center justify-between rounded-6 border-2 px-space-2 py-space-3 transition-colors duration-effects-fast ease-effects-fast focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus ${
        on
          ? 'border-border-brand bg-fill-brand-secondary text-content-brand-hover'
          : 'border-border-secondary bg-fill-secondary text-content-secondary hover:bg-fill-secondary-hover hover:text-content-primary'
      }`}
    >
      {/* The glyph flips to a tick when attached. Two states on one tile, and the border
          and fill change with it, so the state does not rest on the icon alone. */}
      {on ? <Tick on /> : <PlusIcon className="h-space-4 w-space-4" />}
      <span className="font-mono text-label-xs uppercase tracking-[0.08em]">{label}</span>
    </button>
  );
}
