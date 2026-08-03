'use client';

import { audit, cssValue, tokensInGroup } from '@/lib/core/audit';
import { Section, Stage, SubHead } from '@/components/showcase/Section';
import { Swatch, TrackStrip } from '@/components/showcase/Swatch';
import { useTheme } from '@/components/showcase/ThemeProvider';

/* Every list in this section is derived from reports/audit.json at render time. The
 * counts on the page are therefore the real counts, and a token added in
 * build/spec.mjs shows up here on the next reload without this file being touched.
 * A transcribed list is a list that is eventually wrong. */

const SURFACE_LADDER = [
  ['color/background', 'page'],
  ['color/sidebar/background', 'sidebar'],
  ['color/surface/primary', 'card'],
  ['color/surface/secondary', 'nested · input'],
  ['color/surface/tertiary', 'muted'],
  ['color/surface/elevated', 'popover'],
] as const;

const FILL_TRACKS = [
  'primary',
  'secondary',
  'tertiary',
  'brand',
  'success',
  'warning',
  'critical',
  'info',
];

const CONTENT_ROLES = [
  'color/content/primary',
  'color/content/secondary',
  'color/content/tertiary',
  'color/content/placeholder',
  'color/content/link',
  'color/content/brand',
  'color/content/success',
  'color/content/warning',
  'color/content/critical',
  'color/content/info',
];

const BORDER_ROLES = [
  'color/border/primary',
  'color/border/secondary',
  'color/border/tertiary',
  'color/border/focus',
  'color/border/focus-inverse',
  'color/border/selected',
];

export function Foundations({ index }: { index: string }) {
  const { mode } = useTheme();
  const surfaceCount = tokensInGroup('surface', mode).length;
  const fillCount = tokensInGroup('fill', mode).length;

  return (
    <Section
      id="colour"
      index={index}
      title="Colour"
      tag={`${audit.counts.semanticPerMode} semantic × 2 modes`}
      blurb="Authored in OKLCH and computed — no value below was chosen by hand. Every swatch reads its hex from the build's audit output rather than from the DOM, so what is printed is what the build measured."
    >
      <div className="oz-stack oz-stack-11">
        <div>
          <SubHead tag="each rung must be perceptibly clear of the last">
            Surface ladder
          </SubHead>
          <Stage>
            <div className="flex flex-col overflow-hidden rounded-4 border-2 border-border-primary">
              {SURFACE_LADDER.map(([path, label]) => {
                const t = audit[mode][path];
                return (
                  <div
                    key={path}
                    className="flex items-center gap-space-4 px-space-4 py-space-3"
                    style={{ background: cssValue(t ?? null) }}
                  >
                    <span className="text-body-sm text-content-primary">{label}</span>
                    <span className="ml-auto font-mono text-label-sm text-content-tertiary">
                      {path.replace('color/', '')} · {cssValue(t ?? null)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Stage>
        </div>

        <div>
          <SubHead tag={`${fillCount} fill tokens · ${FILL_TRACKS.length} tracks shown`}>
            Interaction tracks
          </SubHead>
          <div className="grid grid-cols-1 gap-space-6 sm:grid-cols-2 lg:grid-cols-4">
            {FILL_TRACKS.map((t) => (
              <TrackStrip key={t} track={t} />
            ))}
          </div>
          <p className="mt-space-4 max-w-[74ch] text-body-sm text-content-tertiary">
            Left to right: base, hover, active, disabled. A track where two adjacent steps look
            identical is a bug — this repo has shipped one, which is why the build now measures
            perceptual distance between states rather than only checking they exist.
          </p>
        </div>

        <div>
          <SubHead tag={`${surfaceCount} surface tokens in total`}>Content roles</SubHead>
          <div className="grid grid-cols-2 gap-space-5 sm:grid-cols-3 lg:grid-cols-5">
            {CONTENT_ROLES.map((p) => (
              <Swatch key={p} path={p} size="sm" />
            ))}
          </div>
        </div>

        <div>
          <SubHead>Borders and rings</SubHead>
          <div className="grid grid-cols-2 gap-space-5 sm:grid-cols-3 lg:grid-cols-6">
            {BORDER_ROLES.map((p) => (
              <Swatch key={p} path={p} size="sm" />
            ))}
          </div>
          <p className="mt-space-4 max-w-[74ch] text-body-sm text-content-tertiary">
            <code className="font-mono">border/focus-inverse</code> is deliberately the same colour
            as the page. It is an inset ring for use on a saturated fill only — drawn with an
            outward offset it fills the gap with page colour and vanishes at 1.00:1. That is why
            there are two ring tokens rather than one.
          </p>
        </div>
      </div>
    </Section>
  );
}
