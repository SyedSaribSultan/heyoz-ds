import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

/* Fourteen variants: five status roles plus brand, each in a solid and a subtle
 * weight, plus four neutrals.
 *
 * The solid/subtle pairing is the whole structure. A subtle badge is a status word
 * on a tint of its own colour and is what a table of thirty rows wants; a solid
 * badge is the same word on a saturated fill and is what one row wants when it is
 * the row that matters. They are not two sizes of emphasis picked by taste — the
 * subtle ones recede in a list and the solid ones do not, so a list of solid badges
 * has no hierarchy left to spend. */
export type BadgeVariant =
  | 'neutral-subtle'
  | 'neutral-strong'
  | 'neutral'
  | 'neutral-over-image'
  | 'brand'
  | 'brand-subtle'
  | 'success'
  | 'success-subtle'
  | 'warning'
  | 'warning-subtle'
  | 'critical'
  | 'critical-subtle'
  | 'info'
  | 'info-subtle';

/** One size. Figma's Badge set has no size axis and this follows it — see the note
 *  in `meta` for why the previous `sm` step went. */
export type BadgeSize = 'md';

class BadgeRecipe extends ComponentRecipe<BadgeVariant, BadgeSize> {
  readonly meta: RecipeMeta = {
    id: 'badge',
    title: 'Badge',
    tag: 'Badge',
    blurb:
      'A status word in a pill. Not a button — if it can be clicked it is the wrong component. Fourteen variants, each in a resting and a disabled state.',
    notes: [
      'One size, 20px tall, matching the Figma set which has no size axis. The previous sm/md pair was a 20px and a 24px badge whose only difference was padding, and nothing chose between them on a rule — a badge is sized by its text step, and there is only one text step small enough to sit inside a table row.',
      'The solid variants pair fill/<role> with content/on-<role>, and the subtle ones pair fill/<role>-secondary with content/<role>. Those are two different gated pairings and they are not interchangeable: content/<role> on a saturated fill/<role> is a mid-tone on a mid-tone and fails everywhere, which is exactly what happens if somebody "simplifies" the two families into one.',
      'neutral-over-image uses an OPAQUE plate where the canvas draws a translucent one, and the reason is that a translucent plate over a photograph has no measurable contrast — the thing showing through it is whatever the user uploaded. At the canvas value it measured 3.79:1 against the 4.5 floor and verify-contrast.ts rejected it. Opaque needs no new token and no exemption, because the label then sits on fill/inverse, which is already gated. Do not use this variant where the background is known — one of the thirteen others is a better fit and none of them pays for an opaque plate.',
      'The leading dot is a 12px slot, not a decoration baked into the fill. It defaults to a filled circle in currentColor and takes any 12x12 glyph, which is how "Ready" becomes a tick and "Failed" becomes a cross without a second component.',
      'Disabled is a real state here even though a badge is not interactive, because a badge frequently labels a row that is itself disabled. It fades fill and text together rather than dropping opacity on the whole pill, so the text does not composite twice and go muddy.',
    ],
  };

  readonly variants = [
    'neutral-subtle',
    'neutral-strong',
    'neutral',
    'neutral-over-image',
    'brand',
    'brand-subtle',
    'success',
    'success-subtle',
    'warning',
    'warning-subtle',
    'critical',
    'critical-subtle',
    'info',
    'info-subtle',
  ] as const;

  readonly sizes = ['md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-default',
    properties: 'colors',
    /* Pops. A badge almost always appears because state changed — a render finished,
     * a status flipped — so it is the arrival of information rather than furniture,
     * and scale-from-96% is the shortest way to say that. */
    enter: 'pop',
    intent:
      'No pointer states at all — a badge is not interactive — so the transition only matters when a variant changes underneath it, which is exactly when a status updates from Rendering to Ready. effects-default rather than effects-fast because that colour change is information the user should notice, and 120ms is below the threshold where a change registers as having happened.',
  };

  /* No border, on any variant.
   *
   * Six of them came off here, and they were the clearest separation case in the
   * system: every badge already sits on its own tint, so the fill was doing the
   * separating and the stroke was drawing a line around a shape that already had an
   * edge. A row of six outlined pills reads as a row of six boxes; the same row
   * filled reads as six statuses.
   *
   * `border-2` is gone from the shape too, not just the bindings. Elsewhere in this
   * system a transparent border is kept to reserve the box so a bordered and an
   * unbordered variant match heights in one row — Button and Switch both do that.
   * Badge has no bordered variant left to match, so the reservation would be
   * padding pretending to be a border. */
  protected readonly shape =
    'inline-flex items-center whitespace-nowrap font-label font-medium rounded-full';

  /* 8 horizontal, 2 vertical, 16px leading — which is 20px tall, the Figma height.
   *
   * The 2px values are arbitrary rather than tokens because the spacing scale starts
   * at 4 and a 4px vertical padding here makes a 24px badge that no longer fits
   * inside a 20px table row. A badge is the one component in the system smaller than
   * the smallest spacing step, which is a fact about the scale rather than about the
   * badge. Same for the 2px gap: at 4 the dot detaches from its word. */
  protected readonly sizeClasses: Record<BadgeSize, string> = {
    md: 'gap-[2px] px-space-3 py-[2px] text-label-sm',
  };

