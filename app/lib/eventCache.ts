// A small localStorage cache of each event's last-successfully-fetched
// `eventInfo`/`players` (roadmap "Resilience on bad venue wifi") — lets
// app/page.tsx show the last-known view instead of blanking to an error
// when a refetch fails on a spotty venue connection. Deliberately not a
// service worker/offline app-shell (that fuller approach is deferred
// until the planned mobile app work — see ROADMAP.md's note on this
// item); this only ever falls back to data already successfully loaded
// in this browser, nothing fetched offline.

import type { EventInfo } from "./bcp";

export type CachedEventSnapshot = {
  eventInfo: EventInfo;
  players: Player[];
  cachedAt: number; // Date.now() when this snapshot was fetched
};

// Same cap as recentEvents.ts's MAX_RECENT_EVENTS — this cache isn't
// meant to grow unboundedly across every event ever viewed in this
// browser, just the ones recently worth falling back to.
const MAX_CACHED_EVENTS = 8;

const INDEX_KEY = "bcp-event-cache-index";

function snapshotKey(eventId: string): string {
  return `bcp-event-cache:${eventId}`;
}

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

/** Most-recently-written event ids first. */
function readIndex(): string[] {
  return readLocalStorage<string[]>(INDEX_KEY, []);
}

/** The cached snapshot for this event, or null if there isn't one (or it's corrupt). */
export function loadCachedEvent(eventId: string): CachedEventSnapshot | null {
  return readLocalStorage<CachedEventSnapshot | null>(snapshotKey(eventId), null);
}

/**
 * Saves this event's snapshot and bumps it to the front of the recency
 * index, evicting the oldest entry beyond MAX_CACHED_EVENTS so this
 * doesn't grow forever for someone who browses many different events
 * over a long period.
 */
export function saveCachedEvent(eventId: string, snapshot: CachedEventSnapshot) {
  writeLocalStorage(snapshotKey(eventId), snapshot);

  const nextIndex = [eventId, ...readIndex().filter((id) => id !== eventId)];
  const evicted = nextIndex.slice(MAX_CACHED_EVENTS);
  writeLocalStorage(INDEX_KEY, nextIndex.slice(0, MAX_CACHED_EVENTS));
  evicted.forEach((id) => {
    try {
      window.localStorage.removeItem(snapshotKey(id));
    } catch {
      // best-effort only, same as writeLocalStorage above
    }
  });
}

/** "3 minutes ago" / "2 hours ago" / "just now", for a Date.now()-style timestamp. */
export function formatRelativeTime(ms: number): string {
  const diffSeconds = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (diffSeconds < 60) return "just now";
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}
