import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PlacingsTable from "./placingsTable.tsx";
import type { MyPairing, PlacingEntry } from "../../lib/bcp.ts";

const entries: PlacingEntry[] = [
  { id: "t1", name: "Team One", placing: 1, metrics: [{ name: "Wins", value: 3 }] },
  { id: "t2", name: "Team Two", placing: 2, metrics: [{ name: "Wins", value: 2 }] },
];

const noop = () => {};

test("shows an error message and nothing else when errored", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries: [], loading: false, error: "network down", onRefresh: noop })
  );
  assert.match(html, /Couldn&#x27;t load placings: network down/);
  assert.ok(!html.includes("<table"));
});

test("shows a loading message when loading and not errored", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries: [], loading: true, error: null, onRefresh: noop })
  );
  assert.match(html, /Loading placings/);
});

test("shows the default empty message, or a custom one for a filtered-out search", () => {
  const defaultHtml = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries: [], loading: false, error: null, onRefresh: noop })
  );
  assert.match(defaultHtml, /No placings published yet/);

  const customHtml = renderToStaticMarkup(
    React.createElement(PlacingsTable, {
      entries: [],
      loading: false,
      error: null,
      onRefresh: noop,
      emptyMessage: "No matches for zzz.",
    })
  );
  assert.match(customHtml, /No matches for zzz\./);
});

test("renders a metrics table with a record column, in placing order", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries, loading: false, error: null, onRefresh: noop })
  );
  assert.match(html, /<table/);
  assert.match(html, />Record</);
  assert.match(html, /Team One/);
  assert.match(html, /Team Two/);
});

test("a row's name links to its player-stats page only when it carries a bcpUserId (individual events only, per PlacingEntry's doc comment)", () => {
  const withUser: PlacingEntry[] = [
    { id: "p1", name: "Alexandria Whitmore", placing: 1, metrics: [], bcpUserId: "bcp-1" },
  ];
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries: withUser, loading: false, error: null, onRefresh: noop })
  );
  assert.match(html, /href="\/players\/bcp-1\?name=Alexandria%20Whitmore"/);

  // Team-event rows never carry a bcpUserId — a team's `name` is the
  // team, not one person.
  const teamHtml = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries, loading: false, error: null, onRefresh: noop })
  );
  assert.ok(!teamHtml.includes("/players/"));
});

test("leads with a win/loss-style metric regardless of BCP's own column order, and labels it Record (roadmap #7)", () => {
  const reordered: PlacingEntry[] = [
    {
      id: "t1",
      name: "Team One",
      placing: 1,
      metrics: [
        { name: "Battle Points", value: 287 },
        { name: "Match Points", value: 4 },
        { name: "Path to Victory", value: 3 },
      ],
    },
  ];
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries: reordered, loading: false, error: null, onRefresh: noop })
  );
  const headerRow = html.split("</thead>")[0];
  assert.match(headerRow, />Record</);
  assert.ok(!headerRow.includes("Battle Points"));
  assert.ok(!headerRow.includes("Match Points"));

  // The identified record metric's own value (Match Points: 4), not
  // Battle Points' 287, is what shows in the collapsed row.
  const rows = html.split("<tr").slice(1);
  const row = rows.find((r) => r.includes("Team One"));
  assert.match(row ?? "", />4</);
  assert.ok(!row?.includes(">287<"));
});

test("leaves column order and label alone when no metric looks like a win/loss record", () => {
  const noRecord: PlacingEntry[] = [
    {
      id: "t1",
      name: "Team One",
      placing: 1,
      metrics: [
        { name: "Battle Points", value: 287 },
        { name: "Strength of Schedule", value: 3 },
      ],
    },
  ];
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries: noRecord, loading: false, error: null, onRefresh: noop })
  );
  const headerRow = html.split("</thead>")[0];
  assert.match(headerRow, />Battle Points</);
  assert.ok(!headerRow.includes("Strength of Schedule"));
  assert.ok(!headerRow.includes("Record"));
});

test("only the record column shows on a collapsed row, labeled Record; opponent win rate and everything else move behind the expand toggle", () => {
  const manyMetrics: PlacingEntry[] = [
    {
      id: "p1",
      name: "Alexandria Whitmore",
      placing: 1,
      metrics: [
        { name: "Wins", value: 3 },
        { name: "Oppt. Game Win %", value: 55.5556 },
        { name: "Path to Victory", value: 7 },
        { name: "Battle Points", value: 227 },
      ],
    },
  ];
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries: manyMetrics, loading: false, error: null, onRefresh: noop })
  );
  const headerRow = html.split("</thead>")[0];
  assert.match(headerRow, />Record</);
  assert.ok(!headerRow.includes("Wins"));
  assert.ok(!headerRow.includes("Oppt. Game Win %"));
  assert.ok(!headerRow.includes("Path to Victory"));
  assert.ok(!headerRow.includes("Battle Points"));

  // Hidden metrics (including opponent win rate) aren't in the initial
  // (collapsed) markup at all, and the row itself carries the expand
  // affordance.
  assert.ok(!html.includes("Oppt. Game Win %"));
  assert.ok(!html.includes("Path to Victory"));
  assert.ok(!html.includes("227"));
  const rows = html.split("<tr").slice(1);
  const row = rows.find((r) => r.includes("Alexandria Whitmore"));
  assert.match(row ?? "", /aria-expanded="false"/);
});

