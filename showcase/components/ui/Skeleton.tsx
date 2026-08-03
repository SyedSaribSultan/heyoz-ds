'use client';

import { skeletonRecipe, type SkeletonVariant } from '@/lib/recipes';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: SkeletonVariant;
  /** Tailwind width utility for the line variant, e.g. 'w-2/3'. Varying widths is
   *  what makes a skeleton read as text rather than as a set of bars. */
  width?: string;
};

export function Skeleton({ variant = 'line', width, className, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={skeletonRecipe.classes({
        variant,
        className: [skeletonRecipe.geometryFor(variant), width, className]
          .filter(Boolean)
          .join(' '),
      })}
      {...rest}
    />
  );
}

/** The shape a caller actually wants: a labelled loading region, announced once,
 *  with the skeletons themselves hidden. Eleven unlabelled boxes read aloud is the
 *  failure mode this exists to prevent. */
export function SkeletonGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
