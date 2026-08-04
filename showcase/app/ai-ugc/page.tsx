import type { Metadata } from 'next';
import { AiUgc } from '@/components/ai-ugc/AiUgc';

export const metadata: Metadata = {
  title: 'AI UGC ads · HeyOz design system',
  description:
    'The HeyOz UGC feature page, built entirely from the design system. One implementation, both modes, no hand-typed colour.',
};

/* The fourth route. `/` is the reference, `/verify` is the audit, `/studio` is the
 * product, and this is the marketing page — the case the others cannot make.
 *
 * A feature page is where a token set gets tested differently from an app screen: it is
 * long, it alternates surfaces for rhythm rather than for hierarchy, it puts type at
 * display sizes next to body copy at a reading measure, and it has to hold a saturated
 * accent across nine sections without the accent becoming the page. /studio proved the
 * tokens survive a product surface; this one asks whether they survive being marketing.
 *
 * One client boundary, drawn in AiUgc.tsx — the sticky header, the carousel, the billing
 * toggle and the mode switcher are all interactive, so splitting finer buys nothing. */
export default function AiUgcPage() {
  return <AiUgc />;
}
