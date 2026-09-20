import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Every exported function in bcp.ts calls this app's own backend via
// fetch(), so these tests install a fake global fetch keyed by the
// request URL rather than hitting a real server. `installFetch` returns
// a `calls` array so a test can also assert on which URLs were actually
// requested (e.g. that a query param was encoded correctly).
type FakeResponse = { status: number; body: string };

function installFetch(handler: (url: string) => FakeResponse): { calls: string[] } {
  const calls: string[] = [];
  (globalThis as unknown as { fetch: typeof fetch }).fetch = (async (url: string) => {
    calls.push(url);
    const { status, body } = handler(url);
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => body,
    } as Response;
  }) as typeof fetch;
  return { calls };
}

const {
  fetchBcpEventInfo,
  fetchBcpPlayers,
  fetchBcpRoster,
  fetchMyIndividualPairings,
  fetchPlacingRoundScores,
  fetchMyTeamPairings,
  fetchRoundBoard,
  fetchTeamPairingBoards,
  fetchBcpPlacings,
  buildBcpItcProfileUrl,
  fetchCurrentItcLeagueId,
  fetchItcRanking,
  __clearRequestCacheForTests,
} = await import("./bcp.ts");

// getJSON de-duplicates in-flight requests and reuses a recent response
// for the same URL (see bcp.ts's REQUEST_CACHE_TTL_MS), so that state
// has to be reset between tests. Several tests here stub a different
// body for a URL they have already requested — something a real backend
// would not do inside the cache window, but exactly what a test needs
// to do.
beforeEach(() => {
  __clearRequestCacheForTests();
});

// --- getJSON's error handling, exercised through fetchBcpEventInfo -----

test("fetchBcpEventInfo: passes through a successful response", async () => {
  installFetch(() => ({ status: 200, body: JSON.stringify({ id: "evt-1", name: "Test Cup" }) }));
  const info = await fetchBcpEventInfo("evt-1");
  assert.equal(info.id, "evt-1");
  assert.equal(info.name, "Test Cup");
});

test("fetchBcpEventInfo: a non-ok response with a JSON {error} body throws that message", async () => {
  installFetch(() => ({ status: 502, body: JSON.stringify({ error: "BCP is down" }) }));
  await assert.rejects(() => fetchBcpEventInfo("evt-1"), /BCP is down/);
});

test("fetchBcpEventInfo: a non-ok response with a non-JSON body falls back to a generic message", async () => {
  installFetch(() => ({ status: 500, body: "<html>server error</html>" }));
  await assert.rejects(() => fetchBcpEventInfo("evt-1"), /HTTP 500/);
});

test("fetchBcpEventInfo: URL-encodes the event id", async () => {
  const { calls } = installFetch(() => ({ status: 200, body: JSON.stringify({ id: "x", name: "x" }) }));
  await fetchBcpEventInfo("evt/with spaces");
  assert.equal(calls.length, 1);
  assert.ok(calls[0].includes(encodeURIComponent("evt/with spaces")), `URL was ${calls[0]}`);
});

// --- Players / rosters --------------------------------------------------

test("fetchBcpPlayers: passes through the player list", async () => {
  installFetch(() => ({
    status: 200,
    body: JSON.stringify([{ id: "p1", name: "Anna", faction: "Necrons" }]),
  }));
  const players = await fetchBcpPlayers("evt-1");
  assert.equal(players.length, 1);
  assert.equal(players[0].name, "Anna");
});

test("fetchBcpRoster: groups players by team and omits players with no team", async () => {
  installFetch(() => ({
    status: 200,
    body: JSON.stringify([
      { id: "p1", name: "Anna", faction: "Necrons", team: "Team A" },
      { id: "p2", name: "Bob", faction: "Orks", team: "Team A" },
      { id: "p3", name: "Cara", faction: "Tau", team: "Team B" },
      { id: "p4", name: "Dan", faction: "Aeldari" }, // no team — singles-style entry
    ]),
  }));
  const roster = await fetchBcpRoster("evt-1");
  assert.deepEqual(
    [...roster.keys()].sort(),
    ["Team A", "Team B"],
    "roster should only have keys for players that actually have a team"
  );
  assert.equal(roster.get("Team A")?.length, 2);
  assert.equal(roster.get("Team B")?.length, 1);
});

// --- "My pairings" (individual and team) --------------------------------

