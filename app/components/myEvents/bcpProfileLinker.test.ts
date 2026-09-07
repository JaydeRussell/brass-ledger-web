import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// BcpProfileLinker (and its nested RosterPicker) keep their whole flow in
// useState/useEffect — which roster/recent-events chips this component
// under it, the linking mode, results — so a static SSR pass (no DOM to
// click into; see app/lib/testUtils.ts) can only ever show the very first
// render, before any effect has populated recent events or any button has
// been clicked. What's verified here is that first render, and that the
// component doesn't reach any of its three mocked dependencies just to
// mount. A real click-through of "pick yourself from a roster" /
// "paste a link instead" needs jsdom/@testing-library/react (see
// CLAUDE.md).
mock.module("../../lib/bcp.ts", { namedExports: { fetchBcpPlayers: async () => [] } });
mock.module("../../lib/myEvents.ts", { namedExports: { linkBcpProfile: async () => "u1" } });
mock.module("../../lib/recentEvents.ts", { namedExports: { loadRecentEvents: () => [] } });
mock.module("../../lib/clientLog.ts", { namedExports: { logClientEvent: () => {} } });
const { default: BcpProfileLinker } = await import("./bcpProfileLinker.tsx");

test("defaults to the roster-picking flow, not the manual paste fallback", () => {
  const html = renderToStaticMarkup(React.createElement(BcpProfileLinker, { onLinked: () => {} }));
  assert.match(html, /Link your Best Coast Pairings profile/);
  assert.match(html, /Open an event you played in, then click your own name below\./);
  assert.match(html, /Paste a link\/id instead/);
  assert.ok(!html.includes("Profile URL or id"));
});
