import type { Metadata } from 'next';
import { Studio } from '@/components/studio/Studio';

export const metadata: Metadata = {
  title: 'Content Studio · HeyOz design system',
  description:
    'The HeyOz Content Studio screen, built entirely from the design system. One implementation, both modes, no hand-typed colour.',
};

/* The third route. `/` is the reference and `/verify` is the audit; this is the
 * product.
 *
 * It exists because the Assembled section on `/` can only argue so much from inside a
 * Stage: it is a dashboard in a bordered box, on a page whose own chrome is competing
 * with it. A full-bleed route with a saturated gradient hero is the case that actually
 * tests whether the accent still reads as "act here" — there are eleven brand-adjacent
 * surfaces on this screen and exactly one brand-filled button in the rail.
 *
 * One client boundary, drawn in Studio.tsx, for the reason app/page.tsx gives: the
 * whole tree below it is interactive. */
export default function StudioPage() {
  return <Studio />;
}
