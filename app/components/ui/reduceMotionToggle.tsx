"use client";
import { useSyncExternalStore } from "react";
import { useReduceMotion } from "../../lib/motionPrefs";

const OS_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToOsSetting(onChange: () => void) {
  const query = window.matchMedia?.(OS_QUERY);
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

/** Whether the device itself asks for reduced motion. */
function useOsReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToOsSetting,
    () => window.matchMedia?.(OS_QUERY).matches === true,
    () => false
  );
}

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
  // The device setting applies whatever this switch says, so say so
  // rather than show "off" while motion is reduced anyway.
  const osReduced = useOsReducedMotion();

  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <span className="text-xs text-text-secondary">
        Reduce motion
        {osReduced && !reduceMotion && (
          <span className="block text-2xs text-text-tertiary">On in your device settings</span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={reduceMotion}
        aria-label="Reduce motion"
        onClick={() => setReduceMotion(!reduceMotion)}
        className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors before:absolute before:-inset-x-1 before:-inset-y-2 before:content-[''] ${
          reduceMotion ? "border-brass-500 bg-brass-500" : "border-surface-border bg-surface-2"
        }`}
      >
        <span
          aria-hidden
          className={`absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-surface-0 transition-transform ${
            reduceMotion ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
