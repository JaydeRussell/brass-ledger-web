import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PlacingsTable from "./placingsTable.tsx";
import type { PlacingEntry } from "../../lib/bcp.ts";

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

test("renders a metrics table with one column per named metric, in placing order", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries, loading: false, error: null, onRefresh: noop })
  );
  assert.match(html, /<table/);
  assert.match(html, />Wins</);
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
