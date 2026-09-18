"use client";
import { useReduceMotion } from "../../lib/motionPrefs";

/**
 * An explicit "Reduce motion" switch — see lib/motionPrefs.ts's own doc
 * comment for why this exists alongside (not instead of) the OS-level
 * prefers-reduced-motion media query. Same switch visual as
 * dossierVisibilityToggle.tsx, sits in the nav drawer's account section
 * next to AccentThemePicker — both are per-browser display preferences,
 * this one just applies immediately (no backend round-trip, so no
 * saving/error state to show).
 */
export default function ReduceMotionToggle() {
  const { reduceMotion, setReduceMotion } = useReduceMotion();

  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <span className="text-xs text-text-secondary">Reduce motion</span>
      <button
        type="button"
        role="switch"
        aria-checked={reduceMotion}
        aria-label="Reduce motion"
        onClick={() => setReduceMotion(!reduceMotion)}
        className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
          reduceMotion ? "border-brass-500 bg-brass-500" : "border-surface-border bg-surface-2"
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-surface-0 transition-transform ${
            reduceMotion ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
