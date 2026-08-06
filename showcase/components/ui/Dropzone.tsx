'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useControllable } from '@/lib/core/useControllable';
import { dropzoneRecipe, type DropzoneSize, type DropzoneVariant, type FieldSize } from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';
import { cx } from '@/lib/core/cx';
import { Field, type FieldControlProps } from './Field';
import { Spinner } from './Spinner';

/**
 * The dashed edge, as an SVG stroke.
 *
 * The Figma dash is 10 on / 10 off at 1px and a CSS `border-dashed` at 1px is drawn
 * by the user agent at roughly 2/2, with no property that changes it — so the edge
 * is a rect. `strokeWidth={2}` with the rect flush to the viewport means the outer
 * half is clipped and the visible stroke is exactly 1px, which also saves doing
 * `calc(100% - 1px)` arithmetic in geometry attributes.
 *
 * The colour arrives as a `stroke-*` class on `className`, derived from the same
 * binding the zone compiles — see `dropzoneRecipe.frameClasses`.
 */
function DashedFrame({
  radius,
  dash,
  className,
}: {
  radius: number;
  dash: string;
  className?: string;
}) {
  return (
    <svg aria-hidden="true" className={cx('pointer-events-none absolute inset-0 -z-10 size-full', className)}>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        rx={radius}
        ry={radius}
        fill="none"
        strokeWidth={2}
        strokeDasharray={dash}
      />
    </svg>
  );
}

/** The default chip glyph: a picture. Redrawn against the frames' `image-icons-set`
 *  — frame, sun, and the sweep of a horizon behind it — at their 1.5 stroke. */
function ImageIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="1.9" y="1.9" width="14.2" height="14.2" rx="4.4" />
      <circle cx="6.6" cy="6.6" r="1.5" />
      <path d="M3.1 15.2c-.9-3.9 4.3-6.7 8.3-7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Shown mid-drag, in place of the media glyphs. The gesture is downward, so the
 *  glyph is — and it is the only one, because mid-drag the question is no longer
 *  what the zone takes. */
function DownIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M9 2.2v12.4M3.6 9.8l4.3 4.9c.5.5.6.5 1.2.1l5-3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

/** A file that did not make it in, and why. Never silently discarded — see the recipe. */
export type Rejection = { file: File; reason: string };

export type DropzoneProps = {
  /** Mirrors the native attribute — `image/*`, `.png,.jpg`, `video/mp4`. Passed straight
   *  through, so the file picker filters with it as well as the validation below. */
  accept?: string;
  multiple?: boolean;
  /** Cap per file, in bytes. Convenience only — see the recipe note on why the server still
   *  has to check. */
  maxSize?: number;
  /** Cap on how many files are held at once. Ignored unless `multiple`. */
  maxFiles?: number;
  disabled?: boolean;
  size?: DropzoneSize;

  files?: File[];
  defaultFiles?: File[];
  onChange?: (files: File[]) => void;
  /** Fires with everything that was refused and the reason. */
  onReject?: (rejections: Rejection[]) => void;

  /**
   * Files still on their way to the server.
   *
   * The zone does not upload anything — it hands you files and the transfer is yours —
   * so the in-flight state has to be told to it. These render ahead of the settled
   * cards as the frames' Uploading tile: the same box, the picture dropped to a wash,
   * a spinner over it. Leave it out and the dock is Uploaded only.
   */
  pending?: File[];

  label?: string;
  labelHidden?: boolean;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Renders the `Optional` badge inside the zone's top-right corner. Not forwarded to
   *  Field — see the recipe note on why it is said once, and said here. */
  optional?: boolean;

  /** Overrides the primary line. Defaults to a phrase built from `multiple`. */
  title?: string;
  /**
   * Glyphs above the copy, one per accepted media kind, each in its own chip.
   *
   * The Figma set shows one to four — image, video, audio, any — because the chips are
   * how the zone says what it takes before the reader gets to the format line, and
   * they fan alternately left and right so a row of them reads as a stack. Defaults to
   * a single image glyph, which is the common case.
   */
  icons?: React.ReactNode[];
  forceState?: StateName;
  forceVariant?: DropzoneVariant;
  className?: string;
};

/** 1000-based, matching what an OS file browser reports — a user comparing the number here
 *  against Finder or Explorer should see the same figure, and those use 1000. */
