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

test("shows an error message and nothing else when errored", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries: [], loading: false, error: "network down" })
  );
  assert.match(html, /Couldn&#x27;t load placings: network down/);
  assert.ok(!html.includes("<table"));
});

test("shows a loading message when loading and not errored", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries: [], loading: true, error: null })
  );
  assert.match(html, /Loading placings/);
});

test("shows the default empty message, or a custom one for a filtered-out search", () => {
  const defaultHtml = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries: [], loading: false, error: null })
  );
  assert.match(defaultHtml, /No placings published yet/);

  const customHtml = renderToStaticMarkup(
    React.createElement(PlacingsTable, {
      entries: [],
      loading: false,
      error: null,
      emptyMessage: "No matches for zzz.",
    })
  );
  assert.match(customHtml, /No matches for zzz\./);
});

test("renders a metrics table with one column per named metric, in placing order", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, { entries, loading: false, error: null })
  );
  assert.match(html, /<table/);
  assert.match(html, />Wins</);
  assert.match(html, /Team One/);
  assert.match(html, /Team Two/);
});

test("highlights a followed row", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlacingsTable, {
      entries,
      loading: false,
      error: null,
      followedIds: new Set(["t2"]),
    })
  );
  // Team Two's row should carry the highlight class; Team One's shouldn't.
  const rows = html.split("<tr").slice(1);
  const team1Row = rows.find((r) => r.includes("Team One"));
  const team2Row = rows.find((r) => r.includes("Team Two"));
  assert.ok(!team1Row?.includes("bg-indigo-50"));
  assert.ok(team2Row?.includes("bg-indigo-50"));
});
