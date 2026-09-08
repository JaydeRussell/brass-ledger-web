"use client";
import React from "react";

// How long a load has to sit before it counts as slow enough to say
// something about — matches the project's own "any load time greater
// than 3 seconds is a problem" bar. A first-ever (uncached) load of an
// event/account this app has never seen crosses this fairly often; once
// this project's own durable BCP cache (brass-ledger-api's
// internal/bcpcache) is warm for it, most loads don't.
export const SLOW_LOAD_MS = 3000;

/**
 * True once `active` has stayed true for at least `delayMs` (default
 * SLOW_LOAD_MS), false immediately once `active` goes false — used to
 * show a "this is taking longer than usual" hint only for a load that's
 * actually slow, not a normal fast one that would otherwise flash a
 * message for a single frame.
 */
export function useDelayedFlag(active: boolean, delayMs: number = SLOW_LOAD_MS): boolean {
  const [flagged, setFlagged] = React.useState(false);

  React.useEffect(() => {
    if (!active) {
      setFlagged(false);
      return;
    }
    const timer = setTimeout(() => setFlagged(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);

  return flagged;
}
