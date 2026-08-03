'use client';

import { useEffect, useState } from 'react';
import { audit } from '@/lib/core/audit';
import { Section, Stage, SubHead } from '@/components/showcase/Section';

/* The 15 steps, read from the build. Each is rendered at its real size, line height
 * and tracking, with all five weights, because weight is an independent axis in this
 * system and a step that only works at one weight is a step with a hidden
 * constraint. */

const WEIGHTS: Array<[string, number]> = [
  ['regular', 400],
  ['medium', 500],
  ['semibold', 600],
  ['bold', 700],
  ['extrabold', 800],
];

/** Warns when the webfonts did not load. Without this a reviewer judges the
 *  fallback stack and concludes the type is wrong. The existing test rig has the
 *  same guard for the same reason. */
function FontGuard() {
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    if (!document.fonts?.ready) return;
    document.fonts.ready
      .then(() => {
        const need = ['Bricolage Grotesque', 'Geist'];
        setMissing(need.filter((f) => !document.fonts.check(`16px '${f}'`)));
      })
      .catch(() => {});
  }, []);

  if (!missing.length) return null;

  return (
    <div
      role="status"
      className="mb-space-5 rounded-5 border-2 border-border-warning bg-surface-warning p-space-4"
    >
      <p className="text-body-sm font-medium text-content-primary">
        Webfonts did not load: {missing.join(', ')}
      </p>
      <p className="mt-space-1 text-body-sm text-content-secondary">
        The specimen below is the CSS fallback stack, not HeyOz type. Colour, spacing and contrast
        are still accurate — the typefaces are not. Connect to the network and reload before judging
        them.
      </p>
    </div>
  );
}

export function Typography({ index }: { index: string }) {
  const { steps, size, lineHeight, letterSpacing, family, defaultWeight } = audit.typography;

  return (
    <Section
      id="typography"
      index={index}
      title="Typography"
      tag={`${steps.length} steps × ${WEIGHTS.length} weights`}
      blurb="A step sets size, line height and tracking together. Weight stays independent, so any step accepts any weight — the underlined one is that step's default."
    >
      <FontGuard />
      <Stage label="specimen · live at real sizes">
        <div className="oz-stack oz-stack-7">
          {steps.map((step) => {
            const role = step.split(' ')[0];
            const key = step.replace(/\s+/g, '-');
            const sz = size[step];
            const lh = lineHeight[step];
            const ls = letterSpacing[step];
            const fam = family[role];
            const def = defaultWeight[role];
            const fluid = typeof sz === 'string';

            return (
              <div key={step} className="border-t-2 border-border-tertiary pt-space-5">
                <div className="mb-space-2 flex flex-wrap items-baseline gap-space-3">
                  <code className="rounded-3 bg-surface-secondary px-space-3 py-space-1 font-mono text-label-sm text-content-secondary">
                    {key}
                  </code>
                  <span className="font-mono text-label-sm text-content-tertiary">
                    {fluid ? 'fluid' : `${sz}px`} / {lh} / {ls}em · {fam} · default {def}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: `'${fam}', sans-serif`,
                    fontSize: fluid ? (sz as string) : `${sz}px`,
                    lineHeight: lh,
                    letterSpacing: `${ls}em`,
                  }}
                  className="text-content-primary"
                >
                  {WEIGHTS.map(([name, value]) => (
                    <span
                      key={name}
                      title={`${name} ${value}`}
                      style={{
                        fontWeight: value,
                        marginRight: '0.5em',
                        textDecoration:
                          name === def
                            ? 'underline dotted var(--oz-color-border-tertiary) 1px'
                            : undefined,
                      }}
                    >
                      Generate video
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Stage>

      <div className="mt-space-9">
        <SubHead>How a developer reaches a step</SubHead>
        <p className="max-w-[74ch] text-body-sm text-content-secondary">
          One Tailwind class carries all three values —{' '}
          <code className="font-mono text-label-sm">text-heading-lg</code> sets size, line height and
          tracking together. Weight is a separate class, so{' '}
          <code className="font-mono text-label-sm">font-semibold</code> composes with any step
          without a second decision. There is no step whose line height has to be remembered.
        </p>
      </div>
    </Section>
  );
}