test("fetchMyIndividualPairings", async () => {
  const { calls } = installFetch((url) => {
    // The batched form: one request naming every round, answered with
    // one flat list, exactly as the backend does it (see its
    // BCPHandler.fetchRounds).
    const params = new URL(url).searchParams;
    const requested = (params.get("rounds") ?? params.get("round") ?? "").split(",").filter(Boolean);
    const byRound: Record<string, unknown[]> = {
      "1": [
        {
          id: "pr-1", pairingType: "Pairing", round: 1, table: 5, published: true, isDone: true,
          player1Id: "me", player2Id: "opp",
          player1: { id: "me", user: { id: "u-me" } },
          player2: { id: "opp", user: { id: "u-opp", firstName: "Oppo", lastName: "Nent" } },
          player1Game: { id: "g1", points: 60 },
          player2Game: { id: "g2", points: 40 },
        },
      ],
      // Round 2: I'm not in any of this round's pairings (a bye/unpaired case).
      "2": [
        {
          id: "pr-2", pairingType: "Pairing", round: 2, published: true, isDone: false,
          player1Id: "someone-else", player2Id: "another-else",
        },
      ],
    };
    return {
      status: 200,
      body: JSON.stringify(requested.flatMap((r) => byRound[r] ?? [])),
    };
  });

  const results = await fetchMyIndividualPairings("evt-1", "me", 2);
  assert.equal(
    calls.length,
    1,
    "every round should arrive in one request — walking them in a serial await loop " +
      "cost a round trip per round, per followed player, before anything rendered"
  );
  assert.equal(results.length, 1, "should only include rounds I actually appear in");
  const [r1] = results;
  assert.equal(r1.round, 1);
  assert.equal(r1.table, 5);
  assert.equal(r1.opponentName, "Oppo Nent");
  assert.equal(r1.opponentUserId, "u-opp");
  assert.equal(r1.myScore, 60);
  assert.equal(r1.opponentScore, 40);
  assert.equal(r1.outcome, "win");
});

test("fetchMyIndividualPairings: a bye (no opponent record) still resolves, as 'Bye / unpaired'", async () => {
  installFetch(() => ({
    status: 200,
    body: JSON.stringify([
      { id: "pr-1", pairingType: "Pairing", round: 1, published: true, isDone: false, player1Id: "me" },
    ]),
  }));
  const [result] = await fetchMyIndividualPairings("evt-1", "me", 1);
  assert.equal(result.opponentName, "Bye / unpaired");
  assert.equal(result.outcome, undefined, "an unscored game has no outcome");
});

test("fetchMyTeamPairings: resolves my side, the opponent team, and mySideIsTeam1", async () => {
  installFetch(() => ({
    status: 200,
    body: JSON.stringify([
      {
        id: "tp-1", pairingType: "TeamPairing", round: 1, published: true, isDone: true,
        teamPlayer1: { id: "my-team", name: "My Team" },
        teamPlayer2: { id: "their-team", name: "Their Team" },
        player1Game: { id: "g1", points: 30 },
        player2Game: { id: "g2", points: 70 },
      },
    ]),
  }));
  const [result] = await fetchMyTeamPairings("evt-1", "my-team", 1);
  assert.equal(result.opponentName, "Their Team");
  assert.equal(result.teamPairingId, "tp-1");
  assert.equal(result.mySideIsTeam1, true);
  assert.equal(result.outcome, "loss");
});

// --- Round board ----------------------------------------------------------

test("fetchRoundBoard: individual event, sorts byes to the bottom and others by table", async () => {
  installFetch(() => ({
    status: 200,
    body: JSON.stringify([
      { id: "a", pairingType: "Pairing", table: 3, player1: { id: "p1", user: { id: "u1", firstName: "A" } }, player2: { id: "p2", user: { id: "u2", firstName: "B" } } },
      { id: "bye", pairingType: "Pairing", player1: { id: "p3", user: { id: "u3", firstName: "C" } } }, // no player2 => a bye
      { id: "b", pairingType: "Pairing", table: 1, player1: { id: "p4", user: { id: "u4", firstName: "D" } }, player2: { id: "p5", user: { id: "u5", firstName: "E" } } },
    ]),
  }));
  const board = await fetchRoundBoard("evt-1", 1, false);
  assert.deepEqual(
    board.map((b) => b.id),
    ["b", "a", "bye"],
    "expected table-1 first, table-3 second, and the bye last regardless of table"
  );
  assert.equal(board[2].isBye, true);
  // side1UserId/side2UserId are what a player-stats link needs (BCP's
  // cross-event account id), distinct from side1Id/side2Id's event-scoped
  // player id.
  const [tableOne] = board;
  assert.equal(tableOne.side1UserId, "u4");
  assert.equal(tableOne.side2UserId, "u5");
});

test("fetchRoundBoard: team event, maps team names onto side1/side2", async () => {
  installFetch(() => ({
    status: 200,
    body: JSON.stringify([
      {
        id: "t1", pairingType: "TeamPairing", table: 1,
        teamPlayer1: { id: "team-a", name: "Team A" },
        teamPlayer2: { id: "team-b", name: "Team B" },
      },
    ]),
  }));
  const [board] = await fetchRoundBoard("evt-1", 1, true);
  assert.equal(board.side1Name, "Team A");
  assert.equal(board.side2Name, "Team B");
  assert.equal(board.isBye, false);
  // A team side is a team, not one person — no BCP account to link.
  assert.equal(board.side1UserId, undefined);
  assert.equal(board.side2UserId, undefined);
});

