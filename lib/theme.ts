export type Theme = "light" | "dark";

export const THEME_KEY = "compliance-mapper.theme";

export interface ThemeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/** Reads the saved choice. Returns null when nothing is saved or storage is blocked. */
export function readTheme(storage: ThemeStorage | null | undefined): Theme | null {
  try {
    const v = storage?.getItem(THEME_KEY);
    return isTheme(v) ? v : null;
  } catch {
    return null;
  }
}

/** Saves a choice. Returns false when storage is blocked. */
export function saveTheme(storage: ThemeStorage | null | undefined, theme: Theme): boolean {
  try {
    if (!storage) return false;
    storage.setItem(THEME_KEY, theme);
    return true;
  } catch {
    return false;
  }
}

/** The theme on screen: a saved choice wins, then the device setting. Light is the default. */
export function resolveTheme(saved: Theme | null, systemPrefersDark: boolean): Theme {
  if (saved) return saved;
  return systemPrefersDark ? "dark" : "light";
}

export function otherTheme(theme: Theme): Theme {
  return theme === "light" ? "dark" : "light";
}

/**
 * Runs in the page head before first paint. It copies a saved choice onto the root element,
 * so a returning visitor never sees a flash of the other theme.
 */
export const THEME_SCRIPT = `(function(){try{var t=window.localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;
