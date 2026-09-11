// Client for this app's own backend, which proxies Best Coast Pairings'
// (unofficial, undocumented) data API.
//
// This used to fetch directly from BCP's own undocumented API, with an
// in-memory cache and a minimum refetch interval enforced per browser tab
// to be a respectful API citizen (see CLAUDE.md's "be respectful of
// third-party APIs" rule). That fetching/caching/rate-limiting logic has
// moved server-side into this app's own Go backend (see the
// brass-ledger-api repo's internal/bcp package), so every browser
// now shares one server-side cache and rate limit against BCP instead of
// each tab enforcing its own. This file is now a thin client for this
// app's own backend, and every exported type/function signature here is
// unchanged from before the move — only what happens inside them changed.
//
// SCOPE NOTE (unchanged): this app only ever retrieves data BCP already
// publishes (rosters, event metadata, already-decided pairings,
// already-computed placings). It never computes, ranks, or suggests a
// pairing/matchup of any kind — Challengers Cup's event pack bans "AI
// programs, algorithms, or methodology... for the pairings process,"
// which is broader than just AI. Don't add scoring or suggestion logic
// here, even without any AI involved.

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

// Only used to build a link out to a player's public BCP profile page —
// this app never fetches from BCP directly anymore, so this is the one
// BCP URL left in this file.
const BCP_SITE_BASE = "https://www.bestcoastpairings.com";

/**
 * Fetches `${BACKEND_API_BASE}${path}` and decodes it as JSON. Throws
 * using the backend's own `{error}` message on a non-ok response (falling
 * back to a generic message if the body isn't parseable JSON), and treats
 * an empty 200 body as `null` rather than trying (and failing) to parse
 * it — the backend uses an empty body for "no ITC ranking found."
 *
 * `credentials: "include"` matters now that these routes require a
 * session (see internal/api.RequireSession on the backend) — without it,
 * the browser never sends the session cookie cross-origin (this app's
 * own domain vs. api.brass-ledger.app in production), and every call
 * here would 401 even for a genuinely signed-in visitor.
 */
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

// --- Event metadata -------------------------------------------------------

/**
 * Metadata about a BCP event: its display name, whether it's a team event
 * (which drives whether the app's primary lookup is team-first or
 * player-first), how many rounds are underway/published, and the
 * event-facts BCP's own Overview tab shows (dates, venue, organizer,
 * registration counts, description). All of this is metadata BCP already
 * published for the event — nothing here is computed or inferred.
 */
export type EventInfo = {
  id: string;
  name: string;
  teamEvent: boolean;
  started: boolean;
  ended: boolean;
  currentRound: number;
  numberOfRounds: number;
  description?: string;
  gameSystem?: string;
  // BCP's internal id for the game system (e.g. Warhammer 40,000) — not
  // meant for display. fetchCurrentItcLeagueId (below) is anchored on
  // the event id itself now, not this field — see its doc comment.
  gameSystemId?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  organizer?: string;
  registrationLabel?: string;
  registrationCount?: string;
  playerCount?: number;
  circuits?: string[];
};

/**
 * Event metadata, fetched from this app's own backend (which handles the
 * caching/rate-limiting against BCP that used to happen here).
 */
export function fetchBcpEventInfo(eventId: string): Promise<EventInfo> {
  return getJSON<EventInfo>(`/api/events/${encodeURIComponent(eventId)}`);
}

// --- Players / rosters ------------------------------------------------------

/**
 * Fetches every registered player for a BCP event, with each player's
 * actual per-event tournament team name already resolved by the backend.
 */
export function fetchBcpPlayers(eventId: string): Promise<Player[]> {
  return getJSON<Player[]>(`/api/events/${encodeURIComponent(eventId)}/players`);
}

/** Groups a flat player list by tournament team name. Players with no
 * resolvable team (e.g. in a singles event) are omitted. */
function groupByTeam(players: Player[]): Map<string, Player[]> {
  const teams = new Map<string, Player[]>();
  for (const player of players) {
    if (!player.team) continue;
    const existing = teams.get(player.team);
    if (existing) {
      existing.push(player);
    } else {
      teams.set(player.team, [player]);
    }
  }
  return teams;
}

/**
 * Team roster for an event (players grouped by tournament team). For
 * singles events this will come back empty — use fetchBcpPlayers instead.
 */
