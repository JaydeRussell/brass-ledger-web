// Client for this app's own backend's "my events" endpoints (see
// internal/api/me.go in the teams-match-making-be repo): linking a Best
// Coast Pairings profile to the signed-in account, and fetching that
// profile's events classified into past/present/future.
//
// Like app/lib/auth.ts (and unlike bcp.ts's plain unauthenticated
// reads), session state lives in an httpOnly cookie, so every request
// here needs credentials: "include".

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

/**
 * Pulls a BCP user id out of a pasted profile URL
 * (https://www.bestcoastpairings.com/user/{id}) or a copied API request
 * URL (https://newprod-api.bestcoastpairings.com/v1/users/{id} — what
 * you get pulling this out of the browser's Network tab, since BCP's
 * own "my account" page doesn't link to a public profile anywhere), or
 * passes a bare id straight through. Same approach as
 * eventSettings.tsx's parseEventId, just matching /user/ or /users/
 * instead of /event/.
 */
export function parseBcpUserId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/users?\/([^/?#]+)/);
  return match ? match[1] : trimmed;
}

/**
 * Decodes a fetch Response as JSON, throwing using the backend's own
 * `{error}` message on a non-ok response (falling back to a generic
 * message if the body isn't parseable JSON) — same handling as bcp.ts's
 * getJSON, duplicated here rather than shared since that helper doesn't
 * send credentials and this one always must.
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

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_API_BASE}${path}`, { credentials: "include" });
  return handleJSONResponse<T>(res);
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BACKEND_API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleJSONResponse<T>(res);
}

/**
 * Links (or, given "", unlinks) a Best Coast Pairings profile to the
 * signed-in account. Accepts either a pasted profile URL or a bare id —
 * parseBcpUserId sorts that out before it reaches the backend. Returns
 * the id as the backend actually stored it (trimmed).
 */
export async function linkBcpProfile(input: string): Promise<string> {
  const body = await postJSON<{ bcpUserId: string }>("/api/me/bcp-profile", {
    bcpUserId: parseBcpUserId(input),
  });
  return body.bcpUserId;
}

/**
 * One event in a fetchMyEvents() response. Past entries additionally
 * carry placing/points/faction/team (BCP's own published result);
 * present/future entries leave those undefined, since BCP hasn't
 * published a placing for an event that hasn't concluded yet.
 */
export type MyEvent = {
  eventId: string;
  eventName: string;
  startDate?: string;
  endDate?: string;
  placing?: number;
  points?: number;
  faction?: string;
  team?: string;
};

/**
 * The signed-in account's BCP events, classified into three sections by
 * this app's own backend (see internal/api/me.go's GET /api/me/events).
 * `linked` is false — with all three sections empty — for an account
 * that hasn't pasted a BCP profile yet, which is a normal state for a
 * new account, not an error.
 */
export type MyEvents = {
  linked: boolean;
  past: MyEvent[];
  present: MyEvent[];
  future: MyEvent[];
};

export async function fetchMyEvents(): Promise<MyEvents> {
  return getJSON<MyEvents>("/api/me/events");
}
