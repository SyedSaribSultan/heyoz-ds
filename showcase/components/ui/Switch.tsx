'use client';

import { useId, useState } from 'react';
import { switchRecipe, type SwitchSize } from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';

export type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** md is 36x20, lg is 44x24. Both from the Figma set; lg for a settings page where
   *  the switch is the primary control, md inside a dense row. */
  size?: SwitchSize;
  /** Omit only when the switch is inside something that already names it — a table
   *  cell with a column header, or a grid of state examples. An unlabelled switch
   *  with no aria-label is announced as "switch, off" and nothing else. */
  label?: string;
  ariaLabel?: string;
  /** Showcase-only. Forces the visual state of the track. */
  forceState?: StateName;
  id?: string;
};

/** A real <button role="switch">, not a styled checkbox. Space and Enter both
 *  activate it for free, aria-checked is the announced state, and the label is a
 *  sibling rather than a wrapper so the 44px target is the whole row. */
export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  size = 'md',
  label,
  ariaLabel,
  forceState,
  id,
}: SwitchProps) {
  const auto = useId();
  const switchId = id ?? auto;
  const [internal, setInternal] = useState(defaultChecked);
  const isOn = checked ?? internal;
  const variant = isOn ? 'on' : 'off';

  function toggle() {
    const next = !isOn;
    if (checked === undefined) setInternal(next);
    onCheckedChange?.(next);
  }

  const track = (
    <button
      id={switchId}
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={label ? undefined : ariaLabel ?? (isOn ? 'On' : 'Off')}
      disabled={disabled}
      onClick={toggle}
      className={switchRecipe.classes({ variant, size, force: forceState })}
    >
      <span className={switchRecipe.thumbClasses(variant, size)} />
    </button>
  );

  if (!label) return track;

  return (
    <div className="flex min-h-target items-center gap-space-4">
      {track}
      <label
        htmlFor={switchId}
        className={`cursor-pointer text-body-sm ${
          disabled ? 'text-content-primary-disabled' : 'text-content-secondary'
        }`}
      >
        {label}
      </label>
    </div>
  );
}
