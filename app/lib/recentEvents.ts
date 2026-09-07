// "Recently viewed events" list, so switching back to an event you've
// already looked at doesn't mean re-pasting its URL. loadRecentEvents/
// recordRecentEvent below are the original localStorage-only
// implementation, still used for a signed-out (guest) visitor.
// fetchRecentEventsFromServer/recordRecentEventOnServer, further down,
// are this app's own backend's sync client (see internal/api/sync.go in
// teams-match-making-be) for a signed-in visitor, so the list follows
// them across devices instead of staying pinned to one browser. Neither
// half talks to BCP.

const RECENT_EVENTS_STORAGE_KEY = "bcp-recent-events";
const MAX_RECENT_EVENTS = 8;
const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export type RecentEvent = {
  id: string;
  name: string;
  teamEvent: boolean;
  lastViewedAt: number;
};

export function loadRecentEvents(): RecentEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_EVENTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecentEvents(events: RecentEvent[]) {
  try {
    window.localStorage.setItem(RECENT_EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // best-effort only (e.g. private browsing can throw) — not worth surfacing
  }
}

/**
 * Records that an event was just viewed, moving it to the front of the
 * list (deduped by id) and persisting the result. Returns the updated list
 * so the caller can put it straight into state.
 */
export function recordRecentEvent(
  current: RecentEvent[],
  event: { id: string; name: string; teamEvent: boolean }
): RecentEvent[] {
  const withoutThisOne = current.filter((e) => e.id !== event.id);
  const next = [
    { ...event, lastViewedAt: Date.now() },
    ...withoutThisOne,
  ].slice(0, MAX_RECENT_EVENTS);
  saveRecentEvents(next);
  return next;
}

/**
 * Decodes a fetch Response as JSON, throwing using the backend's own
 * `{error}` message on a non-ok response — same handling as
 * myEvents.ts's/follows.ts's handleJSONResponse.
 */
async function handleJSONResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let message = `Request failed: HTTP ${res.status}`;
    try {
      const body = JSON.parse(text) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // Body wasn't JSON — keep the generic message above.
    }
    throw new Error(message);
  }
  if (text.length === 0) return null as T;
  return JSON.parse(text) as T;
}

/** The signed-in account's recently-viewed events, most recent first. */
export async function fetchRecentEventsFromServer(): Promise<RecentEvent[]> {
  const res = await fetch(`${BACKEND_API_BASE}/api/me/recent-events`, { credentials: "include" });
  const raw = await handleJSONResponse<
    { eventId: string; eventName: string; teamEvent: boolean; lastViewedAt: number }[]
  >(res);
  return raw.map((e) => ({
    id: e.eventId,
    name: e.eventName,
    teamEvent: e.teamEvent,
    lastViewedAt: e.lastViewedAt,
  }));
}

/**
 * Records that the signed-in account just viewed an event. Fire-and-forget
 * from the caller's point of view (see app/page.tsx) — the server is the
 * source of truth for a signed-in visitor, so there's no local list to
 * merge the result back into the way recordRecentEvent above does.
 */
export async function recordRecentEventOnServer(event: {
  id: string;
  name: string;
  teamEvent: boolean;
}): Promise<void> {
  const res = await fetch(`${BACKEND_API_BASE}/api/me/recent-events`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId: event.id, eventName: event.name, teamEvent: event.teamEvent }),
  });
  await handleJSONResponse(res);
}
