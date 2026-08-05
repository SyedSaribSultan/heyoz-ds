import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

/* Seven sub-types. Six are the neutral and brand families off Button; the seventh
 * is the reason this recipe exists separately rather than as a prop on Button.
 *
 * `fixed` is a white control for use over an image or a video frame — the one place
 * in the system where the surface underneath is whatever the user uploaded, so
 * neither mode's palette applies. It has no label-bearing equivalent because a
 * white pill with a word in it over a photograph is a caption, not a button. */
export type IconButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'outline'
  | 'ghost'
  | 'brand'
  | 'fixed';

export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type IconButtonShape = 'rect' | 'pill';

class IconButtonRecipe extends ComponentRecipe<
  IconButtonVariant,
  IconButtonSize,
  IconButtonShape
> {
  readonly meta: RecipeMeta = {
    id: 'icon-button',
    group: 'actions',
    title: 'Icon Button',
    tag: 'IconButton',
    blurb:
      'A button whose whole label is one glyph. Square at every size, which is the only structural difference from Button — and the reason it needs its own name rather than a prop.',
    notes: [
      'Square means w = h, not "roughly square". The size ramp is 32 / 36 / 40 / 48 / 56 / 64, and 2xl is 64 here against 62 on Button: a 62px square looks like a mistake next to a 64px one, and there is no label to justify the odd number.',
      'An icon with no text needs an accessible name, so `label` is required and lands on aria-label. This is the one prop in the system whose absence is a type error rather than a lint warning — an unlabelled icon button is invisible to a screen reader and it is the single most common accessibility defect in a component library.',
      'fixed is white in both modes because it sits on an image, and it is the only variant with no hover or active COLOUR — every neutral fill ramp in this system inverts between modes, so there is no mode-independent step for it to move to. It takes its pointer feedback from opacity instead. It is also the only variant whose disabled state keeps its own fill rather than falling back to neutral grey, because grey on an unknown background is not reliably legible as "off".',
      'primary and brand use the inset ring; the five variants on neutral or transparent ground use the outward ring. fixed uses the outward ring in border/focus, not the inverse one — the inverse ring is page-coloured, and over an image the page colour is not what is behind the control.',
      'No press-scale. Button has one, and an icon button is small enough that a 2% scale on a 32px square is roughly half a pixel — below the threshold where it reads as anything but a rendering artefact.',
    ],
  };

  readonly variants = [
    'primary',
    'secondary',
    'tertiary',
    'outline',
    'ghost',
    'brand',
    'fixed',
  ] as const;

  readonly sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
  readonly corners = ['rect', 'pill'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    enter: 'none',
    intent:
      'Colour only, on the fastest effects spring, and no press-scale — which is the decision worth stating. Button presses down by 2% because it is large enough that the scale reads as the surface giving way. On a 32px square the same 2% is 0.6px: too small to read as movement, large enough to look like the glyph shifted a subpixel and re-rasterised. The press feedback here is the active fill, which is a full ramp step and unmistakable.',
  };

  /* size-* rather than w/h pairs, so the square cannot drift into a rectangle by
   * somebody editing one of the two numbers. */
  protected readonly shape =
    'inline-flex items-center justify-center shrink-0 ' +
    'border-2 border-transparent select-none ' +
    'disabled:cursor-not-allowed';

  protected readonly sizeClasses: Record<IconButtonSize, string> = {
    xs: 'size-space-9 [&>svg]:size-4',
    sm: 'size-space-10 [&>svg]:size-[18px]',
    md: 'size-space-11 [&>svg]:size-[22px]',
    lg: 'size-space-12 [&>svg]:size-6',
    xl: 'size-space-13 [&>svg]:size-[26px]',
    '2xl': 'size-space-14 [&>svg]:size-7',
  };

  protected readonly cornerClasses: Record<IconButtonShape, string> = {
    rect: '',
    pill: 'rounded-full',
  };

  /** Same rect ramp as Button — 10 / 10 / 12 / 16 / 16 / 20. Duplicated rather than
   *  imported because the two components are free to diverge and a shared constant
   *  would quietly forbid that; if they drift, the Figma library drifted first. */
  private readonly rectRadius: Record<IconButtonSize, string> = {
    xs: 'rounded-5',
    sm: 'rounded-5',
    md: 'rounded-6',
    lg: 'rounded-8',
    xl: 'rounded-8',
    '2xl': 'rounded-9',
  };

  radiusFor(size: IconButtonSize, shape: IconButtonShape): string {
    return shape === 'pill' ? 'rounded-full' : this.rectRadius[size];
  }

  protected readonly bindings: Record<IconButtonVariant, VariantBinding> = {
    primary: {
      intent: 'The committing icon action. A send arrow, a confirm tick.',
      base: { bg: 'fill-inverse', fg: 'content-inverse-primary' },
      hover: { bg: 'fill-inverse-hover' },
      active: { bg: 'fill-inverse-active' },
      disabled: { bg: 'fill-secondary-disabled', fg: 'content-primary-disabled' },
      focus: 'inset',
    },
    secondary: {
      intent: 'The default icon button. A toolbar action that is not the main one.',
      base: { bg: 'fill-secondary', fg: 'content-primary' },
      hover: { bg: 'fill-secondary-hover' },
      active: { bg: 'fill-secondary-active' },
      disabled: { bg: 'fill-secondary-disabled', fg: 'content-primary-disabled' },
      focus: 'outline',
    },
    tertiary: {
      intent: 'One step quieter than secondary, for a dense row of equal actions.',
      base: { bg: 'fill-tertiary', fg: 'content-primary' },
      hover: { bg: 'fill-tertiary-hover' },
      active: { bg: 'fill-tertiary-active' },
      disabled: { bg: 'fill-secondary-disabled', fg: 'content-primary-disabled' },
      focus: 'outline',
    },
    outline: {
      borderJob: 'affordance',
      intent: 'The boundary is the affordance. For an icon button on an unknown surface.',
      base: { bg: 'transparent', fg: 'content-primary', border: 'border-secondary' },
      hover: { bg: 'fill-secondary', border: 'border-secondary-hover' },
      active: { bg: 'fill-secondary-hover' },
      disabled: { fg: 'content-primary-disabled', border: 'border-secondary-disabled' },
      focus: 'outline',
    },
    ghost: {
      intent: 'A close X, a chevron, an overflow menu. The most common of the seven.',
      base: { bg: 'transparent', fg: 'content-primary' },
      hover: { bg: 'fill-secondary' },
      /* fg restated for the same reason as Button.ghost: a keyboard Enter or a touch
       * tap fires :active with no :hover, so this state has to stand on its own. */
      active: { bg: 'fill-secondary-hover', fg: 'content-primary' },
      disabled: { fg: 'content-primary-disabled' },
      focus: 'outline',
    },
    brand: {
      intent: 'An icon action that is the brand doing something: generate, enhance.',
      base: { bg: 'fill-brand', fg: 'content-on-brand' },
      hover: { bg: 'fill-brand-hover' },
      active: { bg: 'fill-brand-active' },
      disabled: { bg: 'fill-secondary-disabled', fg: 'content-primary-disabled' },
      focus: 'inset',
    },
    fixed: {
      intent:
        'Over an image or a video frame, where the surface belongs to the user and neither palette applies. White in both modes.',
      base: { bg: 'fill-fixed', fg: 'content-fixed-primary' },
      /* No hover or active COLOUR, and that is a real constraint rather than an
       * oversight. `fixed` has to be mode-independent — white over a photograph in
       * both light and dark — and every neutral fill ramp in this system inverts
       * between modes, so there is no darker-white step to move to. `fill/secondary`
       * would give a light grey in light mode and a near-black in dark, which is the
       * opposite of the intent on the hover of a white button.
       *
       * So this variant takes its pointer feedback from opacity instead, applied in
       * IconButton.tsx — see FIXED_FEEDBACK there. Opacity is geometry, so it needs no
       * token and inverts with nothing. The alternative was a mode-independent
       * light-neutral ramp, which is a foundation addition this component does not
       * justify on its own. */
      disabled: { bg: 'fill-fixed-disabled', fg: 'content-fixed-primary-disabled' },
      /* The outward ring, not the inverse one. border/focus-inverse is the page
       * colour, and over an image the page colour is not what is behind the ring. */
      focus: 'outline',
    },
  };

  protected sampleChildren(_variant: IconButtonVariant): string {
    return '';
  }
}

export const iconButtonRecipe = new IconButtonRecipe();