function humanSize(bytes: number): string {
  const units = ['B', 'kB', 'MB', 'GB'];
  let n = bytes;
  let u = 0;
  while (n >= 1000 && u < units.length - 1) {
    n /= 1000;
    u += 1;
  }
  return `${n < 10 && u > 0 ? n.toFixed(1) : Math.round(n)} ${units[u]}`;
}

/** Does the file satisfy an `accept` string? Mirrors the browser's own matching so a file
 *  the picker allowed is never rejected here, which would be baffling. */
function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  return accept.split(',').some((raw) => {
    const t = raw.trim().toLowerCase();
    if (!t) return false;
    if (t.startsWith('.')) return file.name.toLowerCase().endsWith(t);
    if (t.endsWith('/*')) return file.type.toLowerCase().startsWith(t.slice(0, -1));
    return file.type.toLowerCase() === t;
  });
}

/** An object URL for an image file, revoked on unmount. A thumbnail strip that never revokes
 *  leaks a blob per file for the life of the page. */
function useThumbnails(files: File[]): Array<string | null> {
  const [urls, setUrls] = useState<Array<string | null>>([]);

  useEffect(() => {
    const made = files.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : null));
    setUrls(made);
    return () => {
      for (const u of made) if (u) URL.revokeObjectURL(u);
    };
  }, [files]);

  return urls;
}

/** One shared empty list, at module scope, for the `pending` default.
 *
 *  `pending ?? []` inline would be a NEW array on every render, and `useThumbnails`
 *  keys its effect on the list it is given: fresh array → effect reruns → `setUrls`
 *  with another fresh array → render → fresh array again. That is an unbounded render
 *  loop that still paints, so it looks fine in a screenshot and pegs a core. A stable
 *  reference is the whole fix. */
const NO_FILES: File[] = [];

/** The two-letter stand-in for a file with no picture — a PDF, an mp4. Same box, so
 *  the dock stays a row of equal cells. */
function extensionOf(file: File): string {
  return (file.name.split('.').pop() ?? '').slice(0, 4).toUpperCase();
}

/**
 * A file drop target.
 *
 * WHY THE ZONE IS NOT A `<label>` ANY MORE. It was, and a label wrapping a hidden file input is
 * the textbook answer — it supplies keyboard activation, the focus ring, form association and
 * the native picker for nothing. The Figma puts a visible `or Select` control inside the zone,
 * and a `<button>` inside a `<label>` means one press fires both, so the picker can open twice.
 * That is the same nesting problem Chip refuses.
 *
 * So the roles split: the ZONE is the pointer target and the BUTTON is the keyboard target.
 * Both open the same hidden input. The zone keeps its click because a 328×136 area that only
 * responds on a 60px button is an area most people will click and nothing will happen.
 *
 * DRAG DEPTH IS COUNTED, NOT TOGGLED. dragenter and dragleave fire for every descendant, so a
 * boolean makes the state flicker as the pointer crosses the icon inside the zone.
 */
