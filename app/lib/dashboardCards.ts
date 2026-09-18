// Which of Home's secondary dashboard cards (page.tsx's FriendsCard/
// RecordCard/JumpBackInCard — not NextUpCard, the page's primary "what's
// happening" slot, which isn't dismissible) a visitor has chosen to
// hide. Purely a per-browser display preference, not synced to an
// account — same "localStorage only, best-effort" posture as
// eventCache.ts's own read/writeLocalStorage (duplicated here rather
// than shared, matching that file's own precedent rather than
// introducing a new shared helper for two small call sites).

import { useCallback, useEffect, useState } from "react";

export type DashboardCardId = "friends" | "record" | "jumpBackIn";

const STORAGE_KEY = "home-hidden-cards";

function readLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalStorage<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // best-effort only (e.g. private browsing can throw) — not worth surfacing
  }
}

/**
 * `hidden` starts empty on every render (server and the client's first
 * paint alike) and is corrected from localStorage in an effect right
 * after mount — the standard fix for a client-only preference that
 * would otherwise mismatch server-rendered markup. A dismissed card can
 * flash visible for one frame before that effect runs; the alternative
 * (blocking first paint on a synchronous localStorage read) isn't worth
 * it for something this low-stakes.
 */
export function useHiddenDashboardCards(): {
  hidden: Set<DashboardCardId>;
  hide: (id: DashboardCardId) => void;
  show: (id: DashboardCardId) => void;
  showAll: () => void;
} {
  const [hidden, setHidden] = useState<Set<DashboardCardId>>(new Set());

  useEffect(() => {
    // Wrapped in a resolved-promise callback, same as event/page.tsx's
    // own hydration effect, so setState never runs synchronously within
    // the effect body itself (this project's lint config flags that).
    Promise.resolve().then(() => {
      setHidden(new Set(readLocalStorage<DashboardCardId[]>(STORAGE_KEY, [])));
    });
  }, []);

  const persist = useCallback((next: Set<DashboardCardId>) => {
    setHidden(next);
    writeLocalStorage(STORAGE_KEY, Array.from(next));
  }, []);

  const hide = useCallback(
    (id: DashboardCardId) => {
      persist(new Set(hidden).add(id));
    },
    [hidden, persist]
  );

  const show = useCallback(
    (id: DashboardCardId) => {
      const next = new Set(hidden);
      next.delete(id);
      persist(next);
    },
    [hidden, persist]
  );

  const showAll = useCallback(() => {
    persist(new Set());
  }, [persist]);

  return { hidden, hide, show, showAll };
}
