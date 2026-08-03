import { cx } from '@/lib/core/cx';
import type { ButtonSize } from '@/lib/recipes';

/** Spinner box per control size, from the Figma control ramp: 14 / 16 / 18 / 20 /
 *  22 / 22. Two pixels under the icon box at every step, because the spinner is a
 *  ring rather than a glyph and a ring at the icon's full diameter reads larger
 *  than the icon it replaced — the button would appear to twitch on click. */
const SPINNER_BOX: Record<ButtonSize, string> = {
  xs: 'size-[14px]',
  sm: 'size-4',
  md: 'size-[18px]',
  lg: 'size-5',
  xl: 'size-[22px]',
  '2xl': 'size-[22px]',
};

export type SpinnerProps = {
  size?: ButtonSize;
  className?: string;
};

/**
 * An indeterminate progress ring.
 *
 * Deliberately NOT marked `.oz-ambient`, and this is the one animation in the
 * system that opts out of the reduced-motion stop.
 *
 * `.oz-ambient` is the marker for a *decorative* loop — the skeleton pulse — and the
 * reduced-motion block kills it outright, which costs that user nothing because the
 * skeleton's shape already says "content is coming". A spinner is the opposite: the
 * rotation IS the message. Stopped, it is a grey ring that looks like a rendering
 * bug, and the user cannot tell a slow request from a hung one. That is the same
 * exemption logic as STATE_TRANSFORMS in verify-motion.ts — reduced motion removes
 * movement that exists to be noticed, not movement that carries information.
 *
 * It is also the mildest possible case: a 16px ring rotating about its own centre
 * has no translation and no vestibular risk, which is what the guideline is for.
 *
 * Colour comes from `currentColor`, so it inherits whatever fg the button's recipe
 * bound. There is no colour token named here — there is nowhere one could go.
 */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <svg
      className={cx('animate-spin shrink-0', SPINNER_BOX[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      role="presentation"
      aria-hidden="true"
    >
      {/* The full ring at low opacity, then the arc that travels over it. Drawn as
          two circles rather than one dashed stroke so the track stays visible —
          a bare arc on a coloured fill reads as a chip out of the button. */}
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path
        d="M21.5 12A9.5 9.5 0 0 0 12 2.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
