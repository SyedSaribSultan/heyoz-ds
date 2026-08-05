import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type DropzoneVariant = 'idle' | 'active' | 'invalid';
export type DropzoneSize = 'md' | 'lg';

class DropzoneRecipe extends ComponentRecipe<DropzoneVariant, DropzoneSize> {
  readonly meta: RecipeMeta = {
    id: 'dropzone',
    title: 'Dropzone',
    tag: 'Dropzone',
    blurb:
      'A file drop target that is also a button. Drag is the affordance people reach for and the click is the one that always works, so it has to be both — a drop-only zone is unusable from a keyboard and on most phones.',
    notes: [
      'It is a <label> wrapping a hidden <input type="file">, not a div with onClick. That single choice supplies the keyboard, the Enter and Space activation, the focus ring, the form association and the native file picker — all of which a div has to reimplement, and the reimplementation is what makes so many uploaders unreachable without a mouse.',
      'active is a real third variant, not a hover. Hover means "the pointer is here"; active means "you are carrying something and releasing it will drop it", which is a different promise and needs to be unmistakable — so it changes the fill and the border together rather than stepping one of them.',
      'The dashed border is the one dashed stroke in the system, and it is an affordance under rule 1c: a drop target with a solid border is a card, and nothing about a card says a file can be released onto it. Dashed is the only convention users already have for "this is a place to put something".',
      'dragenter and dragleave are counted, not toggled. Both fire on every descendant, so dragging across the icon inside the zone fires dragleave on the zone itself — a boolean flag makes the active state flicker on and off as the pointer crosses children, which is the classic dropzone bug. A depth counter incremented on enter and decremented on leave only reaches zero when the pointer has genuinely left.',
      'A rejected file is reported, never silently dropped. Filtering out an oversized file without saying so leaves the user looking at a list missing the one thing they were trying to upload, with no way to find out why. Rejections come back with a reason.',
      'The size cap is checked here AND has to be checked on the server. This one is a convenience so the user finds out in a millisecond instead of after a two-minute upload; it is not a control, because `accept` and any client-side size check are trivially bypassed.',
    ],
  };

  readonly variants = ['idle', 'active', 'invalid'] as const;
  readonly sizes = ['md', 'lg'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    enter: 'none',
    intent:
      'Colour only, fastest effects spring. The state change that matters is idle → active, and it happens while the user is holding a file over the zone — a slow transition there means they release before the zone has confirmed it will accept the drop, which is exactly the moment they need the answer. Nothing spatial: a target that grows or lifts as you approach it moves the thing you are aiming at, and unlike a button the aim here is a drop rather than a click, so there is no second chance.',
  };

  /* border-dashed is the semantic marker — see the notes. `cursor-pointer` because the
   * whole thing is a label for a file input, and a label that does not look clickable is a
   * button people do not press. */
  protected readonly shape =
    'relative flex w-full cursor-pointer flex-col items-center justify-center text-center ' +
    'rounded-8 border-2 border-dashed ' +
    'has-[:disabled]:cursor-not-allowed';

  protected readonly sizeClasses: Record<DropzoneSize, string> = {
    md: 'gap-space-3 px-space-6 py-space-9',
    lg: 'gap-space-4 px-space-7 py-space-14',
  };

  protected readonly bindings: Record<DropzoneVariant, VariantBinding> = {
    idle: {
      borderJob: 'affordance',
      intent: 'Waiting. The boundary is the whole control.',
      base: { bg: 'surface-secondary', fg: 'content-secondary', border: 'border-secondary' },
      hover: { bg: 'fill-secondary-hover', border: 'border-secondary-hover' },
      disabled: {
        bg: 'fill-secondary-disabled',
        fg: 'content-primary-disabled',
        border: 'border-primary-disabled',
      },
      focus: 'outline',
    },
    active: {
      borderJob: 'affordance',
      intent: 'A file is being carried over the zone and releasing it will drop it here.',
      base: { bg: 'fill-brand-secondary', fg: 'content-brand-hover', border: 'border-brand' },
      focus: 'outline',
    },
    invalid: {
      borderJob: 'affordance',
      intent: 'The last drop was rejected, or the field is required and empty.',
      base: { bg: 'surface-secondary', fg: 'content-secondary', border: 'border-critical' },
      hover: { border: 'border-critical-hover' },
      focus: 'outline',
    },
  };

  /** The glyph above the copy. */
  iconClasses(): string {
    return 'size-space-9 text-content-tertiary';
  }

  /** The primary line. `content/primary` rather than the variant's bound `fg`, which is the
   *  colour of the supporting line — the headline should not turn brand-coloured just
   *  because a file is hovering. */
  titleClasses(): string {
    return 'text-body-md font-medium text-content-primary';
  }

  /** One row of the accepted-file list. */
  fileRowClasses(): string {
    return 'flex items-center gap-space-4 rounded-4 bg-surface-secondary px-space-4 py-space-3';
  }

  /** A rejection. `content/critical-hover`, the step that clears every rung of the surface
   *  ladder — the same choice Field's error message makes, and for the same reason: this
   *  text can sit in a dialog, where `content/critical` measures 3.89:1 in dark. */
  rejectionClasses(): string {
    return 'text-body-sm text-content-critical-hover';
  }

  protected sampleChildren(): string {
    return '';
  }
}

export const dropzoneRecipe = new DropzoneRecipe();
