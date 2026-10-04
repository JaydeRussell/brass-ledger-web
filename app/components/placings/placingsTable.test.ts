import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PlacingsTable, { sortEntries } from "./placingsTable.tsx";
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
  assert.ok(!html.includes("<ul"));
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

test("renders a list of rows with each row's record, in placing order", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries, loading: false, error: null, onRefresh: noop })
  );
  assert.match(html, /<ul/);
  assert.match(html, />Record: </);
  assert.match(html, />01</);
  assert.ok(html.indexOf("Team One") < html.indexOf("Team Two"));
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

test("leads with a win/loss-style metric regardless of BCP's own order, and labels it Record", () => {
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
  const row = html.split("<li").find((r) => r.includes("Team One")) ?? "";
  assert.match(row, />Record: <\/span><span[^>]*>4</);
  assert.ok(!row.includes(">287<"));
});

test("without a record-shaped metric, leads with BCP's first metric under its own name", () => {
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
  const row = html.split("<li").find((r) => r.includes("Team One")) ?? "";
  assert.match(row, />Battle Points: <\/span><span[^>]*>287</);
  assert.ok(!row.includes("Record"));
  assert.ok(!row.includes("Strength of Schedule"));
});

test("a collapsed row shows only the record; opponent win rate and everything else sit behind the expand toggle", () => {
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
  const row = html.split("<li").find((r) => r.includes("Alexandria Whitmore")) ?? "";
  assert.match(row, />Record: </);
  assert.ok(!row.includes("Oppt. Game Win %"));
  assert.ok(!row.includes("Path to Victory"));
  assert.ok(!row.includes("227"));
  assert.match(row, /aria-expanded="false"/);
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
  // ...each round colored as a win (all three were wins here) and none
  // as a loss.
  assert.ok((html.match(/text-success-400/g) ?? []).length >= 3);
  assert.ok(!html.includes("text-danger-400"));
});

test("a \"best in faction\" badge sits on the faction line, not inside the name", () => {
  const withFactions: PlacingEntry[] = [
    { id: "p1", name: "Anna Adams", placing: 1, metrics: [{ name: "Wins", value: 3 }], faction: "Necrons" },
    { id: "p2", name: "Ben Baker", placing: 2, metrics: [{ name: "Wins", value: 2 }], faction: "Space Marines" },
  ];
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries: withFactions, loading: false, error: null, onRefresh: noop })
  );
  const row = html.split("<li").find((r) => r.includes("Anna Adams")) ?? "";
  const nameSpan = row.match(/<span class="font-medium text-text-primary">.*?<\/span>/)?.[0] ?? "";
  assert.ok(nameSpan.includes("Anna Adams"));
  assert.ok(!nameSpan.includes("Best"));
  assert.match(row, />Necrons</);
  assert.match(row, /Best Necrons/);
});

test("badges are judged across badgeEntries, not the search-filtered entries", () => {
  const all: PlacingEntry[] = [
    { id: "p1", name: "Anna Adams", placing: 1, metrics: [{ name: "Wins", value: 3 }], faction: "Necrons" },
    { id: "p2", name: "Ben Baker", placing: 2, metrics: [{ name: "Wins", value: 2 }], faction: "Necrons" },
  ];
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, {
      entries: [all[1]],
      badgeEntries: all,
      loading: false,
      error: null,
      onRefresh: noop,
    })
  );
  assert.ok(html.includes("Ben Baker"));
  assert.ok(!html.includes("Best Necrons"), "a filtered-out higher placing should still hold the badge");
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
  assert.match(html, />Record: <\/span><span[^>]*>3</);
  assert.match(html, />Record: <\/span><span[^>]*>2</);
});

test("a team row with a roster shows an expand toggle; a row with nothing hidden doesn't", () => {
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
  const rows = html.split("<li").slice(1);
  const team1Row = rows.find((r) => r.includes("Team One"));
  const team2Row = rows.find((r) => r.includes("Team Two"));
  assert.match(team1Row ?? "", /aria-expanded="false"/);
  assert.ok(!team2Row?.includes("aria-expanded"));
  // Collapsed by default — the roster itself isn't in the initial markup.
  assert.ok(!html.includes("Nicholas Kudriavetz"));
});

test("highlights my own row", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, {
      entries,
      loading: false,
      error: null,
      onRefresh: noop,
      myId: "t2",
    })
  );
  // Team Two's row should carry the highlight class; Team One's shouldn't.
  const rows = html.split("<li").slice(1);
  const team1Row = rows.find((r) => r.includes("Team One"));
  const team2Row = rows.find((r) => r.includes("Team Two"));
  assert.ok(!team1Row?.includes("bg-brass-500/10"));
  assert.ok(team2Row?.includes("bg-brass-500/10"));
});

// Just the enabled/disabled state, via SSR — a real click (which would
// exercise useDelayedFlag(loading) or the sort/expand state below) can't
// be simulated this way; see roundBoard.test.ts for the same documented
// limitation.
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

// sortEntries is the pure logic behind the Sort by select — tested
// directly since changing the select's state can't be simulated without a
// real DOM.
const unsorted: PlacingEntry[] = [
  { id: "a", name: "Zeta", placing: 3, metrics: [{ name: "Wins", value: 1 }] },
  { id: "b", name: "Alpha", placing: 1, metrics: [{ name: "Wins", value: 3 }] },
  { id: "c", name: "Mid", placing: 2, metrics: [{ name: "Wins", value: 2 }] },
];

