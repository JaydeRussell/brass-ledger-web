// The "following" (teams/players tracked within one event) type shared
// between app/page.tsx and this file, plus a client for this app's own
// backend's per-event follows endpoints (see internal/api/sync.go in the
// brass-ledger-api repo) — used only when a user is signed in; a
// signed-out visitor keeps the original localStorage-only behavior (see
// app/page.tsx's readLocalStorage/writeLocalStorage/followingKey).
//
// Like app/lib/auth.ts and app/lib/myEvents.ts (and unlike bcp.ts's plain
// unauthenticated reads), session state lives in an httpOnly cookie, so
// every request here needs credentials: "include".

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

// Following is many-to-one: you can follow any number of teams/players at
// once in a given event. Moved here (out of app/page.tsx) so both the
// page and this sync client share one definition.
export type Followed =
  | { kind: "team"; teamPlayerId: string; label: string }
  | { kind: "player"; playerId: string; label: string };

export function followedKey(f: Followed): string {
  return f.kind === "team" ? `team:${f.teamPlayerId}` : `player:${f.playerId}`;
}

function toFollowed(entry: { kind: string; refId: string; label: string }): Followed | null {
  if (entry.kind === "team") return { kind: "team", teamPlayerId: entry.refId, label: entry.label };
  if (entry.kind === "player") return { kind: "player", playerId: entry.refId, label: entry.label };
  return null; // an unrecognized kind from a future server version — skip rather than crash
}

function fromFollowed(f: Followed): { kind: string; refId: string; label: string } {
  return {
    kind: f.kind,
    refId: f.kind === "team" ? f.teamPlayerId : f.playerId,
    label: f.label,
  };
}

/**
 * Decodes a fetch Response as JSON, throwing using the backend's own
 * `{error}` message on a non-ok response — same handling as
 * myEvents.ts's handleJSONResponse, duplicated rather than shared since
 * these two files were written independently and neither is large enough
 * yet to be worth extracting a common base for.
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

/** The signed-in account's followed teams/players within one event. */
export async function fetchFollows(eventId: string): Promise<Followed[]> {
  const res = await fetch(`${BACKEND_API_BASE}/api/me/events/${encodeURIComponent(eventId)}/follows`, {
    credentials: "include",
  });
  const raw = await handleJSONResponse<{ kind: string; refId: string; label: string }[]>(res);
  return raw.map(toFollowed).filter((f): f is Followed => f !== null);
}

/** Starts following a team/player within an event on the signed-in account. */
export async function addFollow(eventId: string, follow: Followed): Promise<void> {
  const res = await fetch(`${BACKEND_API_BASE}/api/me/events/${encodeURIComponent(eventId)}/follows`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fromFollowed(follow)),
  });
  await handleJSONResponse(res);
}

/** Stops following a team/player within an event on the signed-in account. */
export async function removeFollow(eventId: string, follow: Followed): Promise<void> {
  const { kind, refId } = fromFollowed(follow);
  const res = await fetch(
    `${BACKEND_API_BASE}/api/me/events/${encodeURIComponent(eventId)}/follows/${encodeURIComponent(kind)}/${encodeURIComponent(refId)}`,
    { method: "DELETE", credentials: "include" }
  );
  await handleJSONResponse(res);
}
