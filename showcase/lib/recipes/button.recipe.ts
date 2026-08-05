import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

/* The eleven sub-types the Figma button system ships, flattened onto one axis.
 *
 * Figma groups them into four component sets by colour family — Button/Brand,
 * Button/Neutral, Button/Info, Button/Link — because a Figma component set can
 * only carry so many variant permutations before it becomes unusable on canvas.
 * That is a canvas constraint, not a design statement: `secondary` and `success`
 * are the same kind of thing (a filled button with four states) and belong on the
 * same axis in code. The grouping survives as the order below and as `family` in
 * the intent lines.
 *
 * Link is the one that does NOT flatten in, and it is a separate recipe for the
 * reason Figma also kept it separate: it has no fill, no padding and no height, so
 * every entry in `sizeClasses` would be wrong for it. See buttonLink.recipe.ts. */
export type ButtonVariant =
  | 'primary'
  | 'tonal'
  | 'brand-ghost'
  | 'inverse'
  | 'secondary'
  | 'tertiary'
  | 'outline'
  | 'ghost'
  | 'success'
  | 'warning'
  | 'destructive';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** rect keeps the radius ramp; pill goes to radius/full. Orthogonal to size — see
 *  `corners` on ComponentRecipe for why it is its own axis. */
export type ButtonShape = 'rect' | 'pill';

class ButtonRecipe extends ComponentRecipe<ButtonVariant, ButtonSize, ButtonShape> {
  readonly meta: RecipeMeta = {
    id: 'button',
    group: 'actions',
    title: 'Button',
    tag: 'Button',
    blurb:
      'An action committed on this screen, never a route off it. Eleven sub-types across six sizes and two shapes, with all four interaction states bound on every one of them.',
    notes: [
      'Sizes are the Figma control heights exactly: 32 / 36 / 40 / 48 / 56 / 62. Height is pinned rather than derived from padding because Figma itself uses an off-grid vertical padding at md (9px), xl (15px) and 2xl (18px) to hit those numbers, and reproducing three off-scale paddings is a worse lie than stating the height. Pinning it also means the ramp needs no new type steps — see the comment on sizeClasses.',
      'md is 40px, which is below the 44px touch-target floor this system asserts elsewhere via min-h-target. That is what the Figma library specifies and it is correct for a pointer-driven density; on a touch surface reach for lg (48px) or larger. The floor is not relaxed anywhere — md simply does not claim to meet it.',
      '2xl is the only size that changes weight: 20px semibold against 20px medium at xl. Same type step, so the height is identical and only the stroke differs.',
      'Every filled sub-type disables to the same neutral pair — fill-secondary-disabled with content-primary-disabled — rather than to a faded version of its own fill. A 50%-alpha orange still reads as a brand button and therefore as pressable; grey reads as off. This is why fill-brand-disabled is not bound here despite existing.',
      'primary, inverse, success, warning and destructive use the inset ring in border/focus-inverse; everything on a neutral or transparent ground uses the outward ring in border/focus. That split is the one focus rule the build cannot gate — it can measure both tokens but cannot see which one a component reached for.',
      'White on the orange and red fills measures 3.55:1 and 4.04:1 and is correct. WCAG 2.x has no polarity term so it prefers near-black on any fill lighter than #767676; APCA reverses the verdict. These pairs are gated on APCA Lc 60. An earlier revision "fixed" this and shipped a near-black label on the destructive button.',
      'secondary carries no border. It is a filled grey, and outline is the bordered sub-type — they were one variant in an earlier revision, which meant the only bordered button in the system was also the only one you could not have without a fill.',
    ],
  };

  readonly variants = [
    'primary',
    'tonal',
    'brand-ghost',
    'inverse',
    'secondary',
    'tertiary',
    'outline',
    'ghost',
    'success',
    'warning',
    'destructive',
  ] as const;

  readonly sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
  readonly corners = ['rect', 'pill'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    /* A button does not animate in. It is present when the screen is, and an
     * entrance on a control the user might already be reaching for is a control
     * that moves out from under the cursor. */
    enter: 'none',
    press: 'spatial-fast',
    intent:
      'Colour only, on the fastest effects spring — 120ms, no overshoot. This is the most-executed animation in the system and the one where any delay is read as the product being slow rather than as the animation being long. The press adds a 2% scale on a spatial spring, which is the one place a second spring is justified: the press should feel like the surface gave way, and that is a physical claim about position rather than about colour.',
  };

  protected readonly shape =
    'inline-flex items-center justify-center whitespace-nowrap font-label ' +
    'border-2 border-transparent select-none ' +
    'disabled:cursor-not-allowed';

