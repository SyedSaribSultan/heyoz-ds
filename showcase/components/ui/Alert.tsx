'use client';

import { forwardRef } from 'react';
import { alertRecipe, type AlertVariant } from '@/lib/recipes';

export type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
  title?: string;
};

/** role is derived from the variant, not passed in: critical is an assertive
 *  alert that interrupts a screen reader, and the other three are polite status
 *  updates that wait their turn. Letting the caller choose would eventually put a
 *  success toast in front of someone mid-sentence. */
const ROLE: Record<AlertVariant, { role: 'alert' | 'status'; live: 'assertive' | 'polite' }> = {
  critical: { role: 'alert', live: 'assertive' },
  warning: { role: 'status', live: 'polite' },
  success: { role: 'status', live: 'polite' },
  info: { role: 'status', live: 'polite' },
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { variant = 'info', title, className, children, ...rest },
  ref,
) {
  const a11y = ROLE[variant];
  const copy = alertRecipe.copyFor(variant);

  return (
    <div
      ref={ref}
      role={a11y.role}
      aria-live={a11y.live}
      className={alertRecipe.classes({ variant, className })}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={`mt-[7px] h-space-2 w-space-2 shrink-0 rounded-full bg-fill-${variant}`}
      />
      <div className="min-w-0">
        <p className="text-body-sm font-medium">{title ?? copy.title}</p>
        <p className="mt-space-1 text-body-sm text-content-secondary">{children ?? copy.body}</p>
      </div>
    </div>
  );
});
