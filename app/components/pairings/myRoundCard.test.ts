import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import MyRoundCard from "./myRoundCard.tsx";
import type { MyPairing, TeamBoardMatchup } from "../../lib/bcp.ts";

const players: Player[] = [
  { id: "p1", name: "Me", faction: "Orks", bcpUserId: "u-me" },
  { id: "p2", name: "Rival", faction: "Necrons", bcpUserId: "u-rival" },
];

test("shows a loading message while checking", () => {
  const html = renderToStaticMarkup(
    React.createElement(MyRoundCard, {
      loading: true,
      error: null,
      round: 2,
      pairing: null,
      board: null,
      players: [],
      isTeamEvent: false,
    })
  );
  assert.match(html, /Checking your round/);
});

test("shows the error message on failure", () => {
  const html = renderToStaticMarkup(
    React.createElement(MyRoundCard, {
      loading: false,
      error: "boom",
      round: 2,
      pairing: null,
      board: null,
      players: [],
      isTeamEvent: false,
    })
  );
  assert.match(html, /Couldn&#x27;t load your round: boom/);
});

test("shows a fallback when nothing is published for the current round", () => {
  const html = renderToStaticMarkup(
    React.createElement(MyRoundCard, {
      loading: false,
      error: null,
      round: 3,
      pairing: null,
      board: null,
      players: [],
      isTeamEvent: false,
    })
  );
  assert.match(html, /No pairing published for round 3 yet\./);
});

test("shows an individual pairing's table, opponent, and their faction", () => {
  const pairing: MyPairing = {
    round: 2,
    table: 5,
    published: true,
    isDone: false,
    opponentName: "Rival",
    opponentUserId: "u-rival",
  };
  const html = renderToStaticMarkup(
    React.createElement(MyRoundCard, {
      loading: false,
      error: null,
      round: 2,
      pairing,
      board: null,
      players,
      isTeamEvent: false,
    })
  );
  assert.match(html, /Table 5/);
  assert.match(html, /Rival/);
  assert.match(html, /Necrons/);
  assert.match(html, /in progress/);
  // Opponent quick-look (PlayerStatsPanel) renders once a bcpUserId is
  // known — it fetches its own data in an effect, which doesn't run
  // during a static render, so it's expected to still be in its loading
  // state here.
  assert.match(html, /Loading player stats/);
});

test("shows the opponent's disposition and ITC badge, when known", () => {
  const pairing: MyPairing = {
    round: 2,
    table: 5,
    published: true,
    isDone: false,
    opponentName: "Rival",
    opponentUserId: "u-rival",
  };
  const playersWithDisposition: Player[] = [
    players[0],
    { id: "p2", name: "Rival", faction: "Necrons", disposition: "Purge the Foe", bcpUserId: "u-rival" },
  ];
  const html = renderToStaticMarkup(
    React.createElement(MyRoundCard, {
      loading: false,
      error: null,
      round: 2,
      pairing,
      board: null,
      players: playersWithDisposition,
      isTeamEvent: false,
      itcByUserId: { "u-rival": { points: 1465.4, placing: 15 } },
      itcLeagueId: "league-2026",
    })
  );
  assert.match(html, />Purge</);
  // The compact (mobile) label carries just the placing, the full label
  // (desktop) adds points — both render server-side, toggled by CSS.
  assert.match(html, /<span class="sm:hidden">#15<\/span>/);
  assert.match(html, /<span class="hidden sm:inline">#15 · 1465 pts<\/span>/);
  // My own disposition is unknown in this scenario, so even though the
  // opponent's is known, the mission-matchup panel shouldn't render.
  assert.match(html, /Loading player stats/);
});

test("shows an unpublished pairing's opponent without a score", () => {
  const pairing: MyPairing = {
    round: 2,
    published: false,
    isDone: false,
    opponentName: "Rival",
    opponentUserId: "u-rival",
  };
  const html = renderToStaticMarkup(
    React.createElement(MyRoundCard, {
      loading: false,
      error: null,
      round: 2,
      pairing,
      board: null,
      players,
      isTeamEvent: false,
    })
  );
  assert.match(html, /unpublished/);
  assert.match(html, /Table TBD/);
});

test("shows a decided game's score", () => {
  const pairing: MyPairing = {
    round: 2,
    table: 5,
    published: true,
    isDone: true,
    opponentName: "Rival",
    opponentUserId: "u-rival",
    myScore: 80,
    opponentScore: 20,
  };
  const html = renderToStaticMarkup(
    React.createElement(MyRoundCard, {
      loading: false,
      error: null,
      round: 2,
      pairing,
      board: null,
      players,
      isTeamEvent: false,
    })
  );
  assert.match(html, /80–20/);
});

test("a team-level pairing (no resolved board) shows the opposing team, no opponent quick-look", () => {
  const pairing: MyPairing = {
    round: 2,
    published: true,
    isDone: false,
    opponentName: "Team Rival",
    opponentTeamPlayerId: "tp-2",
    teamPairingId: "tpr-1",
    mySideIsTeam1: true,
  };
  const html = renderToStaticMarkup(
    React.createElement(MyRoundCard, {
      loading: false,
      error: null,
      round: 2,
      pairing,
      board: null,
      players,
      isTeamEvent: true,
    })
  );
  assert.match(html, /Team Rival/);
  // No opponent bcpUserId at the team level, so no quick-look panel.
  assert.ok(!html.includes("Loading player stats"));
});

test("a team-level pairing with no resolved board shows both sides' rosters when available (roadmap #1)", () => {
  const pairing: MyPairing = {
    round: 2,
    published: true,
    isDone: false,
    opponentName: "Team Rival",
    opponentTeamPlayerId: "tp-2",
    teamPairingId: "tpr-1",
    mySideIsTeam1: true,
  };
  const rosterByTeamId = new Map<string, Player[]>([
    ["tp-1", [{ id: "p1", name: "Me", faction: "Orks", bcpUserId: "u-me", teamPlayerId: "tp-1" }]],
    ["tp-2", [{ id: "p2", name: "Rival", faction: "Necrons", bcpUserId: "u-rival", teamPlayerId: "tp-2" }]],
  ]);
  const html = renderToStaticMarkup(
    React.createElement(MyRoundCard, {
      loading: false,
      error: null,
      round: 2,
      pairing,
      board: null,
      players,
      isTeamEvent: true,
      myTeamPlayerId: "tp-1",
      rosterByTeamId,
    })
  );
  assert.match(html, /Your team/);
  assert.match(html, /Me/);
  assert.match(html, /Rival/);
});

test("a team pairing shows a neutral avg-ITC comparison when ITC data is available (roadmap #4)", () => {
  const pairing: MyPairing = {
    round: 2,
    published: true,
    isDone: false,
    opponentName: "Team Rival",
    opponentTeamPlayerId: "tp-2",
    teamPairingId: "tpr-1",
    mySideIsTeam1: true,
  };
  const rosterByTeamId = new Map<string, Player[]>([
    ["tp-1", [{ id: "p1", name: "Me", faction: "Orks", bcpUserId: "u-me", teamPlayerId: "tp-1" }]],
    ["tp-2", [{ id: "p2", name: "Rival", faction: "Necrons", bcpUserId: "u-rival", teamPlayerId: "tp-2" }]],
  ]);
  const html = renderToStaticMarkup(
    React.createElement(MyRoundCard, {
      loading: false,
      error: null,
      round: 2,
      pairing,
      board: null,
      players,
      isTeamEvent: true,
      myTeamPlayerId: "tp-1",
      rosterByTeamId,
      itcByUserId: { "u-me": { points: 1500 }, "u-rival": { points: 1400 } },
    })
  );
  assert.match(html, /Your team: Avg ITC 1500/);
  assert.match(html, /Team Rival: Avg ITC 1400/);
});

test("a resolved board orients my side out from the opponent's, regardless of raw player1/player2 order", () => {
  const pairing: MyPairing = {
    round: 2,
    published: true,
    isDone: false,
    opponentName: "Team Rival",
    teamPairingId: "tpr-1",
    mySideIsTeam1: false,
  };
  const board: TeamBoardMatchup = {
    table: 12,
    player1Name: "Rival",
    player1UserId: "u-rival",
    player2Name: "Me",
    player2UserId: "u-me",
    published: true,
    isDone: false,
  };
  const html = renderToStaticMarkup(
    React.createElement(MyRoundCard, {
      loading: false,
      error: null,
      round: 2,
      pairing,
      board,
      myBcpUserId: "u-me",
      players,
      isTeamEvent: true,
    })
  );
  assert.match(html, /Table 12/);
  // I'm player2 on the raw board, so the opponent shown should be player1 (Rival).
  assert.match(html, /vs[\s\S]*Rival/);
  assert.match(html, /Loading player stats/);
});

test("singles event, both dispositions known: shows the mission-matchup panel instead of player stats", () => {
  const pairing: MyPairing = {
    round: 2,
    table: 5,
    published: true,
    isDone: false,
    opponentName: "Rival",
    opponentUserId: "u-rival",
  };
  const playersWithDispositions: Player[] = [
    { id: "p1", name: "Me", faction: "Orks", disposition: "Purge the Foe", bcpUserId: "u-me" },
    { id: "p2", name: "Rival", faction: "Necrons", disposition: "Take and Hold", bcpUserId: "u-rival" },
  ];
  const html = renderToStaticMarkup(
    React.createElement(MyRoundCard, {
      loading: false,
      error: null,
      round: 2,
      pairing,
      board: null,
      myBcpUserId: "u-me",
      players: playersWithDispositions,
      isTeamEvent: false,
    })
  );
  // Purge the Foe vs Take and Hold -> my mission is Unstoppable Force.
  assert.match(html, /Unstoppable Force/);
  assert.match(html, /Immovable Object/);
  assert.ok(!html.includes("Loading player stats"));
});

test("team event, both dispositions known: still falls back to player stats", () => {
  const pairing: MyPairing = {
    round: 2,
    table: 5,
    published: true,
    isDone: false,
    opponentName: "Rival",
    opponentUserId: "u-rival",
  };
  const playersWithDispositions: Player[] = [
    { id: "p1", name: "Me", faction: "Orks", disposition: "Purge the Foe", bcpUserId: "u-me" },
    { id: "p2", name: "Rival", faction: "Necrons", disposition: "Take and Hold", bcpUserId: "u-rival" },
  ];
  const html = renderToStaticMarkup(
    React.createElement(MyRoundCard, {
      loading: false,
      error: null,
      round: 2,
      pairing,
      board: null,
      myBcpUserId: "u-me",
      players: playersWithDispositions,
      isTeamEvent: true,
    })
  );
  assert.match(html, /Loading player stats/);
  assert.ok(!html.includes("Unstoppable Force"));
});

test("singles event, only one side's disposition known: falls back to player stats", () => {
  const pairing: MyPairing = {
    round: 2,
    table: 5,
    published: true,
    isDone: false,
    opponentName: "Rival",
    opponentUserId: "u-rival",
  };
  const oneSidedDispositions: Player[] = [
    { id: "p1", name: "Me", faction: "Orks", bcpUserId: "u-me" },
    { id: "p2", name: "Rival", faction: "Necrons", disposition: "Take and Hold", bcpUserId: "u-rival" },
  ];
  const html = renderToStaticMarkup(
    React.createElement(MyRoundCard, {
      loading: false,
      error: null,
      round: 2,
      pairing,
      board: null,
      myBcpUserId: "u-me",
      players: oneSidedDispositions,
      isTeamEvent: false,
    })
  );
  assert.match(html, /Loading player stats/);
});