  /* Height, horizontal padding, gap and type step per size.
   *
   * Height is PINNED rather than derived from padding plus leading, and that choice
   * is what lets this ramp use the type scale as it already exists. Figma's control
   * ramp pairs each size with a bespoke leading (16/20/22/24/26) that this system's
   * `label` and `body` roles do not all provide — but because the box is a fixed
   * height with `items-center`, the leading only sets the line box and the glyph is
   * centred inside it either way. The two steps where the available leading runs 2px
   * long (md and xl) render identically to the canvas; the text simply sits in a
   * slightly taller line box inside the same 40px and 56px button.
   *
   * So the type steps below are the closest existing size at each rung, and three of
   * the five are exact:
   *
   *   xs  label-sm    12/16  exact
   *   sm  body-sm     14/20  exact
   *   md  body-md     16/24  (canvas 16/22 — height pinned, no visual delta)
   *   lg  heading-xs  18/24  exact
   *   xl  heading-sm  20/28  (canvas 20/26 — same)
   *
   * heading-xs and heading-sm are size steps, not family choices — `font-label` in
   * `shape` keeps all six on Geist, which is what the canvas specifies.
   *
   * The border-2 in `shape` sits inside the pinned height because box-sizing is
   * border-box, so a bordered outline and an unbordered primary are the same
   * height in the same row without the border needing to be reserved separately. */
  protected readonly sizeClasses: Record<ButtonSize, string> = {
    xs: 'h-space-9 gap-space-1 px-space-4 text-label-sm font-medium',
    sm: 'h-space-10 gap-space-1 px-space-4 text-body-sm font-medium',
    md: 'h-space-11 gap-space-2 px-space-4 text-body-md font-medium',
    lg: 'h-space-12 gap-space-2 px-space-5 text-heading-xs font-medium',
    xl: 'h-space-13 gap-space-3 px-space-6 text-heading-sm font-medium',
    /* 62px is the one height with no spacing token, and it is off-grid in Figma
     * too — the ramp goes 32/36/40/48/56 on the 4px grid and then steps 6. Written
     * as an arbitrary value rather than rounded to 64, because 2xl exists to be the
     * hero button on a landing page and its height is a composition decision
     * somebody made against real copy. */
    '2xl': 'h-[62px] gap-space-3 px-space-7 text-heading-sm font-semibold',
  };

  /* Rect follows the Figma radius ramp: 10 / 10 / 12 / 16 / 16 / 20. It is keyed on
   * the corner axis rather than folded into sizeClasses above so that pill can
   * override all six with one entry.
   *
   * Because rect's radius varies by size and pill's does not, rect's value has to
   * come from the size row — so it lives here as the empty string and the radius is
   * appended per size below. That is the one wrinkle in the two-axis split. */
  protected readonly cornerClasses: Record<ButtonShape, string> = {
    rect: '',
    pill: 'rounded-full',
  };

  /** Rect radius per size. Applied by `radiusFor` rather than by cornerClasses,
   *  because it is the one property that depends on both axes at once. */
  private readonly rectRadius: Record<ButtonSize, string> = {
    xs: 'rounded-5',
    sm: 'rounded-5',
    md: 'rounded-6',
    lg: 'rounded-8',
    xl: 'rounded-8',
    '2xl': 'rounded-9',
  };

  /** The radius for a size/shape pair. pill ignores the size; rect reads the ramp. */
  radiusFor(size: ButtonSize, shape: ButtonShape): string {
    return shape === 'pill' ? 'rounded-full' : this.rectRadius[size];
  }

