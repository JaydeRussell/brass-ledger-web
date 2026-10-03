import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import MinePanel from "./minePanel.tsx";

test("shows the empty message when there's no round to show", () => {
  const html = renderToStaticMarkup(
    React.createElement(MinePanel, { emptyMessage: "Your round will show here once the event starts." })
  );
  assert.match(html, /Your round will show here once the event starts\./);
});

test("renders the 'Your round' card when myRound is supplied", () => {
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
      emptyMessage: "",
    })
  );
  assert.match(html, /Your round/);
  assert.match(html, /Table 7/);
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
      emptyMessage: "",
    })
  );
  assert.match(singles, /Unstoppable Force/);

  const team = renderToStaticMarkup(
    React.createElement(MinePanel, {
      myRound: { ...myRound, isTeamEvent: true },
      emptyMessage: "",
    })
  );
  assert.ok(!team.includes("Unstoppable Force"));
});
