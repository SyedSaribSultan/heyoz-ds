'use client';

import { stepperRecipe, type StepperVariant } from '@/lib/recipes';
import { cx } from '@/lib/core/cx';

function TickIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BangIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <path d="M12 7v6m0 4h.01" strokeLinecap="round" />
    </svg>
  );
}

export type Step = {
  /** Stable across renders. */
  id: string;
  label: string;
  /** `complete` steps become links when this is set. Upcoming ones never do — see the recipe. */
  href?: string;
  onClick?: () => void;
};

export type StepperProps = {
  steps: Step[];
  /** Index of the current step. Everything before it is complete unless listed in `failed`. */
  current: number;
  /** Ids of steps that errored. A failed step keeps its position — it is not complete and not
   *  upcoming, and without this state the stepper shows a tick over work that did not happen. */
  failed?: string[];
  orientation?: 'horizontal' | 'vertical';
  /** Names the sequence. */
  label: string;
  className?: string;
};

/**
 * Where the user is in a sequence with a known number of steps.
 *
 * An `<ol>` with `aria-current="step"`, because position in a sequence is the entire content of
 * this component — "list, 4 items, item 2 of 4, current step" is a screen reader saying exactly
 * what a sighted user reads off the row. A row of divs says none of it.
 */
export function Stepper({
  steps,
  current,
  failed = [],
  orientation = 'horizontal',
  label,
  className,
}: StepperProps) {
  const stateOf = (i: number, id: string): StepperVariant => {
    if (failed.includes(id)) return 'failed';
    if (i < current) return 'complete';
    if (i === current) return 'current';
    return 'upcoming';
  };

  const horizontal = orientation === 'horizontal';

  return (
    <nav aria-label={label} className={className}>
      <ol
        className={cx(
          'flex',
          horizontal ? 'w-full items-center' : 'flex-col items-stretch',
        )}
      >
        {steps.map((s, i) => {
          const state = stateOf(i, s.id);
          /* Reachable only when complete AND the caller supplied a way back. An upload cannot
             be un-uploaded, so whether a finished step can be revisited is the flow's call. */
          const reachable = state === 'complete' && (s.href || s.onClick);

          const marker = (
            <span className={stepperRecipe.classes({ variant: state })}>
              {state === 'complete' ? (
                /* A tick, not the numeral — so done vs not-done survives greyscale rather than
                   depending on a fill colour. Same argument Badge's icon prop wins. */
                <span aria-hidden="true" className="size-space-5">
                  <TickIcon />
                </span>
              ) : state === 'failed' ? (
                <span aria-hidden="true" className="size-space-5">
                  <BangIcon />
                </span>
              ) : (
                <span aria-hidden="true">{i + 1}</span>
              )}
            </span>
          );

          return (
            <li
              key={s.id}
              /* aria-current on the <li>, so the announcement lands on the step rather than on
                 the numeral inside it. */
              aria-current={state === 'current' ? 'step' : undefined}
              className={cx(
                'flex min-w-0',
                horizontal ? 'flex-1 items-center last:flex-none' : 'flex-col',
              )}
            >
              <div className={cx('flex min-w-0 items-center gap-space-4', !horizontal && 'py-space-1')}>
                {reachable ? (
                  <a
                    href={s.href}
                    onClick={s.onClick}
                    className={stepperRecipe.interactiveClasses()}
                    /* The state is in the name. "Step 1" alone does not say it is done, and the
                       tick is aria-hidden because it is decoration over a numeral. */
                    aria-label={`Step ${i + 1}, ${s.label}, complete — go back`}
                  >
                    {marker}
                  </a>
                ) : (
                  marker
                )}
                <span className={cx(stepperRecipe.labelClasses(state), 'min-w-0 truncate')}>
                  {s.label}
                </span>
              </div>

              {/* The connector, coloured by the PREVIOUS step's state so a finished run reads as
                  one continuous path. Not rendered after the last step. In the vertical
                  orientation it is inset to sit under the marker's centre. */}
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cx(
                    stepperRecipe.connectorClasses(state, orientation),
                    horizontal ? 'mx-space-4' : 'ml-[15px] my-space-1',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
