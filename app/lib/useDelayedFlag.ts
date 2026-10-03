"use client";
import React from "react";

// How long a load has to sit before it counts as slow enough to say
// something about — the project's own bar: a page whose content takes
// more than 2 seconds is treated as broken (CLAUDE.md). A first-ever
// (uncached) load of an event or account crosses it fairly often; once
// brass-ledger-api's durable BCP cache is warm for it, most loads don't.
export const SLOW_LOAD_MS = 2000;

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
