'use client';

import { useId } from 'react';
import { fieldRecipe, type FieldSize } from '@/lib/recipes';
import { cx } from '@/lib/core/cx';

/**
 * The label, hint and error around a control — and the wiring between them.
 *
 * WHY A RENDER PROP AND NOT A WRAPPER. `children` is a function called with the props
 * the control must carry, so a control cannot be placed inside a Field without receiving
 * its id and its `aria-describedby`. The wrapper form —
 * `<Field label="…"><input /></Field>` — compiles, renders identically, and silently
 * fails to connect anything, and it fails in the one direction nobody testing with a
 * mouse will ever notice. Making the connection an argument makes it impossible to
 * forget rather than merely documented.
 *
 * This is what Input, Textarea, Select, Radio, Slider and Dropzone all use. Before it,
 * Input hand-rolled the label, the message and the describedby wiring in its own JSX;
 * six copies of that is six chances to drop one, and the copy that drops it looks
 * exactly like the copy that does not.
 */

export type FieldControlProps = {
  id: string;
  /**
   * The id of the rendered `<label>` or `<legend>`.
   *
   * For anything a `<label for>` can actually point at — input, textarea, select, button —
   * ignore this: the association is already made and `aria-labelledby` on top of it is
   * redundant. It exists for controls that are NOT labelable elements, which in HTML means
   * anything that is a div with a role: `role="slider"`, `role="listbox"`,
   * `role="spinbutton"`. A `<label for>` pointing at one of those associates with nothing
   * at all, silently — the label renders, the click does not focus, and a screen reader
   * announces the control unnamed. Those controls take `aria-labelledby={labelId}`.
   */
  labelId: string | undefined;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
  'aria-required': true | undefined;
  disabled: boolean | undefined;
};

export type FieldProps = {
  /** The control's name. Required in practice — see `labelHidden` for the toolbar case,
   *  which is a label that is not painted rather than a field with no label. */
  label?: string;
  /** Persistent help text. Survives the error state — see the recipe note. */
  hint?: string;
  /** Presence is the invalid state: it renders the message, sets `aria-invalid` on the
   *  control, and puts itself first in `aria-describedby`. One prop, so the visual and
   *  the announced state cannot disagree. */
  error?: string;
  required?: boolean;
  /** Renders a quiet "Optional" beside the label. The better pattern when most fields in
   *  a form are required — see the recipe note. Ignored when `required` is set. */
  optional?: boolean;
  disabled?: boolean;
  size?: FieldSize;
  /** `control` → `<label for>`. `group` → `<fieldset><legend>`, for a set of controls
   *  with no single element to point at. */
  as?: 'control' | 'group';
  /** Keeps the label in the accessibility tree and out of the layout. */
  labelHidden?: boolean;
  /** Trailing content on the label row: a character counter, a "Learn more" link, a
   *  units toggle. Sits on the baseline of the label and is pushed to the far edge. */
  labelAside?: React.ReactNode;
  children: (control: FieldControlProps) => React.ReactNode;
  className?: string;
};

export function Field({
  label,
  hint,
  error,
  required = false,
  optional = false,
  disabled = false,
  size = 'md',
  as = 'control',
  labelHidden = false,
  labelAside,
  children,
  className,
}: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const labelId = `${id}-label`;
  const group = as === 'group';

  if (process.env.NODE_ENV !== 'production' && !label) {
    console.error(
      '[oz] <Field> has no label. Pass `label`, with `labelHidden` if it must not be ' +
        'painted — a hidden <label> keeps click-to-focus, which aria-label discards.',
    );
  }

  /* Error first. Screen readers announce describedby in the order given, and on a
   * failed field the correction is more urgent than the instruction. */
  const describedBy = cx(error && errorId, hint && hintId) || undefined;

  const control: FieldControlProps = {
    id,
    labelId: label ? labelId : undefined,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    'aria-required': required ? true : undefined,
    disabled: disabled || undefined,
  };

  const forced = disabled ? ('disabled' as const) : undefined;
  const text = (variant: 'label' | 'hint' | 'error', extra?: string) =>
    fieldRecipe.classes({ variant, size, force: forced, className: extra });

  /* The label's inner content, shared by the two tag branches below. */
  const labelContent = (
    <>
      {label}
      {required && (
        /* aria-hidden: aria-required already says this. See the recipe note. */
        <span aria-hidden="true" className={text('error')}>
          {' *'}
        </span>
      )}
      {!required && optional && <span className={text('hint')}>{' Optional'}</span>}
    </>
  );

  /* Written as two branches rather than one `const Tag = group ? 'legend' : 'label'`.
   * A union of intrinsic tags loses its prop types in JSX — `htmlFor` is valid on one
   * and not the other — so the ternary would either not typecheck or need a cast, and a
   * cast here would hide exactly the mistake it is standing in for. */
  const labelRow = label && (
    <div className={labelHidden ? 'sr-only' : 'flex items-baseline justify-between gap-space-4'}>
      {group ? (
        /* No htmlFor: a legend labels its fieldset by containment, and pointing one at
           the first radio would make the group's name read as that option's name. */
        <legend id={labelId} className={text('label')}>
          {labelContent}
        </legend>
      ) : (
        <label id={labelId} htmlFor={id} className={text('label')}>
          {labelContent}
        </label>
      )}
      {labelAside && !labelHidden && <div className="shrink-0">{labelAside}</div>}
    </div>
  );

  /* Inlined rather than extracted into a nested component. A component declared inside
   * a render is a new component TYPE on every render, so React unmounts and remounts its
   * DOM — which would replay `oz-enter-fade` on the error message every single keystroke.
   * The first draft of this file did exactly that. */
  const messages = (error || hint) && (
    <>
      {error && (
        /* enterClass on the message only. The recipe declares `fade`; a label that faded
           in on every render would be noise, and an error that appears without
           announcing itself is missed. */
        <p id={errorId} className={text('error', fieldRecipe.enterClass)}>
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className={text('hint')}>
          {hint}
        </p>
      )}
    </>
  );

  const stack = fieldRecipe.gapFor(size);

  /* A <fieldset> is not a reliable flex or grid container across browsers, so the group
   * case keeps the fieldset a plain box and puts the stack on an inner div. `min-w-0`
   * because a fieldset's UA default of `min-width: min-content` is one of the last
   * remaining ways to get a horizontal overflow out of a form. */
  if (group) {
    return (
      <fieldset
        /* The aria goes on the FIELDSET in group mode, not on the children.
         *
         * A group has no single control to describe, so `aria-describedby` has to sit on
         * the thing that owns all of them — and a <fieldset> is exactly that thing, which
         * is most of why `as="group"` renders one. Putting it on each child instead would
         * make a screen reader read the group's hint once per option.
         *
         * `control` is still passed to `children` unchanged, because a group can contain a
         * control that wants the id — but a caller that ignores it is now correct rather
         * than silently unwired, which it was in the first draft of RadioGroup. */
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        aria-required={required ? true : undefined}
        disabled={disabled || undefined}
        className={cx('min-w-0 border-0 p-0', className)}
      >
        <div className={stack}>
          {labelRow}
          {children(control)}
          {messages}
        </div>
      </fieldset>
    );
  }

  return (
    <div className={cx(stack, className)}>
      {labelRow}
      {children(control)}
      {messages}
    </div>
  );
}
