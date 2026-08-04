'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  allPrimitives,
  FAMILY_ORDER,
  primitiveSummary,
  primitiveTiers,
  type PrimitiveStep,
} from '@/lib/core/primitives';
import { Notes, Section, SubHead } from '@/components/showcase/Section';
import { PrimitiveRamp } from '@/components/showcase/PrimitiveRamp';
import { Button, Input } from '@/components/ui';

/* ---------------------------------------------------------------------------
 * Tier 1, complete: all 655 primitives.
 *
 * This sits above the semantic Colour section because it is what that section is
 * built from — every semantic token names a path in here, and the build fails on any
 * colour-valued semantic token that names no primitive.
 *
 * Primitives are mode-independent, which is the one place this section departs from
 * the rest of the page: there is a single palette, and light and dark differ only in
 * which step each role points at. The mode toggle deliberately does nothing to the
 * swatches below. It does change the *consumer* lists, because that is exactly what
 * differs between the modes.
 * ------------------------------------------------------------------------- */

/* ---------------------------------------------------------------------------
 * The three things this section holds, as URL parameters.
 *
 * All three were local state, which meant the one thing a reference page is for —
 * "look at this" — could not be sent to anybody. "Filter for brand" was a sentence you
 * typed to a colleague along with instructions; the selected swatch was worse, because
 * the reader on the other end had to find one cell out of 655.
 *
 *   q     the filter string
 *   ref   the referenced-only toggle, and only ever the literal '1'
 *   p     the selected primitive's path, e.g. solid/brand/60
 *
 * `ref` rather than `used` because "referenced" is the word this page uses everywhere
 * the reader can see it — the button, the match counter and the legend under the ramps
 * — and a parameter somebody may type by hand should use the page's vocabulary rather
 * than the field name behind it. The strict '1' comparison is not fussiness: `?ref=` is
 * a referral parameter in the wild, and a link arriving as `?ref=newsletter` must not
 * quietly hide most of the palette.
 *
 * Our own writes percent-encode the slashes in `p` — URLSearchParams does that and it
 * round-trips — so the address bar shows `p=solid%2Fbrand%2F60` while a hand-typed
 * `?p=solid/brand/60` also parses. Same parameter either way; the encoded form is not
 * worth hand-rolling a serialiser to avoid.
 * ------------------------------------------------------------------------- */
const PARAM = { query: 'q', used: 'ref', path: 'p' } as const;

/** Long enough that typing a word is one entry in the address bar rather than six,
 *  short enough that letting go of the keyboard and reaching for the URL always finds
 *  it settled. The toggle and the swatch click do not need a debounce and get it
 *  anyway: one write path is worth more than saving them a quarter of a second. */
const URL_DEBOUNCE_MS = 250;

/** Present when it has a value, gone when it does not, so a cleared filter leaves a
 *  clean URL rather than `?q=&ref=&p=`. */
function setParam(params: URLSearchParams, key: string, value: string) {
  if (value) params.set(key, value);
  else params.delete(key);
}

/** Rewrite the query string and nothing else about the URL.
 *
 *  PRESERVES THE HASH, and that is the load-bearing part. The scroll spy in Chrome.tsx
 *  writes `#primitives`, `#colour` and so on into the address bar as the reader moves
 *  down the page; a URL assembled from pathname plus search alone deletes it, so the two
 *  would fight and whichever wrote last would win. The spy carries the mirror image of
 *  this note and preserves the search for the same reason — read live, both of them, so
 *  neither has to know when the other ran.
 *
 *  The parameters are edited in place rather than rebuilt from state, so anything this
 *  section does not own survives too.
 *
 *  replaceState, not pushState: a filter is a view of one page, and a history entry per
 *  keystroke turns Back into "delete a letter". */
function writeParams(edit: (params: URLSearchParams) => void) {
  const { pathname, search, hash } = window.location;
  const params = new URLSearchParams(search);
  edit(params);
  const next = params.toString();
  const url = `${pathname}${next ? `?${next}` : ''}${hash}`;
  if (url === `${pathname}${search}${hash}`) return;
  window.history.replaceState(null, '', url);
}

