/**
 * The written guidance, one entry per component.
 *
 * Generated content, hand-reviewed. Three passes: a first draft against a house
 * style synthesised from how Material, Apple HIG, Polaris, Carbon, Primer, Wise,
 * Atlassian and Spectrum write theirs; an adversarial critique that recomputed
 * every cited figure against `dist/tokens.css` using the repo's own `contrast()`
 * and `composite()`; and a repair pass against the findings.
 *
 * The reviewer's standing objections, which are the reasons this file looks the way
 * it does:
 *
 *   - A rule whose reverse also sounds reasonable is not a rule. Every entry has to
 *     survive being inverted.
 *   - No global policy is re-argued here. B16 (reduced motion) and B17 (container
 *     queries) are cited in a clause and never restated — an earlier draft carried
 *     eighteen copies of those two arguments across nine pages, which is exactly the
 *     drift surface this repo exists to eliminate.
 *   - Every number traces to `reports/audit.json` or the emitted CSS. A draft
 *     fabricated a "12px box interior" that is really 14px, and another repeated a
 *     4.49:1 ratio that stopped being true two ladder revisions earlier. Both were
 *     caught by recomputation, not by reading.
 *   - `related` gives a discriminator; `reachForSomethingElseWhen` gives a gate.
 *     They are not the same section with different headings.
 */

import type { ComponentContent } from './types';

import button from './pages/button.json';
import badge from './pages/badge.json';
import input from './pages/input.json';
import card from './pages/card.json';
import alert from './pages/alert.json';
import table from './pages/table.json';
import skeleton from './pages/skeleton.json';
import switchContent from './pages/switch.json';
import checkbox from './pages/checkbox.json';

const pages = [
  button,
  badge,
  input,
  card,
  alert,
  table,
  skeleton,
  switchContent,
  checkbox,
] as unknown as ComponentContent[];

/** Keyed by `recipe.meta.id`. A component with no entry renders its specimen and
 *  its generated blocks and no guidance — which is a visible gap on the page rather
 *  than a silent one, and is the intended behaviour while a page is being written. */
export const content: Record<string, ComponentContent> = Object.fromEntries(
  pages.map((p) => [p.id, p]),
);

export const contentCoverage = {
  written: pages.length,
  ids: pages.map((p) => p.id),
};
