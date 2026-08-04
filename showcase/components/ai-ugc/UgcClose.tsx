'use client';

import { useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { Band, BandHead } from './UgcChrome';
import { ArrowRightIcon, CheckIcon, ChevronDownIcon, ToolIcon } from './icons';
import { CTA_PRIMARY, FAQ_GROUPS, FINAL_CTA, PRICING, RELATED_TOOLS } from './content';

/* ---------------------------------------------------------------------------
 * Pricing comparison.
 *
 * Four of the brief's five points land here. The traditional column is now "Typical
 * in-house stack" with a visible footnote instead of an unsourced fact — the real risk
 * was never the size of the gap, it was that an unbelievable number invites the reader
 * to disbelieve the believable ones beside it. The single plan says it is the entry
 * plan rather than wearing a "Best Value" badge with nothing to be better than. The
 * monthly/annual toggle is here. And "Cancel anytime" is beside the button at body-md
 * instead of below it in grey.
 * ------------------------------------------------------------------------- */
export function Pricing() {
  const [annual, setAnnual] = useState(false);
  const price = annual ? PRICING.ozAnnual : PRICING.ozMonthly;

  return (
    <Band id="pricing" tone="surface">
      <BandHead eyebrow="Pricing" title={PRICING.sub} lede={PRICING.intro} />

      {/* The toggle. A radiogroup rather than a switch: "monthly or annual" is a choice
          between two named things, and a switch announces on/off, which does not say
          which one is which. */}
      <div
        role="radiogroup"
        aria-label="Billing period"
        /* rounded-8 with rounded-6 segments rather than a capsule. The frames have no
           pill anywhere — every control is a rounded rectangle at 12 or 16 — and a
           segmented control is the one place a stray capsule reads loudest. */
        className="mx-auto mt-space-11 flex w-fit gap-space-1 rounded-8 border-2 border-border-secondary bg-background p-space-1"
      >
        {[
          { key: false, label: 'Monthly' },
          { key: true, label: 'Annual' },
        ].map(({ key, label }) => (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={annual === key}
            onClick={() => setAnnual(key)}
            className={`rounded-6 px-space-6 py-space-3 text-label-md transition-colors duration-effects-fast ease-effects-fast focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus ${
              annual === key
                ? 'bg-fill-brand font-medium text-content-on-brand'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-space-11 grid items-start gap-space-6 lg:grid-cols-2">
        {/* Left: the stack being replaced. Quieter than the right by one surface step and
            no stroke colour of its own — it is the thing you are leaving. */}
        <div className="rounded-8 border-2 border-border-secondary bg-background p-space-8">
          <h3 className="font-display text-heading-sm font-bold text-content-primary">
            {PRICING.traditionalLabel}
          </h3>

          <p className="mt-space-7 font-mono text-label-sm uppercase text-content-tertiary">
            People
          </p>
          <ul className="mt-space-4 oz-stack oz-stack-3">
            {PRICING.staff.map((r) => (
              <li key={r.label} className="flex items-baseline justify-between gap-space-5">
                <span className="text-body-md text-content-secondary">{r.label}</span>
                <span className="shrink-0 font-mono text-body-md tabular-nums text-content-primary">
                  {r.cost}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-space-7 font-mono text-label-sm uppercase text-content-tertiary">
            Tools
          </p>
          <ul className="mt-space-4 oz-stack oz-stack-3">
            {PRICING.tools.map((r) => (
              <li key={r.label} className="flex items-baseline justify-between gap-space-5">
                <span className="text-body-md text-content-secondary">{r.label}</span>
                <span className="shrink-0 font-mono text-body-md tabular-nums text-content-primary">
                  {r.cost}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-space-8 flex items-baseline justify-between gap-space-5 border-t-2 border-border-primary pt-space-6">
            <span className="text-body-lg font-medium text-content-primary">Estimated total</span>
            <span className="font-display text-heading-md font-semibold tabular-nums text-content-primary">
              {PRICING.traditionalTotal}
              <span className="text-body-md font-normal text-content-tertiary">/mo</span>
            </span>
          </div>

          {/* The footnote, visible rather than tucked at the page foot. A sourced claim
              a reader has to hunt for is an unsourced claim. */}
          <p className="mt-space-5 text-body-sm text-content-tertiary">{PRICING.footnote}</p>
        </div>

        {/* Right: the offer. Brand stroke and tint, which is the one place on this page
            besides the CTAs where brand is load-bearing. */}
        <div className="rounded-8 border-2 border-border-brand bg-fill-brand-secondary p-space-8">
          <div className="flex items-center gap-space-4">
            <h3 className="font-display text-heading-sm font-bold text-content-primary">
              {PRICING.planName}
            </h3>
            <Badge variant="brand">Entry plan</Badge>
          </div>

          <p className="mt-space-6 flex items-baseline gap-space-3">
            <span className="font-display text-display-sm font-semibold tabular-nums text-content-primary">
              {price}
            </span>
            <span className="text-body-md text-content-secondary">/month</span>
          </p>
          {/* aria-live so switching the toggle announces the new price rather than
              silently changing a number the reader may not be looking at. */}
          <p aria-live="polite" className="mt-space-2 text-body-sm text-content-tertiary">
            {annual ? PRICING.annualNote : 'billed monthly'}
          </p>

          <p className="mt-space-6 text-body-md text-content-secondary">{PRICING.planNote}</p>

          <ul className="mt-space-7 oz-stack oz-stack-4">
            {PRICING.includes.map((f) => (
              <li key={f} className="flex gap-space-4">
                <CheckIcon className="mt-space-1 h-space-6 w-space-6 shrink-0 text-content-brand" />
                <span className="text-body-md text-content-primary">{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-space-9">
            <Button
              variant="primary"
              size="lg"
              shape="rect"
              className="w-full"
              trailingIcon={<ArrowRightIcon />}
            >
              {CTA_PRIMARY}
            </Button>
            {/* body-md on content/secondary, next to the button. It was label-sm on
                tertiary below it, which is the least visible place on the card for the
                sentence that removes the reason not to click. */}
            <p className="mt-space-4 text-center text-body-md text-content-secondary">
              {PRICING.reassurance}
            </p>
          </div>
        </div>
      </div>
    </Band>
  );
}

/* ---------------------------------------------------------------------------
 * Related tools.
 *
 * Was a row of pill links the brief calls an SEO afterthought bolted onto the page. Same
 * nine destinations, rendered as what they are: a grid of tools, each with a mark and a
 * line saying what it is for. The difference between a link farm and a directory is
 * whether the links tell you anything before you click them.
 * ------------------------------------------------------------------------- */
export function RelatedTools() {
  return (
    <Band id="related">
      <BandHead
        eyebrow="Explore"
        title="Related tools in the suite"
        lede="Same engine, different starting point."
      />
      <ul className="mt-space-12 grid gap-space-5 sm:grid-cols-2 lg:grid-cols-3">
        {RELATED_TOOLS.map((t) => (
          <li key={t.slug}>
            <a
              href="#related"
              className="group flex h-full items-start gap-space-5 rounded-6 border-2 border-border-secondary bg-surface-primary p-space-6 transition-shadow duration-effects-default ease-effects-default hover:shadow-medium focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
            >
              <span
                aria-hidden="true"
                className="grid h-space-11 w-space-11 shrink-0 place-items-center rounded-5 bg-fill-tertiary text-content-secondary transition-colors duration-effects-fast ease-effects-fast group-hover:bg-fill-brand-secondary group-hover:text-content-brand"
              >
                <ToolIcon name={t.icon} className="h-space-7 w-space-7" />
              </span>
              <span className="min-w-0">
                <span className="block text-body-md font-medium text-content-primary">
                  {t.label}
                </span>
                <span className="mt-space-1 block text-body-sm text-content-tertiary">
                  {t.blurb}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Band>
  );
}

/* ---------------------------------------------------------------------------
 * FAQ.
 *
 * Grouped by theme, first item open, and a lot more air — the three things the brief
 * asks for. Seven questions in a flat list mixed "what is this" with "will TikTok ban
 * me", and a reader who arrived for the second should not have to read the first.
 *
 * `<details>`/`<summary>` rather than a JS accordion. It is keyboard-operable, works
 * before hydration, and is announced as expandable without a single aria attribute —
 * every one of which is something a hand-rolled version has to get right and can get
 * wrong. The chevron rotates off the `open:` variant, so the glyph and the state are the
 * same fact rather than two.
 * ------------------------------------------------------------------------- */
export function Faq() {
  let index = 0;
  return (
    <Band id="faq" tone="surface">
      <BandHead
        eyebrow="FAQ"
        title="Frequently asked questions"
        lede="Everything you need to know about how HeyOz works and what it can do for you"
      />

      <div className="mx-auto mt-space-12 max-w-[76ch] oz-stack oz-stack-12">
        {FAQ_GROUPS.map((g) => (
          <div key={g.group}>
            <h3 className="font-mono text-label-sm uppercase text-content-tertiary">{g.group}</h3>
            {/* E33: horizontal rules rather than twelve bordered boxes. Seven cards in a
                column is seven frames competing with the text inside them; a divider says
                "next item" with one line. The open item gets a tinted surface instead of a
                box, so the state still reads. */}
            <div className="mt-space-5 border-t-2 border-border-tertiary">
              {g.items.map((item) => {
                const first = index++ === 0;
                return (
                  <details
                    key={item.q}
                    open={first}
                    className="group border-b-2 border-border-tertiary px-space-4 open:bg-surface-elevated"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-space-5 py-space-6 text-body-lg font-medium text-content-primary focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <ChevronDownIcon className="h-space-6 w-space-6 shrink-0 text-content-tertiary transition-transform duration-effects-default ease-effects-default group-open:rotate-180" />
                    </summary>
                    <p className="pb-space-6 pr-space-11 text-body-md text-content-secondary">
                      {item.a}
                    </p>
                  </details>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Band>
  );
}

/* ---------------------------------------------------------------------------
 * Closing CTA.
 *
 * The brief's point was that this line is strong but visually identical to the hero, so
 * the page ends where it began. It sits on the inverse block now — the secondary accent
 * the brief asks for, and the same colour the footer beneath it uses, so the last two
 * blocks read as one ending rather than as two more sections. It also carries an
 * incentive the hero does not, which is the other half of the ask.
 * ------------------------------------------------------------------------- */
export function FinalCta() {
  return (
    <section
      id="get-started"
      className="relative isolate overflow-hidden bg-fill-inverse py-space-17"
    >
      {/* The hero's gesture, once more and quieter. Same token and the same two-coat
          construction, centred just below the block rather than 882px down a page.
          It is what makes the page close on the note it opened with instead of ending on a
          flat panel.

          IT SITS ON `fill/inverse`, WHICH FLIPS POLARITY BETWEEN MODES — #070605 in light
          and #F7F5F4 in dark — so this coat is a deep burnt orange on one and a pale coral
          on the other, with the text roles inverting alongside it. That is two grounds, not
          one, and it is exactly the "gate one member of a family" trap in rule 4. Both are
          swept by scripts/verify-glow.ts; the tighter of the two measures 7.74:1. If this
          gradient is retuned, retune the copy of it in that file too — the check reads its
          own model of these stacks and cannot see an edit made only here. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: [
            'radial-gradient(112.5% 80% at 50% 118%, var(--oz-color-gradient-halo) 0%, transparent 100%)',
            'radial-gradient(112.5% 80% at 50% 118%, var(--oz-color-gradient-halo) 0%, transparent 100%)',
          ].join(', '),
        }}
      />
      <div className="mx-auto max-w-container-xl px-space-6 text-center">
        <h2 className="mx-auto max-w-[28ch] font-display text-display-sm font-semibold text-content-on-inverse">
          {FINAL_CTA.heading}
        </h2>
        <p className="mx-auto mt-space-6 max-w-[52ch] text-body-lg text-content-inverse-secondary">
          {FINAL_CTA.sub}
        </p>
        <div className="mt-space-9 flex justify-center">
          {/* `inverse` rather than `primary`: on the dark block the brand fill and the
              surface are both saturated, and the inverse button is the pairing the recipe
              gates for a control sitting on fill/inverse. */}
          <Button variant="inverse" size="lg" shape="rect" trailingIcon={<ArrowRightIcon />}>
            {CTA_PRIMARY}
          </Button>
        </div>
        <p className="mt-space-5 text-body-md text-content-inverse-secondary">
          {FINAL_CTA.incentive}
        </p>
      </div>
    </section>
  );
}
