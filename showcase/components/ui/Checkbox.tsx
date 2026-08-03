'use client';

import { useId, useState } from 'react';
import { checkboxRecipe, type CheckboxVariant } from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';

export type CheckboxProps = {
  /** Three states, not two. `'mixed'` is the select-all header case. */
  checked?: boolean | 'mixed';
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  forceState?: StateName;
  forceVariant?: CheckboxVariant;
  id?: string;
};

/* Drawn rather than typed. A ✓ glyph would come from whichever font actually
 * loaded, and CLAUDE.md's own test rig exists partly because webfonts fail.
 *
 * The tick carries its own spring, and it is the only child element in the system
 * that does — see checkboxRecipe.motion for why. The box transitions colour on an
 * effects spring; the tick scales in on spatial-fast, so it lands with a touch of
 * overshoot. A tick that fades reads as uncertain, and commitment is the whole
 * semantic content of a checkbox. .oz-enter-pop is the token layer's class, so the
 * scale collapses under reduced motion while the opacity still runs. */
function Tick({ mixed }: { mixed: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="oz-enter-pop h-space-4 w-space-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {mixed ? <path d="M4 8h8" /> : <path d="M3.5 8.5l3 3 6-6.5" />}
    </svg>
  );
}

export function Checkbox({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  label,
  forceState,
  forceVariant,
  id,
}: CheckboxProps) {
  const auto = useId();
  const boxId = id ?? auto;
  const [internal, setInternal] = useState(defaultChecked);
  const value = checked ?? internal;

  const variant: CheckboxVariant =
    forceVariant ??
    (value === 'mixed' ? 'indeterminate' : value ? 'checked' : 'unchecked');
  const showTick = variant !== 'unchecked';

  function toggle() {
    const next = value === true ? false : true;
    if (checked === undefined) setInternal(next);
    onCheckedChange?.(next);
  }

  const box = (
    <button
      id={boxId}
      type="button"
      role="checkbox"
      aria-checked={value === 'mixed' ? 'mixed' : value}
      aria-label={label ? undefined : 'Select'}
      disabled={disabled}
      onClick={toggle}
      className={checkboxRecipe.classes({ variant, force: forceState })}
    >
      {showTick && <Tick mixed={variant === 'indeterminate'} />}
    </button>
  );

  if (!label) return box;

  return (
    <div className="flex min-h-target items-center gap-space-4">
      {box}
      <label
        htmlFor={boxId}
        className={`cursor-pointer text-body-sm ${
          disabled ? 'text-content-primary-disabled' : 'text-content-secondary'
        }`}
      >
        {label}
      </label>
    </div>
  );
}
