'use client';

import { forwardRef, useId } from 'react';
import { inputRecipe, type InputSize, type InputVariant } from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  variant?: InputVariant;
  size?: InputSize;
  forceState?: StateName;
  /** Rendered as a real <label for>. Omitting it is allowed only when an
   *  aria-label is supplied instead; a placeholder is not a label — it disappears
   *  exactly when the user needs it. */
  label?: string;
  /** Validation or help text. Wired to the input with aria-describedby, and to
   *  aria-invalid when the variant is invalid, so the visual and the announced
   *  state come from the same prop. */
  message?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { variant = 'default', size = 'md', forceState, label, message, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  const messageId = `${inputId}-message`;
  const invalid = variant === 'invalid';

  return (
    <div className="flex w-full flex-col gap-space-2">
      {label && (
        <label htmlFor={inputId} className="text-label-sm font-medium text-content-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={invalid || undefined}
        aria-describedby={message ? messageId : undefined}
        className={inputRecipe.classes({ variant, size, force: forceState, className })}
        {...rest}
      />
      {message && (
        <p
          id={messageId}
          className={`text-label-sm ${invalid ? 'text-content-critical' : 'text-content-tertiary'}`}
        >
          {message}
        </p>
      )}
    </div>
  );
});