  protected readonly bindings: Record<ButtonVariant, VariantBinding> = {
    /* ---- family: Brand ---------------------------------------------------- */
    primary: {
      intent: 'The one action the screen exists for. At most one per view.',
      base: { bg: 'fill-brand', fg: 'content-on-brand' },
      hover: { bg: 'fill-brand-hover' },
      active: { bg: 'fill-brand-active' },
      disabled: { bg: 'fill-secondary-disabled', fg: 'content-primary-disabled' },
      focus: 'inset',
    },
    tonal: {
      intent:
        'Brand weight without brand volume. A second brand-coloured action beside a primary, or a primary on a surface that already carries the accent.',
      base: { bg: 'fill-brand-secondary', fg: 'content-brand' },
      hover: { bg: 'fill-brand-secondary-hover' },
      /* fg moves with the fill, and it has to.
       *
       * In dark mode `content-brand` is brand/50 and `fill-brand-secondary-active` is
       * a 30% wash of brand/50 — the same primitive on both sides of the pairing, which
       * measured 4.44:1 against the 4.5 floor. verify-contrast.ts caught it; the base
       * and hover states both passed, so this is CLAUDE.md rule 4 again: the sibling
       * nobody named was the broken one.
       *
       * content-brand-hover is one ramp step further from the wash in BOTH modes —
       * brand/90 in light, brand/40 in dark — so it lifts the label away from the fill
       * whichever direction the fill moved. The name says hover and the state is
       * active, which reads oddly; the alternative was a new content step, and the
       * existing ramp already had the value. */
      active: { bg: 'fill-brand-secondary-active', fg: 'content-brand-hover' },
      disabled: { bg: 'fill-secondary-disabled', fg: 'content-primary-disabled' },
      focus: 'outline',
    },
    'brand-ghost': {
      intent: 'A brand-coloured tertiary action. Reads as a link that happens to be a button.',
      base: { bg: 'transparent', fg: 'content-brand' },
      hover: { bg: 'fill-brand-secondary' },
      active: { bg: 'fill-brand-secondary-hover' },
      disabled: { bg: 'fill-secondary-disabled', fg: 'content-primary-disabled' },
      focus: 'outline',
    },

    /* ---- family: Neutral -------------------------------------------------- */
    inverse: {
      intent:
        'The committing action where brand orange would be wrong: a destructive-adjacent confirm, or a primary inside an already-orange region.',
      base: { bg: 'fill-inverse', fg: 'content-inverse-primary' },
      hover: { bg: 'fill-inverse-hover' },
      active: { bg: 'fill-inverse-active' },
      disabled: { bg: 'fill-secondary-disabled', fg: 'content-primary-disabled' },
      focus: 'inset',
    },
    secondary: {
      intent: 'A real alternative to the primary action, not a lesser one.',
      base: { bg: 'fill-secondary', fg: 'content-primary' },
      hover: { bg: 'fill-secondary-hover' },
      active: { bg: 'fill-secondary-active' },
      disabled: { bg: 'fill-secondary-disabled', fg: 'content-primary-disabled' },
      focus: 'outline',
    },
    tertiary: {
      intent:
        'One step quieter than secondary, for a row of peers where none should lead. Distinguished from it only by surface step.',
      base: { bg: 'fill-tertiary', fg: 'content-primary' },
      hover: { bg: 'fill-tertiary-hover' },
      active: { bg: 'fill-tertiary-active' },
      disabled: { bg: 'fill-secondary-disabled', fg: 'content-primary-disabled' },
      focus: 'outline',
    },
    outline: {
      borderJob: 'affordance',
      intent:
        'The boundary is the affordance. For a button on a surface whose colour is not known at author time — a card, an image, a coloured panel.',
      base: { bg: 'transparent', fg: 'content-primary', border: 'border-secondary' },
      hover: { bg: 'fill-secondary', border: 'border-secondary-hover' },
      active: { bg: 'fill-secondary-hover' },
      disabled: {
        fg: 'content-primary-disabled',
        border: 'border-secondary-disabled',
      },
      focus: 'outline',
    },
    ghost: {
      intent: 'Tertiary actions that must not compete: toolbar icons, dismiss, cancel.',
      base: { bg: 'transparent', fg: 'content-primary' },
      hover: { bg: 'fill-secondary' },
      /* fg is restated here rather than inherited from hover, and that is not
       * redundancy. In a mouse press :active and :hover both match, so the label
       * would be content-primary anyway — but a keyboard Enter or a touch tap fires
       * :active with no :hover, and a lighter label on fill-secondary-hover
       * measured 3.61:1 in dark mode against a 4.5 floor. Found by
       * scripts/verify-contrast.ts, which is the same class of bug CLAUDE.md rule 4
       * describes: the state that was gated passed, and the sibling nobody named
       * was the broken one. */
      active: { bg: 'fill-secondary-hover', fg: 'content-primary' },
      disabled: { fg: 'content-primary-disabled' },
      focus: 'outline',
    },

    /* ---- family: Info ----------------------------------------------------- */
    success: {
      intent:
        'Commits something whose outcome is good and worth colouring: approve, publish, accept. Rare — most confirmations are just primary.',
      base: { bg: 'fill-success', fg: 'content-on-success' },
      hover: { bg: 'fill-success-hover' },
      active: { bg: 'fill-success-active' },
      disabled: { bg: 'fill-secondary-disabled', fg: 'content-primary-disabled' },
      focus: 'inset',
    },
    warning: {
      intent:
        'Proceeds into something recoverable but consequential: overwrite, downgrade, cancel a subscription.',
      base: { bg: 'fill-warning', fg: 'content-on-warning' },
      hover: { bg: 'fill-warning-hover' },
      active: { bg: 'fill-warning-active' },
      disabled: { bg: 'fill-secondary-disabled', fg: 'content-primary-disabled' },
      focus: 'inset',
    },
    destructive: {
      intent: 'Irreversible. Never the default focus target in a dialog.',
      base: { bg: 'fill-critical', fg: 'content-on-critical' },
      hover: { bg: 'fill-critical-hover' },
      active: { bg: 'fill-critical-active' },
      disabled: { bg: 'fill-secondary-disabled', fg: 'content-primary-disabled' },
      focus: 'inset',
    },
  };

  protected sampleChildren(variant: ButtonVariant): string {
    /* Deliberately different lengths. Equal-length labels hide the fact that a row
     * of buttons has to survive "Delete permanently" next to "Cancel". */
    const copy: Record<ButtonVariant, string> = {
      primary: 'Generate video',
      tonal: 'Add another brand',
      'brand-ghost': 'See full details',
      inverse: 'Get Plan',
      secondary: 'Save draft',
      tertiary: 'Duplicate',
      outline: 'Cancel',
      ghost: 'Dismiss',
      success: 'Approve',
      warning: 'Downgrade plan',
      destructive: 'Delete permanently',
    };
    return copy[variant];
  }
}

export const buttonRecipe = new ButtonRecipe();
