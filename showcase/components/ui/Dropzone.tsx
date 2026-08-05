'use client';

import { useCallback, useRef, useState } from 'react';
import { useControllable } from '@/lib/core/useControllable';
import { dropzoneRecipe, type DropzoneSize, type DropzoneVariant, type FieldSize } from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';
import { Field, type FieldControlProps } from './Field';
import { IconButton } from './IconButton';

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M12 16V4m0 0L8 8m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
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

  /** Overrides the primary line. Defaults to a phrase built from `accept`. */
  title?: string;
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

/**
 * A file drop target that is also a button.
 *
 * The two things this gets right that hand-rolled uploaders usually do not:
 *
 *   - IT IS A <label> AROUND A REAL FILE INPUT. Keyboard activation, the focus ring, the
 *     native picker and form association all come free. A div with onClick has none of
 *     them, and the absence is invisible to whoever built it with a mouse.
 *   - DRAG DEPTH IS COUNTED, NOT TOGGLED. dragenter and dragleave fire for every
 *     descendant, so a boolean makes the active state flicker as the pointer crosses the
 *     icon inside the zone. See the recipe note.
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
  title,
  forceState,
  forceVariant,
  className,
}: DropzoneProps) {
  /* useControllable rather than a hand-rolled pair, the same as every other control here.
   * Its no-op bail compares by identity, which is correct for an array: a new File[] is a
   * new value even when it holds the same files, and that is exactly what "the user removed
   * one and added it back" produces. */
  const [held, setHeld] = useControllable<File[]>({
    value: files,
    defaultValue: defaultFiles,
    onChange,
  });

  const [rejections, setRejections] = useState<Rejection[]>([]);
  /* A counter, not a boolean. See the recipe note — this is the whole reason the active
   * state does not flicker. */
  const depth = useRef(0);
  const [over, setOver] = useState(false);

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
            reason: `${f.name} is ${humanSize(f.size)}. The limit is ${humanSize(maxSize)}.`,
          });
        } else {
          accepted.push(f);
        }
      }

      /* Replace when single, append when multiple. A single-file zone that appended would
       * grow a list the user cannot see the end of while believing they replaced the file. */
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

  const variant: DropzoneVariant =
    forceVariant ?? (over ? 'active' : error || rejections.length ? 'invalid' : 'idle');

  const defaultTitle = multiple ? 'Drop files here, or click to browse' : 'Drop a file here, or click to browse';

  const control = (c?: FieldControlProps) => (
    <div className="oz-stack oz-stack-4">
      <label
        onDragEnter={(e) => {
          e.preventDefault();
          if (disabled) return;
          depth.current += 1;
          setOver(true);
        }}
        onDragOver={(e) => {
          /* Required. Without preventDefault on dragover the browser treats the element as
             a non-target and navigates to the file on drop, replacing the page. */
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
        className={dropzoneRecipe.classes({ variant, size, force: forceState, className })}
      >
        <input
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
               removing a file and re-picking it is a silent no-op — the input's value has
               not changed, so no event is emitted. */
            e.target.value = '';
          }}
          className="sr-only"
        />

        <span aria-hidden="true" className={dropzoneRecipe.iconClasses()}>
          <UploadIcon />
        </span>
        <span className={dropzoneRecipe.titleClasses()}>{title ?? defaultTitle}</span>
        {(accept || maxSize !== undefined) && (
          <span className="text-body-sm">
            {[accept?.replace(/,/g, ', '), maxSize !== undefined && `up to ${humanSize(maxSize)}`]
              .filter(Boolean)
              .join(' · ')}
          </span>
        )}
      </label>

      {/* Rejections, above the accepted list: the thing that went wrong is more urgent than
          the things that went right. aria-live so a drop rejected without a visible change
          in focus is still announced. */}
      {rejections.length > 0 && (
        <ul aria-live="polite" className="oz-stack oz-stack-1">
          {rejections.map((r) => (
            <li key={`${r.file.name}-${r.file.size}`} className={dropzoneRecipe.rejectionClasses()}>
              {r.reason}
            </li>
          ))}
        </ul>
      )}

      {held.length > 0 && (
        <ul className="oz-stack oz-stack-2">
          {held.map((f, i) => (
            <li key={`${f.name}-${f.size}-${i}`} className={dropzoneRecipe.fileRowClasses()}>
              <span className="min-w-0 flex-1 truncate text-body-sm text-content-primary">{f.name}</span>
              <span className="shrink-0 text-body-sm tabular-nums text-content-tertiary">
                {humanSize(f.size)}
              </span>
              <IconButton
                variant="ghost"
                size="sm"
                shape="rect"
                /* The file name is in the label, not just "Remove". A list of five identical
                   "Remove" buttons is five controls a screen-reader user cannot tell apart. */
                label={`Remove ${f.name}`}
                icon={<CloseIcon />}
                disabled={disabled}
                onClick={() => remove(i)}
                className="shrink-0"
              />
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
