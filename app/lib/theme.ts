// The app's accent-color theme — see components/ui/accentThemePicker.tsx.
// The app itself is dark-mode-only (no light/system option); this is
// purely a choice of accent hue within that one dark palette.

import { useCallback, useEffect, useState } from "react";
import { logClientEvent } from "./clientLog.ts";

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

/**
 * The accent-color theme — each value is just a replacement for the app's
 * single `--brass-*` ramp (see globals.css's `[data-accent="…"]` blocks),
 * so surfaces/text/semantic danger-success-warning tokens stay identical
 * across every theme — only the accent hue/chroma changes. `"brass"` is
 * the original/default ramp, defined directly in globals.css's `:root`
 * with no override block of its own.
 *
 * Falls back to `localStorage` for a signed-out guest; syncs to a
 * signed-in account across devices via `setAccountAccentTheme` below.
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
 * future/older value this build doesn't recognize). */
export function parseAccentTheme(value: string | null): AccentTheme {
  return (ACCENT_THEMES as readonly { value: string }[]).some((option) => option.value === value)
    ? (value as AccentTheme)
    : "brass";
}

export function readStoredAccentTheme(): AccentTheme {
  if (typeof window === "undefined") return "brass";
  try {
    return parseAccentTheme(window.localStorage.getItem(ACCENT_THEME_STORAGE_KEY));
  } catch {
    return "brass";
  }
}

/** Applies an accent theme to the document and persists the visitor's
 * choice. */
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
 * theme against whatever this device already had locally, "brass"
 * standing in for "never actually set anything" (there's no separate
 * light/dark/system axis any more for this to mirror). Pure — no DOM/
 * network access — so directly unit-testable.
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
 * internal/api/me.go's SetAccentTheme, POST /api/me/accent-theme).
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
 * immediately. Starts at "brass" (matching what a server-rendered pass
 * always sees — there's no `localStorage` to read on the server) and
 * syncs to the real stored value in an effect right after mount instead.
 *
 * Reconciling a signed-in account's saved theme against this device's
 * local one does NOT happen here — it lives in
 * components/shared/accentThemeSync.tsx, mounted once in app/layout.tsx.
 * It used to run in this hook, which meant it only ever ran because the
 * nav drawer (this hook's only caller, via AccentThemePicker) was kept
 * mounted on every page by ui/dialog.tsx's `forceMount`. Once the drawer
 * became lazily loaded that was no longer true, so the reconcile moved
 * somewhere that is genuinely always mounted. By the time this hook's
 * own effect reads localStorage, that reconcile has already written the
 * resolved value there.
 *
 * `account` is still taken here, but only so `setAccent` knows whether a
 * manual pick should also be saved server-side. Pass
 * `user && checked ? { accentTheme: user.accentTheme } : null`.
 */
export function useAccentTheme(account?: { accentTheme: AccentTheme } | null) {
  const [accent, setAccentState] = useState<AccentTheme>("brass");

  useEffect(() => {
    Promise.resolve().then(() => setAccentState(readStoredAccentTheme()));
  }, []);

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
