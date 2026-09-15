// The app's own light/dark/system toggle — replaces the old
// OS-preference-only (`prefers-color-scheme` media query) approach with a
// `.dark` class on <html> that a visitor can override per device. See
// globals.css's `@custom-variant dark` for the CSS half of this, and the
// inline blocking script in layout.tsx's <head> for how the class gets
// applied before first paint (a useEffect here would only run after paint,
// causing a flash on every load, not just first visit).

import { useCallback, useEffect, useRef, useState } from "react";
import { logClientEvent } from "./clientLog.ts";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";
const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

/**
 * The accent-color theme — a second, independent axis from light/dark/
 * system above (a visitor can be on Necron Emerald in either light or
 * dark mode). Each value is just a replacement for the app's single
 * `--brass-*` ramp (see globals.css's `[data-accent="…"]` blocks), so
 * surfaces/text/semantic danger-success-warning tokens stay identical
 * across every theme — only the accent hue/chroma changes. `"brass"` is
 * the original/default ramp, defined directly in globals.css's `:root`
 * with no override block of its own.
 *
 * Local-only for now (`localStorage`, like a guest's theme choice) —
 * unlike Theme above, this doesn't yet sync to a signed-in account across
 * devices; that would need a backend field (see `setAccountTheme`) and
 * hasn't been built.
 */
export type AccentTheme =
  | "brass"
  | "ultramarine"
  | "sanguine"
  | "verdant"
  | "plague-bloom"
  | "necron-emerald"
  | "waaagh"
  | "amethyst"
  | "hive-bloom"
  | "tau-cyan"
  | "custodian-gold"
  | "khorne-crimson";

/** Display metadata for the accent-theme picker (see
 * components/ui/accentThemePicker.tsx). `swatch` is a literal color string
 * (not a CSS variable) so every option can preview its own color at once,
 * independent of whichever theme is currently active on `<html>` — it
 * must be kept in sync with that theme's `--brass-500` value in
 * globals.css. */
export const ACCENT_THEMES: readonly { value: AccentTheme; label: string; faction: string; swatch: string }[] = [
  { value: "brass", label: "Brass", faction: "Adeptus Mechanicus", swatch: "oklch(0.68 0.13 75)" },
  { value: "ultramarine", label: "Ultramarine", faction: "Ultramarines", swatch: "oklch(0.68 0.11 254)" },
  { value: "sanguine", label: "Sanguine", faction: "Blood Angels", swatch: "oklch(0.68 0.17 15)" },
  { value: "verdant", label: "Verdant", faction: "Dark Angels", swatch: "oklch(0.68 0.12 138)" },
  { value: "plague-bloom", label: "Plague Bloom", faction: "Death Guard", swatch: "oklch(0.68 0.08 100)" },
  { value: "necron-emerald", label: "Necron Emerald", faction: "Necrons", swatch: "oklch(0.68 0.1 174)" },
  { value: "waaagh", label: "Waaagh!", faction: "Orks", swatch: "oklch(0.68 0.19 128)" },
  { value: "amethyst", label: "Amethyst", faction: "Aeldari", swatch: "oklch(0.68 0.15 300)" },
  { value: "hive-bloom", label: "Hive Bloom", faction: "Tyranids", swatch: "oklch(0.68 0.17 326)" },
  { value: "tau-cyan", label: "T'au Cyan", faction: "T'au Empire", swatch: "oklch(0.68 0.12 214)" },
  { value: "custodian-gold", label: "Custodian Gold", faction: "Adeptus Custodes", swatch: "oklch(0.68 0.21 90)" },
  { value: "khorne-crimson", label: "Khorne Crimson", faction: "World Eaters", swatch: "oklch(0.68 0.18 34)" },
];

const ACCENT_THEME_STORAGE_KEY = "accentTheme";

/** Narrows an arbitrary stored/read value down to a real AccentTheme,
 * defaulting to "brass" for anything else (unset, corrupted, or a
 * future/older value this build doesn't recognize) — mirrors parseTheme
 * above. */
export function parseAccentTheme(value: string | null): AccentTheme {
  return (ACCENT_THEMES as readonly { value: string }[]).some((option) => option.value === value)
    ? (value as AccentTheme)
    : "brass";
}

