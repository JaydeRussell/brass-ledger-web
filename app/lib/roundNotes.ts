// A signed-in account's own private per-round notes (e.g. matchup prep,
// list reminders) — client for this app's own backend's round-note
// endpoints (see internal/api/sync.go's GetRoundNote/SetRoundNote in the
// brass-ledger-api repo). Signed-in + approved only, same as
// follows.ts/recentEvents.ts's account-synced half — no guest/localStorage
// fallback, since there's no previous purely-local version of this
// feature to preserve parity with (see components/pairings/roundNotes.tsx's
// doc comment for the full scoping call).

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

/** Same decode/error handling as follows.ts's handleJSONResponse — kept
 * as its own small copy here rather than shared, matching this app's
 * established app/lib/*.ts convention (see follows.ts's own doc comment). */
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

/** The signed-in account's own private note for one round of one event —
 * "" if they've never saved one. */
export async function fetchRoundNote(eventId: string, round: number): Promise<string> {
  const res = await fetch(
    `${BACKEND_API_BASE}/api/me/events/${encodeURIComponent(eventId)}/rounds/${round}/note`,
    { credentials: "include" }
  );
  const body = await handleJSONResponse<{ note: string }>(res);
  return body.note;
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
}
