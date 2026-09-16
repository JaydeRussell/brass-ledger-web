"use client";
import { useState } from "react";
import { ACCENT_THEMES, useAccentTheme, type AccentTheme } from "../../lib/theme";

type AccentThemePickerProps = {
  // The signed-in account's saved accent theme, or null for a signed-out
  // guest — see useAccentTheme()'s doc comment for why this is passed in
  // rather than fetched here. Omit entirely (guest behavior) if the
  // caller has no account context at all.
  account?: { accentTheme: AccentTheme } | null;
};

/**
 * A swatch grid for picking one of the app's accent-color themes (see
 * lib/theme.ts's AccentTheme doc comment).
 *
 * Collapsed by default, showing only the active swatch — the full
 * 12-option grid, always expanded, was pushing every nav link below the
 * fold in the drawer. Tapping the collapsed row (or a swatch, once
 * expanded) toggles `expanded`; picking a theme also collapses it back
 * down so the drawer returns to its compact state. This local expand/
 * collapse state is separate from `useAccentTheme()`'s own theme state.
 *
 * Plain inline content rather than a Radix popover — keeps this SSR-
 * renderable and avoids stacking a second focus-trapped layer inside the
 * nav drawer's own Dialog.
 *
 * The active swatch's ring uses `border-brass-400` — since `--brass-*` *is*
 * whichever theme is currently applied to `<html>`, this stays the right
 * color for every theme for free, no per-theme conditional needed. 400 is
 * the same step every other foreground-on-charcoal-surface color in this
 * app reaches for (see Badge's own TONE_CLASSES comment) — a *border*
 * against `bg-surface-2` is judged by WCAG 1.4.11's non-text-contrast
 * rule (3:1, not text's 4.5:1), and 400 clears it with margin for all 12
 * themes — confirmed by computing real sRGB relative luminance from each
 * theme's oklch values, not eyeballed.
 */
export default function AccentThemePicker({ account = null }: AccentThemePickerProps) {
  const { accent, setAccent } = useAccentTheme(account);
  const [expanded, setExpanded] = useState(false);
  const active = ACCENT_THEMES.find((option) => option.value === accent) ?? ACCENT_THEMES[0];

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-expanded={false}
        className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left hover:bg-surface-2"
      >
        <span
          aria-hidden
          className="h-5 w-5 shrink-0 rounded-full border border-surface-border"
          style={{ backgroundColor: active.swatch }}
        />
        <span className="text-xs text-text-secondary">
          Theme: <span className="font-medium text-text-primary">{active.label}</span>
        </span>
        <span className="ml-auto text-[10px] text-brass-400">Change</span>
      </button>
    );
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between px-1">
        <span className="text-xs font-medium text-text-secondary">Accent theme</span>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-expanded={true}
          className="text-[10px] text-brass-400"
        >
          Done
        </button>
      </div>
      <div role="radiogroup" aria-label="Accent theme" className="grid grid-cols-3 gap-1.5">
        {ACCENT_THEMES.map((option) => {
          const isActive = accent === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => {
                setAccent(option.value);
                setExpanded(false);
              }}
              title={option.faction}
              className={`flex flex-col items-center gap-1 rounded-md border px-1 py-1.5 transition-colors ${
                isActive ? "border-brass-400 bg-surface-2" : "border-transparent hover:bg-surface-2"
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
    </div>
  );
}