export async function fetchBcpRoster(eventId: string): Promise<Map<string, Player[]>> {
  const players = await fetchBcpPlayers(eventId);
  return groupByTeam(players);
}

// --- Pairings ---------------------------------------------------------------

type BcpTeamPlayerRef = { id: string; name?: string; captainId?: string };
// `result` is some internal enum code (observed 0 and 2 for a loss/win) —
// rather than guess its exact meaning, scores here are compared by `points`
// directly (whoever has more won), which is unambiguous and is exactly
// what BCP's own site shows.
type BcpGameResult = { id: string; result?: number; points?: number };

type BcpPairingRecord = {
  id: string;
  pairingType: "Pairing" | "TeamPairing";
  table?: number;
  round?: number;
  published?: boolean;
  isDone?: boolean;
  // Individual (pairingType: "Pairing") fields:
  player1Id?: string;
  player2Id?: string;
  player1?: { id: string; user?: { id?: string; firstName?: string; lastName?: string } };
  player2?: { id: string; user?: { id?: string; firstName?: string; lastName?: string } };
  // Set on an individual "Pairing" record when it's actually one board
  // within a team event's team-vs-team pairing — points back at that
  // TeamPairing record's own `id`. Absent for a standalone singles-event
  // pairing. This is what lets a team pairing be expanded into its
  // individual boards (see fetchTeamPairingBoards below).
  teamPairingId?: string;
  // Team (pairingType: "TeamPairing") fields:
  teamPlayer1?: BcpTeamPlayerRef;
  teamPlayer2?: BcpTeamPlayerRef;
  player1Game?: BcpGameResult;
  player2Game?: BcpGameResult;
};

/**
 * A single published pairing involving whoever was looked up, already
 * resolved to "me" vs "them" so the UI doesn't need to know which side of
 * the raw record it was on.
 */
export type MyPairing = {
  round: number;
  table?: number;
  published: boolean;
  isDone: boolean;
  opponentName: string;
  // The opponent's BCP global (cross-event) user id — only set for
  // individual pairings, since a team-vs-team pairing's "opponent" is a
  // team, not a single person with an ITC ranking. Used to look up their
  // already-published ITC ranking (see fetchItcRanking below).
  opponentUserId?: string;
  // The opposing tournament-team's BCP teamPlayer id, set only for a
  // team-vs-team pairing — lets a caller look the opponent's own roster
  // up (by Player.teamPlayerId) to show who's playing when BCP hasn't
  // published individual boards for this matchup yet.
  opponentTeamPlayerId?: string;
  // Set only for a team-vs-team pairing — the raw TeamPairing record's own
  // id, i.e. the same id its individual board results reference as
  // `teamPairingId` (see fetchTeamPairingBoards). Lets a followed team's
  // round row expand into its individual boards, the same way a full
  // round-board row does.
  teamPairingId?: string;
  // Set only alongside teamPairingId: whether the followed team was
  // BCP's teamPlayer1 (vs. teamPlayer2) side of this team-vs-team
  // pairing. The individual board results fetchTeamPairingBoards returns
  // are in BCP's raw player1/player2 order, which is tied to that same
  // team1/team2 designation — not to which side is "mine" — so callers
  // need this to know whether to swap sides before displaying "my side
  // first," matching how myScore/opponentScore above are already
  // oriented.
  mySideIsTeam1?: boolean;
  // Present once the game is scored. `outcome` is derived by comparing the
  // two published point totals, not from BCP's own (undocumented) result
  // code — see the note on BcpGameResult above.
  myScore?: number;
  opponentScore?: number;
  outcome?: "win" | "loss" | "draw";
};

function scoreOutcome(
  myScore: number | undefined,
  opponentScore: number | undefined
): "win" | "loss" | "draw" | undefined {
  if (myScore === undefined || opponentScore === undefined) return undefined;
  if (myScore > opponentScore) return "win";
  if (myScore < opponentScore) return "loss";
  return "draw";
}

async function fetchRoundPairings(
  eventId: string,
  round: number,
  pairingType: "Pairing" | "TeamPairing"
): Promise<BcpPairingRecord[]> {
  const params = new URLSearchParams({ type: pairingType, round: String(round) });
  return getJSON<BcpPairingRecord[]>(
    `/api/events/${encodeURIComponent(eventId)}/pairings?${params.toString()}`
  );
}

