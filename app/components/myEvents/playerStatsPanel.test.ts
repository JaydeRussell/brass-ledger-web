import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// PlayerStatsPanel keeps its whole flow in useState/useEffect (fetch
// stats, then — once a game system is known — resolve an ITC league and
// ranking), so a static SSR pass (no DOM to let effects run; see
// app/lib/testUtils.ts) can only ever show the very first render, before
// fetchMyStats has resolved. What's verified here is that first render —
// nothing shown yet, no premature reach into the ITC lookups — same
// pattern and same limitation as bcpProfileLinker.test.ts.
mock.module("../../lib/myStats.ts", { namedExports: { fetchMyStats: async () => ({ linked: false, totalEvents: 0, factions: [] }) } });
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
const { default: PlayerStatsPanel } = await import("./playerStatsPanel.tsx");

test("renders nothing on first paint, before stats have loaded", () => {
  const html = renderToStaticMarkup(React.createElement(PlayerStatsPanel, { bcpUserId: "u1" }));
  assert.equal(html, "");
});
