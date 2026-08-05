'use client';

import { registry } from '@/lib/core/Registry';
import { useState } from 'react';
import {
  alertRecipe,
  badgeRecipe,
  buttonRecipe,
  buttonLinkRecipe,
  cardRecipe,
  checkboxRecipe,
  dialogRecipe,
  fieldRecipe,
  iconButtonRecipe,
  inputRecipe,
  listboxRecipe,
  dropzoneRecipe,
  radioRecipe,
  selectRecipe,
  sliderRecipe,
  textareaRecipe,
  pricingCardRecipe,
  skeletonRecipe,
  switchRecipe,
  tableRecipe,
  tabsRecipe,
  type AlertVariant,
  type BadgeVariant,
  type ButtonLinkVariant,
  type ButtonVariant,
  type CardVariant,
  type CheckboxVariant,
  type DialogVariant,
  type IconButtonVariant,
  type InputVariant,
  type SkeletonVariant,
  type SwitchVariant,
  type TabVariant,
} from '@/lib/recipes';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardMeta,
  CardTitle,
  Checkbox,
  Dialog,
  Dropzone,
  Field,
  IconButton,
  Input,
  ListboxGroup,
  ListboxOption,
  ListboxPanel,
  PricingCard,
  RadioGroup,
  Select,
  Skeleton,
  Slider,
  SkeletonGroup,
  Switch,
  Table,
  Tabs,
  Textarea,
  type SelectItem,
} from '@/components/ui';
import { STARTER, BASIC, PROFESSIONAL, ENTERPRISE } from './pricingFixtures';

/** A placeholder glyph for the icon-button demos. Deliberately geometric rather than
 *  a recognisable icon — the grid is about the button, and a familiar glyph makes a
 *  reviewer read the meaning instead of the state. */
function Glyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * The catalog: recipe ↔ live demo, one registration per component.
 *
 * This is the only file that knows the full list. The page reads `registry.all`,
 * so adding a component here makes it appear in the nav, get a section, a state
 * matrix, a binding table, a token inventory and a usage snippet — with no edit to
 * the page itself.
 *
 * Every Live demo below renders the real exported component. None of them styles a
 * div to look like one. That constraint is the whole point of the exercise: if a
 * state is broken in the app it is broken here, visibly, on the same screen as its
 * own documentation.
 * ------------------------------------------------------------------------- */

const row = 'oz-cluster oz-cluster-4';

/* -- Button ---------------------------------------------------------------- */

registry.register({
  recipe: buttonRecipe,
  Preview: function ButtonPreview() {
    return (
      <div className={row}>
        <Button variant="primary">Generate</Button>
        <Button variant="outline">Cancel</Button>
      </div>
    );
  },
  Live: function ButtonLive() {
    return (
      <div className="oz-stack oz-stack-6">
        <div className={row}>
          {buttonRecipe.variants.map((v) => (
            <Button key={v} variant={v}>
              {buttonRecipe.sampleFor(v)}
            </Button>
          ))}
        </div>
        <div className={row}>
          {buttonRecipe.sizes.map((s) => (
            <Button key={s} variant="primary" size={s}>
              {s === 'sm' ? 'Queue' : s === 'md' ? 'Generate video' : 'Generate video'}
            </Button>
          ))}
          <span className="font-mono text-label-sm text-content-tertiary">sm · md · lg</span>
        </div>
        <div className={row}>
          {buttonRecipe.variants.map((v) => (
            <Button key={v} variant={v} disabled>
              {buttonRecipe.sampleFor(v)}
            </Button>
          ))}
          <span className="font-mono text-label-sm text-content-tertiary">
            real disabled attribute
          </span>
        </div>
      </div>
    );
  },
  Cell: function ButtonCell({ variant, state, disabled, extraClassName }) {
    return (
      <Button
        variant={variant as ButtonVariant}
        forceState={state}
        disabled={disabled}
        className={extraClassName}
      >
        {buttonRecipe.sampleFor(variant as ButtonVariant)}
      </Button>
    );
  },
});

/* -- Badge ----------------------------------------------------------------- */