test("sortEntries: 'placing' returns the array as given (BCP's own published order)", () => {
  const result = sortEntries(unsorted, "placing", 1);
  assert.deepEqual(result.map((e) => e.id), ["a", "b", "c"]);
});

test("sortEntries: sorts by name, ascending or descending", () => {
  assert.deepEqual(sortEntries(unsorted, "name", 1).map((e) => e.name), ["Alpha", "Mid", "Zeta"]);
  assert.deepEqual(sortEntries(unsorted, "name", -1).map((e) => e.name), ["Zeta", "Mid", "Alpha"]);
});

test("sortEntries: sorts by a metric's numeric value", () => {
  assert.deepEqual(sortEntries(unsorted, "Wins", 1).map((e) => e.id), ["a", "c", "b"]);
  assert.deepEqual(sortEntries(unsorted, "Wins", -1).map((e) => e.id), ["b", "c", "a"]);
});

test("sortEntries: doesn't mutate the array it was given", () => {
  const original = [...unsorted];
  sortEntries(unsorted, "name", 1);
  assert.deepEqual(unsorted, original);
});

test("offers Placing, Name and each metric as sort options", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries, loading: false, error: null, onRefresh: noop })
  );
  assert.match(html, /<select/);
  assert.match(html, /<option value="placing" selected="">Placing<\/option>/);
  assert.match(html, /<option value="name">Name<\/option>/);
  assert.match(html, /<option value="Wins">Wins<\/option>/);
});

test("an expandable row's toggle is a real button carrying aria-expanded", () => {
  const expandableEntries: PlacingEntry[] = [
    {
      id: "t1",
      name: "Team One",
      placing: 1,
      metrics: [
        { name: "Wins", value: 3 },
        { name: "Battle Points", value: 91 },
      ],
    },
  ];
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries: expandableEntries, loading: false, error: null, onRefresh: noop })
  );
  assert.match(html, /<button type="button" aria-expanded="false" aria-label="Show details for Team One"/);
});

test("a singles row shows its army list link and disposition from the roster", () => {
  const singles: PlacingEntry[] = [
    { id: "p1", name: "Anna Adams", placing: 1, metrics: [{ name: "Wins", value: 3 }], faction: "Necrons" },
    { id: "p2", name: "Ben Baker", placing: 2, metrics: [{ name: "Wins", value: 2 }], faction: "Orks" },
  ];
  const playerById = new Map<string, Player>([
    [
      "p1",
      {
        id: "p1",
        name: "Anna Adams",
        faction: "Necrons",
        disposition: "Take and Hold",
        list: "https://www.bestcoastpairings.com/list/abc",
      },
    ],
  ]);
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries: singles, loading: false, error: null, onRefresh: noop, playerById })
  );
  const anna = html.split("<li").find((r) => r.includes("Anna Adams")) ?? "";
  const ben = html.split("<li").find((r) => r.includes("Ben Baker")) ?? "";
  assert.match(anna, /href="https:\/\/www\.bestcoastpairings\.com\/list\/abc"/);
  assert.match(anna, /T&amp;H/);
  assert.ok(!ben.includes("Army list on BCP"));
});

test("compact density has a star standing in for the Best badges, with their text as its label", () => {
  const withFactions: PlacingEntry[] = [
    { id: "p1", name: "Anna Adams", placing: 1, metrics: [{ name: "Wins", value: 3 }], faction: "Necrons" },
  ];
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries: withFactions, loading: false, error: null, onRefresh: noop })
  );
  assert.match(html, /<span class="[^"]*\bcompact:hidden">/);
  assert.match(html, /<span class="hidden compact:inline"><button[^>]*aria-label="Best Xenos, Best Necrons"[^>]*>★/);
});

test("isRecordMetric: record-shaped names count, tiebreakers don't", async () => {
  const { isRecordMetric } = await import("./placingsTable.tsx");
  for (const name of ["Wins", "Match Points", "Record", "W/L"]) assert.equal(isRecordMetric(name), true, name);
  for (const name of ["Wins SoS", "Oppt. Game Win %", "Strength of Schedule Wins", "Battle Points"]) {
    assert.equal(isRecordMetric(name), false, name);
  }
});

test("metricNamesOf: union across entries in first-seen order", async () => {
  const { metricNamesOf } = await import("./placingsTable.tsx");
  const entry = (names: string[]) => ({ metrics: names.map((name) => ({ name, value: 0 })) }) as never;
  assert.deepEqual(metricNamesOf([entry(["Wins"]), entry(["Wins", "Battle Points"])]), ["Wins", "Battle Points"]);
});

test("formatMetric: rounds float noise to two decimals and keeps whole numbers whole", async () => {
  const { formatMetric } = await import("./placingsTable.tsx");
  assert.equal(formatMetric(446.44679999999994), "446.45");
  assert.equal(formatMetric(6), "6");
  assert.equal(formatMetric(55.5), "55.5");
  assert.equal(formatMetric(undefined), "—");
});