function individualPairingToMine(
  record: BcpPairingRecord,
  playerId: string
): MyPairing | null {
  const iAmPlayer1 = record.player1Id === playerId;
  const iAmPlayer2 = record.player2Id === playerId;
  if (!iAmPlayer1 && !iAmPlayer2) return null;

  const opponent = iAmPlayer1 ? record.player2 : record.player1;
  const opponentName = opponent
    ? `${opponent.user?.firstName ?? ""} ${opponent.user?.lastName ?? ""}`.trim() ||
      "Unknown player"
    : "Bye / unpaired";

  const myGame = iAmPlayer1 ? record.player1Game : record.player2Game;
  const opponentGame = iAmPlayer1 ? record.player2Game : record.player1Game;

  return {
    round: record.round ?? 0,
    table: record.table,
    published: Boolean(record.published),
    isDone: Boolean(record.isDone),
    opponentName,
    opponentUserId: opponent?.user?.id,
    myScore: myGame?.points,
    opponentScore: opponentGame?.points,
    outcome: scoreOutcome(myGame?.points, opponentGame?.points),
  };
}

function teamPairingToMine(
  record: BcpPairingRecord,
  teamPlayerId: string
): MyPairing | null {
  const iAmTeam1 = record.teamPlayer1?.id === teamPlayerId;
  const iAmTeam2 = record.teamPlayer2?.id === teamPlayerId;
  if (!iAmTeam1 && !iAmTeam2) return null;

  const opponent = iAmTeam1 ? record.teamPlayer2 : record.teamPlayer1;

  const myGame = iAmTeam1 ? record.player1Game : record.player2Game;
  const opponentGame = iAmTeam1 ? record.player2Game : record.player1Game;

  return {
    round: record.round ?? 0,
    table: record.table,
    published: Boolean(record.published),
    isDone: Boolean(record.isDone),
    opponentName: opponent?.name ?? "Unknown team",
    opponentTeamPlayerId: opponent?.id,
    teamPairingId: record.id,
    mySideIsTeam1: iAmTeam1,
    myScore: myGame?.points,
    opponentScore: opponentGame?.points,
    outcome: scoreOutcome(myGame?.points, opponentGame?.points),
  };
}

/**
 * Looks up every published pairing for a given player (individual events)
 * across rounds 1..upToRound, from BCP's already-decided, already-public
 * pairing data. Purely a lookup — this never computes or suggests a
 * pairing itself.
 */
export async function fetchMyIndividualPairings(
  eventId: string,
  playerId: string,
  upToRound: number
): Promise<MyPairing[]> {
  const results: MyPairing[] = [];
  for (let round = 1; round <= upToRound; round++) {
    const records = await fetchRoundPairings(eventId, round, "Pairing");
    for (const record of records) {
      const mine = individualPairingToMine(record, playerId);
      if (mine) results.push(mine);
    }
  }
  return results.sort((a, b) => a.round - b.round);
}

/**
 * Same as fetchMyIndividualPairings, but for team-vs-team pairings in a
 * team event.
 */
export async function fetchMyTeamPairings(
  eventId: string,
  teamPlayerId: string,
  upToRound: number
): Promise<MyPairing[]> {
  const results: MyPairing[] = [];
  for (let round = 1; round <= upToRound; round++) {
    const records = await fetchRoundPairings(eventId, round, "TeamPairing");
    for (const record of records) {
      const mine = teamPairingToMine(record, teamPlayerId);
      if (mine) results.push(mine);
    }
  }
  return results.sort((a, b) => a.round - b.round);
}

// --- Round board (every pairing in a round, not just "mine") --------------

/**
 * One matchup on the round's pairings board — the same information the
 * physical pairings board at the venue would show. Like everything else in
 * this file, this only ever displays a pairing BCP has already published;
 * it doesn't determine or suggest one.
 */