test("shows a round-by-round score strip in the record column when round scores are available", () => {
  const withRecord: PlacingEntry[] = [
    { id: "p1", name: "Bryan Gorny", placing: 1, metrics: [{ name: "Wins", value: 3 }] },
  ];
  const roundScoresById = new Map<string, MyPairing[]>([
    [
      "p1",
      [
        { round: 1, published: true, isDone: true, opponentName: "Jayde Russell", myScore: 62, opponentScore: 54 },
        { round: 2, published: true, isDone: true, opponentName: "Ross Miller", myScore: 91, opponentScore: 32 },
        { round: 3, published: true, isDone: true, opponentName: "Daniel Bradley", myScore: 74, opponentScore: 65 },
      ],
    ],
  ]);
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, {
      entries: withRecord,
      loading: false,
      error: null,
      onRefresh: noop,
      roundScoresById,
    })
  );
  // The plain "Wins" count is replaced by the per-round strip...
  assert.ok(!html.includes(">3<"));
  assert.match(html, />62</);
  assert.match(html, />91</);
  assert.match(html, />74</);
  // ...each round colored as a win or close win (all three were wins
  // here; classifyScore grades round 2's 91-32 blowout a plain "win" and
  // the two closer rounds a "closeWin" — see lib/scoreColor.ts) and none
  // as a loss.
  assert.ok((html.match(/text-success-400|text-lime-400/g) ?? []).length >= 3);
  assert.ok(!html.includes("text-danger-400"));
});

test("a \"best in faction\" badge renders in its own column between Name and Record, not inline with the name", () => {
  const withFactions: PlacingEntry[] = [
    { id: "p1", name: "Anna Adams", placing: 1, metrics: [{ name: "Wins", value: 3 }], faction: "Necrons" },
    { id: "p2", name: "Ben Baker", placing: 2, metrics: [{ name: "Wins", value: 2 }], faction: "Space Marines" },
  ];
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries: withFactions, loading: false, error: null, onRefresh: noop })
  );
  const rows = html.split("<tr").slice(1);
  const row = rows.find((r) => r.includes("Anna Adams"));
  const cells = (row ?? "").split("<td");
  // cells[0] precedes the first <td (the <tr ...> opening tag itself);
  // cells[1..] are the row's actual <td>s in column order: #, Name,
  // badge, Record.
  const nameCell = cells[2] ?? "";
  const badgeCell = cells[3] ?? "";
  assert.ok(!nameCell.includes("Best"), "the name cell itself shouldn't contain the badge text");
  assert.match(badgeCell, /Best Necrons/);
});

test("falls back to the plain metric value when no round scores are available for an entry", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, {
      entries,
      loading: false,
      error: null,
      onRefresh: noop,
      roundScoresById: new Map(),
    })
  );
  assert.match(html, />3</);
  assert.match(html, />2</);
});

test("a team row with a roster available shows an expand affordance; a singles row doesn't (roadmap #7)", () => {
  const rosterByTeamId = new Map<string, Player[]>([
    ["t1", [{ id: "p1", name: "Nicholas Kudriavetz", faction: "Orks", bcpUserId: "u1" }]],
  ]);
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, {
      entries,
      loading: false,
      error: null,
      onRefresh: noop,
      rosterByTeamId,
    })
  );
  const rows = html.split("<tr").slice(1);
  const team1Row = rows.find((r) => r.includes("Team One"));
  const team2Row = rows.find((r) => r.includes("Team Two"));
  assert.match(team1Row ?? "", /aria-expanded="false"/);
  assert.ok(!team2Row?.includes("aria-expanded"));
  // Collapsed by default — the roster itself isn't in the initial markup.
  assert.ok(!html.includes("Nicholas Kudriavetz"));
});

test("highlights a followed row", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, {
      entries,
      loading: false,
      error: null,
      onRefresh: noop,
      followedIds: new Set(["t2"]),
    })
  );
  // Team Two's row should carry the highlight class; Team One's shouldn't.
  const rows = html.split("<tr").slice(1);
  const team1Row = rows.find((r) => r.includes("Team One"));
  const team2Row = rows.find((r) => r.includes("Team Two"));
  assert.ok(!team1Row?.includes("bg-brass-500/10"));
  assert.ok(team2Row?.includes("bg-brass-500/10"));
});

// Just the enabled/disabled state, via SSR — PlacingsTable takes no
// hooks itself, but useDelayedFlag(loading) inside it still means a real
// click can't be simulated this way; see roundBoard.test.ts for the same
// documented limitation.
test("the refresh button is enabled while idle and disabled while loading", () => {
  // See roundBoard.test.ts's equivalent test for why this matches the
  // literal `disabled=""` attribute, not just the substring "disabled"
  // (Button's own className always contains that word).
  const idle = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries, loading: false, error: null, onRefresh: noop })
  );
  const idleButton = idle.match(/<button[^>]*aria-label="Check for updated placings"[^>]*>/)?.[0] ?? "";
  assert.ok(!/\sdisabled=""/.test(idleButton));

  const loading = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries, loading: true, error: null, onRefresh: noop })
  );
  const loadingButton =
    loading.match(/<button[^>]*aria-label="Check for updated placings"[^>]*>/)?.[0] ?? "";
  assert.match(loadingButton, /\sdisabled=""/);
});