function Detail({ step }: { step: PrimitiveStep | null }) {
  return (
    <>
      {/* What was picked, out loud.
       *
       * The live region is this one node and not the panel below, for two reasons. A
       * live region announces its whole subtree, and the panel's ends in one chip per
       * semantic token that resolves to the step — two dozen of them on
       * solid/neutral/white, the busiest step in the palette. Somebody who taps a swatch
       * to ask "which one is this" would be read the entire consumer list, which is the
       * part of the panel you go and read rather than the part you need told.
       *
       * And the panel does not exist in both states: the empty state is a different
       * element, so a region that first mounted with the first selection would arrive
       * already populated, and a region with nothing to diff against is routinely not
       * announced at all. Mounted unconditionally and empty when there is nothing to say
       * — the same construction, for the same reason, as Snippet.tsx's copy receipt.
       *
       * Lightness is in here as well as the path and the value. It is the number the
       * ramp is ordered by, and it used to live in a title attribute and nowhere else. */}
      <p aria-live="polite" className="sr-only">
        {step ? `${step.path}, ${step.value}, lightness ${step.lightness.toFixed(1)}` : ''}
      </p>
      {step ? <DetailPanel step={step} /> : <DetailEmpty />}
    </>
  );
}

function DetailEmpty() {
  return (
    <div className="rounded-5 border-2 border-dashed border-border-secondary p-space-5">
      <p className="text-body-sm text-content-tertiary">
        Pick a swatch to see its value, its lightness, and which semantic tokens reference it.
        Arrow keys move within a ramp once it has focus; Home and End jump to the ends of a
        strip.
      </p>
    </div>
  );
}

