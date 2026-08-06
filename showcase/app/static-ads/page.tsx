import type { Metadata } from 'next';
import { StaticAds } from '@/components/static-ads/StaticAds';

export const metadata: Metadata = {
  title: 'Static ads · HeyOz design system',
  description:
    'The HeyOz static-advertising Content Studio screen, built entirely from the design system. One implementation, both modes, no hand-typed colour.',
};

/* The fourth route, and it took /ai-ugc's slot rather than its content.
 *
 * `/` is the reference, `/verify` is the audit, `/studio` is the product at rest, and this
 * is the product being used: one screen whose whole argument is a single dense control. A
 * composer is a different test from a dashboard — /studio asks whether the tokens can lay
 * out a screen, and this asks whether they can separate nine nested controls from each
 * other and from the card they sit in, on a saturated gradient ground.
 *
 * One client boundary, drawn in StaticAds.tsx: the sidebar, all five composer pickers, the
 * stepper, the attachment tiles and the mode switcher are interactive, so splitting finer
 * buys nothing. */
export default function StaticAdsPage() {
  return <StaticAds />;
}
