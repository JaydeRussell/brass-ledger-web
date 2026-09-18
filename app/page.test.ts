import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NavProvider } from "./components/nav/navContext.tsx";

// Same mocking approach as stats/page.test.ts and friends/page.test.ts:
// this page leans on lib/auth (real fetch on mount) plus lib/myEvents,
// lib/myStats, lib/friends, and lib/recentEvents, and renders
// BcpProfileLinker (pulling in lib/myEvents/lib/bcp again) when no
// profile is linked — every export any of those touch has to be
// covered here, since mocking a module replaces its exports wholesale
// for every importer. None of the *fetch* functions are ever actually
// reached in a static render (no effects run — see testUtils.ts's doc
// comment), so each is mocked to throw if reached; the loading-state
// assertions below are what's actually reachable this way.
let authState: { user: unknown; checked: boolean } = { user: null, checked: false };

mock.module("./lib/auth.ts", {
  namedExports: { useCurrentUser: () => authState },
});
mock.module("./lib/myEvents.ts", {
  namedExports: {
    fetchMyEvents: async () => {
      throw new Error("should not be reached — renderToStaticMarkup never runs effects");
    },
    linkBcpProfile: async () => "u1",
  },
});
mock.module("./lib/myStats.ts", {
  namedExports: {
    fetchMyStats: async () => {
      throw new Error("should not be reached — renderToStaticMarkup never runs effects");
    },
    fetchPlayerStats: async () => {
      throw new Error("should not be reached — renderToStaticMarkup never runs effects");
    },
  },
});
mock.module("./lib/friends.ts", {
  namedExports: {
    fetchFriends: async () => {
      throw new Error("should not be reached — renderToStaticMarkup never runs effects");
    },
    fetchIncomingFriendRequests: async () => {
      throw new Error("should not be reached — renderToStaticMarkup never runs effects");
    },
  },
});
mock.module("./lib/recentEvents.ts", {
  namedExports: {
    loadRecentEvents: () => [],
    fetchRecentEventsFromServer: async () => {
      throw new Error("should not be reached — renderToStaticMarkup never runs effects");
    },
  },
});
mock.module("./lib/bcp.ts", {
  namedExports: {
    fetchBcpPlayers: async () => [],
    fetchCurrentItcLeagueId: async () => {
      throw new Error("should not be reached — renderToStaticMarkup never runs effects");
    },
    fetchItcRanking: async () => {
      throw new Error("should not be reached — renderToStaticMarkup never runs effects");
    },
    buildBcpItcProfileUrl: (bcpUserId: string, leagueId?: string) =>
      `https://example.invalid/user/${bcpUserId}${leagueId ? `?league=${leagueId}` : ""}`,
  },
});
mock.module("./lib/clientLog.ts", { namedExports: { logClientEvent: () => {} } });
mock.module("next/navigation", {
  namedExports: {
    usePathname: () => "/",
    useRouter: () => ({ replace: () => {} }),
  },
});

const { default: HomePage } = await import("./page.tsx");

function renderPage(): string {
  return renderToStaticMarkup(React.createElement(NavProvider, null, React.createElement(HomePage)));
}

test("shows nothing but the header while the sign-in check is in flight", () => {
  authState = { user: null, checked: false };
  const html = renderPage();
  assert.match(html, /Brass Ledger/);
  assert.ok(!html.includes("Loading your events"));
});

test("shows nothing once checked and signed out (useRedirectToLoginIfSignedOut takes it from here)", () => {
  authState = { user: null, checked: true };
  const html = renderPage();
  assert.match(html, /Brass Ledger/);
  assert.ok(!html.includes("Friends"));
});

test("shows a pending-approval message instead of content for a signed-in, not-yet-approved account", () => {
  authState = { user: { id: 1, status: "pending", bcpUserId: "" }, checked: true };
  const html = renderPage();
  assert.match(html, /pending approval/);
  assert.ok(!html.includes("Loading your events"));
});

test("prompts linking a BCP profile instead of the Next-up card when none is linked yet", () => {
  authState = { user: { id: 1, status: "approved", bcpUserId: "" }, checked: true };
  const html = renderPage();
  assert.match(html, /Link your Best Coast Pairings profile/);
  assert.ok(!html.includes("Loading your events"));
});

test("shows loading skeletons for Next up and Your record once a profile is linked", () => {
  authState = { user: { id: 1, status: "approved", bcpUserId: "bcp-1" }, checked: true };
  const html = renderPage();
  assert.match(html, /Loading your events/);
  assert.match(html, /Your record/);
  assert.ok(!html.includes("Link your Best Coast Pairings profile"));
});

test("always shows the Friends module, even before a BCP profile is linked", () => {
  authState = { user: { id: 1, status: "approved", bcpUserId: "" }, checked: true };
  const html = renderPage();
  assert.match(html, />Friends</);
});
