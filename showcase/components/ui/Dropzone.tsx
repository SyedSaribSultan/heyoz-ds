'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useControllable } from '@/lib/core/useControllable';
import { dropzoneRecipe, type DropzoneSize, type DropzoneVariant, type FieldSize } from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';
import { cx } from '@/lib/core/cx';
import { Field, type FieldControlProps } from './Field';

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4 17l5-4 4 3 3-2 4 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Shown mid-drag, in place of the upload glyph. The gesture is downward, so the glyph is. */
function DownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M12 4v12m0 0l-4.5-4.5M12 16l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20h16" strokeLinecap="round" />
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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

  label?: string;
  labelHidden?: boolean;
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;

  /** Overrides the primary line. Defaults to a phrase built from `multiple`. */
  title?: string;
  /**
   * Glyphs above the copy, one per accepted media kind.
   *
   * The Figma set shows one to four — image, video, audio, any — because the icons are how the
   * zone says what it takes before the reader gets to the format line. Defaults to a single
   * image glyph, which is the common case.
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
  const thumbs = useThumbnails(held);

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

  const copy = dropzoneRecipe.copyFor(variant, over, multiple);
  const glyphs = icons ?? [<UploadIcon key="i" />];

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
      <p className="text-body-sm">
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
          force: forceState,
          className: cx(!disabled && 'cursor-pointer', className),
        })}
      >
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

        <span aria-hidden="true" className="flex items-center gap-space-2">
          {over ? (
            <span className={dropzoneRecipe.iconClasses()}>
              <DownIcon />
            </span>
          ) : (
            glyphs.map((g, i) => (
              <span key={i} className={dropzoneRecipe.iconClasses()}>
                {g}
              </span>
            ))
          )}
        </span>

        <span className={dropzoneRecipe.titleClasses()}>{title ?? copy.title}</span>
        {metaLine}

        {copy.showSelect && (
          <span className="flex items-center gap-space-2">
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

      {/* Uploads, as thumbnails.

          oz-cluster rather than a hand-written flex-wrap row: it also sets min-width:0 on the
          children, which is what stops a long strip forcing a horizontal scrollbar inside a
          narrow form column. verify:coverage caught this one as raw layout. */}
      {held.length > 0 && (
        <ul className="oz-cluster oz-cluster-3">
          {held.map((f, i) => (
            <li key={`${f.name}-${f.size}-${i}`} className={dropzoneRecipe.thumbClasses()}>
              {thumbs[i] ? (
                /* alt="" and the name on the <li>'s title: the image is decoration for a
                   filename that is already the accessible content. */
                <img src={thumbs[i]!} alt="" className="size-full object-cover" />
              ) : (
                <span aria-hidden="true" className="px-space-1 text-label-xs text-content-tertiary">
                  {(f.name.split('.').pop() ?? '').slice(0, 4).toUpperCase()}
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
                <span className="size-space-4">
                  <CloseIcon />
                </span>
              </button>
            </li>
          ))}

          {/* The + tile. Only when more are allowed — a full strip offering to add a fifth of
              four is an invitation to a rejection. */}
          {multiple && (maxFiles === undefined || held.length < maxFiles) && (
            <li>
              <button
                type="button"
                aria-label="Add more files"
                disabled={disabled}
                onClick={openPicker}
                className={dropzoneRecipe.addTileClasses()}
              >
                <span className="size-space-6">
                  <PlusIcon />
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
      optional={optional}
      disabled={disabled}
      size={size as FieldSize}
    >
      {control}
    </Field>
  );
}
