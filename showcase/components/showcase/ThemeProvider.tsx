'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Mode } from '@/lib/core/types';

/* The mode is needed in two places that must agree: the .dark class that switches
 * the CSS custom properties, and the audit map the binding tables read their
 * resolved hex values from. Holding it in one context is what stops the page from
 * ever showing light-mode numbers under a dark-mode component. */

type ThemeContextValue = {
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  setMode: () => {},
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  /* Starts light to match the server render, then adopts whatever the no-flash
   * script in app/layout.tsx already put on <html>. The script wins the paint; this
   * only catches React up. */
  const [mode, setModeState] = useState<Mode>('light');

  useEffect(() => {
    setModeState(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem('oz-theme', next);
    } catch {
      /* Private browsing. The toggle still works for this session. */
    }
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggle }}>{children}</ThemeContext.Provider>
  );
}
