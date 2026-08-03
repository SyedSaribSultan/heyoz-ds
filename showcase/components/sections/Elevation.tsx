'use client';

import { useState } from 'react';
import { audit } from '@/lib/core/audit';
import { Section, Stage, SubHead } from '@/components/showcase/Section';
import { Button, Card, CardMeta, CardTitle } from '@/components/ui';
import { useTheme } from '@/components/showcase/ThemeProvider';

/* Elevation and motion, together, because they are the two systems whose values are
 * only judgeable in motion or in context — a shadow token list tells you nothing. */

const STEPS = ['x-small', 'small', 'medium', 'large'] as const;

const DURATIONS = [
  ['instant', '0ms', 'State that must feel like it already happened.'],
  ['fast', '150ms', 'Colour and opacity on hover, press, focus.'],
  ['base', '250ms', 'Something moving or resizing on screen.'],
  ['slow', '420ms', 'A panel or sheet entering.'],
  ['slower', '720ms', 'Large movement across the viewport. Rare.'],
  ['ambient', '1500ms', 'Loops that are not feedback: pulse, shimmer.'],
] as const;

const EASINGS = [
  ['entrance', 'Overshoots slightly. Things arriving.'],
  ['exit', 'Accelerates away. Things leaving.'],
  ['standard', 'Symmetric. Anything staying put and changing.'],
  ['linear', 'Progress and loops only. Never on a transition.'],
] as const;

export function Elevation({ index }: { index: string }) {
  const { mode } = useTheme();
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState<string>('base');
  const [easing, setEasing] = useState<string>('entrance');

  const scrim = audit[mode]['elevation/overlay/dimness'];
  const blur = audit[mode]['elevation/overlay/blur'];

  return (
    <Section
      id="elevation"
      index={index}
      title="Elevation & motion"
      tag="4 shadow steps · 6 durations · 4 curves"
      blurb="Shadows are tinted with a warm neutral in light mode and near-black in dark, so the same step reads as depth in both rather than as a grey smear on one."
    >
      <div className="oz-stack oz-stack-11">
        <div>
          <SubHead tag="shown on surface/elevated">Shadow steps</SubHead>
          <Stage>
            <div className="grid grid-cols-1 gap-space-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => {
                const t = audit[mode][`elevation/drop shadow/${s}`];
                return (
                  <div
                    key={s}
                    className="rounded-6 border-2 border-border-elevated bg-surface-elevated p-space-5"
                    style={{ boxShadow: `var(--oz-elevation-${s})` }}
                  >
                    <p className="text-body-sm font-medium text-content-primary">{s}</p>
                    <p className="mt-space-1 font-mono text-label-sm text-content-tertiary">
                      {t?.hex} @ {Math.round((t?.alpha ?? 0) * 100)}%
                    </p>
                  </div>
                );
              })}
            </div>
          </Stage>
        </div>

        <div>
          <SubHead tag={`${scrim?.hex} @ ${Math.round((scrim?.alpha ?? 0) * 100)}% · blur ${blur?.number ?? 4}px`}>
            Scrim
          </SubHead>
          <Stage flush>
            <div className="relative">
              <div className="p-space-7">
                <div className="grid grid-cols-1 gap-space-5 sm:grid-cols-2">
                  <Card variant="flat">
                    <CardTitle>Behind the scrim</CardTitle>
                    <CardMeta>
                      The dim layer is a token, not an opacity guess. Blur is a second token so a
                      modal can dim without frosting.
                    </CardMeta>
                  </Card>
                  <Card variant="raised">
                    <CardTitle>Also behind it</CardTitle>
                    <CardMeta>Both cards keep their own elevation underneath.</CardMeta>
                  </Card>
                </div>
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `var(--oz-overlay-dimness)`,
                  backdropFilter: `blur(var(--oz-overlay-blur))`,
                }}
              />
            </div>
          </Stage>
        </div>

        <div>
          <SubHead tag="pick a pair and play it">Motion</SubHead>
          <Stage>
            <div className="oz-stack oz-stack-6">
              <div className="flex flex-wrap items-end gap-space-6">
                <label className="oz-stack oz-stack-2">
                  <span className="font-mono text-label-sm uppercase text-content-tertiary">
                    duration
                  </span>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="min-h-target rounded-5 border-2 border-border-secondary bg-surface-secondary px-space-4 text-body-sm text-content-primary focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
                  >
                    {DURATIONS.map(([k, v]) => (
                      <option key={k} value={k}>
                        {k} · {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="oz-stack oz-stack-2">
                  <span className="font-mono text-label-sm uppercase text-content-tertiary">
                    curve
                  </span>
                  <select
                    value={easing}
                    onChange={(e) => setEasing(e.target.value)}
                    className="min-h-target rounded-5 border-2 border-border-secondary bg-surface-secondary px-space-4 text-body-sm text-content-primary focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus"
                  >
                    {EASINGS.map(([k]) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </label>
                <Button variant="secondary" onClick={() => setPlaying((p) => !p)}>
                  {playing ? 'Send it back' : 'Play'}
                </Button>
              </div>

              <div className="overflow-hidden rounded-5 border-2 border-border-primary bg-surface-secondary p-space-5">
                <div
                  className="h-space-11 w-space-11 rounded-4 bg-fill-brand"
                  style={{
                    transform: playing ? 'translateX(min(420px, 60vw))' : 'translateX(0)',
                    transitionProperty: 'transform',
                    transitionDuration: `var(--oz-duration-${duration})`,
                    transitionTimingFunction: `var(--oz-ease-${easing})`,
                  }}
                />
              </div>

              <dl className="grid grid-cols-1 gap-x-space-7 gap-y-space-3 sm:grid-cols-2">
                {DURATIONS.map(([k, v, why]) => (
                  <div key={k} className="flex gap-space-3 text-body-xs">
                    <dt className="w-[110px] shrink-0 font-mono text-content-secondary">
                      {k} <span className="text-content-tertiary">{v}</span>
                    </dt>
                    <dd className="text-content-tertiary">{why}</dd>
                  </div>
                ))}
                {EASINGS.map(([k, why]) => (
                  <div key={k} className="flex gap-space-3 text-body-xs">
                    <dt className="w-[110px] shrink-0 font-mono text-content-secondary">{k}</dt>
                    <dd className="text-content-tertiary">{why}</dd>
                  </div>
                ))}
              </dl>

              <p className="max-w-[74ch] text-body-sm text-content-tertiary">
                Everything on this page collapses to near-zero under{' '}
                <code className="font-mono">prefers-reduced-motion</code>, including the box above.
                If the animation does not run, that setting is on — it is not broken.
              </p>
            </div>
          </Stage>
        </div>
      </div>
    </Section>
  );
}
