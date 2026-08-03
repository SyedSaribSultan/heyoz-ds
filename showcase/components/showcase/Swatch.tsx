'use client';

import { audit, cssValue } from '@/lib/core/audit';
import { useTheme } from './ThemeProvider';

/* Swatches read their value out of reports/audit.json rather than out of a computed
 * style, so the number printed under the colour is the number the build measured.
 * The alternative — getComputedStyle — would agree most of the time and disagree
 * exactly when something was wrong. */

export function Swatch({
  path,
  label,
  size = 'md',
}: {
  /** DTCG path, e.g. 'color/fill/brand-hover'. */
  path: string;
  label?: string;
  size?: 'sm' | 'md';
}) {
  const { mode } = useTheme();
  const token = audit[mode][path];
  const value = cssValue(token ?? null);
  const translucent = (token?.alpha ?? 1) < 1;
  const name = label ?? path.replace(/^color\//, '');

  return (
    <div className="flex min-w-0 flex-col gap-space-2">
      <div
        className={`${
          size === 'sm' ? 'h-space-9' : 'h-space-12'
        } w-full rounded-4 border-2 border-border-primary ${translucent ? 'oz-alpha-grid' : ''}`}
      >
        <div className="h-full w-full rounded-[2px]" style={{ background: value }} />
      </div>
      <div className="min-w-0">
        <p className="truncate font-mono text-label-sm text-content-secondary" title={name}>
          {name}
        </p>
        <p className="font-mono text-label-sm text-content-tertiary">
          {value}
          {translucent && ` · ${Math.round((token?.alpha ?? 1) * 100)}%`}
        </p>
      </div>
    </div>
  );
}

/** One interaction track as a single strip: base → hover → active → disabled.
 *  Reading them side by side is the only way to see that a track has a dead step,
 *  which is a real bug this repo has shipped before. */
export function TrackStrip({ track }: { track: string }) {
  const { mode } = useTheme();
  const steps = ['', '-hover', '-active', '-disabled'];
  const present = steps.filter((s) => audit[mode][`color/fill/${track}${s}`]);

  return (
    <div className="oz-stack oz-stack-2">
      <p className="font-mono text-label-sm text-content-secondary">fill/{track}</p>
      <div className="flex overflow-hidden rounded-4 border-2 border-border-primary">
        {present.map((s) => {
          const token = audit[mode][`color/fill/${track}${s}`];
          const value = cssValue(token);
          return (
            <div
              key={s || 'base'}
              className="group relative h-space-11 flex-1 first:rounded-l-[2px] last:rounded-r-[2px]"
              style={{ background: value }}
              title={`fill/${track}${s} · ${value}`}
            >
              <span className="sr-only">
                {`fill/${track}${s || '-base'} is ${value}`}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-space-2">
        {present.map((s) => (
          <span
            key={s || 'base'}
            className="flex-1 truncate font-mono text-label-sm text-content-tertiary"
          >
            {s ? s.slice(1) : 'base'}
          </span>
        ))}
      </div>
    </div>
  );
}