registry.register({
  recipe: badgeRecipe,
  Preview: function BadgePreview() {
    /* Three of fourteen. One solid, one subtle, one with the marker — enough to show
       what a badge is without turning the tile into the variant grid it used to be. */
    return (
      <div className={row}>
        <Badge variant="success" icon>
          Ready
        </Badge>
        <Badge variant="warning-subtle">Expiring</Badge>
        <Badge variant="neutral-subtle">Seedance 2</Badge>
      </div>
    );
  },
  Live: function BadgeLive() {
    return (
      <div className="oz-stack oz-stack-6">
        <div className={row}>
          {badgeRecipe.variants.map((v) => (
            <Badge key={v} variant={v}>
              {badgeRecipe.sampleFor(v)}
            </Badge>
          ))}
        </div>
        <div className={row}>
          {badgeRecipe.variants.map((v) => (
            <Badge key={v} variant={v} icon>
              {badgeRecipe.sampleFor(v)}
            </Badge>
          ))}
          <span className="font-mono text-label-sm text-content-tertiary">
            icon · survives greyscale
          </span>
        </div>
        {/* Was a size row. Badge has one size now — the Figma set has no size axis —
            so the third row shows the axis that does exist: the disabled state, which
            a badge needs because it frequently labels a row that is itself disabled. */}
        <div className={row}>
          {badgeRecipe.variants.map((v) => (
            <Badge key={v} variant={v} forceState="disabled">
              {badgeRecipe.sampleFor(v)}
            </Badge>
          ))}
          <span className="font-mono text-label-sm text-content-tertiary">disabled</span>
        </div>
      </div>
    );
  },
  Cell: function BadgeCell({ variant }) {
    return <Badge variant={variant as BadgeVariant}>{badgeRecipe.sampleFor(variant as BadgeVariant)}</Badge>;
  },
});

/* -- Input ----------------------------------------------------------------- */

registry.register({
  recipe: inputRecipe,
  gridSuppressed: true,
  Preview: function InputPreview() {
    /* Width-capped. An input is the one specimen that would otherwise stretch to the
       well's full width and read as a divider rather than a field. */
    return (
      <div className="w-[200px]">
        <Input label="Prompt" placeholder="A slow dolly through fog" />
      </div>
    );
  },
  Live: function InputLive() {
    return (
      <div className="grid max-w-[720px] grid-cols-1 gap-space-6 md:grid-cols-2">
        {inputRecipe.variants.map((v) => (
          <Input
            key={v}
            /* `variant` is explicit so `invalid` renders its paint on the same row as
               `default`. In an app, passing `error` alone is the ordinary way in and the
               variant follows from it. */
            variant={v}
            label={inputRecipe.labelFor(v)}
            placeholder={inputRecipe.placeholderFor(v)}
            error={inputRecipe.messageFor(v) ?? undefined}
            defaultValue={v === 'invalid' ? 'design@heyoz' : ''}
          />
        ))}
        <Input
          label="Prompt (lg)"
          size="lg"
          placeholder={inputRecipe.placeholderFor('default')}
          hint="Up to 12 seconds at 1080p."
        />
        <Input label="Seed" disabled defaultValue="locked to 41827" hint="Unlock to edit." />

        {/* Both slots, and both halves of the required/optional pair. The error and the
            hint render together on the invalid field above — that is the point of the
            arrangement, not an oversight. */}
        <Input
          label="Brand name"
          required
          leading={<Glyph />}
          placeholder="HeyOz"
          hint="We read this off the product page when you paste one."
        />
        <Input
          label="Campaign code"
          optional
          size="lg"
          trailing={<Glyph />}
          placeholder="SPRING-26"
        />
      </div>
    );
  },
});

/* -- Card ------------------------------------------------------------------ */

registry.register({
  recipe: cardRecipe,
  Preview: function CardPreview() {
    /* ONE card, not four. The four-up grid is what collapsed to 70px columns with one
       word per line — a Card's whole subject is a surface holding content, and it
       cannot show that at a width narrower than its own padding. */
    return (
      <div className="w-[216px]">
        <Card variant="raised">
          <CardTitle>Render complete</CardTitle>
          <CardMeta>Four clips at 1080p</CardMeta>
        </Card>
      </div>
    );
  },
  Live: function CardLive() {
    return (
      <div className="grid grid-cols-1 gap-space-5 sm:grid-cols-2 lg:grid-cols-4">
        {cardRecipe.variants.map((v) => (
          <Card key={v} variant={v} selected={v === 'interactive' ? false : undefined}>
            <CardTitle>{v}</CardTitle>
            <CardMeta>{cardRecipe.intentFor(v)}</CardMeta>
          </Card>
        ))}
      </div>
    );
  },
  Cell: function CardCell({ variant, state, extraClassName }) {
    return (
      <Card
        variant={variant as CardVariant}
        forceState={state}
        as="div"
        className={`w-[120px] ${extraClassName ?? ''}`}
      >
        <span className="font-mono text-label-sm text-content-tertiary">{state}</span>
      </Card>
    );
  },
});

/* -- Alert ----------------------------------------------------------------- */

registry.register({
  recipe: alertRecipe,
  Preview: function AlertPreview() {
    return (
      <div className="w-[236px]">
        <Alert variant="success" title="Render complete">
          Four clips are in your library.
        </Alert>
      </div>
    );
  },
  Live: function AlertLive() {
    return (
      <div className="flex max-w-[620px] flex-col gap-space-4">
        {alertRecipe.variants.map((v) => (
          <Alert key={v} variant={v} />
        ))}
      </div>
    );
  },
  Cell: function AlertCell({ variant }) {
    const copy = alertRecipe.copyFor(variant as AlertVariant);
    return (
      <div className="w-[260px]">
        <Alert variant={variant as AlertVariant} title={copy.title}>
          {copy.body}
        </Alert>
      </div>
    );
  },
});

