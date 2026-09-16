import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PlacingTrendChart from "./placingTrendChart.tsx";
import type { PlacingHistoryPoint } from "../../lib/myStats.ts";

const points: PlacingHistoryPoint[] = [
  { eventId: "evt-a", eventName: "Earlier Event", eventDate: "2026-01-01T00:00:00.000Z", placing: 10, points: 40 },
  { eventId: "evt-b", eventName: "Later Event", eventDate: "2026-02-01T00:00:00.000Z", placing: 1, points: 95 },
];

test("renders nothing for zero points", () => {
  const html = renderToStaticMarkup(React.createElement(PlacingTrendChart, { points: [], showChart: true }));
  assert.equal(html, "");
});

test("a single event shows the history table but no trend chart", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlacingTrendChart, { points: [points[0]], showChart: true })
  );
  assert.match(html, /Event history/);
  assert.match(html, /Earlier Event/);
  assert.ok(!html.includes("<svg"), "one point isn't a trend — no chart should render");
  assert.ok(!html.includes("Placing over time"));
});

test("showChart: false shows the table but never the trend chart, even with 2+ points", () => {
  const html = renderToStaticMarkup(React.createElement(PlacingTrendChart, { points, showChart: false }));
  assert.match(html, /Event history/);
  assert.match(html, /Earlier Event/);
  assert.match(html, /Later Event/);
  assert.ok(!html.includes("<svg"), "showChart: false should suppress the trend line entirely");
  assert.ok(!html.includes('aria-label="Chart metric"'), "the Placing/Percentile toggle is chart-only");
});

test("shows the most recent placing as a direct label", () => {
  const html = renderToStaticMarkup(React.createElement(PlacingTrendChart, { points, showChart: true }));
  assert.match(html, /Event history/);
  // The most recent (last) point is 1st place.
  assert.match(html, />1st</);
});

test("the event-history table is always visible, with a link out to each event", () => {
  const html = renderToStaticMarkup(React.createElement(PlacingTrendChart, { points, showChart: true }));
  assert.match(html, /<table/);
  assert.match(html, /<a class="hover:underline" href="\/\?event=evt-a">Earlier Event<\/a>/);
  assert.match(html, /<a class="hover:underline" href="\/\?event=evt-b">Later Event<\/a>/);
});

test("the table lists events newest first, opposite of the chart's chronological order", () => {
  const html = renderToStaticMarkup(React.createElement(PlacingTrendChart, { points, showChart: true }));
  // points is oldest-first (evt-a, then evt-b) — the table should read
  // the other way, matching every other browsable list in this app (My
  // Events, Pairings, Placings). Matched by the table's own row links
  // (href="/?event=...") specifically, since the chart's SVG aria-label
  // also mentions both event names in chronological order and would
  // otherwise confuse an indexOf on the bare name.
  const laterIndex = html.indexOf('href="/?event=evt-b"');
  const earlierIndex = html.indexOf('href="/?event=evt-a"');
  assert.ok(laterIndex !== -1 && earlierIndex !== -1, "expected both event links to appear");
  assert.ok(laterIndex < earlierIndex, "the more recent event (evt-b) should come first in the table");
});

test("the table shows each event's faction, falling back to an em dash when unknown", () => {
  const withFaction: PlacingHistoryPoint[] = [{ ...points[0], faction: "Orks" }, points[1]];
  const html = renderToStaticMarkup(
    React.createElement(PlacingTrendChart, { points: withFaction, showChart: true })
  );
  assert.match(html, />Orks</);
  assert.match(html, />—</);
});

test("an SVG accessible label summarizes the trend from first to last", () => {
  const html = renderToStaticMarkup(React.createElement(PlacingTrendChart, { points, showChart: true }));
  assert.match(html, /aria-label="Placing across 2 events, from 10th at Earlier Event to 1st at Later Event"/);
});

