// Client for this app's own backend's public player-dossier endpoint
// (see internal/api/dossier.go in the brass-ledger-api repo) and the
// signed-in account's own visibility toggle for it.
//
// fetchDossier is deliberately unauthenticated (no credentials: "include")
// — unlike every other app/lib/*.ts client, this route is meant to be
// reachable by a visitor who's never signed in, since the whole point is
// a link shareable outside the app. setDossierVisibility, in contrast,
// is exactly like myStats.ts's getJSON: it acts on the signed-in
// account's own session cookie.

import type { FactionStat, PlacingHistoryPoint, PlacingWithField } from "./myStats";

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

/**
 * A public player dossier (see internal/api/dossier.go's
 * dossierResponse) — the same faction/placing summary MyStats carries,
 * plus the display name of the Brass Ledger account it belongs to (BCP
 * itself has no standalone "player profile" lookup independent of an
 * event's roster, so this is the linked account's own sign-in name — see
 * that Go type's doc comment).
 */
export type Dossier = {
  name: string;
  linked: boolean;
  totalEvents: number;
  bestPlacing?: PlacingWithField;
  bestPlacingRtt?: PlacingWithField;
  bestPlacingGt?: PlacingWithField;
  bestPlacingTeams?: PlacingWithField;
  factions: FactionStat[];
  mostRecentEventId?: string;
  competingSince?: string;
  history: PlacingHistoryPoint[];
};

/**
 * Fetches the public dossier for a BCP user id, or null for a 404 —
 * covering all three of "no account has linked this id", "that account
 * isn't approved yet", and "that account has turned its dossier off",
 * which the backend deliberately doesn't distinguish (see dossier.go's
 * doc comment) so this can't be used to enumerate who's opted out. Any
 * other non-OK response still throws, same as every other client here.
 */
export async function fetchDossier(bcpUserId: string): Promise<Dossier | null> {
  const res = await fetch(`${BACKEND_API_BASE}/api/players/${encodeURIComponent(bcpUserId)}/dossier`);
  if (res.status === 404) return null;
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
  return JSON.parse(text) as Dossier;
}

/**
 * Turns the signed-in account's own dossier visibility on/off (see
 * internal/api/me.go's SetDossierVisibility). Resolves to nothing on
 * success — the caller already knows the new value, since it's the one
 * that requested it.
 */
export async function setDossierVisibility(isPublic: boolean): Promise<void> {
  const res = await fetch(`${BACKEND_API_BASE}/api/me/dossier-visibility`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ public: isPublic }),
  });
  if (!res.ok) {
    const text = await res.text();
    let message = `Request failed: HTTP ${res.status}`;
    try {
      const body = JSON.parse(text) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // Body wasn't JSON — keep the generic message above.
    }
    throw new Error(message);
  }
}