function readStoredAccentTheme(): AccentTheme {
  if (typeof window === "undefined") return "brass";
  try {
    return parseAccentTheme(window.localStorage.getItem(ACCENT_THEME_STORAGE_KEY));
  } catch {
    return "brass";
  }
}

/** Applies an accent theme to the document and persists the visitor's
 * choice — the `data-accent` counterpart to `applyTheme` above. */
export function applyAccentTheme(accent: AccentTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-accent", accent);
  try {
    window.localStorage.setItem(ACCENT_THEME_STORAGE_KEY, accent);
  } catch {
    // best-effort only (e.g. private browsing can throw) — not worth surfacing
  }
}

/**
 * Decides how to reconcile a freshly-signed-in account's saved accent
 * theme against whatever this device already had locally — the accent
 * counterpart to `reconcileAccountTheme` below, "brass" standing in for
 * that function's "system" as the "never actually set anything" default.
 * Pure — no DOM/network access — so directly unit-testable.
 */
export function reconcileAccountAccentTheme(
  accountAccent: AccentTheme,
  localAccent: AccentTheme
): { resolved: AccentTheme; pushLocalUp: boolean } {
  const pushLocalUp = accountAccent === "brass" && localAccent !== "brass";
  return { resolved: pushLocalUp ? localAccent : accountAccent, pushLocalUp };
}

/**
 * Saves a signed-in account's accent-theme choice server-side (see
 * internal/api/me.go's SetAccentTheme, POST /api/me/accent-theme) — the
 * accent counterpart to `setAccountTheme` below.
 */
export async function setAccountAccentTheme(accent: AccentTheme): Promise<void> {
  const res = await fetch(`${BACKEND_API_BASE}/api/me/accent-theme`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accentTheme: accent }),
  });
  if (!res.ok) {
    throw new Error(`Request failed: HTTP ${res.status}`);
  }
}

/**
 * Current accent-theme choice plus a setter that also applies it
 * immediately. Starts at "brass" for the same SSR-hydration-mismatch
 * reason `useTheme` starts at "system" (see that hook's doc comment) —
 * synced to the real stored value in an effect right after mount instead.
 *
 * `account` follows the exact same contract as `useTheme`'s own
 * `account` param (see that hook's doc comment for the full reasoning,
 * including why a signed-in account wins over local once known, but an
 * account still at its own default defers to a real local choice
 * instead of discarding it) — pass
 * `user && checked ? { accentTheme: user.accentTheme } : null`.
 */
export function useAccentTheme(account?: { accentTheme: AccentTheme } | null) {
  const [accent, setAccentState] = useState<AccentTheme>("brass");
  const syncedFromAccountRef = useRef(false);

  useEffect(() => {
    Promise.resolve().then(() => setAccentState(readStoredAccentTheme()));
  }, []);

  useEffect(() => {
    if (!account || syncedFromAccountRef.current) return;
    syncedFromAccountRef.current = true;
    Promise.resolve().then(() => {
      const { resolved, pushLocalUp } = reconcileAccountAccentTheme(account.accentTheme, readStoredAccentTheme());
      setAccentState(resolved);
      applyAccentTheme(resolved);
      if (pushLocalUp) {
        setAccountAccentTheme(resolved).catch((err: unknown) => {
          logClientEvent("warn", "pushing local accent theme choice to account failed", {
            error: err instanceof Error ? err.message : String(err),
          });
        });
      }
    });
  }, [account]);

  const setAccent = useCallback(
    (next: AccentTheme) => {
      setAccentState(next);
      applyAccentTheme(next);
      if (account) {
        setAccountAccentTheme(next).catch((err: unknown) => {
          logClientEvent("warn", "saving accent theme choice to account failed", {
            error: err instanceof Error ? err.message : String(err),
          });
        });
      }
    },
    [account]
  );

  return { accent, setAccent };
}

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
 * Decides how to reconcile a freshly-signed-in account's saved theme
 * against whatever this device already had locally, the first time
 * they're compared for a given sign-in. Pure — no DOM/network access —
 * so the "push local up instead of discarding it" rule (see useTheme's
 * doc comment for the full reasoning) is directly unit-testable.
 */
