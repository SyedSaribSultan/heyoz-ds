'use client';

import { useEffect, useId } from 'react';
import { radioRecipe, type FieldSize, type RadioVariant } from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';
import { cx } from '@/lib/core/cx';
import { useControllable } from '@/lib/core/useControllable';
import { useRovingFocus } from '@/lib/core/useRovingFocus';
import { Field } from './Field';

/* -- Radio ----------------------------------------------------------------- */

export type RadioProps = {
  /** Rendered as the label text beside the control. The whole row is the label, so the
   *  44px target is the row rather than the 20px ring — which never meets it alone. */
  label: string;
  /** A second line under the label. This is where a radio earns its place over a Select:
   *  an option can explain itself in situ instead of in a tooltip. */
  description?: string;
  value: string;
  disabled?: boolean;
  forceState?: StateName;
  /** Showcase-only. */
  forceVariant?: RadioVariant;
};

/** Internal props RadioGroup supplies. Not part of the public API — a Radio outside a
 *  group is a control the user can enter and never leave, so there is deliberately no way
 *  to render one. */
type RadioInternalProps = RadioProps & {
  checked: boolean;
  name: string;
  onSelect: () => void;
  rovingProps: ReturnType<ReturnType<typeof useRovingFocus>['itemProps']>;
};

