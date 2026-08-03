/* The four plans, as the Figma pricing board states them.
 *
 * Real copy, not lorem, and it is here rather than inline in the catalog because
 * PricingCard is the one component whose interesting failure modes are all about
 * content: "Professional grade video · 15 credits" is the row that overflows, "For
 * people who would rather we made the ads for them" is the subtitle that wraps to
 * three lines on a phone, and "$100" struck through beside "$70" is the price pair
 * that has to stay on one baseline. Equal-length placeholder copy hides every one of
 * them.
 *
 * A trailing "?" on an equivalents line renders the estimate glyph — see
 * PricingCard's CreditPanel.
 */

import type { PricingCardProps } from '@/components/ui';

/** Shared across all four plans on the board. */
const FEATURES = [
  'AI Avatar & custom actors',
  'UGC hook videos',
  'Image & Video Generation',
  'All formats',
  'Up to 60s',
];

/** The credit ladder. Identical labels on every plan; only the counts change. */
const breakdown = (n: number) => [
  { label: 'Standard image · 1 credit', count: `${n}x` },
  { label: 'Professional image · 2 credits', count: `${Math.floor(n / 2)}x` },
  { label: 'Lite video · 5 credits', count: `${Math.floor(n / 5)}x` },
  { label: 'Video with sound · 8 credits', count: `${Math.floor(n / 8)}x` },
  { label: 'Standard video · 10 credits', count: `${Math.floor(n / 10)}x` },
  { label: 'Professional grade video · 15 credits', count: `${Math.floor(n / 15)}x` },
];

export const STARTER: PricingCardProps = {
  tier: 'starter',
  title: 'Starter',
  subtitle: 'One brand, a few new ads a week',
  allowance: '100 credits/mo',
  equivalents: ['= 100 static ads', '~ 10 video ads?'],
  breakdownLabel: 'What 100 credits makes',
  breakdown: breakdown(100),
  priceWas: '$20',
  priceNow: '$14',
  priceNote: 'first month, then $20/month',
  ctaLabel: 'Get Plan',
  ctaNote: 'Instant access • Cancel anytime',
  features: FEATURES,
  infoRows: [
    { label: 'Connected Social Accounts', value: '1 per platform' },
    { label: 'Support', value: 'Standard' },
  ],
  closing: 'Get started, see what HeyOz can do.',
  detailsHref: '#starter',
};

export const BASIC: PricingCardProps = {
  tier: 'basic',
  title: 'Basic',
  badgeLabel: 'BEST VALUE',
  subtitle: 'One brand, ads running all month',
  allowance: '250 credits/mo',
  multiplier: '2.5x Starter',
  equivalents: ['= 250 static ads', '~ 25 video ads?'],
  breakdownLabel: 'What 250 credits makes',
  breakdown: breakdown(250),
  priceWas: '$45',
  priceNow: '$31.5',
  priceNote: 'first month, then $45/month',
  ctaLabel: 'Get Plan',
  ctaNote: 'Instant access • Cancel anytime',
  features: FEATURES,
  infoRows: [
    { label: 'Connected Social Accounts', value: '1 per platform' },
    { label: 'Support', value: 'Standard' },
  ],
  closing:
    'We read your brand, write the script and pick the hook. Enough to put out something new every day.',
  detailsHref: '#basic',
};

export const PROFESSIONAL: PricingCardProps = {
  tier: 'professional',
  title: 'Professional',
  badgeLabel: 'MOST POWERFUL',
  subtitle: 'Several brands or clients at once',
  allowance: '550 credits/mo',
  multiplier: '5.5x Starter',
  equivalents: ['= 550 static ads', '~ 55 video ads?'],
  breakdownLabel: 'What 550 credits makes',
  breakdown: breakdown(550),
  priceWas: '$100',
  priceNow: '$70',
  priceNote: 'first month, then $100/month',
  ctaLabel: 'Get Plan',
  ctaNote: 'Instant access • Cancel anytime',
  features: FEATURES,
  infoRows: [
    { label: 'Connected Social Accounts', value: 'Unlimited' },
    { label: 'Support', value: 'Priority' },
  ],
  closing: 'Built for teams shipping ads across multiple brands and accounts, every day.',
  detailsHref: '#professional',
};

export const ENTERPRISE: PricingCardProps = {
  tier: 'enterprise',
  size: 'wide',
  title: 'Enterprise',
  badgeLabel: 'FULLY MANAGED',
  subtitle: 'For people who would rather we made the ads for them',
  allowance: '7 finished ads a week',
  equivalents: ['= 2 video ads a week', '~ 5 picture ads a week'],
  priceNow: '$599+',
  priceNote: 'per month',
  ctaLabel: 'Book a call',
  ctaNote: 'A 30 minute call, no commitment',
  features: ['First ad in 10 minutes', 'No watermark', 'Yours to run in ads', 'All formats', 'Up to 60s'],
  infoRows: [
    { label: 'Connected Social Accounts', value: 'Unlimited' },
    { label: 'Support', value: 'Dedicated' },
  ],
  featureGroups: [
    {
      title: 'The team',
      items: [
        'A dedicated creative strategist on your brand',
        'A copywriter working to your voice',
        'A video editor who puts every video together',
      ],
    },
    {
      title: 'The output',
      items: [
        'Two videos and five image ads every week, always on time',
        'Everything matches your brand — same colours, same voice, same faces',
        'We choose the model for each ad, so you never have to',
      ],
    },
    {
      title: 'The account',
      items: [
        'One person you can always contact',
        'Connect as many accounts as you need on every platform',
        'Got more than one brand? We charge per brand and plan it with you',
      ],
    },
    {
      title: 'Add-ons',
      items: [
        'We can run your ads for you too',
        'Running your Facebook and Instagram ads',
        'Help getting found on Google and in AI answers',
      ],
    },
  ],
  closing: 'We read your brand, write the script and pick the hook',
  footnote:
    'Enough to try one new idea a week. The best models are there for the ads that really matter.',
};
