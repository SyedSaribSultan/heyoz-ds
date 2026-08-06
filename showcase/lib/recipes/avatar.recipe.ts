import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

/* The five grounds an initials avatar can land on.
 *
 * Not a random palette and not the chart series. These are the five `*-secondary` washes the
 * system already ships for status tints, which means every one of them is a token whose
 * foreground pairing is already gated — and it means an avatar cannot introduce a colour the
 * rest of the system does not have. The assignment is deterministic (see `toneFor`), so the
 * same person is the same colour on every screen. */
export type AvatarTone = 'brand' | 'success' | 'warning' | 'critical' | 'info';
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

class AvatarRecipe extends ComponentRecipe<AvatarTone, AvatarSize> {
  readonly meta: RecipeMeta = {
    id: 'avatar',
    group: 'identity',
    title: 'Avatar',
    tag: 'Avatar',
    blurb:
      'A person or a brand, as an image with a deterministic initials fallback. The fallback is the real component — an avatar that renders nothing when an image 404s is the state it will be in most often.',
    notes: [
      'The tone is DERIVED from the name, not passed in. A hash of the string picks one of five, so the same person is the same colour in the sidebar, on the comment and in the row — and nobody has to store an avatar colour. Passing it in would let two screens disagree about one person, which is worse than any particular colour being wrong.',
      'Five tones, and they are the status washes the system already ships rather than a new palette. Every one is a token whose foreground pairing is already gated, so an avatar cannot introduce an unmeasured colour. That constrains the range to five — which is the right trade: a set of twelve distinct avatar colours would mean twelve new gated pairings for a decorative distinction nobody navigates by.',
      'Initials are computed from the first and last word, capped at two characters. Three-letter initials do not fit a 24px circle at a readable size, and a middle name is not what distinguishes two people in a list.',
      'The image is a real <img> with onError, not a CSS background. A background-image cannot report failure, so the initials fallback would never appear — the avatar would just be an empty coloured circle, which looks like a bug rather than like a person without a photo.',
      'aria-hidden on the initials and the image both, with the name on the wrapper. An avatar beside a name that is already on screen is decorative and announcing it repeats the name; an avatar standing alone for a person needs the name, and that is what the wrapper carries. One decision, made by whether `label` is passed.',
      'xs is 20px and has no initials — only an image or a plain tinted disc. Two characters at 20px is 9px type, below anything this system will render, and a single initial is ambiguous enough to be worse than no initial at all.',
      'AvatarGroup overlaps with a ring in the PAGE colour, not a border. The ring separates one disc from the next, which is separation — a border there is rule 1c, and the honest form is a ring painted in whatever is behind the group. It takes a `ring` utility rather than `border` for the same reason Separator takes a background.',
    ],
  };

  readonly variants = ['brand', 'success', 'warning', 'critical', 'info'] as const;
  readonly sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    enter: 'none',
    intent:
      'Colour only, and in practice almost nothing animates — an avatar has no interaction states of its own. The transition exists for the case where an avatar sits inside something that does have them, a menu row or a table row, so its tint moves with the row rather than a beat behind it. No entrance: a grid of twelve avatars fading in one at a time is a loading state pretending to be a flourish.',
  };

  protected readonly shape =
    'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ' +
    'select-none font-label font-medium';

  protected readonly sizeClasses: Record<AvatarSize, string> = {
    xs: 'size-space-6 text-label-xs',
    sm: 'size-space-9 text-label-sm',
    md: 'size-space-11 text-label-md',
    lg: 'size-space-12 text-body-md',
    xl: 'size-space-14 text-heading-xs',
  };

  /* The five washes, each with the status content token that is already gated against it. */
  protected readonly bindings: Record<AvatarTone, VariantBinding> = {
    brand: {
      intent: 'One of five. Assigned by hash, never chosen.',
      base: { bg: 'fill-brand-secondary', fg: 'content-brand-active' },
      focus: 'none',
    },
    success: {
      intent: 'One of five.',
      base: { bg: 'fill-success-secondary', fg: 'content-success-hover' },
      focus: 'none',
    },
    warning: {
      intent: 'One of five.',
      base: { bg: 'fill-warning-secondary', fg: 'content-warning-hover' },
      focus: 'none',
    },
    critical: {
      intent: 'One of five. Carries no failure meaning here — it is a colour, not a status.',
      base: { bg: 'fill-critical-secondary', fg: 'content-critical-hover' },
      focus: 'none',
    },
    info: {
      intent: 'One of five.',
      base: { bg: 'fill-info-secondary', fg: 'content-info-hover' },
      focus: 'none',
    },
  };

  /**
   * Pick a tone from a name.
   *
   * A small FNV-1a-style hash rather than `name.length % 5` or a char-code sum, both of which
   * cluster badly on real data: length buckets every 5-character name together, and a plain
   * sum collides on anagrams and on names that differ by one letter either side of a
   * boundary. This spreads adjacent strings, which is the only property that matters — two
   * people in the same list should look different.
   */
  toneFor(name: string): AvatarTone {
    let h = 0x811c9dc5;
    for (let i = 0; i < name.length; i += 1) {
      h ^= name.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return this.variants[Math.abs(h) % this.variants.length];
  }

  /** First and last word, capped at two. See the notes for why not three. */
  initialsFor(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  /** The overlap ring in AvatarGroup. A ring in the page colour, not a border — see the
   *  notes. `ring-offset` is not used: the ring is drawn on the disc's own edge, which is
   *  what makes the stack read as overlapping rather than as spaced. */
  groupItemClasses(): string {
    return '-ml-space-3 ring-2 ring-background first:ml-0';
  }

  /** The "+3 more" disc at the end of a group. Neutral rather than one of the five tones,
   *  because it is a count and not a person. */
  overflowClasses(): string {
    return 'bg-fill-tertiary text-content-secondary';
  }

  protected sampleChildren(): string {
    return '';
  }
}

export const avatarRecipe = new AvatarRecipe();
