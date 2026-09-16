import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { PlacingHistoryPoint } from "../../lib/myStats.ts";

// PlayerStatsPanel keeps its whole flow in useState/useEffect (fetch
// stats, then — once a game system is known — resolve an ITC league and
// ranking), so a static SSR pass (no DOM to let effects run; see
// app/lib/testUtils.ts) can only ever show the very first render, before
// fetchMyStats has resolved. What's verified here is that first render —
// a loading spinner, no premature reach into the ITC lookups — same
// pattern and same limitation as bcpProfileLinker.test.ts.
mock.module("../../lib/myStats.ts", {
  namedExports: {
    fetchMyStats: async () => ({ linked: false, totalEvents: 0, factions: [] }),
    fetchPlayerStats: async () => ({ linked: false, totalEvents: 0, factions: [] }),
  },
});
mock.module("../../lib/bcp.ts", {
  namedExports: {
    fetchCurrentItcLeagueId: async () => {
      throw new Error("should not be called before stats have loaded");
    },
    fetchItcRanking: async () => {
      throw new Error("should not be called before stats have loaded");
    },
    // Also needed transitively by ../shared/itcBadge.tsx, which this
    // component renders (once a ranking is loaded) — mocking this module
    // replaces its exports wholesale, so every export any imported code
    // path touches has to be covered here, not just the two this
    // component calls directly.
    buildBcpItcProfileUrl: (bcpUserId: string, leagueId?: string) =>
      `https://example.invalid/user/${bcpUserId}${leagueId ? `?league=${leagueId}` : ""}`,
  },
});
mock.module("../../lib/clientLog.ts", { namedExports: { logClientEvent: () => {} } });
const { default: PlayerStatsPanel, avgPercentile, recentFormPercentile, topQuarterRate } = await import(
  "./playerStatsPanel.tsx"
);

test("shows a loading skeleton on first paint, before stats have loaded", () => {
  const html = renderToStaticMarkup(React.createElement(PlayerStatsPanel, { bcpUserId: "u1" }));
  assert.match(html, /Loading player stats…/);
  assert.match(html, /animate-pulse/);
  // useDelayedFlag starts false — the "taking longer than usual" hint
  // only appears once the 3-second threshold has actually elapsed, never
  // on the very first render.
  assert.ok(!html.includes("Taking longer than usual"));
});

test("mode: player also shows a loading skeleton on first paint", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlayerStatsPanel, { bcpUserId: "u1", mode: "player", playerName: "Alexandria" })
  );
  assert.match(html, /Loading player stats…/);
});

// The "skill at a glance" tiles (avgPercentile/recentFormPercentile/
// topQuarterRate) are exported as plain functions purely so they're
// testable directly — the component itself can't be exercised past its
// first render here (see the doc comment above), since they only ever
// show up once fetchMyStats/fetchPlayerStats has resolved.
function point(overrides: Partial<PlacingHistoryPoint> & Pick<PlacingHistoryPoint, "eventId">): PlacingHistoryPoint {
  return { eventName: overrides.eventId, eventDate: "2026-01-01", placing: 1, ...overrides };
}

test("avgPercentile: averages only the events with a known field size", () => {
  const history: PlacingHistoryPoint[] = [
    point({ eventId: "a", placing: 5, fieldSize: 100 }), // top 5%
    point({ eventId: "b", placing: 25, fieldSize: 100 }), // top 25%
    point({ eventId: "c", placing: 1 }), // no field size — excluded
  ];
  assert.deepEqual(avgPercentile(history), { avg: 15, sampleSize: 2 });
});

test("avgPercentile: undefined when no event ever published a field size", () => {
  const history: PlacingHistoryPoint[] = [point({ eventId: "a", placing: 1 })];
  assert.equal(avgPercentile(history), undefined);
});

test("recentFormPercentile: only considers the last 5 events, chronologically", () => {
  // 6 events, oldest first — the 1st (best percentile, 1%) is outside the
  // 5-event window and must not pull the average down.
  const history: PlacingHistoryPoint[] = [
    point({ eventId: "old", placing: 1, fieldSize: 100 }),
    point({ eventId: "e1", placing: 50, fieldSize: 100 }),
    point({ eventId: "e2", placing: 50, fieldSize: 100 }),
    point({ eventId: "e3", placing: 50, fieldSize: 100 }),
    point({ eventId: "e4", placing: 50, fieldSize: 100 }),
    point({ eventId: "e5", placing: 50, fieldSize: 100 }),
  ];
  assert.deepEqual(recentFormPercentile(history), { avg: 50, sampleSize: 5 });
});

test("recentFormPercentile: skips (rather than reaches past) an in-window event with no field size", () => {
  // "old" sits just outside the 5-event window with a would-be-dominant
  // 1% percentile — if the function "reached past" a missing field size
  // to keep a full sample of 5, it would pull the average way down.
  const history: PlacingHistoryPoint[] = [
    point({ eventId: "old", placing: 1, fieldSize: 100 }),
    point({ eventId: "e1", placing: 50, fieldSize: 100 }),
    point({ eventId: "e2", placing: 50, fieldSize: 100 }),
    point({ eventId: "e3", placing: 50, fieldSize: 100 }),
    point({ eventId: "e4", placing: 50, fieldSize: 100 }),
    point({ eventId: "e5", placing: 1 }), // in-window but no field size
  ];
  assert.deepEqual(recentFormPercentile(history), { avg: 50, sampleSize: 4 });
});

test("recentFormPercentile: undefined when none of the last 5 have a field size", () => {
  const history: PlacingHistoryPoint[] = [point({ eventId: "a", placing: 1 })];
  assert.equal(recentFormPercentile(history), undefined);
});

test("topQuarterRate: counts top-25%-percentile finishes against every event with a known field size", () => {
  const history: PlacingHistoryPoint[] = [
    point({ eventId: "a", placing: 10, fieldSize: 100 }), // top 10% — counts
    point({ eventId: "b", placing: 25, fieldSize: 100 }), // exactly top 25% — counts (inclusive)
    point({ eventId: "c", placing: 26, fieldSize: 100 }), // top 26% — doesn't count
    point({ eventId: "d", placing: 1 }), // no field size — excluded from the denominator too
  ];
  assert.deepEqual(topQuarterRate(history), { count: 2, eligible: 3 });
});

test("topQuarterRate: undefined when no event ever published a field size", () => {
  const history: PlacingHistoryPoint[] = [point({ eventId: "a", placing: 1 })];
  assert.equal(topQuarterRate(history), undefined);
});
