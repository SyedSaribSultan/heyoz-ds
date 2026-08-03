'use client';

import { useMemo, useState } from 'react';
import {
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

function Detail({ step }: { step: PrimitiveStep | null }) {
  if (!step) {
    return (
      <div className="rounded-5 border-2 border-dashed border-border-secondary p-space-5">
        <p className="text-body-sm text-content-tertiary">
          Pick a swatch to see its value, its lightness, and which semantic tokens reference it.
          Arrow keys move within a ramp once it has focus.
        </p>
      </div>
    );
  }

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
        <div className="oz-stack oz-stack-4">
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
