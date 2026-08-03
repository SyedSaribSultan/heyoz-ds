'use client';

import { audit, cssValue } from '@/lib/core/audit';
import { Notes, Section, Stage, SubHead } from '@/components/showcase/Section';
import { useTheme } from '@/components/showcase/ThemeProvider';

/* ---------------------------------------------------------------------------
 * Chart series and gradients — the fourteen tokens nobody drew.
 *
 * `chart-1` through `chart-5` and nine `gradient-*` shipped in every build of this
 * system and appeared on no page. The chart series in particular carries twenty
 * greyscale gates asserting the five are separated in LIGHTNESS, not only in hue, so
 * they survive greyscale printing and red-green deficiency — and until this section
 * existed, the thing those twenty gates protect had never been looked at.
 *
 * That is the argument for drawing them rather than deleting them: a gated token
 * nobody renders is a gate nobody can falsify. It passes, and no reviewer can say
 * whether passing means what it should. scripts/verify-coverage.ts now fails the
 * build if a semantic group has no specimen, which is what stops this recurring.
 * ------------------------------------------------------------------------- */

const SERIES = ['1', '2', '3', '4', '5'] as const;

/** Deliberately not a real chart library. A bar chart drawn from the tokens shows
 *  the one property the gates assert — that five series stay distinguishable — and a
 *  charting dependency would show the library's defaults as much as ours. */
const BARS = [
  { label: 'Seedance 2', values: [62, 48, 71, 35, 54] },
  { label: 'Veo 3', values: [41, 66, 29, 58, 44] },
  { label: 'Kling 1.6', values: [77, 33, 52, 61, 38] },
];

function ChartSeries() {
  const { mode } = useTheme();
  return (
    <div className="oz-stack oz-stack-6">
      {/* The bars, and then the same bars in greyscale. The second row is the point:
          it is the gate rendered, and if a future series is added on hue alone it
          becomes two identical grey bars here before it becomes a failing build. */}
      {[false, true].map((grey) => (
        <div key={String(grey)}>
          <p className="mb-space-3 font-mono text-label-sm text-content-tertiary">
            {grey ? 'the same five, desaturated — the greyscale gate, rendered' : 'in colour'}
          </p>
          <div
            className="oz-cluster items-end"
            style={{ '--cluster-space': 'var(--oz-space-7)', filter: grey ? 'grayscale(1)' : undefined } as React.CSSProperties}
          >
            {BARS.map((group) => (
              <div key={group.label} className="oz-stack oz-stack-2">
                <div className="flex h-space-16 items-end gap-space-1">
                  {group.values.map((v, i) => (
                    <div
                      key={i}
                      className="w-space-4 rounded-t-2"
                      style={{
                        height: `${v}%`,
                        background: `var(--oz-color-chart-${SERIES[i]})`,
                      }}
                      title={`chart-${SERIES[i]} · ${v}%`}
                    />
                  ))}
                </div>
                <p className="font-mono text-label-sm text-content-tertiary">{group.label}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <dl className="oz-cluster" style={{ '--cluster-space': 'var(--oz-space-6)' } as React.CSSProperties}>
        {SERIES.map((s) => {
          const t = audit[mode][`color/chart/${s}`];
          return (
            <div key={s} className="flex items-center gap-space-3">
              <span
                aria-hidden="true"
                className="h-space-4 w-space-4 shrink-0 rounded-2"
                style={{ background: `var(--oz-color-chart-${s})` }}
              />
              <dt className="font-mono text-label-sm text-content-secondary">chart-{s}</dt>
              <dd className="font-mono text-label-sm text-content-tertiary">{cssValue(t ?? null)}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

/** The three gradient families, each drawn at the size it is meant for. */
function Gradients() {
  return (
    <div className="oz-grid" style={{ '--grid-min': '15rem' } as React.CSSProperties}>
      <figure className="oz-stack oz-stack-3">
        <div
          className="h-space-16 rounded-5"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, var(--oz-color-gradient-halo), transparent 70%)',
          }}
        />
        <figcaption className="font-mono text-label-sm text-content-tertiary">
          gradient/halo — a glow behind a focal object
        </figcaption>
      </figure>

      <figure className="oz-stack oz-stack-3">
        <div
          className="h-space-16 rounded-5"
          style={{
            background: [
              'radial-gradient(at 20% 20%, var(--oz-color-gradient-mesh-1), transparent 50%)',
              'radial-gradient(at 80% 10%, var(--oz-color-gradient-mesh-2), transparent 50%)',
              'radial-gradient(at 30% 80%, var(--oz-color-gradient-mesh-3), transparent 50%)',
              'radial-gradient(at 90% 70%, var(--oz-color-gradient-mesh-4), transparent 50%)',
              'var(--oz-color-gradient-mesh-base)',
            ].join(', '),
          }}
        />
        <figcaption className="font-mono text-label-sm text-content-tertiary">
          gradient/mesh-1…4 over mesh-base — an ambient field
        </figcaption>
      </figure>

      <figure className="oz-stack oz-stack-3">
        <div
          className="h-space-16 rounded-5"
          style={{
            background:
              'linear-gradient(135deg, var(--oz-color-gradient-onboarding-1), var(--oz-color-gradient-onboarding-2), var(--oz-color-gradient-onboarding-3))',
          }}
        />
        <figcaption className="font-mono text-label-sm text-content-tertiary">
          gradient/onboarding-1…3 — a full-bleed welcome surface
        </figcaption>
      </figure>
    </div>
  );
}

export function Spectrum({ index }: { index: string }) {
  return (
    <Section
      id="spectrum"
      index={index}
      title="Charts & gradients"
      tag="14 tokens · tier 3"
      blurb="Data visualisation and artwork. These carry no status meaning — spectrum-purple is not “info” — and they are the only semantic tokens in the system that no component consumes."
    >
      <div className="oz-stack oz-stack-11">
        <div>
          <SubHead tag="separated in lightness, not only in hue">Chart series</SubHead>
          <Stage>
            <ChartSeries />
          </Stage>
        </div>

        <div>
          <SubHead tag="artwork surfaces, not UI roles">Gradients</SubHead>
          <Stage>
            <Gradients />
          </Stage>
        </div>

        <div>
          <SubHead>Decisions worth knowing</SubHead>
          <Notes
            items={[
              'These fourteen tokens shipped in every build and were drawn on no page until this section existed. The chart series carries twenty greyscale gates asserting the five stay separated in lightness so they survive greyscale printing and red-green deficiency — and a gated token nobody renders is a gate nobody can falsify. It passes, and no reviewer can say whether passing means what it should. scripts/verify-coverage.ts now fails the build when a semantic group has no specimen.',
              'The desaturated row above is the greyscale gate rendered rather than described. A sixth series added on hue alone becomes two identical grey bars here before it becomes a failing build, which is the order those two things should happen in.',
              'Series are staggered in lightness as well as hue — L 46 to 78 in light, L 54 to 85 in dark — so the ordering carries information even with no colour at all. That is why a chart legend in this system can be a shape or a label rather than a colour swatch, and why the five are safe to print.',
              'spectrum-* is the tier-1 family these resolve to, and it carries no status meaning. spectrum-purple is not “info” and spectrum-yellow is not “warning”; reaching for one to mean a state is how a chart palette becomes a second, ungated status palette.',
              'gradient/onboarding-* has no consumer in this system and is not expected to grow one here — it is for a flow this repo does not contain. It is drawn rather than deleted because a token with no specimen is a token nobody can review, and the coverage gate asks for a specimen rather than a consumer for exactly that reason.',
            ]}
          />
        </div>
      </div>
    </Section>
  );
}