function Radio({
  label,
  description,
  value,
  disabled = false,
  checked,
  name,
  onSelect,
  rovingProps,
  forceState,
  forceVariant,
}: RadioInternalProps) {
  const variant: RadioVariant = forceVariant ?? (checked ? 'checked' : 'unchecked');
  const descId = useId();

  return (
    /* A real <label> wrapping a real <input type="radio">, with the input visually hidden
       rather than replaced. Three things come free that a div with role="radio" has to
       reimplement and usually gets wrong: form submission, the native name-grouping that
       makes browser autofill and "restore session" work, and Windows High Contrast Mode,
       which paints native controls from the OS palette and cannot see a styled div. */
    <label
      className={cx(
        /* `group` so the ring can react to the ROW being hovered rather than only its own
           20px circle. See radioRecipe.rowHoverClasses. */
        'group flex min-h-target cursor-pointer items-start gap-space-4 rounded-4 py-space-2',
        disabled && 'cursor-not-allowed',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        aria-describedby={description ? descId : undefined}
        {...rovingProps}
        /* sr-only, not `hidden` or `display:none`. A hidden input is removed from the
           accessibility tree and cannot be focused, which would defeat the roving tab stop
           this component is built around. peer, so the ring below can react to its state. */
        className="peer sr-only"
      />

      {/* aria-hidden: the real input above is what gets announced. Without this a screen
          reader finds two radios per option. */}
      <span
        aria-hidden="true"
        className={radioRecipe.classes({
          variant,
          force: forceState,
          /* The ring is a sibling of the input, so its focus and hover states are driven by
             the peer rather than by its own pseudo-classes — the recipe's own
             `focus-visible:` and `hover:` prefixes would never fire on a span. The ring
             classes mirror FOCUS_CLASSES['outline'] exactly; they are written out because
             there is no `peer-focus-visible:` variant of an arbitrary group of four
             utilities. */
          className: cx(
            'mt-space-1',
            'peer-focus-visible:outline peer-focus-visible:outline-ring peer-focus-visible:outline-offset-ring peer-focus-visible:outline-border-focus',
            !disabled && radioRecipe.rowHoverClasses(variant),
          ),
        })}
      >
        <span className={radioRecipe.discClasses(variant === 'checked')} />
      </span>

      <span className="min-w-0">
        <span className="block text-body-md text-content-primary">{label}</span>
        {description && (
          <span id={descId} className="mt-space-1 block text-body-sm text-content-secondary">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

/* -- RadioGroup ------------------------------------------------------------ */

export type RadioOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type RadioGroupProps = {
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;

  /** The group's name. Rendered as a <legend> — see Field's `as="group"`. */
  label?: string;
  labelHidden?: boolean;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  size?: FieldSize;
  /** Lay the options out in a row. Only sensible for two or three short ones. */
  orientation?: 'vertical' | 'horizontal';
  className?: string;
};

/**
 * One choice from a small set of visible alternatives.
 *
 * The keyboard behaviour is the reason this is a component rather than a loop over Radio,
 * and it is what a set of styled inputs usually gets wrong:
 *
 *   - ONE TAB STOP for the whole group, not one per option. Tab enters the group at the
 *     checked option and leaves it entirely; the arrows move within. Ten tab stops is not
 *     a radio group, it is ten checkboxes drawn in a column, and only a keyboard reveals
 *     the difference.
 *   - SELECTION FOLLOWS FOCUS. Arrowing to an option checks it. This is what ARIA
 *     specifies for a radio group and what every native one does — and it is the opposite
 *     of a Menu, where moving the caret must not commit anything.
 *   - THE ARROWS WRAP. A set of mutually exclusive options has no meaningful "past the
 *     last one".
 */
export function RadioGroup({
  options,
  value,
  defaultValue,
  onChange,
  label,
  labelHidden,
  hint,
  error,
  required,
  disabled = false,
  size = 'md',
  orientation = 'vertical',
  className,
}: RadioGroupProps) {
  const name = useId();

  /* Defaults to NOTHING checked, not to the first option.
   *
   * Preselecting option one is the tempting default and it is wrong: it records an answer
   * the user never gave, and on a required field it means the form can be submitted with a
   * value nobody chose. The cost is that the first Tab lands on option one with nothing
   * checked, which is the correct ARIA behaviour for an unanswered group. Pass
   * `defaultValue` explicitly when a real default exists. */
  const [selected, setSelected] = useControllable<string>({
    value,
    defaultValue: defaultValue ?? '',
    onChange,
  });

  const checkedIndex = options.findIndex((o) => o.value === selected);

  const roving = useRovingFocus({
    orientation: orientation === 'horizontal' ? 'horizontal' : 'vertical',
    loop: true,
    /* Disabled options are skipped. Unlike a Menu — where a disabled item should be
     * reachable so it can explain itself — an unreachable radio is correct: there is
     * nothing to explain, and stopping on an option that cannot be chosen while selection
     * follows focus would mean arrowing onto it and failing to select it. */
    skipDisabled: true,
    /* Selection follows focus. This is the line that makes it a radio group. */
    onFocusChange: (i) => {
      const o = options[i];
      if (o && !o.disabled && !disabled) setSelected(o.value);
    },
  });

  /* Point the tab stop at the checked option rather than the first. ARIA specifies it, and
   * without it Tab lands on option one while the caret ring appears on option four. */
  useEffect(() => {
    if (checkedIndex >= 0) roving.setTabStop(checkedIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedIndex]);

  return (
    <Field
      as="group"
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      error={error}
      required={required}
      disabled={disabled}
      size={size}
      className={className}
    >
      {() => (
        <div
          ref={roving.containerRef}
          /* role="radiogroup" is NOT set here. The fieldset+legend Field renders already
             groups and names these, and a radiogroup role on an inner div would produce a
             group inside a group with the same name announced twice. The native inputs
             carry the grouping through their shared `name`. */
          onKeyDown={roving.onKeyDown}
          className={cx(
            orientation === 'horizontal'
              ? 'oz-cluster oz-cluster-7'
              : /* Not `oz-stack`: the rows already carry their own vertical padding to reach
                   the 44px target, so a stack gap on top of it would double-space them. */
                'flex flex-col',
          )}
        >
          {options.map((o, i) => (
            <Radio
              key={o.value}
              {...o}
              name={name}
              checked={o.value === selected}
              disabled={disabled || o.disabled}
              onSelect={() => setSelected(o.value)}
              rovingProps={roving.itemProps(i)}
            />
          ))}
        </div>
      )}
    </Field>
  );
}

/* Re-exported so a consumer can read the row's type, and deliberately NOT exported as a
 * usable component. See the note on RadioInternalProps. */
export type { RadioInternalProps };
