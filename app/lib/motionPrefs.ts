// An explicit, in-app "Reduce motion" preference — for anyone the OS-
// level prefers-reduced-motion setting doesn't cover (a shared/work
// computer they can't change system settings on, or simply a preference
// scoped to this one app). Same "data-* attribute on <html> + localStorage,
// applied via an inline <head> script to avoid a flash of the wrong state
// before hydration" shape as lib/theme.ts's own AccentTheme — but purely
// local, no account sync: unlike the accent theme, there's no existing
// backend field for this, and adding one is out of scope for a UI/UX-only
// pass (see globals.css's own :focus-visible comment for a similar
// "audited, here's what's actually fixable within this scope" note).

import { useEffect, useState } from "react";

const STORAGE_KEY = "reduceMotion";

function readStoredPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Applies the preference to the document and persists it. `false`
 * removes the attribute entirely (rather than setting it to "false") so
 * globals.css's `:root[data-reduce-motion="true"]` selector only ever
 * has one way to match. */
export function applyReduceMotion(reduce: boolean) {
  if (typeof document === "undefined") return;
  if (reduce) {
    document.documentElement.setAttribute("data-reduce-motion", "true");
  } else {
    document.documentElement.removeAttribute("data-reduce-motion");
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, reduce ? "1" : "0");
  } catch {
    // best-effort only (e.g. private browsing can throw) — not worth surfacing
  }
}

/** Same synchronous-in-<head>-script logic as lib/theme.ts's own
 * ACCENT_INIT_SCRIPT (see layout.tsx) — has to run before first paint to
 * avoid a flash of motion for someone who's explicitly opted out. */
export const REDUCE_MOTION_INIT_SCRIPT = `(function(){try{if(localStorage.getItem("${STORAGE_KEY}")==="1")document.documentElement.setAttribute("data-reduce-motion","true");}catch(e){}})();`;

/** Current preference plus a setter that also applies it immediately.
 * Starts `false` (matching what a server-rendered pass always sees) and
 * syncs to the real stored value in an effect right after mount. */
export function useReduceMotion(): { reduceMotion: boolean; setReduceMotion: (v: boolean) => void } {
  const [reduceMotion, setReduceMotionState] = useState(false);

  useEffect(() => {
    // Wrapped in a resolved-promise callback, same as lib/theme.ts's own
    // useAccentTheme, so setState never runs synchronously within the
    // effect body itself (this project's lint config flags that).
    Promise.resolve().then(() => setReduceMotionState(readStoredPreference()));
  }, []);

  const setReduceMotion = (v: boolean) => {
    setReduceMotionState(v);
    applyReduceMotion(v);
  };

  return { reduceMotion, setReduceMotion };
}
