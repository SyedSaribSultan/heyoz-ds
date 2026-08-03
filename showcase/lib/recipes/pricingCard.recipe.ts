import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';
import type { ButtonVariant } from './button.recipe';
import type { BadgeVariant } from './badge.recipe';

/**
 * MARKETING PAINT — the only hardcoded colour in this library, and it is quarantined
 * here on purpose.
 *
 * Two of the four plans are identified by a colour this design system does not have:
 * an indigo for Professional and a teal for Enterprise. They are not tokens and must
 * not become tokens. A token is a promise that a value means something everywhere it
 * appears, and these mean one thing in one place — they are art direction for a
 * pricing page, in the same category as a hero photograph.
 *
 * What that buys, and what it costs:
 *
 *   - The recipe's `bindings` below stay TRUE. Every tier binds a real surface token,
 *     so the generated binding table is not lying about what the card is made of.
 *   - These values are applied as a DECORATIVE WASH on an aria-hidden layer above that
 *     surface and below the content. Nothing reads text off them: the copy sits on the
 *     card's real, gated surface, and the wash is a low-alpha gradient over it.
 *   - Because no text pairs with them, no contrast gate applies, which is exactly why
 *     it is safe for them to be ungated. A hardcoded colour under text would not be.
 *
 * If either tier ever needs a colour that text sits on, that is the moment to author a
 * proper OKLCH ramp in build/palette.mjs — not the moment to add another entry here.
 */
export const TIER_PAINT: Record<PricingTier, { wash: string; cta?: string; ctaHover?: string }> = {
  starter: { wash: 'transparent' },
  basic: { wash: 'transparent' },
  professional: {
    wash: 'linear-gradient(160deg, rgb(79 53 232 / 0.10) 0%, rgb(79 53 232 / 0) 55%)',
    cta: 'rgb(79 53 232)',
    ctaHover: 'rgb(68 41 212)',
  },
  enterprise: {
    wash: 'linear-gradient(160deg, rgb(0 138 138 / 0.10) 0%, rgb(0 138 138 / 0) 55%)',
  },
};

/** The four plans. A tier, not a status — see the note on fill/tier-pro. */
export type PricingTier = 'starter' | 'basic' | 'professional' | 'enterprise';

/** `panel` is the 400px column; `wide` is the two-column Enterprise layout. Figma
 *  models these as Type=Basic/Standard/Professional plus a separate Type4 at
 *  1240x548, which is a layout difference rather than a colour one — so it is the
 *  size axis here, not a fifth variant. */
export type PricingCardSize = 'panel' | 'wide';

class PricingCardRecipe extends ComponentRecipe<PricingTier, PricingCardSize> {
  readonly meta: RecipeMeta = {
    id: 'pricing-card',
    title: 'Pricing Card',
    tag: 'PricingCard',
    blurb:
      'One plan, priced, with everything it includes. The only composition in this library rather than a primitive — it is assembled from Button, Badge and ButtonLink rather than binding its own controls.',
    notes: [
      'Four tiers. Starter and Basic are entirely token-driven — neutral and brand. Professional and Enterprise carry an indigo and a teal this system does not own, and those are HARDCODED in TIER_PAINT rather than promoted to tokens: they are art direction for one page, not values with a meaning elsewhere. They are applied as a decorative wash on an aria-hidden layer, so no text ever pairs with them and no gate is bypassed.',
      'Enterprise is teal-washed but commits in black on purpose — its action is "Book a call", a conversation rather than a purchase, and colouring it as a fifth accent would imply a fifth product.',
      'Two sizes are two layouts, not two scales. `panel` is the 400px column that stacks three-up; `wide` is the 1240px Enterprise card whose right half is a feature matrix. They share every token and differ only in how the content is arranged, which is why they are one recipe.',
      'The washes are low-alpha gradients, so they composite with the card surface rather than replacing it. That is what makes three cards side by side read as one surface with three regions instead of three floating panels, and it is also what keeps them safe: at 10% over a gated surface the text contrast is still the surface\'s, which is measured.',
      'No border on any tier, and the vertical rule between the wide card\'s two halves is space rather than a stroke. Both would be separation, which CLAUDE.md rule 1c makes a build error; the Figma file draws both and verify-borders.ts would reject either.',
      'The credit breakdown is a native <details>, not a JS accordion. It is keyboard-operable, announced correctly, works before hydration, and prints open — four properties a div with an onClick has to re-implement and usually gets three of.',
      'Prices are marked up as <s> for the old figure and a plain span for the new one, with a visually-hidden "was"/"now" pair. A struck-through price styled with line-through alone is read aloud as an ordinary number, so a screen-reader user hears two prices and no indication which one they pay.',
    ],
  };

