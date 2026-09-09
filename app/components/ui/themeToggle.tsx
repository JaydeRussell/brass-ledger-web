"use client";
import { useTheme, type Theme } from "../../lib/theme";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

/**
 * A plain three-button light/dark/system control — deliberately not built
 * on a Radix primitive yet (that's a later redesign phase, once
 * ui/dropdownMenu.tsx exists); this just gets real theme switching working
 * end to end. See lib/theme.ts for the persistence/resolution logic.
 */
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className="flex gap-1 rounded-md border border-surface-border bg-surface-2 p-1"
    >
      {OPTIONS.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(option.value)}
            className={`flex-1 rounded-sm px-2 py-1 text-xs font-medium transition-colors ${
              active
                ? // A fixed dark-neutral text color, not a surface token — brass-500's
                  // lightness is constant across light/dark mode, so the text sitting
                  // on top of it needs to be too (surface-0 would go near-white in
                  // light mode, failing contrast against the same gold background).
                  "bg-brass-500 text-[oklch(0.16_0.006_260)]"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