export function Dropzone({
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  disabled = false,
  size = 'md',
  files,
  defaultFiles = [],
  onChange,
  onReject,
  pending,
  label,
  labelHidden,
  hint,
  error,
  required,
  optional,
  title,
  icons,
  forceState,
  forceVariant,
  className,
}: DropzoneProps) {
  const [held, setHeld] = useControllable<File[]>({
    value: files,
    defaultValue: defaultFiles,
    onChange,
  });

  const [rejections, setRejections] = useState<Rejection[]>([]);
  /* A counter, not a boolean. See the recipe note. */
  const depth = useRef(0);
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inFlight = pending ?? NO_FILES;
  const thumbs = useThumbnails(held);
  const pendingThumbs = useThumbnails(inFlight);

  const openPicker = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const commit = useCallback(
    (incoming: FileList | File[]) => {
      const list = [...incoming];
      const accepted: File[] = [];
      const refused: Rejection[] = [];

      for (const f of list) {
        if (!matchesAccept(f, accept)) {
          refused.push({ file: f, reason: `${f.name} is not an accepted file type.` });
        } else if (maxSize !== undefined && f.size > maxSize) {
          refused.push({
            file: f,
            reason: `File size exceeded ${humanSize(maxSize)}`,
          });
        } else {
          accepted.push(f);
        }
      }

      let next = multiple ? [...held, ...accepted] : accepted.slice(0, 1);

      if (multiple && maxFiles !== undefined && next.length > maxFiles) {
        for (const f of next.slice(maxFiles)) {
          refused.push({ file: f, reason: `Only ${maxFiles} files at a time.` });
        }
        next = next.slice(0, maxFiles);
      }

      setRejections(refused);
      onReject?.(refused);
      setHeld(next);
    },
    [accept, maxSize, maxFiles, multiple, held, setHeld, onReject],
  );

  const remove = (at: number) => setHeld(held.filter((_, i) => i !== at));

  /* `over` beats an explicit variant, because it is the live gesture: a caller forcing
   * `invalid` still needs the zone to say "yes, release it here" while a file is over it. */
  const variant: DropzoneVariant =
    over ? 'active' : (forceVariant ?? (error || rejections.length ? 'invalid' : 'idle'));

  /* A div is never `:disabled`, so the compiler's `disabled:` prefixes match nothing on
   * the zone. Forcing the state is the same merge the state grid uses, and it is the
   * only way the disabled colours reach this element at all. */
  const force: StateName | undefined = disabled ? 'disabled' : forceState;

  const copy = dropzoneRecipe.copyFor(variant, multiple);
  const dragging = variant === 'active';
  const glyphs = icons ?? [<ImageIcon key="i" />];

  /* The line under the title. Mid-drag it is gone; when something was refused it IS the
   * rejection, in place, so the box does not change height and the sentence that said
   * "up to 50MB" is the one that says the file was too big. */
  const metaLine = (() => {
    if (!copy.showMeta) return null;
    if (rejections.length > 0) {
      return (
        <p aria-live="polite" className={dropzoneRecipe.rejectionClasses()}>
          {rejections[0].reason}
        </p>
      );
    }
    if (!accept && maxSize === undefined) return null;
    return (
      <p className={dropzoneRecipe.metaClasses()}>
        {[accept?.replace(/,/g, ', '), maxSize !== undefined && `up to ${humanSize(maxSize)}`]
          .filter(Boolean)
          .join(' · ')}
      </p>
    );
  })();

  const control = (c?: FieldControlProps) => (
    <div className="oz-stack oz-stack-4">
      <div
        /* Pointer target only. The keyboard path is the Select button inside — see the header.
           No role and no tabIndex: a div with role="button" would announce a second control
           doing the same job as the button it contains. */
        onClick={openPicker}
        onDragEnter={(e) => {
          e.preventDefault();
          if (disabled) return;
          depth.current += 1;
          setOver(true);
        }}
        onDragOver={(e) => {
          /* Required. Without preventDefault on dragover the browser treats the element as a
             non-target and navigates to the file on drop, replacing the page. */
          e.preventDefault();
        }}
        onDragLeave={() => {
          if (disabled) return;
          depth.current -= 1;
          if (depth.current <= 0) {
            depth.current = 0;
            setOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (disabled) return;
          depth.current = 0;
          setOver(false);
          if (e.dataTransfer.files.length) commit(e.dataTransfer.files);
        }}
        className={dropzoneRecipe.classes({
          variant,
          size,
          force,
          className: cx(!disabled && 'cursor-pointer', className),
        })}
      >
        <DashedFrame
          radius={16}
          dash={dropzoneRecipe.frameDash}
          className={dropzoneRecipe.frameClasses({ variant, force })}
        />

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          id={c?.id}
          aria-describedby={c?.['aria-describedby']}
          aria-invalid={c?.['aria-invalid']}
          aria-required={c?.['aria-required']}
          onChange={(e) => {
            if (e.target.files?.length) commit(e.target.files);
            /* Cleared so choosing the same file twice fires change again. Without this,
               removing a file and re-picking it is a silent no-op. */
            e.target.value = '';
          }}
          className="sr-only"
        />

        {/* Pinned inside the corner rather than beside a label, because a dropzone is
            frequently the only thing in its column and has no visible label to sit next
            to. Gone mid-drag, with the rest of the at-rest explanation. */}
        {optional && !dragging && <span className={dropzoneRecipe.badgeClasses()}>Optional</span>}

        <span aria-hidden="true" className={dropzoneRecipe.chipRowClasses()}>
          {(dragging ? [<DownIcon key="drop" />] : glyphs).map((g, i) => (
            <span key={i} className={dropzoneRecipe.chipClasses(variant)}>
              <span className={dropzoneRecipe.chipIconClasses()}>{g}</span>
            </span>
          ))}
        </span>

        {/* Title and format line are one block with no gap between them — two lines of
            one paragraph in the frames — and the 4px to the `or Select` row below is
            this stack's, because the 8px above is the zone's flex gap and a flex gap is
            uniform. */}
        <div className="oz-stack oz-stack-1 w-full">
          <div>
            <p className={dropzoneRecipe.titleClasses()}>{title ?? copy.title}</p>
            {metaLine}
          </div>

          {copy.showSelect && (
            <span className="flex items-center justify-center gap-space-2">
              <span className={dropzoneRecipe.orClasses()}>or</span>
              <button
                type="button"
                disabled={disabled}
                /* stopPropagation so the zone's own click does not ALSO open the picker. Without
                   it the button and its container both fire and the dialog opens twice — the
                   exact defect that dropping the <label> was meant to avoid, reintroduced one
                   level down. */
                onClick={(e) => {
                  e.stopPropagation();
                  openPicker();
                }}
                className={dropzoneRecipe.selectClasses()}
              >
                Select
              </button>
            </span>
          )}
        </div>
      </div>

      {/* The dock.

          oz-cluster rather than a hand-written flex-wrap row: it also sets min-width:0 on
          the children, which is what stops a long strip forcing a horizontal scrollbar
          inside a narrow form column. verify:coverage caught this one as raw layout. */}
      {(held.length > 0 || inFlight.length > 0) && (
        <ul className={dropzoneRecipe.dockClasses()}>
          {held.map((f, i) => (
            <li key={`${f.name}-${f.size}-${i}`} className={dropzoneRecipe.thumbClasses()}>
              {thumbs[i] ? (
                /* alt="" and the name on the <li>'s title: the image is decoration for a
                   filename that is already the accessible content. */
                <img src={thumbs[i]!} alt="" className="size-full object-cover" />
              ) : (
                <span aria-hidden="true" className="px-space-1 text-label-xs text-content-tertiary">
                  {extensionOf(f)}
                </span>
              )}

              <span className="sr-only">
                {f.name}, {humanSize(f.size)}
              </span>
              {multiple && <span className={dropzoneRecipe.thumbBadgeClasses()}>{i + 1}</span>}

              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                title={f.name}
                disabled={disabled}
                onClick={() => remove(i)}
                className={dropzoneRecipe.thumbRemoveClasses()}
              >
                <span className="size-space-3">
                  <CloseIcon />
                </span>
              </button>
            </li>
          ))}

          {/* Still in flight. The picture is there but washed out, because what is being
              read at this size is the spinner and not the thumbnail. */}
          {inFlight.map((f, i) => (
            <li
              key={`pending-${f.name}-${f.size}-${i}`}
              className={dropzoneRecipe.pendingThumbClasses()}
            >
              {pendingThumbs[i] && (
                <img
                  src={pendingThumbs[i]!}
                  alt=""
                  className="absolute inset-0 size-full object-cover opacity-15"
                />
              )}
              <Spinner size="xs" className="relative" />
              <span className="sr-only">Uploading {f.name}</span>
            </li>
          ))}

          {/* The + tile. Only when more are allowed — a full strip offering to add a fifth of
              four is an invitation to a rejection. */}
          {multiple && (maxFiles === undefined || held.length + inFlight.length < maxFiles) && (
            <li>
              <button
                type="button"
                aria-label="Add more files"
                disabled={disabled}
                onClick={openPicker}
                className={dropzoneRecipe.addTileClasses()}
              >
                <DashedFrame radius={12} dash={dropzoneRecipe.tileDash} className="stroke-current" />
                <span className={dropzoneRecipe.plusClasses()}>
                  <span className="size-space-3">
                    <PlusIcon />
                  </span>
                </span>
              </button>
            </li>
          )}
        </ul>
      )}

      {/* Rejections past the first. The first one is shown in place of the format line inside
          the zone; any others are listed here rather than dropped, because a five-file drop
          can fail five different ways and only saying one of them is a lie of omission. */}
      {rejections.length > 1 && (
        <ul aria-live="polite" className="oz-stack oz-stack-1">
          {rejections.slice(1).map((r) => (
            <li key={`${r.file.name}-${r.file.size}`} className={dropzoneRecipe.rejectionClasses()}>
              {r.reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  if (!label && !hint && !error) return control();

  return (
    <Field
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      error={error}
      required={required}
      disabled={disabled}
      size={size as FieldSize}
    >
      {control}
    </Field>
  );
}
