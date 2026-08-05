'use client';

import { progressRecipe, type ProgressSize, type ProgressVariant } from '@/lib/recipes';
import { cx } from '@/lib/core/cx';

export type ProgressProps = {
  /**
   * How much is done, in `min`..`max`. OMIT for indeterminate.
   *
   * The presence of this prop is the determinate/indeterminate switch, rather than a
   * `indeterminate` boolean — see the recipe note. A caller who does not know the total simply
   * does not pass a value, which is the honest expression of not knowing.
   */
  value?: number;
  min?: number;
  max?: number;

  variant?: ProgressVariant;
  size?: ProgressSize;
  disabled?: boolean;

  /** Names the process. Required: "progressbar" with no name tells a screen-reader user that
   *  something is happening and nothing about what. */
  label: string;
  /** Paint the label above the track. Without it the name is still in the a11y tree. */
  showLabel?: boolean;
  /** Turns the value into the readout beside the label, and into `aria-valuetext`. Both from
   *  one function, so the screen and the announcement cannot disagree. */
  format?: (value: number, max: number) => string;
  className?: string;
};

export function Progress({
  value,
  min = 0,
  max = 100,
  variant = 'brand',
  size = 'md',
  disabled = false,
  label,
  showLabel = false,
  format,
  className,
}: ProgressProps) {
  const indeterminate = value === undefined;

  /* Clamped silently, warned loudly. A caller who has miscounted needs the bar to stay inside
   * its track more than they need a runtime error — but they do need to find out, and
   * development is where. */
  if (process.env.NODE_ENV !== 'production' && value !== undefined && (value < min || value > max)) {
    console.error(
      `[oz] <Progress> value ${value} is outside ${min}..${max} and has been clamped. ` +
        'The bar and aria-valuenow both report the clamped figure.',
    );
  }

  const clamped = indeterminate ? 0 : Math.min(max, Math.max(min, value));
  const pct = max === min ? 0 : ((clamped - min) / (max - min)) * 100;
  const readout = format ? format(clamped, max) : `${Math.round(pct)}%`;

  return (
    <div className={cx('oz-stack oz-stack-2', className)}>
      {showLabel && (
        <div className="flex items-baseline justify-between gap-space-4">
          <span className="text-label-md font-medium text-content-secondary">{label}</span>
          {!indeterminate && <span className={progressRecipe.readoutClasses()}>{readout}</span>}
        </div>
      )}

      <div
        role="progressbar"
        /* Named either by the painted label or by aria-label. Never both — two names on one
           element is a name a screen reader has to choose between. */
        {...(showLabel ? {} : { 'aria-label': label })}
        aria-valuemin={indeterminate ? undefined : min}
        aria-valuemax={indeterminate ? undefined : max}
        /* Omitted entirely when indeterminate, which is what tells assistive technology the
           total is unknown. A valuenow of 0 on an indeterminate bar claims no progress has
           been made, which is a different and false statement. */
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-valuetext={indeterminate ? undefined : format ? readout : undefined}
        className={progressRecipe.classes({
          variant,
          size,
          force: disabled ? 'disabled' : undefined,
        })}
      >
        {indeterminate ? (
          <span className={progressRecipe.indeterminateClasses(variant)} />
        ) : (
          <span
            className={progressRecipe.fillClasses(variant, disabled)}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  );
}
