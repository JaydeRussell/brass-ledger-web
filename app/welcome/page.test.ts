import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NavProvider } from "../components/nav/navContext.tsx";

// Same mocking approach as my-events/page.test.ts and stats/page.test.ts:
// this page leans on lib/auth (real fetch on mount) and renders
// BcpProfileLinker (via lib/myEvents, lib/bcp, lib/recentEvents) and
// SignInPrompt (via next/navigation's usePathname) — every export any of
// those touch has to be covered, since mocking a module replaces its
// exports wholesale for every importer.
let authState: { user: unknown; checked: boolean; setUser: (u: unknown) => void } = {
  user: null,
  checked: false,
  setUser: () => {},
};

mock.module("../lib/auth.ts", {
  namedExports: {
    useCurrentUser: () => authState,
    googleSignInUrl: (returnTo?: string) =>
      `http://localhost:8080/auth/google/login${returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : ""}`,
  },
});
mock.module("../lib/myEvents.ts", {
  namedExports: { linkBcpProfile: async () => "u1" },
});
mock.module("../lib/recentEvents.ts", {
  namedExports: { loadRecentEvents: () => [] },
});
mock.module("../lib/bcp.ts", {
  namedExports: { fetchBcpPlayers: async () => [] },
});
mock.module("../lib/clientLog.ts", { namedExports: { logClientEvent: () => {} } });
mock.module("next/navigation", {
  namedExports: {
    usePathname: () => "/welcome",
    // The redirect/onLinked-navigation effects that call these live in
    // useEffect, which doesn't run under a static SSR pass — see the
    // note on the last test below. No-ops are enough to let the render
    // itself complete without throwing.
    useRouter: () => ({ replace: () => {}, push: () => {} }),
  },
});

const { default: WelcomePage } = await import("./page.tsx");

function renderPage(): string {
  return renderToStaticMarkup(React.createElement(NavProvider, null, React.createElement(WelcomePage)));
}

test("shows nothing but the header while the sign-in check is in flight", () => {
  authState = { user: null, checked: false, setUser: () => {} };
  const html = renderPage();
  assert.match(html, /Welcome to Brass Ledger/);
  assert.ok(!html.includes("Sign in to"));
  assert.ok(!html.includes("Connect your Best Coast Pairings profile"));
});

test("prompts sign-in once checked and signed out", () => {
  authState = { user: null, checked: true, setUser: () => {} };
  const html = renderPage();
  assert.match(html, /Sign in to get started\./);
});

test("prompts linking a profile for a signed-in account with none linked", () => {
  authState = {
    checked: true,
    setUser: () => {},
    user: { id: 1, email: "a@b.com", name: "A B", avatarUrl: "", bcpUserId: "", role: "user", status: "approved" },
  };
  const html = renderPage();
  assert.match(html, /Connect your Best Coast Pairings profile/);
  assert.match(html, /Link your Best Coast Pairings profile/); // BcpProfileLinker's own heading
});

// The actual router.replace("/my-events") call lives in a useEffect,
// which (like every effect in this codebase's tests — see
// bcpProfileLinker.test.ts's note) doesn't run under a static SSR pass,
// so it can't be verified here. What *is* verified: an already-linked
// account's render output shows no onboarding content at all — the
// render-time condition guarding it is independent of whether the
// effect has fired yet.
test("an already-linked account's first render shows no onboarding content (the redirect effect takes it from here)", () => {
  authState = {
    checked: true,
    setUser: () => {},
    user: { id: 1, email: "a@b.com", name: "A B", avatarUrl: "", bcpUserId: "u1", role: "user", status: "approved" },
  };
  const html = renderPage();
  assert.ok(!html.includes("Connect your Best Coast Pairings profile"));
  assert.ok(!html.includes("Sign in to"));
});