  readonly variants = ['starter', 'basic', 'professional', 'enterprise'] as const;
  readonly sizes = ['panel', 'wide'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-default',
    properties: 'colors',
    /* Rises. A pricing grid is nearly always the first thing on its own route, so the
     * cards are arriving rather than already present — the opposite of a button. */
    enter: 'rise',
    intent:
      'The card itself only transitions colour, on the default effects spring, because the only thing that changes on it is the tint under a mode switch. It deliberately does not lift on hover the way Card.interactive does: the whole card is not a target here, the CTA inside it is, and a card that lifts under the pointer while the button inside it also reacts gives two responses to one gesture and makes the smaller, real target feel less clickable.',
  };

  /* w-full, not a fixed 400. The Figma frame is 400px wide and that is the widest it
   * should be, not the only width it can be — three fixed 400px cards in a 1200px
   * container leave no gutter, and one on a 375px phone overflows by 25px. The grid
   * that lays these out owns the width; the card owns its own max. */
  /* `isolate` is load-bearing: the decorative tier wash is an absolutely-positioned
   * first child at -z-10, and without a stacking context here that negative index
   * would escape the card and slide behind the page background instead of behind the
   * card's own copy. See the wash layer in PricingCard.tsx. */
  protected readonly shape = 'relative isolate flex w-full flex-col overflow-hidden rounded-10';

  protected readonly sizeClasses: Record<PricingCardSize, string> = {
    panel: 'max-w-[400px] p-space-7 gap-space-5',
    /* The wide card is not padded more, it is padded the same and given a second
     * column. `max-w-[1240px]` is the Figma width. */
    wide: 'max-w-[1240px] p-space-7 gap-space-7',
  };

  protected readonly bindings: Record<PricingTier, VariantBinding> = {
    starter: {
      intent: 'The entry plan. Neutral ground, neutral CTA — it makes no claim.',
      base: { bg: 'surface-primary', fg: 'content-primary' },
      focus: 'none',
    },
    basic: {
      intent: 'The recommended plan. Brand ground and brand CTA, badged BEST VALUE.',
      base: { bg: 'surface-brand-flat', fg: 'content-primary' },
      focus: 'none',
    },
    professional: {
      intent:
        'The high-volume plan, badged MOST POWERFUL. Binds the neutral surface; its indigo is a decorative wash above it — see TIER_PAINT.',
      base: { bg: 'surface-primary', fg: 'content-primary' },
      focus: 'none',
    },
    enterprise: {
      intent:
        'Done-for-you, neutral CTA — the action is a call, not a purchase. Teal wash over the same neutral surface.',
      base: { bg: 'surface-primary', fg: 'content-primary' },
      focus: 'none',
    },
  };

  /** Which Button variant commits, per tier.
   *
   *  Professional resolves to `inverse` and then has its background repainted from
   *  TIER_PAINT. It keeps every one of the variant's real properties — focus ring,
   *  disabled pair, press spring, gated white label — and overrides one declaration.
   *  A bespoke purple button variant would have had to re-earn all of them. */
  ctaVariant(tier: PricingTier): ButtonVariant {
    const map: Record<PricingTier, ButtonVariant> = {
      starter: 'inverse',
      basic: 'primary',
      professional: 'inverse',
      enterprise: 'inverse',
    };
    return map[tier];
  }

  /** Which Badge variant marks the tier, or null where the tier makes no claim.
   *
   *  Professional uses `neutral` — a black pill, not an indigo one. The wash already
   *  identifies the card, and repainting the badge too would need white text on an
   *  ungated hardcoded fill, which is the one thing TIER_PAINT must not be used for. */
  badgeVariant(tier: PricingTier): BadgeVariant | null {
    const map: Record<PricingTier, BadgeVariant | null> = {
      starter: null,
      basic: 'brand',
      professional: 'neutral',
      enterprise: 'neutral',
    };
    return map[tier];
  }

  /** The inner panel that holds the credit allowance. A surface step down from the
   *  tinted card, which is how it separates — no stroke. */
  creditPanelClasses(): string {
    return 'oz-stack oz-stack-3 rounded-8 bg-surface-primary-variant p-space-5';
  }

  protected sampleChildren(): string {
    return '';
  }
}

export const pricingCardRecipe = new PricingCardRecipe();