test("handles every result being tied without a zero-height scale", () => {
  const tied: PlacingHistoryPoint[] = [
    { eventId: "evt-a", eventName: "A", eventDate: "2026-01-01T00:00:00.000Z", placing: 4 },
    { eventId: "evt-b", eventName: "B", eventDate: "2026-02-01T00:00:00.000Z", placing: 4 },
  ];
  // Shouldn't throw (a naive (max-min)*0.1 pad would be 0, collapsing the
  // y-domain to a single value and dividing by zero when scaling).
  assert.doesNotThrow(() =>
    renderToStaticMarkup(React.createElement(PlacingTrendChart, { points: tied, showChart: true }))
  );
});

test("the Percentile toggle is disabled when no event published a field size", () => {
  const html = renderToStaticMarkup(React.createElement(PlacingTrendChart, { points, showChart: true }));
  const percentileButton = html.match(/<button[^>]*>Percentile<\/button>/)?.[0];
  assert.ok(percentileButton, "expected a Percentile toggle button");
  assert.match(percentileButton!, /disabled=""/);
});

test("the Percentile toggle is enabled once at least one event has a field size", () => {
  const withFieldSize: PlacingHistoryPoint[] = [
    { ...points[0], fieldSize: 20 },
    points[1],
  ];
  const html = renderToStaticMarkup(
    React.createElement(PlacingTrendChart, { points: withFieldSize, showChart: true })
  );
  const percentileButton = html.match(/<button[^>]*>Percentile<\/button>/)?.[0];
  assert.ok(percentileButton, "expected a Percentile toggle button");
  assert.ok(!percentileButton!.includes('disabled=""'));
});

test("axis tick labels default to plain placing numbers, not percentages", () => {
  const html = renderToStaticMarkup(React.createElement(PlacingTrendChart, { points, showChart: true }));
  const tickTexts = [...html.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
  assert.ok(tickTexts.length > 0, "expected at least one axis tick label");
  assert.ok(
    tickTexts.every((t) => !t.includes("%")),
    `placing mode ticks shouldn't be percent-formatted, got ${JSON.stringify(tickTexts)}`
  );
});

test("shows a lower-is-better caption naming the active metric", () => {
  const html = renderToStaticMarkup(React.createElement(PlacingTrendChart, { points, showChart: true }));
  assert.match(html, /Placing · lower is better/);
});

test("no format filter appears when every event is the same format (or unclassified)", () => {
  const allGt: PlacingHistoryPoint[] = [
    { ...points[0], category: "gt" },
    { ...points[1], category: "gt" },
  ];
  const html = renderToStaticMarkup(
    React.createElement(PlacingTrendChart, { points: allGt, showChart: true })
  );
  assert.ok(!html.includes('aria-label="Format filter"'));

  const unclassified = renderToStaticMarkup(
    React.createElement(PlacingTrendChart, { points, showChart: true })
  );
  assert.ok(!unclassified.includes('aria-label="Format filter"'));
});

test("a format filter appears once two distinct formats are present, defaulting to All", () => {
  const mixed: PlacingHistoryPoint[] = [
    { ...points[0], category: "gt" },
    { ...points[1], category: "rtt" },
  ];
  const html = renderToStaticMarkup(React.createElement(PlacingTrendChart, { points: mixed, showChart: true }));
  assert.match(html, /aria-label="Format filter"/);
  assert.match(html, />All</);
  assert.match(html, />GT</);
  assert.match(html, />RTT</);
  assert.ok(!html.includes(">Team<"), "Team pill shouldn't appear when no event is team-format");
  // Both events still show in the table/chart under the default "All" filter.
  assert.match(html, /Earlier Event/);
  assert.match(html, /Later Event/);
});

test("the format filter still applies to the table when showChart is false", () => {
  const mixed: PlacingHistoryPoint[] = [
    { ...points[0], category: "gt" },
    { ...points[1], category: "rtt" },
  ];
  const html = renderToStaticMarkup(React.createElement(PlacingTrendChart, { points: mixed, showChart: false }));
  assert.match(html, /aria-label="Format filter"/);
  assert.ok(!html.includes("<svg"));
});