test("fetchTeamPairingBoards: filters to one team pairing's boards and sorts by table", async () => {
  installFetch(() => ({
    status: 200,
    body: JSON.stringify([
      { id: "b2", pairingType: "Pairing", teamPairingId: "tp-1", table: 2, player1: { id: "p1", user: { firstName: "A" } }, player2: { id: "p2", user: { firstName: "B" } } },
      { id: "other", pairingType: "Pairing", teamPairingId: "tp-OTHER", table: 1 },
      { id: "b1", pairingType: "Pairing", teamPairingId: "tp-1", table: 1, player1: { id: "p3", user: { firstName: "C" } }, player2: { id: "p4", user: { firstName: "D" } } },
    ]),
  }));
  const boards = await fetchTeamPairingBoards("evt-1", 1, "tp-1");
  assert.equal(boards.length, 2, "should exclude boards belonging to a different team pairing");
  assert.deepEqual(boards.map((b) => b.table), [1, 2]);
});

// --- Placings ---------------------------------------------------------------

test("fetchBcpPlacings: passes through entries and encodes the team flag in the query", async () => {
  const { calls } = installFetch(() => ({
    status: 200,
    body: JSON.stringify([{ id: "t1", name: "Team A", placing: 1, metrics: [] }]),
  }));
  const entries = await fetchBcpPlacings("evt-1", true);
  assert.equal(entries[0].name, "Team A");
  assert.ok(calls[0].includes("team=true"), `URL was ${calls[0]}`);
});

// --- ITC ranking / league -------------------------------------------------

test("buildBcpItcProfileUrl", () => {
  const cases: { name: string; bcpUserId: string; leagueId?: string; want: string }[] = [
    { name: "with a league id", bcpUserId: "u1", leagueId: "league-2026", want: "https://www.bestcoastpairings.com/user/u1?league=league-2026" },
    { name: "without a league id", bcpUserId: "u1", want: "https://www.bestcoastpairings.com/user/u1" },
    {
      name: "encodes special characters in both ids",
      bcpUserId: "u/1",
      leagueId: "league 2026",
      want: `https://www.bestcoastpairings.com/user/${encodeURIComponent("u/1")}?league=${encodeURIComponent("league 2026")}`,
    },
  ];
  for (const tc of cases) {
    const got = buildBcpItcProfileUrl(tc.bcpUserId, tc.leagueId);
    assert.equal(got, tc.want, tc.name);
  }
});

test("fetchCurrentItcLeagueId: maps a found league id through, and null to undefined", async () => {
  const { calls } = installFetch(() => ({ status: 200, body: JSON.stringify({ leagueId: "league-2026" }) }));
  assert.equal(await fetchCurrentItcLeagueId("evt-1"), "league-2026");
  // Anchored on the event id, not a bare game system id — see the
  // function's doc comment for why.
  assert.match(calls[0], /\/api\/itc\/leagues\/event\/evt-1$/);

  // Second scenario, same URL: the cached first response would be
  // returned otherwise. A real backend wouldn't change its answer
  // inside the cache window, but these are two separate cases.
  __clearRequestCacheForTests();
  installFetch(() => ({ status: 200, body: JSON.stringify({ leagueId: null }) }));
  assert.equal(await fetchCurrentItcLeagueId("evt-1"), undefined);
});

test("fetchItcRanking: a found ranking passes through, and an empty body resolves to null", async () => {
  installFetch(() => ({ status: 200, body: JSON.stringify({ points: 1234.5, placing: 7 }) }));
  const ranking = await fetchItcRanking("u1", "league-1");
  assert.equal(ranking?.points, 1234.5);
  assert.equal(ranking?.placing, 7);

  // The backend returns an empty body (not the literal string "null")
  // when a player has no ranking in a league — getJSON has to treat
  // that as null rather than failing to JSON.parse an empty string.
  __clearRequestCacheForTests();
  installFetch(() => ({ status: 200, body: "" }));
  assert.equal(await fetchItcRanking("u1", "league-1"), null);
});

// --- Request de-duplication and reuse (getJSON's cache) ---------------

test("getJSON: concurrent identical requests share one fetch", async () => {
  // The shape a real event page makes: the roster feeds Overview,
  // Roster, Pairings and Placings, and they all ask at once.
  const { calls } = installFetch(() => ({ status: 200, body: JSON.stringify([{ id: "p1" }]) }));

  const results = await Promise.all([
    fetchBcpPlayers("evt-dedupe"),
    fetchBcpPlayers("evt-dedupe"),
    fetchBcpPlayers("evt-dedupe"),
    fetchBcpPlayers("evt-dedupe"),
  ]);

  assert.equal(calls.length, 1, "four simultaneous reads of the same roster should cost one request");
  for (const r of results) assert.equal(r[0]?.id, "p1");
});