  protected readonly bindings: Record<BadgeVariant, VariantBinding> = {
    /* ---- neutrals --------------------------------------------------------- */
    'neutral-subtle': {
      intent: 'Metadata with no valence: a count, a model name, a tag. The default.',
      base: { bg: 'fill-secondary', fg: 'content-secondary' },
      disabled: { bg: 'fill-secondary-disabled', fg: 'content-secondary-disabled' },
      focus: 'none',
    },
    'neutral-strong': {
      intent: 'The same thing one surface step up, for a badge on an already-grey card.',
      base: { bg: 'fill-tertiary', fg: 'content-secondary' },
      disabled: { bg: 'fill-tertiary-disabled', fg: 'content-secondary-disabled' },
      focus: 'none',
    },
    neutral: {
      intent: 'Metadata that must be found first: a plan name, a "PRO" marker.',
      base: { bg: 'fill-inverse', fg: 'content-inverse-primary' },
      disabled: { bg: 'fill-inverse-disabled', fg: 'content-inverse-primary-disabled' },
      focus: 'none',
    },
    'neutral-over-image': {
      intent:
        'A label on a thumbnail, a duration on a video frame. The only variant whose backdrop is unknown, which is why its plate is opaque.',
      /* OPAQUE, where the canvas draws a translucent #ffffff80 scrim.
       *
       * A translucent plate cannot be gated: what shows through it is a photograph,
       * so the effective contrast is whatever the user uploaded. The nearest thing
       * this system can measure is the plate over the page, and at 50% black that
       * lands at 3.79:1 against a 4.5 floor — verify-contrast.ts failed it, correctly.
       *
       * The available fixes were a heavier alpha rung (a foundation change, declined),
       * binding `fill/inverse-disabled` for its value (a -disabled token doing resting
       * duty, which is a trap), or an opaque plate. Opaque is the one that needs no
       * new token and no exemption: the image cannot show through, so the contrast is
       * the plate/label pair, and that pair is already gated. It reads slightly
       * heavier than the canvas and is legible on every frame rather than on most. */
      base: { bg: 'fill-inverse', fg: 'content-inverse-primary' },
      disabled: { bg: 'fill-inverse-disabled', fg: 'content-inverse-primary-disabled' },
      focus: 'none',
    },

    /* ---- brand ------------------------------------------------------------ */
    brand: {
      intent: 'New, beta, or otherwise ours, where it has to carry. Sparingly.',
      base: { bg: 'fill-brand', fg: 'content-on-brand' },
      disabled: { bg: 'fill-brand-disabled', fg: 'content-on-brand-disabled' },
      focus: 'none',
    },
    'brand-subtle': {
      intent: 'The same claim inside a list, where a solid orange pill would shout.',
      base: { bg: 'fill-brand-secondary', fg: 'content-brand' },
      disabled: { bg: 'fill-brand-secondary-disabled', fg: 'content-brand-disabled' },
      focus: 'none',
    },

    /* ---- status ----------------------------------------------------------- */
    success: {
      intent: 'A finished, good outcome that is the point of the row: Ready, Paid.',
      base: { bg: 'fill-success', fg: 'content-on-success' },
      disabled: { bg: 'fill-success-disabled', fg: 'content-on-success-disabled' },
      focus: 'none',
    },
    'success-subtle': {
      intent: 'The same outcome in a table of thirty rows that are mostly fine.',
      base: { bg: 'fill-success-secondary', fg: 'content-success' },
      disabled: { bg: 'fill-success-secondary-disabled', fg: 'content-success-disabled' },
      focus: 'none',
    },
    warning: {
      intent: 'Needs attention but nothing is broken yet. Near a limit, expiring.',
      base: { bg: 'fill-warning', fg: 'content-on-warning' },
      disabled: { bg: 'fill-warning-disabled', fg: 'content-on-warning-disabled' },
      focus: 'none',
    },
    'warning-subtle': {
      intent: 'The quiet form: a quota badge that is not yet a problem.',
      base: { bg: 'fill-warning-secondary', fg: 'content-warning' },
      disabled: { bg: 'fill-warning-secondary-disabled', fg: 'content-warning-disabled' },
      focus: 'none',
    },
    critical: {
      intent: 'Failed or blocked. Something must be done, and this is the one row.',
      base: { bg: 'fill-critical', fg: 'content-on-critical' },
      disabled: { bg: 'fill-critical-disabled', fg: 'content-on-critical-disabled' },
      focus: 'none',
    },
    'critical-subtle': {
      intent: 'Failed, in a list where several have. Still red, no longer an alarm.',
      base: { bg: 'fill-critical-secondary', fg: 'content-critical' },
      disabled: { bg: 'fill-critical-secondary-disabled', fg: 'content-critical-disabled' },
      focus: 'none',
    },
    info: {
      intent: 'Neutral system state that should be noticed: Queued, Processing.',
      base: { bg: 'fill-info', fg: 'content-on-info' },
      disabled: { bg: 'fill-info-disabled', fg: 'content-on-info-disabled' },
      focus: 'none',
    },
    'info-subtle': {
      intent: 'The same state as ambient information rather than as news.',
      base: { bg: 'fill-info-secondary', fg: 'content-info' },
      disabled: { bg: 'fill-info-secondary-disabled', fg: 'content-info-disabled' },
      focus: 'none',
    },
  };

  protected sampleChildren(variant: BadgeVariant): string {
    const copy: Record<BadgeVariant, string> = {
      'neutral-subtle': 'Seedance 2',
      'neutral-strong': '1 per platform',
      neutral: 'FULLY MANAGED',
      'neutral-over-image': '0:24',
      brand: 'BEST VALUE',
      'brand-subtle': '2.5x Starter',
      success: 'Ready',
      'success-subtle': 'Paid',
      warning: '82% of quota',
      'warning-subtle': 'Expiring',
      critical: 'Failed',
      'critical-subtle': 'Blocked',
      info: 'Rendering',
      'info-subtle': 'Queued',
    };
    return copy[variant];
  }
}

export const badgeRecipe = new BadgeRecipe();
