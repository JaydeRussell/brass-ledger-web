import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NavProvider } from "../components/nav/navContext.tsx";

// Same mocking approach as my-events/page.test.ts: this page leans on
// lib/auth (real fetch on mount) and renders BcpProfileLinker /
// PlayerStatsPanel, which between them pull in lib/myEvents, lib/bcp,
// lib/myStats, lib/recentEvents, and lib/clientLog — every export any of
// those components touch has to be covered here, since mocking a module
// replaces its exports wholesale for every importer.
let authState: { user: unknown; checked: boolean; setUser: (u: unknown) => void } = {
  user: null,
  checked: false,
  setUser: () => {},
};

mock.module("../lib/auth.ts", {
  namedExports: {
    useCurrentUser: () => authState,
    googleSignInUrl: () => "http://localhost:8080/auth/google/login",
  },
});
mock.module("../lib/myEvents.ts", {
  namedExports: { linkBcpProfile: async () => "u1" },
});
mock.module("../lib/recentEvents.ts", {
  namedExports: { loadRecentEvents: () => [] },
});
mock.module("../lib/myStats.ts", {
  namedExports: {
    fetchMyStats: async () => ({ linked: false, totalEvents: 0, factions: [] }),
  },
});
mock.module("../lib/bcp.ts", {
  namedExports: {
    fetchBcpPlayers: async () => [],
    fetchCurrentItcLeagueId: async () => {
      throw new Error("should not be called before stats have loaded");
    },
    fetchItcRanking: async () => {
      throw new Error("should not be called before stats have loaded");
    },
    buildBcpItcProfileUrl: (bcpUserId: string, leagueId?: string) =>
      `https://example.invalid/user/${bcpUserId}${leagueId ? `?league=${leagueId}` : ""}`,
  },
});
mock.module("../lib/clientLog.ts", { namedExports: { logClientEvent: () => {} } });

const { default: StatsPage } = await import("./page.tsx");

// The page's HamburgerButton needs a NavProvider ancestor, normally
// supplied once by app/layout.tsx.
function renderPage(): string {
  return renderToStaticMarkup(React.createElement(NavProvider, null, React.createElement(StatsPage)));
}

test("shows nothing but the header while the sign-in check is in flight", () => {
  authState = { user: null, checked: false, setUser: () => {} };
  const html = renderPage();
  assert.match(html, /Player Stats/);
  assert.ok(!html.includes("Sign in to see"));
});

test("prompts sign-in once checked and signed out", () => {
  authState = { user: null, checked: true, setUser: () => {} };
  const html = renderPage();
  assert.match(html, /Sign in to see your player stats\./);
  assert.match(html, /href="http:\/\/localhost:8080\/auth\/google\/login"/);
});

test("shows a pending-approval message instead of content for a signed-in, not-yet-approved account", () => {
  authState = {
    checked: true,
    setUser: () => {},
    user: { id: 1, email: "a@b.com", name: "A B", avatarUrl: "", bcpUserId: "u1", role: "user", status: "pending" },
  };
  const html = renderPage();
  assert.match(html, /pending approval/);
  assert.ok(!html.includes("Link your Best Coast Pairings profile"));
});

test("shows a rejected message for a rejected account", () => {
  authState = {
    checked: true,
    setUser: () => {},
    user: { id: 1, email: "a@b.com", name: "A B", avatarUrl: "", bcpUserId: "u1", role: "user", status: "rejected" },
  };
  const html = renderPage();
  assert.match(html, /access request/);
  assert.match(html, /approved/);
});

test("prompts linking a BCP profile for a signed-in account with none linked", () => {
  authState = {
    checked: true,
    setUser: () => {},
    user: { id: 1, email: "a@b.com", name: "A B", avatarUrl: "", bcpUserId: "", role: "user", status: "approved" },
  };
  const html = renderPage();
  assert.match(html, /Link your Best Coast Pairings profile/);
});

test("shows a Change profile link for a fully linked account", () => {
  authState = {
    checked: true,
    setUser: () => {},
    user: { id: 1, email: "a@b.com", name: "A B", avatarUrl: "", bcpUserId: "u1", role: "user", status: "approved" },
  };
  const html = renderPage();
  assert.match(html, /Change profile/);
});
