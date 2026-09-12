import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { MyPairing } from "../../lib/bcp.ts";

// MyPairings fetches boards/ITC rankings only once a round is expanded by
// a click — never on initial render — so mocking those out is mostly
// belt-and-suspenders here (this static SSR pass, with no DOM to click
// into, can never actually trigger that fetch either way; see
// app/lib/testUtils.ts and CLAUDE.md's note on jsdom not being
// installable in this sandboxed environment). Mocking a module replaces
// *all* of its exports for every importer in the process, not just this
// file's own import — MyPairings also renders ItcBadge, which imports
// buildBcpItcProfileUrl from this same module, so that has to be included
// here too or ItcBadge's own import breaks.
mock.module("../../lib/bcp.ts", {
  namedExports: {
    fetchItcRanking: async () => null,
    fetchTeamPairingBoards: async () => [],
    buildBcpItcProfileUrl: (id: string, league?: string) =>
      `https://www.bestcoastpairings.com/user/${id}${league ? `?league=${league}` : ""}`,
  },
});
const { default: MyPairings } = await import("./myPairings.tsx");

const baseProps = {
  eventId: "e1",
  whoLabel: "Team Ultramarines",
  loading: false,
  error: null,
  pairings: [] as MyPairing[],
  upToRound: 0,
  onClear: () => {},
};

test("shows an error message and stops there", () => {
  const html = renderToStaticMarkup(React.createElement(MyPairings, { ...baseProps, error: "boom" }));
  assert.match(html, /Couldn&#x27;t load pairings: boom/);
});

test("shows a loading message", () => {
  const html = renderToStaticMarkup(React.createElement(MyPairings, { ...baseProps, loading: true }));
  assert.match(html, /Checking published rounds/);
});

test("shows a not-started message when no rounds have happened yet", () => {
  const html = renderToStaticMarkup(React.createElement(MyPairings, baseProps));
  assert.match(html, /Pairings haven&#x27;t started for this event yet\./);
});

test("lists one row per round up to upToRound, published or not", () => {
  const pairings: MyPairing[] = [
    { round: 1, published: true, isDone: true, opponentName: "Team Blue", table: 4, myScore: 60, opponentScore: 40 },
  ];
  const html = renderToStaticMarkup(
    React.createElement(MyPairings, { ...baseProps, pairings, upToRound: 2 })
  );
  assert.match(html, /Round 1/);
  assert.match(html, /vs Team Blue/);
  assert.match(html, /table 4/);
  assert.match(html, /60–40/);
  assert.match(html, /Round 2/);
  assert.match(html, /Not published yet/);
});

test("surfaces the opponent's faction, disposition, and list link on a published round row (roadmap #8)", () => {
  const pairings: MyPairing[] = [
    { round: 1, published: true, isDone: false, opponentName: "Rival", opponentUserId: "u-rival" },
  ];
  const players: Player[] = [
    {
      id: "p1",
      name: "Rival",
      faction: "Necrons",
      disposition: "Purge the Foe",
      list: "https://example.com/list.pdf",
      bcpUserId: "u-rival",
    },
  ];
  const html = renderToStaticMarkup(
    React.createElement(MyPairings, { ...baseProps, pairings, upToRound: 1, players })
  );
  assert.match(html, /\(Necrons\)/);
  assert.match(html, /Purge the Foe/);
  assert.match(html, /href="https:\/\/example\.com\/list\.pdf"/);
});

test("shows an Unfollow button and the followed side's own ITC badge when given", () => {
  const html = renderToStaticMarkup(
    React.createElement(MyPairings, {
      ...baseProps,
      ownItc: { points: 1500, placing: 1 },
      ownBcpUserId: "u1",
    })
  );
  assert.match(html, />Unfollow</);
  assert.match(html, /#1/);
  assert.match(html, /1500 pts/);
});
