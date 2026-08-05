'use client';

import { useCallback, useRef } from 'react';
import { sliderRecipe, type FieldSize, type SliderSize } from '@/lib/recipes';
import { cx } from '@/lib/core/cx';
import { useControllable } from '@/lib/core/useControllable';
import { Field, type FieldControlProps } from './Field';

export type SliderProps = {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;

  size?: SliderSize;
  disabled?: boolean;

  label?: string;
  labelHidden?: boolean;
  hint?: string;
  error?: string;

  /**
   * Turns the raw number into something worth announcing and worth reading.
   *
   * Used for BOTH `aria-valuetext` and the readout beside the label, so the two cannot
   * disagree — a screen reader hearing "40" while the screen says "40s" is a component
   * telling two people different things. Without it, `aria-valuetext` is omitted rather
   * than set to the bare number, because a redundant valuetext overrides a perfectly good
   * default announcement with a worse one.
   */
  format?: (value: number) => string;
  className?: string;
};

/**
 * A value on a continuous range.
 *
 * The appearance is sliderRecipe. What lives here is the ARIA slider pattern, and the two
 * parts of it that hand-rolled sliders usually miss:
 *
 *   - PAGE UP and PAGE DOWN move ten steps. Without them a 0–100 slider at step 1 takes a
 *     hundred key presses to cross, which in practice means keyboard users do not use it.
 *   - THE DRAG USES POINTER CAPTURE, so a pointer that leaves the track mid-drag keeps
 *     driving the value. Without capture the slider stops responding the moment the finger
 *     strays a few pixels above the 4px track, which is most of a real drag.
 */
export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue = 0,
  onChange,
  size = 'md',
  disabled = false,
  label,
  labelHidden,
  hint,
  error,
  format,
  className,
}: SliderProps) {
  const [current, setCurrent] = useControllable<number>({ value, defaultValue, onChange });
  const trackRef = useRef<HTMLDivElement | null>(null);

  /* Clamped AND snapped to the step grid, then rounded. Snapping without rounding leaves
   * 0.30000000000000004 on a 0.1 step, which reaches aria-valuenow and gets announced in
   * full. The decimal count is derived from the step so an integer step stays an integer. */
  const quantise = useCallback(
    (raw: number) => {
      const snapped = Math.round((raw - min) / step) * step + min;
      const clamped = Math.min(max, Math.max(min, snapped));
      const decimals = (String(step).split('.')[1] ?? '').length;
      return Number(clamped.toFixed(decimals));
    },
    [min, max, step],
  );

  const pct = max === min ? 0 : ((current - min) / (max - min)) * 100;

  /** Value at a client x position. */
  const valueAt = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return current;
      const r = el.getBoundingClientRect();
      if (r.width === 0) return current;
      const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      return quantise(min + ratio * (max - min));
    },
    [current, min, max, quantise],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    /* Capture on the element the gesture started on, so the drag survives the pointer
     * leaving the 4px track — which it does almost immediately. Released automatically on
     * pointerup, so there is no cleanup to forget. */
    e.currentTarget.setPointerCapture(e.pointerId);
    setCurrent(valueAt(e.clientX));
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    /* hasPointerCapture rather than a boolean in state: the browser already knows whether
     * this gesture belongs to us, and a state flag would need a pointerup handler to clear
     * it — which is the one that gets missed when the pointer is released off-window. */
    if (disabled || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    setCurrent(valueAt(e.clientX));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const big = step * 10;
    const next = {
      ArrowRight: current + step,
      ArrowUp: current + step,
      ArrowLeft: current - step,
      ArrowDown: current - step,
      PageUp: current + big,
      PageDown: current - big,
      Home: min,
      End: max,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setCurrent(quantise(next));
  };

  const readout = format ? format(current) : String(current);

  const control = (c?: FieldControlProps) => (
    <div className={sliderRecipe.rowClasses()}>
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        className={sliderRecipe.classes({
          variant: 'track',
          size,
          force: disabled ? 'disabled' : undefined,
          className,
        })}
      >
        <div className={sliderRecipe.rangeClasses(disabled)} style={{ width: `${pct}%` }} />

        <div
          role="slider"
          tabIndex={disabled ? -1 : 0}
          id={c?.id}
          /* aria-labelledby, NOT the <label for> Field already rendered. A label can only
             be associated with a labelable element, and a div with role="slider" is not one
             — so `for` points at nothing, silently, and the control is announced unnamed.
             This is what Field's `labelId` exists for. */
          aria-labelledby={c?.labelId}
          aria-describedby={c?.['aria-describedby']}
          aria-invalid={c?.['aria-invalid']}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={current}
          /* Omitted rather than set to the bare number — see the note on `format`. */
          aria-valuetext={format ? readout : undefined}
          aria-disabled={disabled || undefined}
          onKeyDown={onKeyDown}
          className={sliderRecipe.thumbClasses(size, disabled)}
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );

  if (!label && !hint && !error) return control();

  return (
    <Field
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      error={error}
      disabled={disabled}
      size={size as FieldSize}
      /* The live value, on the label's baseline. Not under the track: a readout below the
         thumb is a number that moves horizontally as the user drags, which is the one place
         it is hardest to read. */
      labelAside={<span className={sliderRecipe.readoutClasses()}>{readout}</span>}
    >
      {control}
    </Field>
  );
}
