'use client';

import { forwardRef, useId, useLayoutEffect, useRef, useState } from 'react';
import { AssetPickerModal } from './AssetPickerModal';
import { CtaModal } from './CtaModal';
import { PlaceholderArt } from './PlaceholderArt';
import { TouchpointSlot } from './TouchpointSlot';
import { AspectRatioPopover, ModelsPopover, QualityPopover } from './popovers';
import {
  ASPECT_MORE,
  ASPECT_PRIMARY,
  MAX_VARIATIONS,
  MODELS,
  QUALITIES,
  type Asset,
  type PickerTab,
} from './fixtures';
import {
  AspectIcon,
  CloseIcon,
  CtaIcon,
  DropletIcon,
  MinusIcon,
  PlusIcon,
  SparkIcon,
  type IconProps,
} from './icons';

/* ---------------------------------------------------------------------------
 * The prompt box. ONE component, four states, per the brief.
 *
 * ┌──────────────────────────────────────────────┬────────┬────────┬──────────┐
 * │ (+)  Describe your ad                        │   +    │   +    │          │
 * │                                              │        │        │ Generate │
 * │ ✦ Pro   ▯ 4:5   ◌ 4K   − 1/4 +   ≡ CTA       │PRODUCT │TEMPLATE│          │
 * └──────────────────────────────────────────────┴────────┴────────┴──────────┘
 *
 * THE FOUR STATES ARE NOT FOUR RENDER PATHS. They are what two pieces of state look like in
 * combination, which is why this is one component and why there is no `state` prop:
 *
 *   A  empty              prompt === ''                       placeholder shows
 *   B  text, no assets    prompt !== '', no product/template   slots still empty
 *   C  text + assets      prompt !== '' and ≥1 asset           slots filled, Generate lifts
 *   —  reference strip     references.length > 0               a row above the textarea
 *
 * `ready` is the whole of state C: `prompt.trim() && (product || template)`. The brief calls
 * this out as the subtle-but-important bit — the button must not lift on text alone — so it
 * is one derived boolean read in one place rather than a flag anybody can set.
 *
 * THE LIFT IS `fill/brand-hover`, NOT A NEW COLOUR, and there is a real problem hiding in the
 * brief here. It asks for "a darker/deeper red-orange" than the default orange. Measured off
 * dist/tokens.css rather than asserted, because the two modes disagree:
 *
 *            rest            ready (-hover)   pressed (-active)
 *   light    #FF3D01    →    #D53100          #A92500      deepens
 *   dark     #FF3D01    →    #FE542D          #FC6645      lightens
 *
 * `fill/brand` is the same #FF3D01 in both modes; the ramp then moves in OPPOSITE directions.
 * So the brief's "darker" is achievable in light and not in dark, and no token is
 * deeper-in-both — because a fill that darkened against a near-black page would be receding
 * exactly when the action becomes available. What is constant is that ready sits one ramp step
 * from rest, so the rest-vs-ready contrast survives in both modes even though its sign does
 * not. Hand-picking a darker orange for dark would break rule 2 and lose that.
 *
 * The knock-on: `Generate`'s own :hover then has to move somewhere, or the button stops
 * responding to the pointer at the moment it matters. Ready uses `-active` for hover, which
 * is the next rung along in both modes.
 *
 * EVERY CONTROL IS REAL AND OPENS THE SPECIFIED SURFACE. The option lists here are no longer
 * guesses — the component sheet specifies them, and they live in fixtures.ts. What the sheet
 * corrected from the previous commit, recorded because guessing quietly is how it went wrong:
 *
 *   was guessed                       is specified
 *   ───────────────────────────       ────────────────────────────────────────────
 *   Pro/Standard/Draft tiers          Standard / Pro / Ultra, with engines and credit costs
 *   five aspect ratios, flat          four named crops plus seven behind `More`
 *   CTA as a preset menu              CTA is a MODAL with a free-text field
 *   slots toggled an attachment       slots open a tabbed asset picker
 *   a gem glyph for resolution        a droplet, matching its own popover's rows
 *
 * Only the resolution list (1K/2K/4K) and the 1/4 stepper survived unchanged.
 * ------------------------------------------------------------------------- */

