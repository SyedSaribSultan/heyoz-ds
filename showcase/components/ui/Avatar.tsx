'use client';

import { useState } from 'react';
import { avatarRecipe, type AvatarSize, type AvatarTone } from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';
import { cx } from '@/lib/core/cx';

export type AvatarProps = {
  /** The person or brand. Drives the initials AND the tone, so the same name is always the
   *  same colour — see the recipe note on why the tone is derived rather than passed. */
  name: string;
  src?: string;
  /**
   * Names the avatar for assistive technology.
   *
   * Omit it when the name is already on screen beside the avatar, which is the common case: an
   * avatar next to "Sara Malik" is decorative, and announcing it makes a screen reader say the
   * name twice. Pass it when the avatar stands alone for a person — a stack of collaborators,
   * an author chip with no byline.
   */
  label?: string;
  size?: AvatarSize;
  /** Overrides the derived tone. For a brand with a fixed colour, not for people. */
  tone?: AvatarTone;
  forceState?: StateName;
  className?: string;
};

export function Avatar({
  name,
  src,
  label,
  size = 'md',
  tone,
  forceState,
  className,
}: AvatarProps) {
  /* An <img> that has failed is not the same as no <img>, and only the DOM can tell us which.
   * A CSS background-image cannot report failure, which would leave an empty coloured circle
   * where the initials should be — see the recipe note. */
  const [failed, setFailed] = useState(false);
  const resolved = tone ?? avatarRecipe.toneFor(name);
  const initials = avatarRecipe.initialsFor(name);
  /* xs is 20px: two characters would render at 9px. Image or plain disc only. */
  const showInitials = size !== 'xs' && (!src || failed);

  return (
    <span
      /* The name goes on the wrapper, once, and only if the caller asked for it. The img and
         the initials are both aria-hidden below, so there is exactly one announcement or none. */
      {...(label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const })}
      className={avatarRecipe.classes({ variant: resolved, size, force: forceState, className })}
    >
      {src && !failed && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          onError={() => setFailed(true)}
          /* absolute inset-0 rather than w-full h-full: the initials stay in the flow
             underneath, so a slow image reveals them rather than an empty disc, and a broken
             one falls back to them without a reflow. */
          className="absolute inset-0 size-full object-cover"
        />
      )}
      {showInitials && <span aria-hidden="true">{initials}</span>}
    </span>
  );
}

/* -- group ----------------------------------------------------------------- */

export type AvatarGroupProps = {
  /** In display order. The overflow count is computed from the excess, so pass them all. */
  people: Array<{ name: string; src?: string }>;
  /** How many discs before the "+N" tile. */
  max?: number;
  size?: AvatarSize;
  /** Names the whole stack. A group of avatars is one piece of information — "4
   *  collaborators" — not four, so the name belongs here and the members are hidden. */
  label: string;
  className?: string;
};

/**
 * Overlapping avatars with a count.
 *
 * The list is one announcement, not N. Individually labelling six overlapping 20px discs
 * gives a screen-reader user six items to step through in exchange for information the
 * sighted reader gets as "some people" — so the group carries the name and the members are
 * hidden. If the identities matter, they belong in a list with text.
 */
export function AvatarGroup({ people, max = 4, size = 'sm', label, className }: AvatarGroupProps) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;

  return (
    <div role="img" aria-label={label} className={cx('flex items-center', className)}>
      {shown.map((p) => (
        <Avatar
          key={p.name}
          name={p.name}
          src={p.src}
          size={size}
          className={avatarRecipe.groupItemClasses()}
        />
      ))}
      {extra > 0 && (
        <span
          aria-hidden="true"
          className={avatarRecipe.classes({
            /* Variant is required by the recipe and then overridden — the overflow tile is a
               count, not a person, so it takes the neutral fill rather than one of the five
               tones. Passing a real variant keeps the size and shape from the same table. */
            variant: 'brand',
            size,
            className: cx(avatarRecipe.groupItemClasses(), avatarRecipe.overflowClasses()),
          })}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
