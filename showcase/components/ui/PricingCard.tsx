import {
  pricingCardRecipe,
  TIER_PAINT,
  type PricingCardSize,
  type PricingTier,
} from '@/lib/recipes';
import { cx } from '@/lib/core/cx';
import { Badge } from './Badge';
import { Button } from './Button';
import { ButtonLink } from './ButtonLink';

/* ---------------------------------------------------------------------------
 * Icons. Inline and 1em-sized so they scale with the text step they sit in, and
 * currentColor so they never name a token — the surrounding text already did.
 * ------------------------------------------------------------------------- */

const Sparkle = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-5 shrink-0" aria-hidden="true">
    <path d="M12 2l1.9 5.7L19.6 9.6 13.9 11.5 12 17.2 10.1 11.5 4.4 9.6 10.1 7.7z" />
    <path d="M18.5 15.5l.85 2.55L21.9 18.9l-2.55.85L18.5 22.3l-.85-2.55L15.1 18.9l2.55-.85z" />
  </svg>
);

const Info = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="size-[1em] shrink-0"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 11v6M12 7.5v.5" strokeLinecap="round" />
  </svg>
);

const Chevron = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    /* Rotates when the parent <details> opens. `group-open` is Tailwind's variant for
       exactly this, so the state lives on the element the browser already toggles
       rather than in React. */
    className="size-4 shrink-0 transition-transform duration-effects-fast ease-effects-fast group-open:rotate-180"
    aria-hidden="true"
  >
    <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Check = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    className="size-[1em] shrink-0 text-content-brand"
    aria-hidden="true"
  >
    <path d="M4.5 12.5l5 5 10-11" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ---------------------------------------------------------------------------
 * Data shapes
 * ------------------------------------------------------------------------- */

export type CreditRow = { label: string; count: string };
export type PricingInfoRow = { icon?: React.ReactNode; label: string; value: string };
export type PricingFeatureGroup = { title: string; items: string[] };

export type PricingCardProps = {
  tier: PricingTier;
  size?: PricingCardSize;
  title: string;
  /** The tier claim: BEST VALUE, MOST POWERFUL, FULLY MANAGED. */
  badgeLabel?: string;
  subtitle: string;
  /** The headline allowance, e.g. "250 credits/mo". */
  allowance: string;
  /** Relative claim beside it, e.g. "2.5x Starter". */
  multiplier?: string;
  /** The plain-language equivalents under the allowance. A trailing "?" on a line
   *  renders the info glyph — it marks the figure as an estimate. */
  equivalents?: string[];
  breakdownLabel?: string;
  breakdown?: CreditRow[];
  /** The pre-discount figure. Rendered struck through, with a screen-reader "was". */
  priceWas?: string;
  priceNow: string;
  priceNote?: string;
  ctaLabel: string;
  ctaNote?: string;
  features?: string[];
  infoRows?: PricingInfoRow[];
  /** wide size only: the feature matrix in the right-hand column. */
  featureGroups?: PricingFeatureGroup[];
  closing?: string;
  footnote?: string;
  detailsHref?: string;
  className?: string;
};

/* ---------------------------------------------------------------------------
 * Sub-blocks
 * ------------------------------------------------------------------------- */

