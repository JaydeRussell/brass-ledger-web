import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import MinePanel from "./minePanel.tsx";
import type { MyPairing } from "../../lib/bcp.ts";

test("shows a 'not following anyone' prompt when nobody is followed", () => {
  const html = renderToStaticMarkup(
    React.createElement(MinePanel, { following: [], onGoToRoster: () => {}, onGoToPairings: () => {} })
  );
  assert.match(html, /Not following anyone/);
  assert.match(html, /Go to Roster/);
});

test("shows each followed entry's most recent published pairing", () => {
  const pairings: MyPairing[] = [
    { round: 1, published: true, isDone: true, opponentName: "Team X" },
    { round: 2, published: false, isDone: false, opponentName: "Team Y" },
  ];
  const html = renderToStaticMarkup(
    React.createElement(MinePanel, {
      following: [{ label: "My Team", pairings }],
      onGoToRoster: () => {},
      onGoToPairings: () => {},
    })
  );
  assert.match(html, /Following My Team/);
  // Round 2 isn't published, so the latest *published* one (round 1) wins.
  assert.match(html, /Round 1: vs Team X/);
});

test("shows a neutral avg-ITC comparison for a followed team's pairing when data is available (roadmap #4)", () => {
  const pairings: MyPairing[] = [
    {
      round: 1,
      published: true,
      isDone: false,
      opponentName: "Rose City Ruffians",
      opponentTeamPlayerId: "tp-opponent",
    },
  ];
  const rosterByTeamId = new Map<string, Player[]>([
    ["tp-mine", [{ id: "p1", name: "A1", faction: "Orks", bcpUserId: "u-a1", teamPlayerId: "tp-mine" }]],
    [
      "tp-opponent",
      [{ id: "p2", name: "B1", faction: "Necrons", bcpUserId: "u-b1", teamPlayerId: "tp-opponent" }],
    ],
  ]);
  const html = renderToStaticMarkup(
    React.createElement(MinePanel, {
      following: [{ label: "Master Crafted", pairings, teamPlayerId: "tp-mine" }],
      rosterByTeamId,
      itcByUserId: { "u-a1": { points: 1540 }, "u-b1": { points: 1410 } },
      onGoToRoster: () => {},
      onGoToPairings: () => {},
    })
  );
  assert.match(html, /Master Crafted: Avg ITC 1540/);
  assert.match(html, /Rose City Ruffians: Avg ITC 1410/);
});

test("shows a fallback when a followed entry has no published pairings", () => {
  const html = renderToStaticMarkup(
    React.createElement(MinePanel, {
      following: [{ label: "My Team", pairings: [] }],
      onGoToRoster: () => {},
      onGoToPairings: () => {},
    })
  );
  assert.match(html, /No pairings published yet\./);
});

test("renders a 'Your round' card first when myRound is supplied", () => {
  const html = renderToStaticMarkup(
    React.createElement(MinePanel, {
      myRound: {
        eventId: "evt-1",
        round: 2,
        loading: false,
        error: null,
        pairing: { round: 2, table: 7, published: true, isDone: false, opponentName: "Rival" },
        board: null,
        players: [],
        isTeamEvent: true,
      },
      following: [],
      onGoToRoster: () => {},
      onGoToPairings: () => {},
    })
  );
  assert.match(html, /Your round/);
  assert.match(html, /Table 7/);
});

test("omits the 'Your round' card when myRound is absent", () => {
  const html = renderToStaticMarkup(
    React.createElement(MinePanel, { following: [], onGoToRoster: () => {}, onGoToPairings: () => {} })
  );
  assert.ok(!html.includes("Your round"));
});

test("threads isTeamEvent into MyRoundCard's mission-matchup gate", () => {
  const dispositionPlayers: Player[] = [
    { id: "p1", name: "Me", faction: "Orks", disposition: "Purge the Foe", bcpUserId: "u-me" },
    { id: "p2", name: "Rival", faction: "Necrons", disposition: "Take and Hold", bcpUserId: "u-rival" },
  ];
  const myRound = {
    eventId: "evt-1",
    round: 2,
    loading: false,
    error: null,
    pairing: {
      round: 2,
      table: 7,
      published: true,
      isDone: false,
      opponentName: "Rival",
      opponentUserId: "u-rival",
    },
    board: null,
    myBcpUserId: "u-me",
    players: dispositionPlayers,
  };

  const singles = renderToStaticMarkup(
    React.createElement(MinePanel, {
      myRound: { ...myRound, isTeamEvent: false },
      following: [],
      onGoToRoster: () => {},
      onGoToPairings: () => {},
    })
  );
  assert.match(singles, /Unstoppable Force/);

  const team = renderToStaticMarkup(
    React.createElement(MinePanel, {
      myRound: { ...myRound, isTeamEvent: true },
      following: [],
      onGoToRoster: () => {},
      onGoToPairings: () => {},
    })
  );
  assert.ok(!team.includes("Unstoppable Force"));
});