/** Every ratio, both lists, for resolving an id back to its label. */
const ALL_RATIOS = [...ASPECT_PRIMARY, ...ASPECT_MORE];

/** The reference-images strip. Absent from state A and B; the sheet shows it only once
 *  references exist, and it is a row of small square thumbs with a remove control. */
type Reference = { id: string; seed: 1 | 2 | 3 | 4 | 5 };

export function PromptBox({
  /** Seeds the box for a specimen. The page itself mounts it empty; the states are reachable
   *  by typing and picking, which is the point of building it as one component. */
  initialPrompt = '',
  initialProduct,
  initialTemplate,
  initialReferences = [],
}: {
  initialPrompt?: string;
  initialProduct?: Asset;
  initialTemplate?: Asset;
  initialReferences?: Reference[];
} = {}) {
  const promptId = useId();
  const promptRef = useRef<HTMLTextAreaElement | null>(null);

  const [prompt, setPrompt] = useState(initialPrompt);
  const [product, setProduct] = useState<Asset | undefined>(initialProduct);
  const [template, setTemplate] = useState<Asset | undefined>(initialTemplate);
  const [references, setReferences] = useState<Reference[]>(initialReferences);

  const [model, setModel] = useState(MODELS[1].id);
  const [ratio, setRatio] = useState('4:5');
  const [quality, setQuality] = useState(QUALITIES[2].id);
  const [variations, setVariations] = useState(1);
  const [cta, setCta] = useState('');

  const [ctaOpen, setCtaOpen] = useState(false);
  /** Which slot opened the picker, so the chosen asset lands in the right one. Null when
   *  closed — one piece of state rather than an `open` boolean plus a `target`, which is two
   *  that can disagree. */
  const [picking, setPicking] = useState<null | 'product' | 'template'>(null);

  /* Auto-grow. useLayoutEffect rather than useEffect so the measure happens before paint —
     with useEffect the box renders at its old height for one frame and the row visibly jumps
     on every keystroke. Keyed on `prompt` so it also runs for a programmatic set, not only
     for typing. */
  useLayoutEffect(() => {
    const el = promptRef.current;
    if (!el) return;
    /* Reset first: scrollHeight never shrinks below the element's current height, so
       measuring without clearing the inline height makes the field one-way — it grows and
       then never comes back when text is deleted. */
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [prompt]);

  /* State C's condition, in one place. Text alone is not enough — see the header. */
  const ready = Boolean(prompt.trim()) && Boolean(product || template);

  const activeModel = MODELS.find((m) => m.id === model) ?? MODELS[0];
  const activeRatio = ALL_RATIOS.find((r) => r.id === ratio) ?? ASPECT_PRIMARY[1];
  const activeQuality = QUALITIES.find((q) => q.id === quality) ?? QUALITIES[2];

  return (
    <>
      <div className="mx-auto mt-space-8 w-full max-w-[752px] rounded-8 border-2 border-border-secondary bg-surface-elevated p-space-3 text-left shadow-medium focus-within:outline focus-within:outline-ring focus-within:outline-offset-ring focus-within:outline-border-focus">
        {/* The reference strip, above the textarea and only when there is something in it. */}
        {references.length > 0 && (
          <ul className="mb-space-3 flex flex-wrap gap-space-2">
            {references.map((reference) => (
              <li key={reference.id} className="group/ref relative">
                <span className="block h-space-9 w-space-9 overflow-hidden rounded-3 border-2 border-border-secondary">
                  <PlaceholderArt seed={reference.seed} kind="product" />
                </span>
                {/* Appears on hover OR focus. Hover-only would make it unreachable by
                    keyboard, which is the usual way a remove control on a thumbnail goes
                    wrong — so focus-within is not a nicety here, it is the whole control. */}
                <button
                  type="button"
                  onClick={() =>
                    setReferences((r) => r.filter((item) => item.id !== reference.id))
                  }
                  aria-label="Remove reference image"
                  className="absolute -right-space-1 -top-space-1 grid h-space-5 w-space-5 place-items-center rounded-full bg-fill-inverse text-content-on-inverse opacity-0 transition-opacity duration-effects-fast ease-effects-fast group-hover/ref:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
                >
                  <CloseIcon className="h-space-3 w-space-3" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="oz-stack oz-stack-3 sm:flex-row sm:items-stretch sm:min-h-[84px]">
          <div className="oz-stack oz-stack-4 min-w-0 flex-1 justify-between">
            <div className="flex items-start gap-space-3">
              <button
                type="button"
                aria-label="Add a reference image"
                onClick={() =>
                  setReferences((r) => [
                    ...r,
                    /* Deterministic, not random: Math.random() in a render path gives a
                       different thumb on every re-render, and the seed is meant to identify
                       the asset. Cycling the palette by length is enough to tell five
                       references apart. */
                    { id: `ref-${r.length + 1}`, seed: ((r.length % 5) + 1) as 1 | 2 | 3 | 4 | 5 },
                  ])
                }
                className="grid h-space-7 w-space-7 shrink-0 place-items-center rounded-full border-2 border-border-secondary bg-fill-secondary text-content-secondary transition-colors duration-effects-fast ease-effects-fast hover:bg-fill-secondary-hover hover:text-content-primary focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
              >
                <PlusIcon className="h-space-4 w-space-4" />
              </button>

              <label className="sr-only" htmlFor={promptId}>
                Describe your ad
              </label>
              {/* A raw textarea, chromeless, for the reason StudioHero's composer gives: the
                  FRAME is the card and the field inside it carries no border of its own, so
                  the whole card reads as one control. ui/Textarea would bring Field's label
                  and message rows plus its own border.

                  IT HAS TO AUTO-GROW BY HAND, and skipping that was a real bug rather than a
                  polish item. `rows={1}` pins the height to one line; a plain textarea does
                  not grow with its content, so the sheet's four-line prompt rendered as a
                  one-line box scrolled to the caret — the whole field read "focus." and the
                  populated states were unreviewable. ui/Textarea has `autoGrow` for exactly
                  this and cannot be used here, so this is that behaviour in the six lines it
                  takes: reset to auto, then measure. The 4-line cap is CSS, so past it the
                  field scrolls itself rather than growing the card past the tiles beside it. */}
              <textarea
                ref={promptRef}
                id={promptId}
                rows={1}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your ad"
                className="block max-h-[5.25rem] w-full resize-none overflow-y-auto bg-transparent text-body-sm leading-[1.3125rem] text-content-primary placeholder:text-content-placeholder focus:outline-none"
              />
            </div>

            <div className="oz-cluster oz-cluster-2">
              <ModelsPopover value={model} onChange={setModel}>
                <ControlChip icon={<SparkIcon />} accent field="Model">
                  {activeModel.name}
                </ControlChip>
              </ModelsPopover>

              <AspectRatioPopover value={ratio} onChange={setRatio}>
                <ControlChip icon={<AspectIcon />} field="Aspect ratio">
                  {activeRatio.ratio}
                </ControlChip>
              </AspectRatioPopover>

              <QualityPopover value={quality} onChange={setQuality}>
                <ControlChip icon={<DropletIcon />} field="Resolution">
                  {activeQuality.label}
                </ControlChip>
              </QualityPopover>

              <VariationStepper value={variations} onChange={setVariations} />

              {/* The CTA chip opens a modal, not a popover, so it is a plain trigger rather
                  than a Popover child. It reads the committed value when there is one — a
                  chip that still says "CTA" after the reader typed one is a chip that lost
                  their work as far as they can tell. */}
              <ControlChip
                icon={<CtaIcon />}
                field="Call to action"
                accent={Boolean(cta)}
                onClick={() => setCtaOpen(true)}
              >
                {cta || 'CTA'}
              </ControlChip>
            </div>
          </div>

          <div className="flex items-stretch gap-space-2">
            <TouchpointSlot
              label="Product"
              value={product?.name}
              seed={product?.seed as 1 | 2 | 3 | 4 | 5 | undefined}
              kind="product"
              onClick={() => setPicking('product')}
              className="w-[86px]"
            />
            <TouchpointSlot
              label="Template"
              value={template?.name}
              seed={template?.seed as 1 | 2 | 3 | 4 | 5 | undefined}
              kind="template"
              onClick={() => setPicking('template')}
              className="w-[86px]"
            />

            <button
              type="button"
              /* Not disabled when it is not ready. The brief asks for a visual cue, not a
                 lock, and a Generate that cannot be pressed until both a prompt and an asset
                 exist would hide the reason it is inert. aria-describedby carries the reason
                 instead, so the state is announced rather than merely painted. */
              aria-describedby={ready ? undefined : `${promptId}-hint`}
              className={`w-[108px] shrink-0 rounded-6 py-space-4 text-label-sm font-semibold text-content-on-brand transition-colors duration-effects-default ease-effects-default focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus ${
                ready
                  ? 'bg-fill-brand-hover hover:bg-fill-brand-active'
                  : 'bg-fill-brand hover:bg-fill-brand-hover'
              }`}
            >
              Generate
            </button>
            <span id={`${promptId}-hint`} className="sr-only">
              Add a prompt and pick a product or template to generate.
            </span>
          </div>
        </div>
      </div>

      <CtaModal open={ctaOpen} onClose={() => setCtaOpen(false)} value={cta} onCommit={setCta} />

      <AssetPickerModal
        open={picking !== null}
        onClose={() => setPicking(null)}
        /* The slot decides the tab, which is exactly what the brief's `defaultTab` prop is
           for — "the Product Modal" and "the Avatar Modal" are this component twice. */
        defaultTab={picking === 'template' ? 'avatars' : 'products'}
        selectedId={picking === 'template' ? template?.id : product?.id}
        onSelect={(asset) => {
          if (picking === 'template') setTemplate(asset);
          else setProduct(asset);
          setPicking(null);
        }}
      />
    </>
  );
}

/* ---------------------------------------------------------------------------
 * The control chip.
 * ------------------------------------------------------------------------- */

/** forwardRef because Popover clones its trigger with a ref, `aria-haspopup`,
 *  `aria-expanded`, `aria-controls` and an onClick. A trigger that swallows the ref anchors
 *  the panel at the origin and one that drops the props opens a panel no screen reader
 *  announces — so `...rest` is load-bearing rather than tidiness. */
const ControlChip = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: React.ReactNode;
    /** Names what the value belongs to. The visible text is the VALUE — "4:5" alone does not
     *  say aspect ratio, and "Aspect ratio: 4:5" does not fit a 24px chip. */
    field: string;
    accent?: boolean;
  }
>(function ControlChip({ icon, field, accent = false, children, className, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={`inline-flex h-space-7 max-w-[168px] shrink-0 items-center gap-space-2 rounded-4 border-2 px-space-2 text-label-sm transition-colors duration-effects-fast ease-effects-fast focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus ${
        accent
          ? /* content/brand-HOVER, not content/brand, and this is CLAUDE.md 4b rather than a
             * hover state in the wrong place. These chips sit on surface/elevated, which the
             * card paints, and in dark every accent content role is under 4.5:1 on the top two
             * rungs of the ladder — content/brand measures 4.02 there. The -hover step clears
             * every rung in both modes. */
            'border-border-brand bg-fill-brand-secondary text-content-brand-hover hover:bg-fill-brand-secondary-hover'
          : 'border-border-secondary bg-fill-secondary text-content-secondary hover:bg-fill-secondary-hover hover:text-content-primary'
      } ${className ?? ''}`}
      {...rest}
    >
      <span aria-hidden="true" className="shrink-0">
        {icon}
      </span>
      <span className="sr-only">{field}: </span>
      {/* truncate, because the CTA chip renders whatever was typed into the modal and a
          sentence would otherwise push Generate off the card. */}
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
});

/* ---------------------------------------------------------------------------
 * The stepper.
 * ------------------------------------------------------------------------- */

/** How many variations to generate, rendered `n/4`.
 *
 *  role="spinbutton" on the readout rather than three unrelated buttons, so a screen reader
 *  announces a value that changes instead of two clicks and some text. The buttons stay real
 *  buttons because a spinbutton is not operable by pointer on its own.
 */
function VariationStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const step = (delta: number) => onChange(Math.min(MAX_VARIATIONS, Math.max(1, value + delta)));

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
        /* tabular-nums for the reason stepper.recipe.ts gives: 1 and 4 have different widths
           in a proportional font, so the readout would shift by that difference on every
           press and drag the + button with it. */
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

/* Re-exported so the icon type stays reachable from the barrel this file replaced. */
export type { IconProps };
