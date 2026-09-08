// Client for this app's own backend's calendar-feed link (see
// internal/api/calendar.go's CalendarHandler in the brass-ledger-api
// repo): a subscribable .ics URL for the signed-in account's own
// upcoming (present/future) events, for adding to a phone/desktop
// calendar app.
//
// Like app/lib/myEvents.ts (and unlike bcp.ts's plain unauthenticated
// reads), session state lives in an httpOnly cookie, so this request
// needs credentials: "include" — same small getJSON duplicated here as
// in myEvents.ts/myStats.ts, for the same reason noted there. Note that
// the returned URL itself is deliberately NOT session-gated (a calendar
// app can't send this app's cookie) — only fetching that URL in the
// first place requires being signed in.

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_API_BASE}${path}`, { credentials: "include" });
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

/**
 * Returns the signed-in account's subscribable calendar-feed URL,
 * generating its token on the backend if this is the first request
 * (see user.Store.EnsureCalendarToken) — a second call returns the same
 * URL, so it's safe to call this every time the calendar page loads
 * rather than caching it client-side.
 */
export async function fetchCalendarUrl(): Promise<string> {
  const body = await getJSON<{ url: string }>("/api/me/calendar-url");
  return body.url;
}
