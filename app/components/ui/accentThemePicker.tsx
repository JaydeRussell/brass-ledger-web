"use client";
import { ACCENT_THEMES, useAccentTheme, type AccentTheme } from "../../lib/theme";

type AccentThemePickerProps = {
  // The signed-in account's saved accent theme, or null for a signed-out
  // guest — see useAccentTheme()'s doc comment for why this is passed in
  // rather than fetched here. Omit entirely (guest behavior) if the
  // caller has no account context at all. Mirrors ThemeToggle's own
  // `account` prop exactly.
  account?: { accentTheme: AccentTheme } | null;
};

/**
 * A swatch grid for picking one of the app's accent-color themes —
 * companion to ThemeToggle's light/dark/system control, but a separate,
 * independent axis (see lib/theme.ts's AccentTheme doc comment): every
 * theme works in either light or dark mode. Plain inline content rather
 * than a Radix popover, matching ThemeToggle's own "not built on a Radix
 * primitive yet" call — keeps this SSR-renderable and avoids stacking a
 * second focus-trapped layer inside the nav drawer's own Dialog.
 *
 * The active swatch's ring uses `border-brass-600 dark:border-brass-400`
 * — since `--brass-*` *is* whichever theme is currently applied to
 * `<html>`, this stays the right color for every theme for free, no
 * per-theme conditional needed. Deliberately not the 500 stop every
 * other "active" indicator in this app uses (e.g. themeToggle.tsx's
 * `bg-brass-500` fill): a *border* against `bg-surface-2` is judged by
 * WCAG 1.4.11's non-text-contrast rule (3:1, not text's 4.5:1), and 500
 * against light mode's pale surface-2 (oklch L 0.92) only reaches
 * ~2.2:1 for every one of the 12 themes — confirmed by computing real
 * sRGB relative luminance from each theme's oklch values, not eyeballed.
 * 600/400 (darker-in-light, lighter-in-dark — the same shade-flip
 * Badge's own TONE_CLASSES comment already documents) clears 3:1 with
 * margin in both modes for all 12 themes.
 */
export default function AccentThemePicker({ account = null }: AccentThemePickerProps) {
  const { accent, setAccent } = useAccentTheme(account);

  return (
    <div role="radiogroup" aria-label="Accent theme" className="grid grid-cols-3 gap-1.5">
      {ACCENT_THEMES.map((option) => {
        const active = accent === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setAccent(option.value)}
            title={option.faction}
            className={`flex flex-col items-center gap-1 rounded-md border px-1 py-1.5 transition-colors ${
              active ? "border-brass-600 dark:border-brass-400 bg-surface-2" : "border-transparent hover:bg-surface-2"
            }`}
          >
            <span
              aria-hidden
              className="h-5 w-5 rounded-full border border-surface-border"
              style={{ backgroundColor: option.swatch }}
            />
            <span className="text-center text-[10px] leading-tight text-text-secondary">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