export type BoardPairing = {
  // The raw pairing record's own id. For a team pairing, this is the same
  // id its individual board results reference as `teamPairingId` — see
  // fetchTeamPairingBoards below, which is how a team pairing row expands
  // into its individual boards.
  id: string;
  table?: number;
  // Ids let the UI highlight a followed team/player's own row reliably —
  // matching on name alone could collide (two players with the same name).
  side1Id?: string;
  side1Name: string;
  side2Id?: string;
  side2Name: string;
  published: boolean;
  isDone: boolean;
  isBye: boolean;
  // Present once the game is scored (isDone), straight from BCP.
  side1Score?: number;
  side2Score?: number;
};

function teamPairingToBoard(record: BcpPairingRecord): BoardPairing {
  return {
    id: record.id,
    table: record.table,
    side1Id: record.teamPlayer1?.id,
    side1Name: record.teamPlayer1?.name ?? "TBD",
    side2Id: record.teamPlayer2?.id,
    side2Name: record.teamPlayer2?.name ?? "TBD",
    published: Boolean(record.published),
    isDone: Boolean(record.isDone),
    isBye: !record.teamPlayer1 || !record.teamPlayer2,
    side1Score: record.player1Game?.points,
    side2Score: record.player2Game?.points,
  };
}

function individualPairingToBoard(record: BcpPairingRecord): BoardPairing {
  const nameOf = (p?: BcpPairingRecord["player1"]) =>
    p ? `${p.user?.firstName ?? ""} ${p.user?.lastName ?? ""}`.trim() || "Unknown player" : "Bye";

  return {
    id: record.id,
    table: record.table,
    side1Id: record.player1Id ?? record.player1?.id,
    side1Name: nameOf(record.player1),
    side2Id: record.player2Id ?? record.player2?.id,
    side2Name: nameOf(record.player2),
    published: Boolean(record.published),
    isDone: Boolean(record.isDone),
    isBye: !record.player1 || !record.player2,
    side1Score: record.player1Game?.points,
    side2Score: record.player2Game?.points,
  };
}

/**
 * Every published pairing for a single round — the whole board, not
 * filtered down to one team/player. Backed by the same per-round data as
 * the "my pairings" lookups above via this app's backend, which caches per
 * round so browsing the board doesn't cost any extra BCP requests beyond
 * what its rate limit already allows.
 */
export async function fetchRoundBoard(
  eventId: string,
  round: number,
  teamEvent: boolean
): Promise<BoardPairing[]> {
  const pairingType = teamEvent ? "TeamPairing" : "Pairing";
  const records = await fetchRoundPairings(eventId, round, pairingType);
  const board = records.map(teamEvent ? teamPairingToBoard : individualPairingToBoard);
  // Byes sort to the bottom regardless of table, since they're not really
  // part of the table sequence; everything else sorts by table number.
  return board.sort((a, b) => {
    if (a.isBye !== b.isBye) return a.isBye ? 1 : -1;
    return (a.table ?? Infinity) - (b.table ?? Infinity);
  });
}

/**
 * One individual board within a team-vs-team pairing (each player on one
 * team faces one player on the other) — e.g. a 5-a-side team pairing has
 * 5 of these. Already-published BCP data, same as everything else here;
 * this doesn't determine who plays whom, only displays it.
 */
export type TeamBoardMatchup = {
  table?: number;
  player1Name: string;
  player1UserId?: string;
  player2Name: string;
  player2UserId?: string;
  published: boolean;
  isDone: boolean;
  player1Score?: number;
  player2Score?: number;
};

function individualPairingToTeamBoardMatchup(record: BcpPairingRecord): TeamBoardMatchup {
  const nameOf = (p?: BcpPairingRecord["player1"]) =>
    p ? `${p.user?.firstName ?? ""} ${p.user?.lastName ?? ""}`.trim() || "Unknown player" : "Bye";

  return {
    table: record.table,
    player1Name: nameOf(record.player1),
    player1UserId: record.player1?.user?.id,
    player2Name: nameOf(record.player2),
    player2UserId: record.player2?.user?.id,
    published: Boolean(record.published),
    isDone: Boolean(record.isDone),
    player1Score: record.player1Game?.points,
    player2Score: record.player2Game?.points,
  };
}

/**
 * The individual board matchups nested inside one team pairing, so a team
 * pairing row can be expanded to show them (and each player's ITC ranking,
 * the same way a singles-event pairing already does). Backed by the same
 * per-round "Pairing" data as the singles-event board above via this app's
 * backend — expanding several team pairings in the same round only costs
 * one BCP request total, and none at all if that round's individual
 * pairings were already fetched for any other reason.
 */