/** The allowance panel: headline, equivalents, and the optional breakdown. */
function CreditPanel({
  allowance,
  multiplier,
  equivalents,
  breakdownLabel,
  breakdown,
  tier,
}: Pick<
  PricingCardProps,
  'allowance' | 'multiplier' | 'equivalents' | 'breakdownLabel' | 'breakdown'
> & { tier: PricingTier }) {
  return (
    <div className={pricingCardRecipe.creditPanelClasses()}>
      <div className="oz-cluster oz-cluster-3">
        <span className="text-content-brand">
          <Sparkle />
        </span>
        {/* Natural width, NOT flex-1 min-w-0.

            With flex-1 the allowance shrank to whatever was left after the multiplier
            badge and wrapped mid-phrase — "250 credits/mo" broke across two lines
            while 70px of the panel sat empty beside it. The row is an oz-cluster and
            therefore already wraps, so the correct behaviour when the pair does not
            fit is the badge dropping to its own line with the allowance intact: the
            allowance is the number the card is selling and it reads as one phrase. */}
        <p className="text-body-lg font-medium text-content-primary">{allowance}</p>
        {/* brand on every tier. The multiplier is a comparison against Starter, which
            is the same claim whichever plan is making it — colouring it per tier would
            imply the claim differs. */}
        {multiplier && <Badge variant="brand">{multiplier}</Badge>}
      </div>

      {equivalents && equivalents.length > 0 && (
        <ul className="oz-stack oz-stack-1 pl-space-6">
          {equivalents.map((line) => {
            const estimate = line.endsWith('?');
            return (
              <li
                key={line}
                className="flex items-center gap-space-2 text-body-sm text-content-secondary"
              >
                {estimate ? line.slice(0, -1).trim() : line}
                {estimate && (
                  <span className="text-content-tertiary" title="Approximate — varies by length">
                    <Info />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {breakdown && breakdown.length > 0 && (
        /* Native <details>. Keyboard-operable, announced as a disclosure, open before
           hydration, and open when printed — see the recipe note. */
        <details className="group mt-space-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-space-3 rounded-2 text-body-sm text-content-tertiary marker:content-none focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus">
            <span className="min-w-0 truncate">{breakdownLabel}</span>
            <Chevron />
          </summary>
          <ul className="mt-space-3 oz-stack oz-stack-2">
            {breakdown.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-space-3">
                <span className="min-w-0 flex-1 truncate text-body-xs text-content-tertiary">
                  {row.label}
                </span>
                <Badge variant="neutral-strong">{row.count}</Badge>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/** was / now. The visually-hidden words are the whole point — see the recipe note. */
function Price({ was, now, note }: { was?: string; now: string; note?: string }) {
  return (
    <div className="oz-stack oz-stack-1">
      <p className="flex flex-wrap items-baseline gap-space-3">
        {was && (
          <s className="text-heading-lg font-medium text-content-tertiary">
            <span className="sr-only">Was </span>
            {was}
          </s>
        )}
        <span className="text-heading-lg font-semibold text-content-primary">
          {was && <span className="sr-only">Now </span>}
          {now}
        </span>
      </p>
      {note && <p className="text-body-xs text-content-tertiary">{note}</p>}
    </div>
  );
}

/** The wrapped chip row. Centred, because it is a summary rather than a list to
 *  read down — and centring is what keeps a ragged final row from looking broken. */
function FeatureChips({ features }: { features: string[] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-space-2">
      {features.map((f) => (
        <li
          key={f}
          className="flex items-center gap-space-2 rounded-full bg-fill-brand-secondary px-space-4 py-space-1 text-body-xs text-content-secondary"
        >
          <Check />
          {f}
        </li>
      ))}
    </ul>
  );
}

/** icon + label + value. A row, not a table: there are two of them. */
function InfoRows({ rows }: { rows: PricingInfoRow[] }) {
  return (
    <ul className="oz-stack oz-stack-2">
      {rows.map((r) => (
        <li
          key={r.label}
          className="flex items-center justify-between gap-space-3 rounded-6 bg-surface-primary-variant px-space-4 py-space-3"
        >
          <span className="flex min-w-0 items-center gap-space-3 text-body-sm text-content-secondary">
            {r.icon && <span className="shrink-0 text-content-tertiary">{r.icon}</span>}
            <span className="truncate">{r.label}</span>
          </span>
          <Badge variant="neutral-strong">{r.value}</Badge>
        </li>
      ))}
    </ul>
  );
}

/** The wide card's feature matrix. Two columns from sm up, one below. */
function FeatureGroups({ groups }: { groups: PricingFeatureGroup[] }) {
  return (
    <div className="grid grid-cols-1 gap-space-7 sm:grid-cols-2">
      {groups.map((g) => (
        <section key={g.title} className="flex min-w-0 flex-col gap-space-3">
          <h4 className="text-body-md font-medium text-content-primary">{g.title}</h4>
          <ul className="oz-stack oz-stack-3">
            {g.items.map((item) => (
              <li
                key={item}
                className="flex items-start gap-space-3 text-body-sm text-content-secondary"
              >
                {/* mt aligns the tick with the first line's cap height rather than
                    centring it against a wrapped two-line item. */}
                <span className="mt-[3px]">
                  <Check />
                </span>
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * PricingCard
 * ------------------------------------------------------------------------- */

/**
 * One plan. Appearance is PricingCardRecipe's; this file is the composition.
 *
 * `panel` stacks everything in one 400px column. `wide` splits at lg into the same
 * offer on the left and the feature matrix on the right — below lg it degrades to
 * the panel arrangement rather than to a squeezed two-column grid, because two
 * columns of checklist at 400px wide is four words per line.
 */
export function PricingCard({
  tier,
  size = 'panel',
  title,
  badgeLabel,
  subtitle,
  allowance,
  multiplier,
  equivalents,
  breakdownLabel,
  breakdown,
  priceWas,
  priceNow,
  priceNote,
  ctaLabel,
  ctaNote,
  features,
  infoRows,
  featureGroups,
  closing,
  footnote,
  detailsHref,
  className,
}: PricingCardProps) {
  const badge = badgeLabel ? pricingCardRecipe.badgeVariant(tier) : null;
  const paint = TIER_PAINT[tier];

  const offer = (
    <div className="flex min-w-0 flex-col gap-space-5">
      <header className="oz-stack oz-stack-2">
        <div className="oz-cluster oz-cluster-3">
          <h3 className="text-heading-lg font-semibold text-content-primary">{title}</h3>
          {badge && badgeLabel && <Badge variant={badge}>{badgeLabel}</Badge>}
        </div>
        <p className="text-body-sm text-content-tertiary">{subtitle}</p>
      </header>

      <CreditPanel
        tier={tier}
        allowance={allowance}
        multiplier={multiplier}
        equivalents={equivalents}
        breakdownLabel={breakdownLabel}
        breakdown={breakdown}
      />

      <Price was={priceWas} now={priceNow} note={priceNote} />

      <div className="oz-stack oz-stack-3">
        {/* The CTA keeps its real variant — focus ring, disabled pair, press spring,
            gated label — and Professional overrides one declaration. `!bg-[…]` wins
            over the recipe's own bg regardless of stylesheet order, and the hover
            colour rides the same CSS variable so there is one place to change it. */}
        <Button
          variant={pricingCardRecipe.ctaVariant(tier)}
          size="lg"
          fullWidth
          style={
            paint.cta
              ? ({
                  '--tier-cta': paint.cta,
                  '--tier-cta-hover': paint.ctaHover ?? paint.cta,
                } as React.CSSProperties)
              : undefined
          }
          className={paint.cta ? '!bg-[var(--tier-cta)] hover:!bg-[var(--tier-cta-hover)]' : undefined}
        >
          {ctaLabel}
        </Button>
        {ctaNote && <p className="text-center text-label-xs text-content-tertiary">{ctaNote}</p>}
      </div>

      {features && features.length > 0 && <FeatureChips features={features} />}
    </div>
  );

  /* The tail: info rows, closing line, details link. In `panel` it follows the offer
   * in the same column; in `wide` the info rows move to the right-hand column and
   * only the prose stays here. */
  const tail = (
    <div className="flex min-w-0 flex-col gap-space-5">
      {size === 'panel' && infoRows && infoRows.length > 0 && <InfoRows rows={infoRows} />}
      {closing && (
        <p className="text-center text-body-sm font-medium text-content-primary">{closing}</p>
      )}
      {footnote && <p className="text-body-xs text-content-tertiary">{footnote}</p>}
      {detailsHref && (
        <ButtonLink variant="neutral" href={detailsHref}>
          See full details
        </ButtonLink>
      )}
    </div>
  );

  return (
    <article className={pricingCardRecipe.classes({ variant: tier, size, className })}>
      {/* The marketing wash. aria-hidden, pointer-events-none, and BEHIND the content
          — the copy sits on the card's real gated surface and only sees this through a
          10% gradient, so no text pairing depends on an ungated colour. This is the
          only place in the library a raw colour value is applied, and it is confined
          to a decorative layer for exactly that reason. See TIER_PAINT. */}
      {paint.wash !== 'transparent' && (
        <div
          aria-hidden="true"
          /* -z-10 inside the card's own stacking context (`isolate` on the recipe's
             shape). Without both, an absolutely-positioned first child paints ABOVE
             the in-flow content that follows it, and the wash would sit over the copy.
             `isolate` keeps the negative z-index from escaping the card. */
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: paint.wash }}
        />
      )}
      {size === 'wide' ? (
        <div className="grid grid-cols-1 gap-space-7 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-space-5">
            {offer}
            {tail}
          </div>
          <div className="flex min-w-0 flex-col gap-space-7">
            {infoRows && infoRows.length > 0 && <InfoRows rows={infoRows} />}
            {featureGroups && featureGroups.length > 0 && (
              <FeatureGroups groups={featureGroups} />
            )}
          </div>
        </div>
      ) : (
        <>
          {offer}
          {tail}
        </>
      )}
    </article>
  );
}
