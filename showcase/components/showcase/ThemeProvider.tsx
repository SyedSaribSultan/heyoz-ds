'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Mode } from '@/lib/core/types';

/* The mode is needed in two places that must agree: the .dark class that switches
 * the CSS custom properties, and the audit map the binding tables read their
 * resolved hex values from. Holding it in one context is what stops the page from
 * ever showing light-mode numbers under a dark-mode component.
 *
 * Two values, not one, and the distinction is the whole of this file.
 *
 *   preference  what the reader asked for: 'light' | 'dark' | 'system'
 *   mode        what that resolves to right now: 'light' | 'dark'
 *
 * Only `mode` may reach a consumer that renders a value. The .dark class is binary,
 * so the audit map has to be asked for a binary answer — a binding table handed
 * 'system' would either crash on `audit['system']` or, worse, quietly fall back to
 * light while the page around it was dark. Everything that reads `mode` today keeps
 * getting the resolved answer; `preference` exists for the one control that has to
 * show which of the three buttons is pressed.
 *
 * 'system' was missing entirely before this. The no-flash script in app/layout.tsx
 * has always treated an absent 'oz-theme' as "follow prefers-color-scheme", but the
 * first click on light or dark wrote a value and there was no way to ever unwrite it
 * — the OS setting was permanently overridden by a decision the reader may have made
 * once, on a different machine, months ago. */

/** What the reader asked for. Distinct from `Mode`, which is what it resolved to. */
export type ThemePreference = Mode | 'system';

type ThemeContextValue = {
  /** RESOLVED. Always 'light' or 'dark' — the mode the .dark class is actually in. */
  mode: Mode;
  /** Sets an explicit mode, i.e. leaves 'system' behind. Unchanged signature: other
   *  files call this and must keep working. */
  setMode: (mode: Mode) => void;
  toggle: () => void;
  /** What the reader asked for, including 'system'. For the toggle group only. */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  setMode: () => {},
  toggle: () => {},
  preference: 'system',
  setPreference: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

const STORAGE_KEY = 'oz-theme';

/* The one place the query is written. app/layout.tsx has the same string in the
 * no-flash script and cannot import it — that script is a raw string that runs in
 * <head> ahead of every module — so the two are checked against each other by eye,
 * and the note in layout.tsx says so. */
const DARK_QUERY = '(prefers-color-scheme: dark)';

function systemMode(): Mode {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  /* Both start at the server-safe answer and are corrected in an effect. 'light' is
   * what the server render says because the server cannot know; 'system' is the
   * honest default preference because that is what the no-flash script does with an
   * absent key. The script wins the paint; the effect below only catches React up.
   *
   * Do not be tempted to read localStorage or matchMedia in a lazy useState
   * initialiser to skip the effect. Neither exists during the server render, and the
   * first client render has to reproduce the server's markup byte for byte or React
   * throws the hydration away — the discipline the whole app follows. */
  const [mode, setModeState] = useState<Mode>('light');
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* Private browsing. Falls through to 'system', which is also the fallback the
       * no-flash script took, so the two agree. */
    }
    /* Anything that is not one of the two explicit modes is 'system' — including the
     * absent key, and including a stale value from an older build of this page. */
    setPreferenceState(stored === 'light' || stored === 'dark' ? stored : 'system');
    /* Read the class rather than re-deriving the mode: the script already made the
     * decision and put it on <html>, and re-deriving it here is a second
     * implementation of the same rule that can disagree with the pixels on screen. */
    setModeState(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    const resolved: Mode = next === 'system' ? systemMode() : next;
    setPreferenceState(next);
    setModeState(resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    try {
      /* 'system' is stored EXPLICITLY rather than by removing the key. Removing it
       * would work here and read as tidier, but it makes "never chose" and "chose to
       * follow the OS" the same state, and the second one is a decision worth
       * keeping. The no-flash script has to know the string too — see the note there,
       * because storing it without teaching the script about it is a dark-mode white
       * flash on every reload. */
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Private browsing. The toggle still works for this session. */
    }
  }, []);

  /* Kept for the callers that already exist: an explicit mode IS a preference, so
   * setMode is setPreference narrowed to the two values that are also modes. */
  const setMode = useCallback((next: Mode) => setPreference(next), [setPreference]);

  const toggle = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  /* While the preference is 'system', the OS switch has to land live. Otherwise
   * "follow the system" means "follow the system as it was when this tab opened",
   * which on a machine that flips at sunset is the one moment the reader would
   * notice. Detached the instant the preference becomes explicit, so an explicit
   * choice cannot be overwritten by a sunset.
   *
   * Deliberately NOT resolving eagerly here. An eager call would run on mount with
   * the initial 'system' before the effect above has read localStorage, so a reader
   * whose stored preference is 'dark' on a light-mode OS would watch the page they
   * chose get overruled and flash. The script already resolved the mode correctly at
   * paint time; this only needs to hear about changes from here on. */
  useEffect(() => {
    if (preference !== 'system') return;
    const mq = window.matchMedia(DARK_QUERY);
    const sync = () => {
      const resolved = systemMode();
      setModeState(resolved);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    };
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [preference]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggle, preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}
