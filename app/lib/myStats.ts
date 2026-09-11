// Client for this app's own backend's player-stats summary endpoint
// (see internal/api/stats.go in the brass-ledger-api repo): best
// placing (overall, GT, RTT) and a per-faction breakdown, aggregated
// from the signed-in account's linked BCP profile's placing history —
// the same already-published data "my events" uses, just summarized.
//
// Like app/lib/myEvents.ts (and unlike bcp.ts's plain unauthenticated
// reads), session state lives in an httpOnly cookie, so this request
// needs credentials: "include" — same small getJSON duplicated here as
// in myEvents.ts/follows.ts, for the same reason noted there.

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

/** One faction's summary across the player's placing history. */
export type FactionStat = {
  faction: string;
  eventCount: number;
  bestPlacing?: number;
};

/**
 * A best placing plus the size of the field it was achieved in (BCP's
 * own published player/team count for that event, when available) — see
 * internal/api/stats.go's placingWithField.
 */
export type PlacingWithField = {
  placing: number;
  fieldSize?: number;
};

/**
 * The signed-in account's player-stats summary (see
 * internal/api/stats.go's playerStatsResponse). `linked` is false — with
 * every other field empty/zero — for an account that hasn't pasted a BCP
 * profile yet, same as fetchMyEvents' MyEvents.linked.
 *
 * mostRecentEventId, when present, is this app's cue for which event's
 * own known leagues to resolve an ITC ranking league from (via
 * lib/bcp.ts's fetchCurrentItcLeagueId/fetchItcRanking — anchored on an
 * event id, not a bare game system id, see fetchCurrentItcLeagueId's
 * doc comment for why) — deliberately not fetched by this endpoint
 * itself, so a page that doesn't want an ITC badge doesn't pay for one.
 *
 * competingSince is the earliest event date in the player's history.
 */
export type MyStats = {
  linked: boolean;
  totalEvents: number;
  bestPlacing?: PlacingWithField;
  bestPlacingRtt?: PlacingWithField;
  bestPlacingGt?: PlacingWithField;
  bestPlacingTeams?: PlacingWithField;
  factions: FactionStat[];
  mostRecentEventId?: string;
  competingSince?: string;
};

export async function fetchMyStats(): Promise<MyStats> {
  return getJSON<MyStats>("/api/me/stats");
}

/**
 * The same summary as fetchMyStats, but for an arbitrary already-known
 * BCP account id (see internal/api/stats.go's PlayerStats) — used
 * whenever a player's name is clicked somewhere else in the app (roster,
 * pairings, placings) rather than for the signed-in account's own
 * profile. Still requires being signed in and approved, same as every
 * other BCP-backed read in this app; it just isn't scoped to the
 * caller's own linked profile the way fetchMyStats is.
 */
export async function fetchPlayerStats(bcpUserId: string): Promise<MyStats> {
  return getJSON<MyStats>(`/api/players/${encodeURIComponent(bcpUserId)}/stats`);
}
