import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type DropzoneVariant = 'idle' | 'active' | 'invalid';
export type DropzoneSize = 'md' | 'lg';

class DropzoneRecipe extends ComponentRecipe<DropzoneVariant, DropzoneSize> {
  readonly meta: RecipeMeta = {
    id: 'dropzone',
    group: 'forms',
    title: 'Dropzone',
    tag: 'Dropzone',
    blurb:
      'A file drop target that is also a button. Drag is the affordance people reach for and the click is the one that always works, so it has to be both — a drop-only zone is unusable from a keyboard and on most phones.',
    notes: [
      'The zone is a div with a click handler and the `or Select` inside it is the one real button. It used to be a <label> wrapping the input, which supplied the keyboard, the focus ring and the picker for free — but the Figma puts a visible Select control inside the zone, and a <button> inside a <label> means one press fires both, so the picker can open twice. Dropping the label costs the zone its own keyboard access, which is why Select exists: it is the keyboard path, and the zone is the pointer path. Both open the same hidden input.',
      'The whole zone is still clickable, because a 328x136 target that only responds on a 60px button is a target most people will miss. What changed is that the zone is pointer-only and the button is the tab stop, rather than both being the same element and fighting.',
      'active is a real third variant, not a hover. Hover means "the pointer is here"; active means "you are carrying something and releasing it will drop it", which is a different promise and needs to be unmistakable — so it changes the fill and the border together rather than stepping one of them.',
      'The COPY changes while a file is being carried, and it is the best idea in the design. At rest the zone explains what to upload, in which formats, and offers a second way in. Mid-drag none of that is actionable — the user is holding a file and the only open question is whether releasing it here will work — so the format line and the Select button go, the glyph becomes a downward arrow, and the copy answers that question instead. The previous version kept all three lines and only recoloured, which left the reader holding a file over text telling them to pick one.',
      'The error replaces the format line IN PLACE rather than appearing below the zone. Below it, the error moves the whole form down at the moment the user is looking at the box; in place, the box is the same height before and after and the line that said "up to 50MB" is the line that says the file was too big — which is the sentence that needed correcting.',
      'Uploads render as square thumbnails with a trailing + tile, not as filename rows. An image upload\'s identity is the picture; `product-shot-final-v3.jpg` is what it is called, not what it is. The filename survives as the tile\'s accessible name and its title attribute, so it is available without being the primary content.',
      'The dashed border is the one dashed stroke in the system, and it is an affordance under rule 1c: a drop target with a solid border is a card, and nothing about a card says a file can be released onto it. Dashed is the only convention users already have for "this is a place to put something".',
      'The radius is rounded-5 (10px), from the Figma, and it was rounded-8 (16px). 16 is the radius this system gives a PANEL — at that corner the zone read as a card with a dashed edge rather than as a field, which is the wrong category for something that sits in a form beside inputs at 10px.',
      'The "Hover on Dragging" state deepens the wash from 15% to 30% and takes the label OFF the accent. content/brand-hover on a 30% brand wash over surface/elevated in dark measures 3.87:1 — worse than the 4.54:1 it manages on the 15% wash, because the ground moved toward the text. content/primary clears at 7.64:1. Same shape as Menu\'s destructive hover row; the difference is that the accent runs out of steps here, so the label goes neutral and the border keeps the colour.',
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
  /* rounded-5 is 10px, from the Figma frames — it was rounded-8 (16px) before, which is the
   * radius this system gives a PANEL. A dropzone is a field, and at 16px it read as a card
   * with a dashed edge rather than as an input. */
  protected readonly shape =
    'relative flex w-full flex-col items-center justify-center text-center ' +
    'rounded-5 border-2 border-dashed ' +
    'has-[:disabled]:cursor-not-allowed';

  /* Geometry from the Figma component set: padding 20 (space-6), radius 10 (rounded-5), border
   * 1px (border-2 — the stroke scale is 0.5/1/1.5/2/2.5/4, so `border-2` IS 1px), and each
   * state 136px tall.
   *
   * The height is a MINIMUM here rather than the pinned 136. The frames are 328 wide with two
   * lines of copy; the same component in a 640px form column fits that copy on one line and
   * would leave 40px of dead space, and with three icons and a longer format string it needs
   * more than 136. A floor keeps the empty state from collapsing and lets the content win when
   * there is more of it — which is the same call Textarea makes about `rows`. */
  protected readonly sizeClasses: Record<DropzoneSize, string> = {
    md: 'min-h-[136px] gap-space-3 p-space-6',
    lg: 'min-h-[180px] gap-space-4 p-space-7',
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
      base: { bg: 'fill-brand-secondary', fg: 'content-brand-active', border: 'border-brand' },
      /* "Hover on Dragging" — the pointer is inside the zone while carrying a file, which is
       * the moment before release and the one the drop actually depends on. The wash deepens
       * from 15% to 30%.
       *
       * The LABEL has to leave the accent behind to do it. `content/brand-hover` on a 30%
       * brand wash over `surface/elevated` in dark measures 3.87:1 — under the floor, and
       * worse than the 4.54:1 it manages on the 15% wash, because the ground has moved toward
       * the text. `content/primary` clears at 7.64:1 worst case. Same shape as Menu's
       * destructive row, where the deeper red hover forced the label a step out; here the
       * accent runs out of steps, so the label goes neutral and the border keeps the colour. */
      hover: { bg: 'fill-brand-secondary-hover', fg: 'content-primary' },
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

  /**
   * The copy changes when a file is being carried, and that is the design's best idea.
   *
   * At rest the zone explains itself: what to upload, which formats, and an alternative way in.
   * Mid-drag none of that is actionable — the user is holding a file and the only question left
   * is whether releasing it here will work. So the format line and the Select button both go,
   * the glyph becomes a downward arrow, and the copy becomes the answer to that question.
   *
   * The previous version kept the same three lines and only recoloured, which left the reader
   * holding a file over text telling them to pick one.
   */
  copyFor(variant: DropzoneVariant, dragging: boolean, multiple: boolean) {
    if (dragging) {
      return { title: multiple ? 'Drop files here' : 'Drop the file here', showMeta: false, showSelect: false };
    }
    return {
      title: multiple ? 'Upload media or drag and drop' : 'Upload a file or drag and drop',
      showMeta: true,
      showSelect: true,
    };
  }

  /** The `or Select` control. A real button — see the note in the component on why the zone is
   *  no longer a `<label>`. Sized to sit inline with the format line without becoming the
   *  loudest thing in a mostly-empty box. */
  selectClasses(): string {
    return [
      'rounded-4 border-2 border-border-secondary bg-surface-primary-variant',
      'px-space-4 py-space-1 text-label-sm font-medium text-content-primary',
      'transition-colors duration-effects-fast ease-effects-fast',
      'hover:bg-fill-secondary-hover hover:border-border-secondary-hover',
      'focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus',
      'disabled:cursor-not-allowed disabled:text-content-primary-disabled',
    ].join(' ');
  }

  /** The `or` between the drag copy and the Select button. */
  orClasses(): string {
    return 'text-body-sm text-content-tertiary';
  }

  /**
   * A thumbnail tile in the accepted-file strip.
   *
   * The frames show uploads as square thumbnails with a trailing `+`, not as filename rows —
   * which is right for the case this component is mostly used in. An image upload's identity
   * is the picture; `product-shot-final-v3.jpg` is what the file is called, not what it is.
   * The filename stays as the tile's accessible name and its tooltip.
   */
  thumbClasses(): string {
    return [
      'group relative grid size-space-14 shrink-0 place-items-center overflow-hidden',
      'rounded-4 border-2 border-border-secondary bg-surface-secondary',
    ].join(' ');
  }

  /** The `+` tile that adds more, at the end of the strip. Same box as a thumbnail so the
   *  strip reads as one row of equal cells rather than a row with a button stuck on it. */
  addTileClasses(): string {
    return [
      'grid size-space-14 shrink-0 place-items-center rounded-4',
      'border-2 border-dashed border-border-secondary bg-surface-secondary',
      'text-content-tertiary',
      'transition-colors duration-effects-fast ease-effects-fast',
      'hover:border-border-secondary-hover hover:bg-fill-secondary-hover hover:text-content-primary',
      'focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus',
      'disabled:cursor-not-allowed',
    ].join(' ');
  }

  /** The remove button on a thumbnail. Appears on hover and on keyboard focus — `group-focus-within`
   *  as well as `group-hover`, because a control that only exists under a pointer is a control a
   *  keyboard user cannot reach. */
  thumbRemoveClasses(): string {
    return [
      'absolute right-space-1 top-space-1 grid size-space-6 place-items-center rounded-full',
      'bg-fill-inverse text-content-inverse-primary',
      'opacity-0 transition-opacity duration-effects-fast ease-effects-fast',
      'group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100',
      'focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus',
    ].join(' ');
  }

  /** The count badge on a thumbnail, for a page or frame index. */
  thumbBadgeClasses(): string {
    return [
      'absolute bottom-space-1 left-space-1 rounded-2 px-space-2',
      'bg-fill-inverse text-label-xs tabular-nums text-content-inverse-primary',
    ].join(' ');
  }

  /** A rejection. `content/critical-hover`, the step that clears every rung of the surface
   *  ladder — the same choice Field's error message makes, and for the same reason: this
   *  text can sit in a dialog, where `content/critical` measures 3.91:1 in dark. */
  rejectionClasses(): string {
    return 'text-body-sm text-content-critical-hover';
  }

  protected sampleChildren(): string {
    return '';
  }
}

export const dropzoneRecipe = new DropzoneRecipe();
