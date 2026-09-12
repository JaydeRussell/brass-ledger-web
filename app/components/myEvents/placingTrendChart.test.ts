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

test("renders nothing for fewer than 2 points", () => {
  const zero = renderToStaticMarkup(React.createElement(PlacingTrendChart, { points: [] }));
  assert.equal(zero, "");

  const one = renderToStaticMarkup(React.createElement(PlacingTrendChart, { points: [points[0]] }));
  assert.equal(one, "");
});

test("shows the most recent placing as a direct label", () => {
  const html = renderToStaticMarkup(React.createElement(PlacingTrendChart, { points }));
  assert.match(html, /Placing over time/);
  // The most recent (last) point is 1st place.
  assert.match(html, />1st</);
});

test("the table view is collapsed by default", () => {
  const html = renderToStaticMarkup(React.createElement(PlacingTrendChart, { points }));
  assert.match(html, /aria-expanded="false"/);
  // The event names do appear in the SVG's own aria-label summary — what
  // this checks is that the actual <table> of per-event rows isn't
  // rendered until expanded.
  assert.ok(!html.includes("<table"), "collapsed state shouldn't render the table element");
});

test("an SVG accessible label summarizes the trend from first to last", () => {
  const html = renderToStaticMarkup(React.createElement(PlacingTrendChart, { points }));
  assert.match(html, /aria-label="Placing across 2 events, from 10th at Earlier Event to 1st at Later Event"/);
});

test("handles every result being tied without a zero-height scale", () => {
  const tied: PlacingHistoryPoint[] = [
    { eventId: "evt-a", eventName: "A", eventDate: "2026-01-01T00:00:00.000Z", placing: 4 },
    { eventId: "evt-b", eventName: "B", eventDate: "2026-02-01T00:00:00.000Z", placing: 4 },
  ];
  // Shouldn't throw (a naive (max-min)*0.1 pad would be 0, collapsing the
  // y-domain to a single value and dividing by zero when scaling).
  assert.doesNotThrow(() => renderToStaticMarkup(React.createElement(PlacingTrendChart, { points: tied })));
});
