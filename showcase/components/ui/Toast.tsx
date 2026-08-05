'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { toastRecipe, type ToastVariant } from '@/lib/recipes';
import type { StateName } from '@/lib/core/types';
import { cx } from '@/lib/core/cx';
import { IconButton } from './IconButton';
import { Button } from './Button';

/** Default lifetime. Four seconds — see the recipe note on why it is a floor, not a guess. */
const DEFAULT_MS = 4000;
/** With an action, longer: the user has to decide as well as read. */
const ACTION_MS = 7000;

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

const GLYPHS: Record<ToastVariant, React.ReactNode> = {
  neutral: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M12 11v5" strokeLinecap="round" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 3l9 16H3l9-16z" strokeLinejoin="round" />
      <path d="M12 9v4m0 3h.01" strokeLinecap="round" />
    </svg>
  ),
  critical: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5m0 3h.01" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M12 11v5" strokeLinecap="round" />
    </svg>
  ),
};

export type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Milliseconds. `null` never auto-dismisses — for a transient that is genuinely waiting on
   *  something, and the one case where the close button is the only way out. */
  duration?: number | null;
  action?: { label: string; onClick: () => void };
};

type ToastRecord = ToastOptions & { id: number };

type ToastApi = {
  /** Returns the id, so a caller can dismiss its own toast early — "saved" replaced by
   *  "save failed" without two stacking up. */
  show: (options: ToastOptions) => number;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

/** Throws rather than returning a no-op. A `toast()` that silently does nothing because the
 *  provider is missing is a bug that only shows up as "the confirmation never appeared",
 *  which is indistinguishable from the request having failed. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>.');
  return ctx;
}

/* -- one toast ------------------------------------------------------------- */

export type ToastProps = {
  toast: ToastRecord;
  onDismiss: (id: number) => void;
  forceState?: StateName;
  /** Showcase-only: renders it without a live timer. */
  frozen?: boolean;
};

export function Toast({ toast, onDismiss, forceState, frozen = false }: ToastProps) {
  const { id, title, description, variant = 'neutral', duration, action } = toast;
  const ms = duration === undefined ? (action ? ACTION_MS : DEFAULT_MS) : duration;

  /* Paused is a counter, not a boolean: hover and focus are independent, and a pointer
   * leaving while focus is still inside must not resume. Same shape as scrollLock's depth and
   * Dropzone's drag depth, for the same reason. */
  const [pauses, setPauses] = useState(0);
  const remaining = useRef(ms ?? 0);
  const startedAt = useRef(0);

  useEffect(() => {
    if (frozen || ms === null) return;
    /* Also paused while the tab is hidden. Without this, toasts queued behind a tab switch
     * all expire unseen and the work they confirmed appears to have produced no feedback. */
    if (pauses > 0 || document.hidden) return;

    startedAt.current = Date.now();
    const t = setTimeout(() => onDismiss(id), remaining.current);
    return () => {
      clearTimeout(t);
      /* Bank the elapsed time so resuming continues rather than restarting. A toast that
       * restarts its four seconds every time the pointer crosses it never leaves. */
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
    };
  }, [id, ms, pauses, onDismiss, frozen]);

  /* visibilitychange has to re-run the effect above, and `document.hidden` is not reactive.
   * A counter bump is the cheapest way to make it so. */
  useEffect(() => {
    if (frozen) return;
    const onVis = () => setPauses((p) => p + (document.hidden ? 1 : -1));
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [frozen]);

  return (
    <div
      /* role="alert" only on critical, and per-toast rather than on the region. Changing a
         live region's politeness after it exists is unreliable across screen readers, and a
         polite region is correct for the other four — assertive interrupts whatever is being
         read, which for "Draft saved" is an interruption with no news in it. */
      role={variant === 'critical' ? 'alert' : undefined}
      onPointerEnter={() => setPauses((p) => p + 1)}
      onPointerLeave={() => setPauses((p) => Math.max(0, p - 1))}
      onFocus={() => setPauses((p) => p + 1)}
      onBlur={() => setPauses((p) => Math.max(0, p - 1))}
      className={cx(toastRecipe.classes({ variant, force: forceState }), toastRecipe.enterClass)}
    >
      <span aria-hidden="true" className={toastRecipe.iconClasses(variant)}>
        {GLYPHS[variant]}
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-medium text-content-primary">{title}</p>
        {description && <p className={toastRecipe.descriptionClasses()}>{description}</p>}
        {action && (
          <div className="mt-space-3">
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                action.onClick();
                onDismiss(id);
              }}
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>

      <IconButton
        variant="ghost"
        size="sm"
        shape="rect"
        /* The title is in the label. A stack of five "Dismiss" buttons is five controls a
           screen-reader user cannot tell apart. */
        label={`Dismiss: ${title}`}
        icon={<CloseIcon />}
        onClick={() => onDismiss(id)}
        className="-mr-space-2 -mt-space-1 shrink-0"
      />
    </div>
  );
}

/* -- the provider ---------------------------------------------------------- */

/** How many are shown at once. Beyond this the oldest is dropped: a stack taller than the
 *  viewport cannot be read or dismissed, and the newest is the one that matters. */
const MAX_VISIBLE = 4;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((options: ToastOptions) => {
    const id = nextId.current++;
    /* Newest FIRST — see the recipe note. Prepending means the new toast appears at the top
     * of the column and the ones below it do not move, so a toast being read stays put. */
    setToasts((list) => [{ ...options, id }, ...list].slice(0, MAX_VISIBLE));
    return id;
  }, []);

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            /* polite, and the region exists whether or not it holds anything. A live region
               inserted at the same moment as its first message is frequently not announced —
               screen readers watch existing regions for changes, so the container has to be
               there first. This is the commonest reason a toast is silent. */
            aria-live="polite"
            aria-atomic="false"
            className={toastRecipe.regionClasses()}
          >
            {toasts.map((t) => (
              <Toast key={t.id} toast={t} onDismiss={dismiss} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