function DetailPanel({ step }: { step: PrimitiveStep }) {
  const translucent = step.alpha < 1;
  const byMode = {
    light: step.consumers.filter((c) => c.endsWith('(light)')),
    dark: step.consumers.filter((c) => c.endsWith('(dark)')),
  };

  return (
    <div className="oz-stack oz-stack-5 rounded-5 bg-surface-primary p-space-5 sm:flex-row">
      <div
        className={`h-space-16 w-space-16 shrink-0 rounded-4 border-2 border-border-primary ${
          translucent ? 'oz-alpha-grid' : ''
        }`}
      >
        <div className="h-full w-full rounded-[2px]" style={{ background: step.value }} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-mono text-body-sm text-content-primary">{step.path}</p>
        <dl className="mt-space-3 flex flex-wrap gap-x-space-7 gap-y-space-2">
          {[
            ['value', step.value],
            ['hex', step.hex],
            ['alpha', translucent ? `${Math.round(step.alpha * 100)}%` : '100%'],
            ['L*', step.lightness.toFixed(1)],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="font-mono text-label-sm uppercase text-content-tertiary">{k}</dt>
              <dd className="font-mono text-label-sm text-content-secondary">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-space-4">
          {step.consumers.length === 0 ? (
            <p className="max-w-[64ch] text-body-sm text-content-tertiary">
              No semantic token references this. Expected for most of the grid — the alpha tiers
              are generated across every family and step rather than curated, so{' '}
              {primitiveSummary.unused} of the {primitiveSummary.total} have no consumer. That is a
              property of the generator, not a backlog.
            </p>
          ) : (
            <div className="oz-stack oz-stack-3">
              {(['light', 'dark'] as const).map((mode) =>
                byMode[mode].length === 0 ? null : (
                  <div key={mode}>
                    <p className="font-mono text-label-sm uppercase text-content-tertiary">
                      {mode} · {byMode[mode].length}
                    </p>
                    <div className="mt-space-1 flex flex-wrap gap-space-2">
                      {byMode[mode].map((c) => (
                        <code
                          key={c}
                          className="rounded-3 bg-surface-secondary px-space-3 py-space-1 font-mono text-label-sm text-content-secondary"
                        >
                          {c.replace(` (${mode})`, '')}
                        </code>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Primitives({ index }: { index: string }) {
  const [query, setQuery] = useState('');
  const [usedOnly, setUsedOnly] = useState(false);
  const [selected, setSelected] = useState<PrimitiveStep | null>(null);

  /* Read the URL once, after hydration — and gate the writer on having done so.
   *
   * Not in a lazy useState initialiser and not during render: window.location does not
   * exist during the server render, so a first client render that consulted it would
   * disagree with the markup React is hydrating and the tree would be thrown away. That
   * is the discipline ThemeProvider.tsx documents at length, and the price here is one
   * frame of the unfiltered grid before `?q=` lands.
   *
   * The gate matters as much as the read. Without it the write effect below fires on
   * mount holding the default empty state and deletes the very parameters this effect is
   * about to read — a link that clears itself the moment it is opened. */
  const [readUrl, setReadUrl] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get(PARAM.query) ?? '');
    setUsedOnly(params.get(PARAM.used) === '1');
    /* A path that no longer names a primitive resolves to nothing, and the first write
     * below then drops it from the URL. This is a normal event rather than a defensive
     * flourish: steps get added when a semantic role needs a rung that is not there,
     * which is the entire reason neutral carries seven half-steps, so a link somebody
     * sent last month can name a step that has since moved. `find`'s undefined is
     * collapsed to null on the way in — `selected` is `PrimitiveStep | null` everywhere
     * below and downstream, and a third empty value that only this path can produce is
     * how a missing step would turn into a crash somewhere else. */
    const path = params.get(PARAM.path);
    setSelected(path ? (allPrimitives.find((p) => p.path === path) ?? null) : null);
    setReadUrl(true);
  }, []);

  /* One debounced write for all three parameters. The timer restarts on every change,
   * so a typed word reaches the address bar once, when the typing stops. */
  useEffect(() => {
    if (!readUrl) return;
    const timer = window.setTimeout(() => {
      writeParams((params) => {
        setParam(params, PARAM.query, query.trim());
        setParam(params, PARAM.used, usedOnly ? '1' : '');
        setParam(params, PARAM.path, selected?.path ?? '');
      });
    }, URL_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [readUrl, query, usedOnly, selected]);

  const needle = query.trim().toLowerCase();
  const filtering = needle.length > 0 || usedOnly;

  const matches = useMemo(() => {
    return (step: PrimitiveStep) => {
      if (usedOnly && step.consumers.length === 0) return false;
      if (!needle) return true;
      return (
        step.path.toLowerCase().includes(needle) ||
        step.hex.toLowerCase().includes(needle) ||
        step.consumers.some((c) => c.toLowerCase().includes(needle))
      );
    };
  }, [needle, usedOnly]);

  const matchCount = useMemo(() => {
    if (!filtering) return primitiveSummary.total;
    let n = 0;
    for (const t of primitiveTiers)
      for (const f of t.families) for (const s of f.steps) if (matches(s)) n++;
    return n;
  }, [filtering, matches]);

  return (
    <Section
      id="primitives"
      index={index}
      title="Primitives"
      tag={`${primitiveSummary.total} tokens · ${primitiveSummary.tiers} tiers × ${primitiveSummary.families} families`}
      blurb="Tier 1, in full. Authored in OKLCH and computed — every ramp step is a measured lightness, not a picked colour. Nothing above this tier may contain a hex, so every semantic token on the page resolves to one of these."
    >
      <div className="oz-stack oz-stack-9">
        {/* The controls and the detail panel, pinned.
         *
         * The panel renders above 655 swatches, so clicking a step near the bottom of the
         * neutral ramp updated a block a screen and a half off the top of the viewport and
         * nothing the reader could see moved at all. That is the same bug as the swatch
         * being unlinkable, from the other end: the selection existed and was
         * unobservable.
         *
         * This is the element that can be sticky, and the markup is why rather than the
         * intent: it is the first child of the section's `oz-stack oz-stack-9`, the ramps
         * are its sibling, so its containing block is that flex column — which is as tall
         * as every ramp put together — and it holds for the whole scroll past them. The
         * other half of the requirement is negative and is the half that usually kills a
         * sticky silently: nothing between here and <body> sets overflow. `.oz-stack` sets
         * display, direction and gap and puts `min-width: 0` on its children, and that is
         * all it sets.
         *
         * Opaque, and only from lg. `bg-background` because the block sits on the page and
         * a card behind a card is what the rest of this folder spent its comments
         * removing; the panel's own surface/primary covers its own box and nothing else,
         * so without this the swatches scroll visibly through the gaps around it. Below lg
         * the controls plus the panel are most of a phone viewport, and the grid is what
         * the reader came for, so there it stays in the flow.
         *
         * `lg:z-dropdown`, deliberately not `lg:z-sticky`. The header already owns
         * z-sticky, an equal z-index is resolved by document order, and this block comes
         * later in the document — so the two being equal means this paints over the header
         * the first time they ever touch. It does need a layer of some kind, though:
         * ScrollRegion wraps each ramp strip in a `relative` div, positioned siblings at
         * z-index auto paint in tree order, and every strip is after this block. Leaving
         * it unlayered puts the swatches on top of the panel that describes them.
         *
         * The padding is at lg only for the same reason the position is: it is breathing
         * room for the pinned state — clearance under the header's rule at the top, and a
         * gap at the bottom so the swatches disappear a little clear of the panel rather
         * than against its edge. */}
        <div className="oz-stack oz-stack-4 lg:sticky lg:top-[var(--showcase-header)] lg:z-dropdown lg:bg-background lg:pb-space-5 lg:pt-space-4">
          <div className="flex flex-wrap items-end gap-space-5">
            <div className="w-full max-w-[360px]">
              <Input
                label="Filter"
                placeholder="brand, #FF3D01, fill/critical…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                message="Matches path, hex, or the name of a consuming token."
              />
            </div>
            <Button
              variant={usedOnly ? 'secondary' : 'ghost'}
              aria-pressed={usedOnly}
              onClick={() => setUsedOnly((v) => !v)}
            >
              Referenced only
            </Button>
            <p
              aria-live="polite"
              className="pb-space-3 font-mono text-label-sm text-content-tertiary"
            >
              {filtering
                ? `${matchCount} of ${primitiveSummary.total} match`
                : `${primitiveSummary.used} of ${primitiveSummary.total} referenced by a semantic token`}
            </p>
          </div>

          <Detail step={selected} />
        </div>

        <div>
          <SubHead
            tag={`${primitiveSummary.tiers} strips per family · solid, then 8 / 15 / 30 / 50% alpha`}
          >
            Ramps
          </SubHead>
          <div className="oz-stack oz-stack-11">
            {FAMILY_ORDER.map((family) => (
              <PrimitiveRamp
                key={family}
                family={family}
                tiers={primitiveTiers}
                matches={matches}
                filtering={filtering}
                selected={selected}
                onSelect={setSelected}
              />
            ))}
          </div>
          <p className="mt-space-5 oz-cluster oz-cluster-3 text-body-sm text-content-tertiary">
            <span
              aria-hidden="true"
              className="grid h-[9px] w-[9px] place-items-center rounded-full bg-content-fixed-inverse ring-1 ring-border-tertiary"
            >
              <span className="h-[4px] w-[4px] rounded-full bg-content-fixed-primary" />
            </span>
            marks a primitive some semantic token resolves to. Unmarked steps exist because the
            grid is generated across every family and step.
          </p>
        </div>

        <div>
          <SubHead>Decisions worth knowing</SubHead>
          <Notes
            items={[
              'Primitives are mode-independent. There is one palette; light and dark differ in which step each semantic role points at — surface/primary is neutral/10 in light and neutral/20 in dark. The mode toggle therefore changes nothing in the swatches above, and does change the consumer lists, because that is precisely what differs.',
              'The half-steps exist because a ladder ran out of room. neutral carries 25/35/45/95/105/115/135 and brand carries 45/55/75 on top of the round decades — each was added when a semantic role needed a rung that was not there. Adding a step is normal and cheap; hand-typing a colour above tier 1 is neither.',
              'brand/60 is #FF3D01, and the brand guide says #FF3D00. It is OKLCH L 0.6535 / C 0.2348 / h 34.0 and the round trip lands one 8-bit unit away. Typing the exact hex would put brand outside the engine — if the byte matters, move L.',
              'neutral/white and neutral/black are named, not numbered, because they are absolutes rather than ramp positions. They are also the only two steps that mean the same thing in both modes, which is why content/fixed-* is built from them.',
              `The four alpha tiers are one alpha applied across the whole grid, so 524 of the ${primitiveSummary.total} are generated rather than chosen (DECISIONS.md D7). Most have no consumer, and that count is a description of the generator rather than a backlog. Deleting the unreferenced ones would mean the grid is no longer a grid, and the next role that needs a 30% teal would be back to hand-typing rgba() — solid/neutral/black is the cautionary case: it looks unused until you notice it is every drop shadow and the scrim in dark mode.`,
              'spectrum-* is the chart and gradient palette. It carries no semantic status meaning — spectrum-purple is not "info" — and the build gates the five chart series on lightness separation so they survive greyscale and red-green deficiency.',
            ]}
          />
        </div>

        {/* Live cross-check between this page's count and the build's own.
         *
         * They agree, so this renders nothing. It stays because it is cheap and because
         * they did once disagree: the build counted primitives from its colour-semantic
         * map only and missed solid/neutral/black, which is reached exclusively through
         * the elevation tokens. Fixed at build/build.mjs:794.
         *
         * A footnote rather than the warning callout this used to be. A ±1 in a
         * statistic about a generated grid does not warrant a tinted surface louder than
         * the 655 swatches above it — and the Notes component in this same file exists on
         * the principle that facts read better undressed. */}
        {primitiveSummary.unused !== primitiveSummary.auditUnused && (
          <p className="max-w-[74ch] border-t-2 border-border-primary pt-space-4 text-body-sm text-content-tertiary">
            This page counts {primitiveSummary.unused} unreferenced primitives;{' '}
            <code className="font-mono">reports/audit.json</code> reports{' '}
            {primitiveSummary.auditUnused}. The page derives its figure from every token that
            names a primitive, elevation included. Rebuild, and if the gap persists the two are
            counting different sets — start at{' '}
            <code className="font-mono">build/build.mjs:794</code>.
          </p>
        )}
      </div>
    </Section>
  );
}