test("getJSON: a second read inside the TTL is served without a request", async () => {
  const { calls } = installFetch(() => ({ status: 200, body: JSON.stringify([{ id: "p1" }]) }));

  await fetchBcpPlayers("evt-reuse");
  await fetchBcpPlayers("evt-reuse");

  assert.equal(calls.length, 1, "a repeat read inside the cache window should not reach the network");
});

test("getJSON: the same round's pairings are fetched once across every view derived from it", async () => {
  // fetchRoundBoard and fetchTeamPairingBoards both derive from the
  // same per-round pairings resource — the property FetchRoundPairings'
  // doc comment on the backend promises.
  const { calls } = installFetch(() => ({
    status: 200,
    body: JSON.stringify([{ id: "pair-1", round: 1, teamPairingId: "tp-1" }]),
  }));

  await fetchRoundBoard("evt-shared", 1, false);
  await fetchTeamPairingBoards("evt-shared", 1, "tp-1");

  assert.equal(calls.length, 1, "two views of one round should cost one request");
});

test("getJSON: a refresh bypasses the cache and supersedes the plain copy", async () => {
  let body = JSON.stringify([{ id: "stale" }]);
  const { calls } = installFetch(() => ({ status: 200, body }));

  const first = await fetchBcpPlacings("evt-refresh", false);
  assert.equal(first[0]?.id, "stale");

  // What the "check for updated placings" button does.
  body = JSON.stringify([{ id: "fresh" }]);
  const refreshed = await fetchBcpPlacings("evt-refresh", false, true);
  assert.equal(refreshed[0]?.id, "fresh", "a refresh must reach the backend");

  // And the plain URL must not serve the pre-refresh copy afterwards,
  // or the next ordinary read puts the stale value straight back.
  const after = await fetchBcpPlacings("evt-refresh", false);
  assert.equal(after[0]?.id, "fresh", "a refresh has to supersede the cached plain response");
  assert.equal(calls.length, 3);
});

test("getJSON: a failed request is not cached", async () => {
  let status = 502;
  const { calls } = installFetch(() => ({
    status,
    body: JSON.stringify(status === 502 ? { error: "BCP is having a moment" } : { id: "evt-recover" }),
  }));

  await assert.rejects(fetchBcpEventInfo("evt-flaky"), /BCP is having a moment/);

  // Venue wifi drops one request; the retry has to actually retry.
  status = 200;
  const recovered = await fetchBcpEventInfo("evt-flaky");
  assert.equal(recovered.id, "evt-recover");
  assert.equal(calls.length, 2, "caching a failure would turn one dropped request into a blank minute");
});

test("every rounds-walking caller asks once, not once per round", async () => {
  // The three functions that used to loop `await` over rounds. Each
  // ran its own loop, and "my pairings" ran once per followed player,
  // so a five-round team event could chain dozens of round trips before
  // the page settled.
  const body = JSON.stringify([
    {
      id: "pr-1", pairingType: "Pairing", round: 1, published: true,
      player1Id: "p1", player2Id: "p2",
      teamPlayer1: { id: "t1" }, teamPlayer2: { id: "t2" },
    },
  ]);

  for (const [label, run] of [
    ["fetchMyIndividualPairings", () => fetchMyIndividualPairings("evt-1", "p1", 5)],
    ["fetchMyTeamPairings", () => fetchMyTeamPairings("evt-1", "t1", 5)],
    ["fetchPlacingRoundScores", () => fetchPlacingRoundScores("evt-1", false, 5)],
  ] as const) {
    __clearRequestCacheForTests();
    const { calls } = installFetch(() => ({ status: 200, body }));
    await run();
    assert.equal(calls.length, 1, `${label} made ${calls.length} requests for 5 rounds, want 1`);
    assert.match(calls[0], /rounds=1%2C2%2C3%2C4%2C5|rounds=1,2,3,4,5/, `${label} should name every round`);
  }
});

test("a zero-round event asks for nothing at all", async () => {
  // An event that hasn't published a round yet. The old loop simply
  // didn't execute; the batched form has to short-circuit explicitly
  // rather than send rounds= with an empty list, which the backend
  // rejects as malformed.
  __clearRequestCacheForTests();
  const { calls } = installFetch(() => ({ status: 200, body: "[]" }));

  const results = await fetchMyIndividualPairings("evt-1", "me", 0);

  assert.equal(results.length, 0);
  assert.equal(calls.length, 0, "no rounds published means no request worth making");
});
