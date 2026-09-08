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
 * The signed-in account's player-stats summary (see
 * internal/api/stats.go's playerStatsResponse). `linked` is false — with
 * every other field empty/zero — for an account that hasn't pasted a BCP
 * profile yet, same as fetchMyEvents' MyEvents.linked.
 *
 * mostRecentGameSystemId, when present, is this app's cue for which game
 * system to look up an ITC ranking for (via lib/bcp.ts's
 * fetchCurrentItcLeagueId/fetchItcRanking) — deliberately not fetched by
 * this endpoint itself, so a page that doesn't want an ITC badge doesn't
 * pay for one.
 */
export type MyStats = {
  linked: boolean;
  totalEvents: number;
  bestPlacing?: number;
  bestPlacingRtt?: number;
  bestPlacingGt?: number;
  bestPlacingTeams?: number;
  factions: FactionStat[];
  mostRecentGameSystemId?: string;
};

export async function fetchMyStats(): Promise<MyStats> {
  return getJSON<MyStats>("/api/me/stats");
}