/* -- Table ----------------------------------------------------------------- */

const CLIP_COLUMNS = [
  { key: 'clip', label: 'Clip' },
  { key: 'model', label: 'Model' },
  { key: 'status', label: 'Status' },
  { key: 'length', label: 'Length', align: 'right' as const },
];

const CLIP_ROWS = [
  { clip: 'street-dusk-01', model: 'Seedance 2', status: <Badge variant="success-subtle" icon>Ready</Badge>, length: '0:12' },
  { clip: 'harbour-pan-04', model: 'Seedance 2', status: <Badge variant="info-subtle" icon>Rendering</Badge>, length: '0:08' },
  { clip: 'rooftop-wide-02', model: 'Veo 3', status: <Badge variant="critical-subtle" icon>Failed</Badge>, length: '—' },
];

registry.register({
  recipe: tableRecipe,
  Preview: function TablePreview() {
    /* Two columns and two rows. The real demo has four columns of real filenames,
       which at tile width wraps every cell to three lines and reads as a paragraph. */
    return (
      <div className="w-[228px]">
        <Table
          caption="Recent renders"
          columns={[
            { key: 'clip', label: 'Clip' },
            { key: 'status', label: 'Status' },
          ]}
          /* Short keys on purpose. The real demo uses `street-dusk-01`, which at tile
             width wraps to two lines per cell and pushes the second row past the
             well's clip — a preview showing its own overflow is worse than no
             preview. The full filenames are on the component's page. */
          rows={[
            {
              clip: 'dusk-01',
              status: (
                <Badge variant="success-subtle" icon>
                  Ready
                </Badge>
              ),
            },
            {
              clip: 'pan-04',
              status: (
                <Badge variant="info-subtle" icon>
                  Rendering
                </Badge>
              ),
            },
          ]}
          rowKey={(r) => String(r.clip)}
        />
      </div>
    );
  },
  Live: function TableLive() {
    return (
      <div className="oz-stack oz-stack-4">
        <Table
          caption="Recent renders"
          columns={CLIP_COLUMNS}
          rows={CLIP_ROWS}
          rowKey={(r) => String(r.clip)}
          selectedKeys={['harbour-pan-04']}
          onRowClick={() => {}}
        />
        <p className="text-body-sm text-content-tertiary">
          Row two is selected — <code className="font-mono">fill/selected</code> and{' '}
          <code className="font-mono">aria-selected</code> from one prop. Hover any other row.
        </p>
      </div>
    );
  },
  Cell: function TableCell({ variant, state }) {
    const isHeader = variant === 'header';
    return (
      <div className="w-[200px] overflow-hidden rounded-4 border-2 border-border-primary">
        <table className="w-full border-collapse">
          <tbody>
            <tr className={tableRecipe.classes({ variant: variant as 'row' | 'header', force: state })}>
              <td className={tableRecipe.cellClasses}>
                {isHeader ? (
                  <span className="font-mono text-label-xs uppercase">Clip</span>
                ) : (
                  'street-dusk-01'
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  },
});

/* -- Skeleton -------------------------------------------------------------- */

registry.register({
  recipe: skeletonRecipe,
  Preview: function SkeletonPreview() {
    return (
      <div className="w-[176px]">
        <SkeletonGroup label="Loading a clip">
          <div className="oz-stack oz-stack-3">
            <Skeleton variant="line" className="w-full" />
            <Skeleton variant="line" className="w-3/4" />
            <Skeleton variant="line" className="w-1/2" />
          </div>
        </SkeletonGroup>
      </div>
    );
  },
  Live: function SkeletonLive() {
    return (
      <SkeletonGroup label="Loading four clips">
        <div className="grid max-w-[620px] grid-cols-1 gap-space-6 sm:grid-cols-2">
          <div className="oz-stack oz-stack-3">
            <Skeleton variant="line" width="w-2/3" />
            <Skeleton variant="line" width="w-full" />
            <Skeleton variant="line" width="w-5/6" />
            <Skeleton variant="line" width="w-1/2" />
          </div>
          <div className="oz-stack oz-stack-4">
            <Skeleton variant="block" />
            <div className="flex items-center gap-space-4">
              <Skeleton variant="circle" />
              <div className="flex flex-1 flex-col gap-space-2">
                <Skeleton variant="line" width="w-1/2" />
                <Skeleton variant="line" width="w-1/3" />
              </div>
            </div>
          </div>
        </div>
      </SkeletonGroup>
    );
  },
  Cell: function SkeletonCell({ variant }) {
    return (
      <div className="w-[110px]">
        <Skeleton variant={variant as SkeletonVariant} />
      </div>
    );
  },
});

/* -- Switch ---------------------------------------------------------------- */

registry.register({
  recipe: switchRecipe,
  gridSuppressed: true,
  Preview: function SwitchPreview() {
    /* Both states, short labels. The real demo uses full sentences, which at tile
       width wrap to three lines each and bury the control they belong to. */
    return (
      <div className="oz-stack oz-stack-3">
        <Switch label="Upscale to 4K" defaultChecked />
        <Switch label="Email me" />
      </div>
    );
  },
  Live: function SwitchLive() {
    return (
      <div className="flex max-w-[520px] flex-col gap-space-2">
        <Switch label={switchRecipe.labelFor('off')} />
        <Switch label={switchRecipe.labelFor('on')} defaultChecked />
        <Switch label="Public link (locked by your workspace)" disabled />
        <Switch label="Delete originals after export (locked, on)" disabled defaultChecked />
      </div>
    );
  },
  Cell: function SwitchCell({ variant, state, disabled }) {
    return (
      <Switch
        ariaLabel={`${variant}, ${state}`}
        checked={variant === 'on'}
        forceState={state}
        disabled={disabled}
      />
    );
  },
});

/* -- Checkbox -------------------------------------------------------------- */

registry.register({
  recipe: checkboxRecipe,
  Preview: function CheckboxPreview() {
    /* All three values, which is the component's whole subject — and the third is the
       one no click can reach. */
    return (
      <div className="oz-stack oz-stack-3">
        <Checkbox label="Add a watermark" defaultChecked />
        <Checkbox label="Select all clips" checked="mixed" />
      </div>
    );
  },
  Live: function CheckboxLive() {
    return (
      <div className="flex max-w-[520px] flex-col gap-space-2">
        <Checkbox label={checkboxRecipe.labelFor('unchecked')} />
        <Checkbox label={checkboxRecipe.labelFor('checked')} defaultChecked />
        <Checkbox label={checkboxRecipe.labelFor('indeterminate')} checked="mixed" />
        <Checkbox label="Commercial licence (required, locked)" checked disabled />
      </div>
    );
  },
  Cell: function CheckboxCell({ variant, state, disabled }) {
    return (
      <Checkbox
        forceVariant={variant as CheckboxVariant}
        checked={variant === 'unchecked' ? false : variant === 'checked' ? true : 'mixed'}
        forceState={state}
        disabled={disabled}
      />
    );
  },
});

/* -- Icon Button ----------------------------------------------------------- */

registry.register({
  recipe: iconButtonRecipe,
  Preview: function IconButtonPreview() {
    return (
      <div className={row}>
        <IconButton variant="primary" label="Primary" icon={<Glyph />} />
        <IconButton variant="secondary" label="Secondary" icon={<Glyph />} />
        <IconButton variant="outline" shape="pill" label="Outline" icon={<Glyph />} />
      </div>
    );
  },
  Live: function IconButtonLive() {
    return (
      <div className="oz-stack oz-stack-6">
        {/* Every sub-type at xl, both shapes, so the radius ramp is visible against
            the square. `fixed` sits on an inverse plate because that is the only
            ground it is designed for — on the page it is a white square on white. */}
        {(['rect', 'pill'] as const).map((shape) => (
          <div key={shape} className={row}>
            {iconButtonRecipe.variants.map((v) => (
              <span
                key={v}
                className={v === 'fixed' ? 'rounded-4 bg-surface-inverse p-space-2' : undefined}
              >
                <IconButton variant={v} size="xl" shape={shape} label={`${v} ${shape}`} icon={<Glyph />} />
              </span>
            ))}
            <span className="font-mono text-label-sm text-content-tertiary">{shape}</span>
          </div>
        ))}
        {/* The size ramp: 32 / 36 / 40 / 48 / 56 / 64, square at every step. */}
        <div className={row}>
          {iconButtonRecipe.sizes.map((s) => (
            <IconButton key={s} variant="secondary" size={s} label={`size ${s}`} icon={<Glyph />} />
          ))}
          <span className="font-mono text-label-sm text-content-tertiary">32→64 · w = h</span>
        </div>
        <div className={row}>
          <IconButton variant="primary" size="xl" label="Sending" icon={<Glyph />} loading />
          <span className="font-mono text-label-sm text-content-tertiary">loading · disables itself</span>
        </div>
      </div>
    );
  },
  Cell: function IconButtonCell({ variant, state, disabled, extraClassName }) {
    return (
      <IconButton
        variant={variant as IconButtonVariant}
        size="xl"
        label={`${variant}, ${state}`}
        icon={<Glyph />}
        forceState={state}
        disabled={disabled}
        className={extraClassName}
      />
    );
  },
});

/* -- Button Link ----------------------------------------------------------- */

registry.register({
  recipe: buttonLinkRecipe,
  Preview: function ButtonLinkPreview() {
    return (
      <div className="oz-stack oz-stack-3">
        <ButtonLink variant="brand" href="#preview">
          See full details
        </ButtonLink>
        <ButtonLink variant="subtle" href="#preview">
          Privacy policy
        </ButtonLink>
      </div>
    );
  },
  Live: function ButtonLinkLive() {
    return (
      <div className="oz-stack oz-stack-4">
        <div className={row}>
          {buttonLinkRecipe.variants.map((v) => (
            <ButtonLink key={v} variant={v} href={`#${v}`}>
              {buttonLinkRecipe.sampleFor(v)}
            </ButtonLink>
          ))}
        </div>
        {/* The element split. Both look identical and only one of them is navigation,
            which is the whole argument in the recipe's third note. */}
        <div className={row}>
          <ButtonLink variant="brand" href="#anchor">
            renders an anchor
          </ButtonLink>
          <ButtonLink variant="brand" onClick={() => {}}>
            renders a button
          </ButtonLink>
        </div>
      </div>
    );
  },
  Cell: function ButtonLinkCell({ variant, state, disabled, extraClassName }) {
    return (
      <ButtonLink
        variant={variant as ButtonLinkVariant}
        forceState={state}
        disabled={disabled}
        className={extraClassName}
      >
        {buttonLinkRecipe.sampleFor(variant as ButtonLinkVariant)}
      </ButtonLink>
    );
  },
});

/* -- Tabs ------------------------------------------------------------------ */

const TAB_ITEMS = [
  { id: 'reshoots', label: 'Product reshoots' },
  { id: 'hooks', label: 'UGC hooks' },
  { id: 'avatars', label: 'AI avatars' },
];

registry.register({
  recipe: tabsRecipe,
  /* The grid cannot show these honestly: `passed` and `inactive` differ only in the
   * rail's opacity, which is a child element the forced classes never reach. The Live
   * demo below shows all three in one row, which is the truthful version. */
  gridSuppressed: true,
  Preview: function TabsPreview() {
    /* Static — no state, because a preview is a thumbnail and a tile that responds to
       nothing should not carry a useState. Two steps rather than three so the labels
       keep their own line at tile width. */
    return (
      <div className="w-[216px] rounded-6 bg-surface-inverse p-space-4">
        <Tabs
          items={[
            /* Short enough to survive the tile without truncating. The full copy is on
               the component's page — a thumbnail that ends in an ellipsis is showing
               its own clipping rather than the component. */
            { id: 'a', label: 'Reshoots' },
            { id: 'b', label: 'UGC hooks' },
          ]}
          activeId="a"
          label="Onboarding videos"
        />
      </div>
    );
  },
  Live: function TabsLive() {
    const [active, setActive] = useState('hooks');
    return (
      /* On surface-inverse, because that is the ground this component is bound
         against — content-inverse-* is gated there and nowhere else. */
      <div className="rounded-8 bg-surface-inverse p-space-6">
        <Tabs
          items={TAB_ITEMS}
          activeId={active}
          onSelect={setActive}
          label="Onboarding videos"
        />
      </div>
    );
  },
});

/* -- Dialog ---------------------------------------------------------------- */

registry.register({
  recipe: dialogRecipe,
  /* Four identical panels — the variant only changes which button commits, so a
   * variant x state grid of the panel would be four identical rows. The Live demo
   * opens each one instead. */
  gridSuppressed: true,
  Preview: function DialogPreview() {
    /* The panel, without the modal chrome. `dialogRecipe.classes` is the real recipe,
       so this is the component's actual surface, shadow and radius — it simply is not
       trapped behind a backdrop, because a tile cannot open one and a preview that
       required a click would show an empty well. */
    return (
      <div className="w-[248px]">
        <div className={dialogRecipe.classes({ variant: 'basic', className: 'p-space-5 gap-space-3' })}>
          <p className="text-body-md font-medium text-content-primary">Are you sure?</p>
          <p className="line-clamp-1 text-body-sm text-content-secondary">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-space-2">
            <Button variant="outline" size="xs">
              Cancel
            </Button>
            <Button variant="inverse" size="xs">
              Yes, delete
            </Button>
          </div>
        </div>
      </div>
    );
  },
  Live: function DialogLive() {
    const [open, setOpen] = useState<DialogVariant | null>(null);
    const copy: Record<DialogVariant, { confirm: string; body: string }> = {
      basic: {
        confirm: 'Yes, delete',
        body: 'Are you sure you want to permanently delete this chat? This action cannot be undone.',
      },
      warning: {
        confirm: 'Yes, downgrade',
        body: 'Downgrading now keeps your credits until the end of the billing period, then drops you to 100/month.',
      },
      error: {
        confirm: 'Yes, delete',
        body: 'Are you sure you want to permanently delete this chat? This action cannot be undone.',
      },
      detailed: {
        confirm: 'Yes, continue',
        body: "Changing the plan right now will allocate your current subscription's remaining time to the new one.",
      },
    };
    return (
      <div className={row}>
        {dialogRecipe.variants.map((v) => (
          <Button key={v} variant="outline" size="md" onClick={() => setOpen(v)}>
            {v}
          </Button>
        ))}
        {open && (
          <Dialog
            open
            variant={open}
            title="Are you sure?"
            detailLabel={open === 'detailed' ? 'Error' : undefined}
            confirmLabel={copy[open].confirm}
            onClose={() => setOpen(null)}
            onConfirm={() => setOpen(null)}
          >
            {copy[open].body}
          </Dialog>
        )}
      </div>
    );
  },
});

/* -- Pricing Card ---------------------------------------------------------- */

registry.register({
  recipe: pricingCardRecipe,
  /* A composition, not a primitive. Its variants differ in a decorative wash and a
   * CTA colour, neither of which a forced-state grid cell can show — and a 400x766
   * card does not fit in one. */
  gridSuppressed: true,
  Preview: function PricingCardPreview() {
    /* An EXCERPT, and the only preview in the catalogue that is one.
     *
     * The other thirteen show the real component at its natural size. A pricing card
     * is 400x766 — twelve times the well's height — so the choices were a scaled-down
     * thumbnail whose type renders at four pixels, or the fragment that makes it
     * recognisable. This is the fragment: the tier badge, the struck price pair and
     * the CTA, on the card's own surface via the real recipe. The full card is one
     * click away and that is where it should be read. */
    return (
      <div className="w-[212px]">
        <div
          className={pricingCardRecipe.classes({
            variant: 'basic',
            size: 'panel',
            className: 'gap-space-3 p-space-5',
          })}
        >
          <div className={row}>
            <p className="font-display text-body-lg font-semibold text-content-primary">Basic</p>
            <Badge variant="brand">BEST VALUE</Badge>
          </div>
          <p className="flex items-baseline gap-space-2">
            <s className="text-body-md text-content-tertiary">$45</s>
            <span className="text-heading-xs font-semibold text-content-primary">$31.5</span>
          </p>
          <Button variant="primary" size="xs" fullWidth>
            Get Plan
          </Button>
        </div>
      </div>
    );
  },
  Live: function PricingCardLive() {
    return (
      <div className="oz-stack oz-stack-7">
        {/* Three-up above lg, two-up at md, stacked on a phone. The cards are
            max-w-[400px] rather than w-[400px], so the grid owns the width. */}
        <div className="grid grid-cols-1 gap-space-5 md:grid-cols-2 lg:grid-cols-3">
          <PricingCard {...STARTER} />
          <PricingCard {...BASIC} />
          <PricingCard {...PROFESSIONAL} />
        </div>
        <PricingCard {...ENTERPRISE} />
      </div>
    );
  },
});

/* -- Field ----------------------------------------------------------------- */

registry.register({
  recipe: fieldRecipe,
  /* The variant axis is the three TEXT ROLES rather than three looks of one thing, so the
     forced-state grid stays on: it shows what each of the three does when its control is
     disabled, which is the one state a reader would otherwise have to guess at. */
  Preview: function FieldPreview() {
    return (
      <div className="w-[240px]">
        <Field label="Product URL" hint="We read the brand from it.">
          {(c) => <Input {...c} placeholder="heyoz.com/…" />}
        </Field>
      </div>
    );
  },
  Live: function FieldLive() {
    return (
      <div className="oz-stack oz-stack-7 max-w-[520px]">
        {/* The render prop used directly — the shape every other form component here uses
            internally. */}
        <Field label="Product URL" hint={fieldRecipe.sampleFor('hint')} required>
          {(c) => <Input {...c} placeholder="heyoz.com/products/…" />}
        </Field>

        {/* Error AND hint together. That is the arrangement, not an oversight. */}
        <Field
          label="Product URL"
          hint={fieldRecipe.sampleFor('hint')}
          error={fieldRecipe.sampleFor('error')}
        >
          {(c) => <Input {...c} variant="invalid" defaultValue="htp://heyoz" />}
        </Field>

        <Field label="Seed" hint="Locked while a render is in flight." disabled>
          {(c) => <Input {...c} defaultValue="41827" />}
        </Field>

        <Field label="Campaign code" optional labelAside={<Badge variant="neutral">beta</Badge>}>
          {(c) => <Input {...c} placeholder="SPRING-26" />}
        </Field>
      </div>
    );
  },
});

/* -- Textarea -------------------------------------------------------------- */

registry.register({
  recipe: textareaRecipe,
  Preview: function TextareaPreview() {
    return (
      <div className="w-[240px]">
        <Textarea label="Brief" rows={2} placeholder="A 20-second hook for a matcha brand…" />
      </div>
    );
  },
  Live: function TextareaLive() {
    return (
      <div className="oz-stack oz-stack-7 max-w-[520px]">
        {textareaRecipe.variants.map((v) => (
          <Textarea
            key={v}
            variant={v}
            label={textareaRecipe.labelFor(v)}
            placeholder={textareaRecipe.placeholderFor(v)}
            error={textareaRecipe.messageFor(v) ?? undefined}
          />
        ))}
        {/* Type into this one: it grows to six lines and then scrolls itself. */}
        <Textarea
          label="Script"
          size="lg"
          rows={3}
          maxRows={6}
          limit={180}
          hint="Grows to six lines, then scrolls. The counter is a soft limit — nothing is truncated."
          defaultValue="Open on the jar, close on her face. She says the line about quitting coffee, then holds it up."
        />
        <Textarea label="Notes" disabled defaultValue="Locked while rendering." rows={2} />
      </div>
    );
  },
});

/* -- Select ---------------------------------------------------------------- */

const FORMATS: SelectItem[] = [
  {
    group: 'Vertical',
    options: [
      { value: '9-16', label: 'Vertical 9:16', description: 'TikTok, Reels, Shorts' },
      { value: '4-5', label: 'Portrait 4:5', description: 'Feed posts' },
    ],
  },
  {
    group: 'Other',
    options: [
      { value: '1-1', label: 'Square 1:1' },
      { value: '16-9', label: 'Landscape 16:9', description: 'YouTube pre-roll' },
      { value: '21-9', label: 'Cinematic 21:9', description: 'Not yet supported', disabled: true },
    ],
  },
];

registry.register({
  recipe: selectRecipe,
  /* The panel is portalled to <body> and positioned against its trigger, so no forced-state
     cell can contain it. The trigger's states are inherited from Input and shown there; the
     panel is on the Live demo, where it can actually open. */
  gridSuppressed: true,
  Preview: function SelectPreview() {
    return (
      <div className="w-[240px]">
        <Select items={FORMATS} label="Ad format" defaultValue="9-16" />
      </div>
    );
  },
  Live: function SelectLive() {
    return (
      <div className="oz-stack oz-stack-7 max-w-[440px]">
        <Select
          items={FORMATS}
          label="Ad format"
          hint="Open it and type “sq” — typeahead matches the label, and repeating a letter cycles."
          defaultValue="9-16"
        />
        <Select
          items={FORMATS}
          label={selectRecipe.labelFor('invalid')}
          placeholder={selectRecipe.placeholderFor('invalid')}
          error={selectRecipe.messageFor('invalid') ?? undefined}
        />
        <Select items={FORMATS} label="Ad format (lg)" size="lg" defaultValue="16-9" />
        <Select items={FORMATS} label="Ad format" disabled defaultValue="1-1" />
        {/* No options. The empty state is a real state — without it the panel is an empty
            box, which looks the same as one that failed to load. */}
        <Select items={[]} label="Creators" placeholder="None connected yet" />
      </div>
    );
  },
});

/* -- Listbox option -------------------------------------------------------- */

registry.register({
  recipe: listboxRecipe,
  Preview: function ListboxPreview() {
    return (
      <div className="w-[240px]">
        <ListboxPanel style={{ position: 'static' }}>
          <ListboxOption selected={false}>Square 1:1</ListboxOption>
          <ListboxOption selected>Vertical 9:16</ListboxOption>
        </ListboxPanel>
      </div>
    );
  },
  Live: function ListboxLive() {
    return (
      /* position: static overrides the panel's own fixed positioning so the rows can be read
         in place. In use, useAnchor supplies position, top, left, maxHeight and the width
         floor — this demo is the panel without its anchor. */
      <div className="max-w-[360px]">
        <ListboxPanel style={{ position: 'static' }}>
          <ListboxGroup label="Vertical" labelId="lb-demo-vertical">
            <ListboxOption selected={false} description="TikTok, Reels, Shorts">
              Vertical 9:16
            </ListboxOption>
            <ListboxOption selected description="Feed posts">
              Portrait 4:5
            </ListboxOption>
          </ListboxGroup>
          <ListboxGroup label="Other" labelId="lb-demo-other">
            <ListboxOption selected={false} forceState="hover">
              Square 1:1 — forced hover
            </ListboxOption>
            <ListboxOption selected={false} disabled description="Not yet supported">
              Cinematic 21:9
            </ListboxOption>
          </ListboxGroup>
        </ListboxPanel>
      </div>
    );
  },
});

/* -- Radio group ----------------------------------------------------------- */

const RATIOS = [
  { value: '9-16', label: 'Vertical 9:16', description: 'TikTok, Reels, Shorts' },
  { value: '1-1', label: 'Square 1:1', description: 'Feed posts and display' },
  { value: '16-9', label: 'Landscape 16:9', description: 'YouTube pre-roll' },
  { value: '21-9', label: 'Cinematic 21:9', description: 'Not yet supported', disabled: true },
];

registry.register({
  recipe: radioRecipe,
  /* The ring's hover comes from the row via `group-hover:` and its focus from a peer input.
     A cell rendering the ring on its own can reproduce neither. */
  gridSuppressed: true,
  Preview: function RadioPreview() {
    return (
      <div className="w-[240px]">
        <RadioGroup options={RATIOS.slice(0, 2)} label="Aspect ratio" defaultValue="9-16" />
      </div>
    );
  },
  Live: function RadioLive() {
    return (
      <div className="oz-stack oz-stack-9 max-w-[520px]">
        {/* Tab into it: one stop for the whole group, landing on the checked option. Then
            arrow — selection follows focus, it wraps, and it steps over the disabled row. */}
        <RadioGroup
          options={RATIOS}
          label="Aspect ratio"
          hint="One tab stop for the group. Arrows move and select, and skip the disabled row."
          defaultValue="9-16"
        />
        <RadioGroup
          options={RATIOS.slice(0, 3)}
          label="Aspect ratio"
          orientation="horizontal"
          defaultValue="1-1"
        />
        {/* Nothing preselected, which is the default — see the note in RadioGroup. */}
        <RadioGroup
          options={RATIOS.slice(0, 2)}
          label="Aspect ratio"
          required
          error="Pick a ratio before generating."
        />
        <RadioGroup
          options={RATIOS.slice(0, 2)}
          label="Aspect ratio"
          disabled
          defaultValue="9-16"
        />
      </div>
    );
  },
});

/* -- Slider ---------------------------------------------------------------- */

registry.register({
  recipe: sliderRecipe,
  /* The track is the only thing on the variant axis, and its states are a hover and a
     disabled — worth a grid. The thumb's focus ring is not forceable from the track's
     classes, so the keyboard behaviour has to be read on the Live demo. */
  Preview: function SliderPreview() {
    return (
      <div className="w-[240px]">
        <Slider label="Clip length" min={5} max={60} defaultValue={20} format={(v) => `${v}s`} />
      </div>
    );
  },
  Live: function SliderLive() {
    return (
      <div className="oz-stack oz-stack-7 max-w-[440px]">
        {/* Tab to the thumb, then try PageUp — ten steps, not one. */}
        <Slider
          label="Clip length"
          hint="Arrows step by one, PageUp and PageDown by ten, Home and End go to the ends."
          min={5}
          max={60}
          step={1}
          defaultValue={20}
          format={(v) => `${v}s`}
        />
        {/* A fractional step: the readout and aria-valuenow stay at one decimal rather than
            drifting to 0.30000000000000004. */}
        <Slider
          label="Motion intensity"
          size="lg"
          min={0}
          max={1}
          step={0.1}
          defaultValue={0.4}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <Slider label="Upscale factor" min={1} max={4} defaultValue={2} format={(v) => `${v}×`} disabled />
      </div>
    );
  },
});

/* -- Dropzone -------------------------------------------------------------- */

registry.register({
  recipe: dropzoneRecipe,
  Preview: function DropzonePreview() {
    return (
      <div className="w-[240px]">
        <Dropzone accept="image/*" title="Drop a product image" />
      </div>
    );
  },
  Live: function DropzoneLive() {
    return (
      <div className="oz-stack oz-stack-7 max-w-[520px]">
        {/* Drag a file over it: `active` is a third variant rather than a hover, so the fill
            and the border move together. Dragging across the icon inside does not make it
            flicker — the depth counter is what stops that. */}
        <Dropzone
          label="Product image"
          hint="Drag one over it, or tab to it and press Enter. We read the brand and packaging from it."
          accept="image/png,image/jpeg,image/webp"
          maxSize={5_000_000}
          required
        />
        <Dropzone
          label="Reference clips"
          hint="Up to three. A fourth is refused with a reason rather than dropped silently."
          accept="video/mp4,video/quicktime"
          multiple
          maxFiles={3}
          maxSize={50_000_000}
          size="lg"
        />
        {/* Every variant, forced, so `active` can be read without a file in hand.
            Three-up rather than stacked: six full-width dropzones put this specimen at
            1354px against the suite's 1200px ceiling, and that ceiling is a real guard —
            it is what catches a specimen that has quietly become the whole page. Widening
            the exemption for one component would have removed the guard from the other
            twenty. A grid is the honest fix. */}
        <div className="grid gap-space-4 md:grid-cols-3">
          {dropzoneRecipe.variants.map((v) => (
            <Dropzone key={v} forceVariant={v} title={`forced: ${v}`} />
          ))}
        </div>
        <Dropzone label="Brand assets" hint="Locked on the free plan." disabled />
      </div>
    );
  },
});

export { registry };