export function reconcileAccountTheme(
  accountTheme: Theme,
  localTheme: Theme
): { resolved: Theme; pushLocalUp: boolean } {
  const pushLocalUp = accountTheme === "system" && localTheme !== "system";
  return { resolved: pushLocalUp ? localTheme : accountTheme, pushLocalUp };
}

/**
 * Saves a signed-in account's theme choice server-side (see
 * internal/api/me.go's SetTheme, POST /api/me/theme) so it follows them
 * across devices instead of staying stuck in one browser's localStorage.
 * Same getJSON/postJSON-less minimal fetch shape myEvents.ts's postJSON
 * uses, kept as its own small copy here rather than a shared import — the
 * established convention across this app's app/lib/*.ts modules.
 */
export async function setAccountTheme(theme: Theme): Promise<void> {
  const res = await fetch(`${BACKEND_API_BASE}/api/me/theme`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ theme }),
  });
  if (!res.ok) {
    throw new Error(`Request failed: HTTP ${res.status}`);
  }
}

/**
 * Current theme choice ("light"/"dark"/"system", not the resolved
 * light-or-dark value) plus a setter that also applies it immediately.
 *
 * `account` is the signed-in account's saved preference, or `null` for a
 * signed-out guest — pass `user && checked ? { themePreference: user.themePreference } : null`
 * from a component that already calls useCurrentUser() (e.g.
 * accountSection.tsx), rather than this hook calling useCurrentUser()
 * itself, which would mean a second independent /api/me fetch alongside
 * whatever the caller already made (useCurrentUser() is explicitly NOT
 * shared state — see auth.ts's doc comment).
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
 * Once `account` is known (non-null), it wins over whatever this device
 * had locally — the same "server wins once signed in" rule this app
 * already uses for follows/recent-events (see page.tsx's hydration
 * effect) — with one deliberate addition: if the account has never
 * actually set a preference (still at the backend's own "system"
 * default) but this device already has a real, different local choice,
 * that local choice is pushed up once instead of being silently
 * discarded — follows/recent-events don't need this (there's no
 * meaningful "guest data" to preserve there), but overwriting someone's
 * already-made dark-mode choice the moment they sign in for the first
 * time would be a real, visible regression for exactly the visitors this
 * feature is supposed to help. Runs once per sign-in (guarded by a ref),
 * not on every render — a later manual toggle change is never clobbered
 * by this effect re-firing, since `account` doesn't change again until
 * the next full sign-in.
 *
 * While `theme === "system"`, listens for the OS-level preference
 * changing live — same `matchMedia` listener idiom as
 * itcBadge.tsx's usePrefersDarkMode — so flipping the OS setting updates
 * the page immediately rather than only on next load.
 */
export function useTheme(account?: { themePreference: Theme } | null) {
  const [theme, setThemeState] = useState<Theme>("system");
  const syncedFromAccountRef = useRef(false);

  useEffect(() => {
    // Wrapped in a resolved-promise callback, like every effect in this
    // app that sets state from something read synchronously — see
    // itcBadge.tsx's usePrefersDarkMode for the same idiom.
    Promise.resolve().then(() => setThemeState(readStoredTheme()));
  }, []);

  useEffect(() => {
    if (!account || syncedFromAccountRef.current) return;
    syncedFromAccountRef.current = true;
    Promise.resolve().then(() => {
      const { resolved, pushLocalUp } = reconcileAccountTheme(account.themePreference, readStoredTheme());
      setThemeState(resolved);
      applyTheme(resolved);
      if (pushLocalUp) {
        setAccountTheme(resolved).catch((err: unknown) => {
          logClientEvent("warn", "pushing local theme choice to account failed", {
            error: err instanceof Error ? err.message : String(err),
          });
        });
      }
    });
  }, [account]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      applyTheme(next);
      if (account) {
        setAccountTheme(next).catch((err: unknown) => {
          logClientEvent("warn", "saving theme choice to account failed", {
            error: err instanceof Error ? err.message : String(err),
          });
        });
      }
    },
    [account]
  );

  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [theme]);

  return { theme, setTheme };
}
