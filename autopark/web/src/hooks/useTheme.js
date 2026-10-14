import { useCallback, useEffect, useState } from 'react';

const KEY = 'autopark_theme';
export const THEMES = ['light', 'dark', 'system'];

const readStored = () => {
  try {
    const v = localStorage.getItem(KEY);
    return THEMES.includes(v) ? v : 'system';
  } catch {
    return 'system';
  }
};

const apply = (theme) => {
  const root = document.documentElement;
  // No attribute means "follow the OS": theme.css handles that via
  // prefers-color-scheme, so the attribute is only set for an explicit choice.
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
};

/**
 * Light / dark / system theme, persisted per browser.
 * The document attribute is the single switch — every token flips with it,
 * so no component needs to know which theme is active.
 */
export function useTheme() {
  const [theme, setThemeState] = useState(readStored);

  useEffect(() => {
    apply(theme);
    try {
      if (theme === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, theme);
    } catch {
      // Storage unavailable: the choice simply does not persist.
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(THEMES.includes(next) ? next : 'system');
  }, []);

  const cycle = useCallback(() => {
    setThemeState((t) => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]);
  }, []);

  return { theme, setTheme, cycle };
}

export default useTheme;
