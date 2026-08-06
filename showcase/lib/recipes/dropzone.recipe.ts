import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import { cx } from '../core/cx';
import type { MotionSpec, StateName, TokenBinding, VariantBinding } from '../core/types';

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
      'THE DASHED EDGE IS AN SVG STROKE, NOT A CSS BORDER, and that is the one piece of this component that could not be built out of utilities. The Figma dash is 10 on / 10 off at 1px; a CSS `border-dashed` at 1px is drawn by the user agent at roughly 2/2 and there is no property that changes it. At that scale the difference is not a nicety — long airy dashes are most of what makes the zone read as a place to put something rather than as a hairline box. So the edge is a `<rect>` with `stroke-dasharray="10 10"` and `stroke-width="2"` half-clipped by the SVG viewport, which lands on exactly 1px. The stroke COLOUR is read back out of the same `bindings` the root compiles — see `frameClasses` — remapped from `border-*` to `stroke-*`, so the drawn edge and the declared token cannot drift apart. The root still names the border token, so verify:borders still sees the binding it is meant to police.',
      'The radius is rounded-8 (16px). It read rounded-5 (10px) here for a while, with a comment claiming 10 came from the Figma — it did not. 10px is the radius of the `Select` button INSIDE the zone; the container frames are all 16 (`M0 16C0 7.16 7.16 0 16 0` on every state in the set, and on the 158-wide Start/End Frame pair). The correction is recorded rather than quietly applied because the wrong number arrived attached to the same claim of provenance.',
      'The accepted-media glyphs are CHIPS, not bare icons: a 28px squircle with its own 1px stroke, a soft inner shadow, and an 18px glyph inside, rotated alternately -8 and +8 degrees so a row of them fans like a hand of cards and overlaps by about 4px. That fan is the component\'s signature and it is load-bearing information — one to four chips is how the zone says what it takes before the reader reaches the format line. The stroke on a chip is the icon-button stroke QUOTED, not a new one; the chips are decorative here (aria-hidden) and the real affordance is the zone.',
      'active is a real third variant, not a hover. Hover means "the pointer is here"; active means "you are carrying something and releasing it will drop it", which is a different promise and needs to be unmistakable — so it changes the fill and the border together rather than stepping one of them.',
      'The COPY changes while a file is being carried, and it is the best idea in the design. At rest the zone explains what to upload, in which formats, and offers a second way in. Mid-drag none of that is actionable — the user is holding a file and the only open question is whether releasing it here will work — so the format line, the Optional badge and the Select button go, the chip becomes a single downward arrow, and the copy answers that question instead. The previous version kept all three lines and only recoloured, which left the reader holding a file over text telling them to pick one.',
      'The title takes no colour of its own. It inherits the variant\'s bound `fg`, which is why it goes accent mid-drag and neutral again on the 30% wash — the two states the Figma actually recolours. It used to hardcode content/primary "so the headline does not turn brand-coloured", which read the design backwards: mid-drag the headline is the ONLY thing left saying the zone will take the file, and in the frames it is the accent.',
      'The format line is italic and the error that replaces it is italic too. That is from the frames — every stem in that line is slanted about 10 degrees — and it is the only italic in the system. It earns the exception by doing the job the second line always has to do in a mostly-empty box: read as an aside rather than as a second instruction competing with the first.',
      'The error replaces the format line IN PLACE rather than appearing below the zone. Below it, the error moves the whole form down at the moment the user is looking at the box; in place, the box is the same height before and after and the line that said "up to 50MB" is the line that says the file was too big — which is the sentence that needed correcting.',
      'Uploads render as square 48px cards with a trailing dashed + tile, not as filename rows. An image upload\'s identity is the picture; `product-shot-final-v3.jpg` is what it is called, not what it is. The filename survives as the card\'s accessible name and its title attribute, so it is available without being the primary content. A card still in flight is the same box, dimmed to a wash with a spinner over it — the Uploading and Uploaded frames are one dock in two states, not two components.',
      'The Optional badge lives INSIDE the zone, pinned to the top-right, rather than beside a label. A dropzone is frequently the only thing in its column with no visible label at all — the Start/End Frame pair is exactly that — and "Optional" said next to a label that is not there is said nowhere. When the zone does get a Field label it is not repeated there, because the badge is already the answer.',
      'dragenter and dragleave are counted, not toggled. Both fire on every descendant, so dragging across the icon inside the zone fires dragleave on the zone itself — a boolean flag makes the active state flicker on and off as the pointer crosses children, which is the classic dropzone bug. A depth counter incremented on enter and decremented on leave only reaches zero when the pointer has genuinely left.',
      'A rejected file is reported, never silently dropped. Filtering out an oversized file without saying so leaves the user looking at a list missing the one thing they were trying to upload, with no way to find out why. Rejections come back with a reason.',
      'The size cap is checked here AND has to be checked on the server. This one is a convenience so the user finds out in a millisecond instead of after a two-minute upload; it is not a control, because `accept` and any client-side size check are trivially bypassed.',
      'The disabled appearance is rendered FORCED rather than through the `disabled:` variant. The zone is a div and a div is never `:disabled`, so every `disabled:bg-*` the compiler emitted onto it matched nothing — the disabled dropzone was drawing its idle colours the whole time. The component passes `force: \'disabled\'` instead, which is the same merge the state grid uses.',
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

  /* No border utilities here on purpose — the dashed edge is drawn by `frameClasses`
   * onto an SVG child. The bound `border-*` token still lands on this element and
   * still sets `border-color`; with Tailwind's preflight width of 0 it paints
   * nothing, and it keeps the token where verify:borders reads it.
   *
   * `isolate` so the frame can sit at -z-10: that puts it above the zone's own
   * background and below the in-flow content, without the frame needing to escape
   * behind the parent. `group` so the frame and the chips can follow hover. */
  protected readonly shape =
    'group relative isolate flex w-full flex-col items-center justify-center text-center ' +
    'rounded-8 has-[:disabled]:cursor-not-allowed';

  /* Geometry from the Figma component set. Padding 16 (space-5) and the content
   * vertically centred: in the 328x136 frames the chip row's bounding box starts at
   * 17.67 and the Select button ends 16 from the bottom, which is what a 16px pad
   * around a 101px centred stack produces to within a pixel.
   *
   * The 8px gap is between the chip row and the copy; the 4px between the copy and
   * the `or Select` row is applied by the inner stack, because a flex `gap` is
   * uniform and those two gaps are not.
   *
   * The height is a MINIMUM rather than the pinned 136. The frames are 328 wide with
   * two lines of copy; the same component in a 640px form column fits that copy on
   * one line and would leave 40px of dead space, and with three chips and a longer
   * format string it needs more than 136. A floor keeps the empty state from
   * collapsing and lets the content win when there is more of it — the same call
   * Textarea makes about `rows`.
   *
   * lg is 150, which is the other height in the set: the 158-wide Start Frame / End
   * Frame pair. It was 180, a number from nowhere. */
  protected readonly sizeClasses: Record<DropzoneSize, string> = {
    md: 'min-h-[136px] gap-space-3 p-space-5',
    lg: 'min-h-[150px] gap-space-3 p-space-5',
  };

  protected readonly bindings: Record<DropzoneVariant, VariantBinding> = {
    idle: {
      borderJob: 'affordance',
      intent: 'Waiting. The boundary is the whole control.',
      /* The frames put the resting zone on WHITE, not on a surface step, and the
       * hover on #F7F7F7 — which is fill/primary-variant and its hover exactly, in
       * both modes. It used to sit on surface/secondary with a fill/secondary-hover
       * step, a pairing two rungs darker than the design at rest and four at hover. */
      base: { bg: 'fill-primary-variant', fg: 'content-secondary', border: 'border-secondary' },
      hover: { bg: 'fill-primary-variant-hover', border: 'border-secondary-hover' },
      disabled: {
        bg: 'fill-primary-variant-disabled',
        fg: 'content-secondary-disabled',
        border: 'border-secondary-disabled',
      },
      focus: 'outline',
    },
    active: {
      borderJob: 'affordance',
      intent: 'A file is being carried over the zone and releasing it will drop it here.',
      /* The Figma wash is the accent at 15%, and fill/brand-secondary IS the accent at
       * 15% — the alpha step lines up exactly, so only the hue is translated (the
       * frames are purple because that file predates the brand). The border is the
       * one deliberate deviation: the frames stroke it at 50% and this system has no
       * 50% brand border — border/brand-secondary is 30% and border/brand is 100%.
       * 100% is the one that keeps the promise the recipe note argues for. */
      base: { bg: 'fill-brand-secondary', fg: 'content-brand-active', border: 'border-brand' },
      /* "Hover on Dragging" — the pointer is inside the zone while carrying a file,
       * which is the moment before release and the one the drop actually depends on.
       * The wash deepens from 15% to 30%, and fill/brand-secondary-hover is 30%.
       *
       * The LABEL has to leave the accent behind to do it. `content/brand-hover` on a
       * 30% brand wash over `surface/elevated` in dark measures 3.87:1 — under the
       * floor, and worse than the 4.54:1 it manages on the 15% wash, because the
       * ground has moved toward the text. `content/primary` clears at 7.64:1 worst
       * case. Same shape as Menu's destructive row, where the deeper red hover forced
       * the label a step out; here the accent runs out of steps, so the label goes
       * neutral and the border keeps the colour. */
      hover: { bg: 'fill-brand-secondary-hover', fg: 'content-primary' },
      focus: 'outline',
    },
    invalid: {
      borderJob: 'affordance',
      intent: 'The last drop was rejected, or the field is required and empty.',
      base: { bg: 'fill-primary-variant', fg: 'content-secondary', border: 'border-critical' },
      hover: { bg: 'fill-primary-variant-hover', border: 'border-critical-hover' },
      focus: 'outline',
    },
  };

  /**
   * The dashed edge, as `stroke-*` classes for the SVG frame.
   *
   * Derived from `bindings` rather than written out a second time. A border token
   * appears once, in the binding the root compiles and verify:borders reads; this
   * remaps it onto the property that actually paints it. Change the binding and the
   * drawn edge follows, which is the whole reason this is a method and not a string.
   *
   * Mirrors `classes()`'s two modes: forced merges base with the target state and
   * emits unprefixed, live emits base plus a `group-hover:` twin.
   */
  frameClasses({ variant, force }: { variant?: DropzoneVariant; force?: StateName } = {}): string {
    const b = this.bindings[variant ?? this.defaultVariant];
    const stroke = (token?: string) => (token ? `stroke-${token}` : '');

    if (force) {
      const merged: TokenBinding = { ...b.base, ...(force === 'base' ? {} : b[force] ?? {}) };
      return stroke(merged.border);
    }

    const hover = b.hover?.border;
    return cx(stroke(b.base.border), hover ? `group-hover:${stroke(hover)}` : '');
  }

  /** The dash the frame is drawn with: 10 on, 10 off, measured off the frames. */
  readonly frameDash = '10 10';

  /**
   * One accepted-media chip. A 28px squircle carrying an 18px glyph.
   *
   * `odd:`/`even:` rather than an index passed in from the component, because the
   * alternation is a property of the row and not of the icon — the second chip leans
   * the other way whatever glyph is in it.
   *
   * Almost all of the ~4.7px overlap in the frames is the rotation, not the spacing:
   * there the chips are 29 wide on a 28.14 pitch, a negative gap of 0.86 against a
   * rotated bounding box of 32.8. Here they are 28 on a 27 pitch — `-ml-px`, one whole
   * pixel of it — which is the same ratio to within a rounding error, and the reason
   * the row is laid out from the chips' UNROTATED boxes: a transform does not move the
   * box its neighbours lay out against, which is exactly what is wanted here.
   *
   * The inner shadow is the frames' `feGaussianBlur stdDeviation 2` at 15% black.
   * It is composed out of `--oz-shadow-medium` rather than written as a literal
   * rgba, because there is no inset entry in the elevation set and inventing one
   * for a decoration is worse than naming the shadow token it would be built from.
   */
  chipClasses(variant: DropzoneVariant = 'idle'): string {
    return [
      'grid size-space-8 shrink-0 place-items-center rounded-5 border-2',
      'shadow-[inset_0_0_4px_var(--oz-shadow-medium)]',
      'odd:-rotate-[8deg] even:rotate-[8deg]',
      /* The chip takes the accent while a file is over the zone. In the frames it is
       * the wash, the stroke and the glyph together — the chip is the arrow at that
       * moment, and an arrow in a grey box on an accent-washed field reads as the one
       * thing that did not get the message. */
      variant === 'active'
        ? 'border-border-brand bg-fill-brand-secondary text-content-brand-active'
        : 'border-border-tertiary bg-fill-secondary-variant text-content-secondary',
      'group-has-[:disabled]:border-border-secondary-disabled',
      'group-has-[:disabled]:text-content-secondary-disabled',
    ].join(' ');
  }

  /** The row the chips fan across. The -1px between them is the whole of the spacing
   *  half of the overlap; the rest of it is the rotation. */
  chipRowClasses(): string {
    return 'flex items-center [&>*+*]:-ml-px';
  }

  /** The glyph box inside a chip. 18px in a 28px chip, from the frames' 18px clip
   *  rect inside a 29px squircle. */
  chipIconClasses(): string {
    return 'size-[18px]';
  }

  /** The `Optional` badge, pinned inside the top-right corner. 16px tall, so the
   *  label-sm line box IS the height and there is no vertical padding to give it. */
  badgeClasses(): string {
    return [
      'pointer-events-none absolute right-space-3 top-space-3 select-none',
      'rounded-3 bg-fill-tertiary px-space-2',
      'text-label-sm font-medium text-content-secondary',
      'group-has-[:disabled]:bg-fill-tertiary-disabled',
      'group-has-[:disabled]:text-content-secondary-disabled',
    ].join(' ');
  }

  /** The primary line. No colour of its own — see the note; it inherits the
   *  variant's bound `fg`, which is what makes it go accent mid-drag. */
  titleClasses(): string {
    return 'text-body-sm font-medium';
  }

  /** The format line under the title. Italic, from the frames, and the one italic in
   *  the system. Zero gap from the title: they are two lines of one block. */
  metaClasses(): string {
    return 'text-label-sm italic text-content-tertiary group-has-[:disabled]:text-content-tertiary-disabled';
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
  copyFor(variant: DropzoneVariant, multiple: boolean) {
    /* Keyed off the VARIANT, not off a separate live `dragging` flag. `active` means
     * exactly "a file is being carried over the zone" — the binding's own intent says
     * so — and reading it from one place is what lets the state grid render the real
     * mid-drag frame. With two sources the forced `active` cell drew accent colours
     * under resting copy, a state that cannot occur and that nobody could check the
     * drag against. */
    if (variant === 'active') {
      return { title: multiple ? 'Drop files here' : 'Drop the file here', showMeta: false, showSelect: false };
    }
    return {
      title: multiple ? 'Upload media or drag and drop' : 'Upload a file or drag and drop',
      showMeta: true,
      showSelect: true,
    };
  }

  /** The `or Select` control. A real button — see the note in the component on why the
   *  zone is no longer a `<label>`. 53x24 with a 10px radius and no fill in the frames:
   *  an outline control, so it does not become the loudest thing in a mostly-empty box. */
  selectClasses(): string {
    return [
      'inline-flex h-space-7 items-center rounded-5 border-2 border-border-secondary px-space-3',
      'text-label-sm font-medium text-content-secondary',
      'transition-colors duration-effects-fast ease-effects-fast',
      'hover:border-border-secondary-hover hover:bg-fill-primary-variant-hover hover:text-content-primary',
      'focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus',
      'disabled:cursor-not-allowed disabled:border-border-secondary-disabled disabled:text-content-secondary-disabled',
    ].join(' ');
  }

  /** The `or` between the copy and the Select button. */
  orClasses(): string {
    return 'text-label-sm text-content-tertiary group-has-[:disabled]:text-content-tertiary-disabled';
  }

  /** The dock the uploads sit in. 4px gutters, from the 50px pitch on 46px tiles. */
  dockClasses(): string {
    return 'oz-cluster oz-cluster-1';
  }

  /**
   * An upload, settled. A 48px card with the picture in it.
   *
   * The frames show uploads as square thumbnails with a trailing `+`, not as filename
   * rows — which is right for the case this component is mostly used in. An image
   * upload's identity is the picture; `product-shot-final-v3.jpg` is what the file is
   * called, not what it is. The filename stays as the card's accessible name and its
   * tooltip.
   *
   * rounded-4 and a shadow where the still-uploading tile is rounded-6 and flat: that
   * asymmetry is in the frames, and it reads correctly — a finished upload is an
   * object sitting on the dock, an unfinished one is still a slot.
   */
  thumbClasses(): string {
    return [
      'group/thumb relative grid size-space-12 shrink-0 place-items-center overflow-hidden',
      'rounded-4 border-2 border-border-secondary bg-fill-primary-variant shadow-small',
    ].join(' ');
  }

  /** An upload still in flight. Same box, no shadow, a slot radius, and the picture
   *  dropped to a wash so the spinner over it is the thing being read. */
  pendingThumbClasses(): string {
    return [
      'relative grid size-space-12 shrink-0 place-items-center overflow-hidden',
      'rounded-6 border-2 border-border-secondary bg-fill-primary-variant',
      'text-content-secondary',
    ].join(' ');
  }

  /** The `+` tile that adds more, at the end of the dock. Same box as a card so the
   *  dock reads as one row of equal cells rather than a row with a button stuck on
   *  it. Its dashed edge is drawn the same way the zone's is, at the smaller 5.5/4.5
   *  dash the frames use at this size. */
  addTileClasses(): string {
    return [
      'relative isolate grid size-space-12 shrink-0 place-items-center rounded-6',
      'text-border-secondary',
      'transition-colors duration-effects-fast ease-effects-fast',
      'hover:text-border-secondary-hover',
      'focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus',
      'disabled:cursor-not-allowed',
    ].join(' ');
  }

  readonly tileDash = '5.5 4.5';

  /** The button face inside the + tile: a 16px disc with a top-light gradient, which
   *  is the frames' white→#E0E0E0 linear fill. */
  plusClasses(): string {
    return [
      'grid size-space-5 place-items-center rounded-full border-2 border-border-primary',
      'bg-gradient-to-b from-fill-elevated to-fill-tertiary text-content-primary',
    ].join(' ');
  }

  /** The remove control on a settled card. Appears on hover and on keyboard focus —
   *  `group-focus-within` as well as `group-hover`, because a control that only exists
   *  under a pointer is a control a keyboard user cannot reach. Named group, because
   *  the zone itself is now a group too and an unnamed one would follow the wrong
   *  ancestor. */
  thumbRemoveClasses(): string {
    return [
      'absolute right-space-1 top-space-1 grid size-space-5 place-items-center rounded-full',
      'bg-fill-inverse text-content-inverse-primary',
      'opacity-0 transition-opacity duration-effects-fast ease-effects-fast',
      'group-hover/thumb:opacity-100 group-focus-within/thumb:opacity-100 focus-visible:opacity-100',
      'focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus',
    ].join(' ');
  }

  /** The index on a settled card. Bottom-right in the frames, on a blurred plate that
   *  is cut into the corner rather than floated over it — which is what keeps a light
   *  numeral legible on a photograph nobody has seen yet. */
  thumbBadgeClasses(): string {
    return [
      'pointer-events-none absolute bottom-0 right-0 rounded-tl-3 px-space-2',
      'bg-fill-elevated backdrop-blur-[var(--oz-overlay-blur)]',
      'text-label-sm tabular-nums text-content-secondary',
    ].join(' ');
  }

  /** A rejection. `content/critical-hover`, the step that clears every rung of the
   *  surface ladder — the same choice Field's error message makes, and for the same
   *  reason: this text can sit in a dialog, where `content/critical` measures 3.91:1
   *  in dark. Italic because it stands in the format line's place. */
  rejectionClasses(): string {
    return 'text-label-sm italic text-content-critical-hover';
  }

  protected sampleChildren(): string {
    return '';
  }
}

export const dropzoneRecipe = new DropzoneRecipe();
