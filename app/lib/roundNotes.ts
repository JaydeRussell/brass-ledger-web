// A signed-in account's own private per-round notes (e.g. matchup prep,
// list reminders) — client for this app's own backend's round-note
// endpoints (see internal/api/sync.go's GetRoundNote/SetRoundNote in the
// brass-ledger-api repo). Signed-in + approved only, same as
// recentEvents.ts's account-synced half — no guest/localStorage fallback
// (see components/pairings/roundNotes.tsx's doc comment for why).

import { httpErrorMessage } from "./httpError";
const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

/** Same decode/error handling as recentEvents.ts's handleJSONResponse —
 * kept as its own small copy here rather than shared, matching this
 * app's app/lib/*.ts convention. */
async function handleJSONResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let message = httpErrorMessage(res.status);
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

// One request per round for the page's lifetime: the notes box mounts
// twice while "Your round" loads, and only this account edits its notes.
// A save replaces the entry; a failure drops it so the next mount retries.
const noteRequests = new Map<string, Promise<string>>();
const noteKey = (eventId: string, round: number) => `${eventId}:${round}`;

/** Clears the per-page note cache. Exported for tests. */
export function __clearRoundNotesForTests() {
  noteRequests.clear();
}

/** The signed-in account's own private note for one round of one event —
 * "" if they've never saved one. */
export function fetchRoundNote(eventId: string, round: number): Promise<string> {
  const key = noteKey(eventId, round);
  const existing = noteRequests.get(key);
  if (existing) return existing;
  const request = fetch(
    `${BACKEND_API_BASE}/api/me/events/${encodeURIComponent(eventId)}/rounds/${round}/note`,
    { credentials: "include" }
  )
    .then((res) => handleJSONResponse<{ note: string }>(res))
    .then((body) => body.note);
  noteRequests.set(key, request);
  request.catch(() => noteRequests.delete(key));
  return request;
}

/** Saves (or, given an empty/whitespace-only note, clears) the signed-in
 * account's private note for one round of one event. */
export async function saveRoundNote(eventId: string, round: number, note: string): Promise<void> {
  const res = await fetch(
    `${BACKEND_API_BASE}/api/me/events/${encodeURIComponent(eventId)}/rounds/${round}/note`,
    {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    }
  );
  await handleJSONResponse(res);
  // Matches the server, which keeps a note as typed and deletes a blank one.
  noteRequests.set(noteKey(eventId, round), Promise.resolve(note.trim() === "" ? "" : note));
}