export async function fetchTeamPairingBoards(
  eventId: string,
  round: number,
  teamPairingId: string
): Promise<TeamBoardMatchup[]> {
  const records = await fetchRoundPairings(eventId, round, "Pairing");
  return records
    .filter((r) => r.teamPairingId === teamPairingId)
    .map(individualPairingToTeamBoardMatchup)
    .sort((a, b) => (a.table ?? Infinity) - (b.table ?? Infinity));
}

// --- Placings ---------------------------------------------------------------

/**
 * One row of the event's standings — whatever BCP has already computed and
 * published. `metrics` is left as whatever named values BCP reports (e.g.
 * "Wins", "Battle Points", "Wins SoS") rather than hardcoded fields, since
 * these can vary by event/scoring format; this is a display, not a
 * recomputation of them.
 */
export type PlacingEntry = {
  id: string; // player id (individual events) or teamPlayerId (team events)
  name: string;
  placing?: number;
  metrics: { name: string; value: number }[];
};

/**
 * Event standings — whatever BCP has already computed and published,
 * ranked by its own `placing` field. Not available (returns an empty
 * list) until BCP has actually placed anyone, which typically means at
 * least one round has finished.
 */
export function fetchBcpPlacings(eventId: string, teamEvent: boolean): Promise<PlacingEntry[]> {
  return getJSON<PlacingEntry[]>(
    `/api/events/${encodeURIComponent(eventId)}/placings?team=${teamEvent}`
  );
}

// --- ITC ranking (score + rank) ------------------------------------------
//
// BCP tracks a season-long, cross-event "ITC Points" ranking per player
// (what its own Rankings pages show) — already-published data, not
// anything this app computes. It's scoped to a "league": BCP's current
// flagship ranking league for the game system, a year-versioned record
// that rotates roughly annually (e.g. "Warhammer Global Rankings 2026"),
// which the backend looks up rather than this app hardcoding it.

/**
 * A link to a player's public BCP profile — where their full ITC event
 * history lives — scoped to the given ranking league. Falls back to an
 * unscoped profile link (still real, just without the points table) if the
 * current league couldn't be resolved yet.
 */
export function buildBcpItcProfileUrl(bcpUserId: string, leagueId?: string): string {
  const base = `${BCP_SITE_BASE}/user/${encodeURIComponent(bcpUserId)}`;
  return leagueId ? `${base}?league=${encodeURIComponent(leagueId)}` : base;
}

/**
 * One player's current ITC ranking within a league: their total points and
 * overall rank (`placing`), exactly as BCP has already computed and
 * published it — this is a lookup, not a computation.
 */
export type ItcRanking = {
  points: number;
  placing?: number;
  wins?: number;
  losses?: number;
  ties?: number;
};

/**
 * Lookup of BCP's current flagship ITC ranking league id, anchored on one
 * specific event's own already-known leagues rather than a bare game
 * system id — see internal/bcp/itc.go's FetchCurrentItcLeagueIDForEvent
 * doc comment for why a game-system-wide search stopped being reliable
 * against BCP's real API. Used to build a working
 * buildBcpItcProfileUrl(...) link. Returns undefined if it couldn't be
 * resolved (e.g. none of this event's leagues is the flagship one);
 * callers should fall back to an unscoped profile link in that case.
 */
export async function fetchCurrentItcLeagueId(eventId: string): Promise<string | undefined> {
  const body = await getJSON<{ leagueId: string | null }>(
    `/api/itc/leagues/event/${encodeURIComponent(eventId)}`
  );
  return body.leagueId ?? undefined;
}

/**
 * One player's ITC ranking (points + rank) within a league — see the "ITC
 * ranking" section above for why this is cheap (a real per-player filter
 * on the backend) rather than requiring the full leaderboard. Returns null
 * if this player has no ranking in this league.
 */
export function fetchItcRanking(bcpUserId: string, leagueId: string): Promise<ItcRanking | null> {
  return getJSON<ItcRanking | null>(
    `/api/itc/rankings?leagueId=${encodeURIComponent(leagueId)}&userId=${encodeURIComponent(bcpUserId)}`
  );
}
