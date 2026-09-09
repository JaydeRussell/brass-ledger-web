// The app's own light/dark/system toggle — replaces the old
// OS-preference-only (`prefers-color-scheme` media query) approach with a
// `.dark` class on <html> that a visitor can override per device. See
// globals.css's `@custom-variant dark` for the CSS half of this, and the
// inline blocking script in layout.tsx's <head> for how the class gets
// applied before first paint (a useEffect here would only run after paint,
// causing a flash on every load, not just first visit).

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";

/** Narrows an arbitrary stored/read value down to a real Theme, defaulting
 * to "system" for anything else (unset, corrupted, or a future/older value
 * this build doesn't recognize). */
export function parseTheme(value: string | null): Theme {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

/** Pure resolution logic — no DOM access — so it's directly unit-testable
 * and reusable by both the inline no-FOUC script (as an equivalent inline
 * expression) and the React hook below. */
export function resolveTheme(theme: Theme, systemPrefersDark: boolean): ResolvedTheme {
  if (theme === "system") return systemPrefersDark ? "dark" : "light";
  return theme;
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    return parseTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Applies a resolved theme to the document and persists the visitor's
 * choice. Safe to call from an event handler (not just the initial script)
 * — this is what the toggle itself calls on every change. */
export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolveTheme(theme, systemPrefersDark()) === "dark");
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // best-effort only (e.g. private browsing can throw) — not worth surfacing
  }
}

/**
 * Current theme choice ("light"/"dark"/"system", not the resolved
 * light-or-dark value) plus a setter that also applies it immediately.
 *
 * Starts at "system" — matching what a server-rendered pass always sees
 * (there's no `localStorage` to read on the server) — then syncs to the
 * real stored value in an effect right after mount. This intentionally
 * does NOT read `readStoredTheme()` as the initial state: doing so would
 * make the client's first render disagree with the server-rendered HTML
 * whenever a visitor has a non-default saved preference, which is a real
 * React hydration mismatch (logged as a warning/error) even though it's
 * invisible in practice here, since every consumer of this hook today
 * (ThemeToggle, inside the nav drawer) starts off-screen until manually
 * opened. The <html> class itself never has this problem — the inline
 * script in layout.tsx's <head> sets it before hydration even begins.
 *
 * While `theme === "system"`, listens for the OS-level preference
 * changing live — same `matchMedia` listener idiom as
 * itcBadge.tsx's usePrefersDarkMode — so flipping the OS setting updates
 * the page immediately rather than only on next load.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    // Wrapped in a resolved-promise callback, like every effect in this
    // app that sets state from something read synchronously — see
    // itcBadge.tsx's usePrefersDarkMode for the same idiom.
    Promise.resolve().then(() => setThemeState(readStoredTheme()));
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [theme]);

  return { theme, setTheme };
}
