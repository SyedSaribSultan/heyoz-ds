'use client';

import { forwardRef } from 'react';
import { inputRecipe, type InputSize, type InputVariant } from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';
import { cx } from '@/lib/core/cx';
import { Field, type FieldControlProps } from './Field';

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  variant?: InputVariant;
  size?: InputSize;
  forceState?: StateName;

  /* -- the Field's props, forwarded ------------------------------------------ *
   * Listed rather than spread from FieldProps so the API surface is readable at the
   * call site and so `children` — which Field takes as a render prop — cannot leak
   * into a component whose children are meaningless. */

  label?: string;
  /** Keeps the label in the a11y tree and out of the layout. The right answer for a
   *  filter field in a toolbar; strictly better than `aria-label`, which discards
   *  click-to-focus. */
  labelHidden?: boolean;
  /** Persistent help text. */
  hint?: string;
  /**
   * The validation failure. Presence drives `aria-invalid`, renders the message, and
   * puts the field into its invalid paint — so `variant` does not need setting for the
   * common case.
   *
   * This replaced `message`, which was one prop with two meanings: it rendered as help
   * text under `default` and as an error under `invalid`, so the same string changed
   * meaning depending on a second prop. Every call site in this repo was passing it as
   * help text.
   */
  error?: string;
  required?: boolean;
  optional?: boolean;
  labelAside?: React.ReactNode;

  /** A 20px glyph at the leading edge. Decorative — `pointer-events-none`, so the click
   *  it would otherwise swallow still focuses the field. */
  leading?: React.ReactNode;
  /** A glyph or a small control at the trailing edge: a clear button, a unit, a reveal
   *  toggle. Interactive by default, because that is what a trailing slot is usually for;
   *  pass `trailingInteractive={false}` for a decorative one. */
  trailing?: React.ReactNode;
  trailingInteractive?: boolean;
  /** Applied to the Field column, not the input. */
  fieldClassName?: string;
};

/**
 * Text entry.
 *
 * The label, hint, error and aria wiring are Field's. What is here is the input, its
 * two adornment slots, and the size-aware padding that keeps the text clear of them.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    variant,
    size = 'md',
    forceState,
    label,
    labelHidden,
    hint,
    error,
    required,
    optional,
    labelAside,
    leading,
    trailing,
    trailingInteractive = true,
    className,
    fieldClassName,
    disabled,
    ...rest
  },
  ref,
) {
  /* `error` is the ordinary way in; `variant` stays available because the showcase's
   * state matrix drives the variant axis directly and needs to render `invalid` without
   * inventing an error string for it. Explicit `variant` wins, so a demo can show the
   * invalid paint with no message and a caller can force it. */
  const resolved: InputVariant = variant ?? (error ? 'invalid' : 'default');

  const control = (c?: FieldControlProps) => (
    <div className="relative">
      {leading && (
        <span aria-hidden="true" className={inputRecipe.adornmentClasses(size, 'leading', false)}>
          {leading}
        </span>
      )}

      <input
        ref={ref}
        {...c}
        disabled={disabled}
        className={inputRecipe.classes({
          variant: resolved,
          size,
          force: forceState,
          /* Ternaries rather than `leading && …`: a ReactNode can legitimately be `0`,
             which is falsy but is not a value `cx` accepts. */
          className: cx(
            leading ? inputRecipe.padFor(size, 'leading') : null,
            trailing ? inputRecipe.padFor(size, 'trailing') : null,
            className,
          ),
        })}
        {...rest}
      />

      {trailing && (
        <span
          /* aria-hidden only when it cannot be operated. Hiding an interactive trailing
             control — a clear button, a password reveal — would remove it from the
             accessibility tree while leaving it clickable, which is the worst of both. */
          aria-hidden={trailingInteractive ? undefined : true}
          className={inputRecipe.adornmentClasses(size, 'trailing', trailingInteractive)}
        >
          {trailing}
        </span>
      )}
    </div>
  );

  /* No Field when there is nothing for one to hold. Two reasons, and the second is the
   * load-bearing one: an empty label row plus two empty <p>s is a wrapper that changes
   * the layout for nothing, and Field warns in development when it has no label — which
   * would fire on every legitimately label-less input, training people to ignore it. A
   * bare input still accepts `aria-label` from `rest`. */
  if (!label && !hint && !error) return control();

  return (
    <Field
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      disabled={disabled}
      /* Field's ramp is sm/md/lg and the input's is md/lg. They are deliberately not the
         same axis — there is no `sm` input, because anything under 16px makes iOS Safari
         zoom the viewport on focus — so the mapping is stated here rather than implied by
         a shared type. */
      size={size}
      labelAside={labelAside}
      className={fieldClassName}
    >
      {control}
    </Field>
  );
});
