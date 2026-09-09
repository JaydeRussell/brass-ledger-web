import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NavProvider } from "../components/nav/navContext.tsx";

// This page leans on next/navigation (needs a real App Router context —
// mocked, same rationale as navDrawer.test.ts) and this app's own
// lib/auth + lib/myEvents (both do real fetches on mount, mocked the same
// way accountSection.test.ts mocks lib/auth). One shared mutable object
// per mocked module, set per test, rather than re-calling mock.module()
// per test — see navDrawer.test.ts's note on why.
let authState: { user: unknown; checked: boolean; setUser: (u: unknown) => void } = {
  user: null,
  checked: false,
  setUser: () => {},
};
let searchParamsValue = new URLSearchParams();

mock.module("../lib/auth.ts", {
  namedExports: {
    useCurrentUser: () => authState,
    googleSignInUrl: () => "http://localhost:8080/auth/google/login",
  },
});
// linkBcpProfile has to be mocked too, even though this page never calls
// it directly — the "no profile linked yet" branch renders the real
// BcpProfileLinker component, which imports it from this same module, and
// mocking a module replaces *all* of its exports for every importer.
mock.module("../lib/myEvents.ts", {
  namedExports: {
    fetchMyEvents: async () => ({ linked: true, past: [], present: [], future: [] }),
    linkBcpProfile: async () => "u1",
  },
});
mock.module("../lib/clientLog.ts", { namedExports: { logClientEvent: () => {} } });
mock.module("next/navigation", {
  namedExports: {
    usePathname: () => "/my-events",
    useRouter: () => ({ replace: () => {} }),
    useSearchParams: () => searchParamsValue,
  },
});

const { default: MyEventsPage } = await import("./page.tsx");

// The page's own HamburgerButton needs a NavProvider ancestor — normally
// supplied once by app/layout.tsx, so tests supply their own.
function renderPage(): string {
  return renderToStaticMarkup(React.createElement(NavProvider, null, React.createElement(MyEventsPage)));
}

test("shows nothing but the header while the sign-in check is in flight", () => {
  authState = { user: null, checked: false, setUser: () => {} };
  searchParamsValue = new URLSearchParams();
  const html = renderPage();
  assert.match(html, /My Events/);
  assert.ok(!html.includes("Sign in to see"));
});

test("shows nothing once checked and signed out (useRedirectToLoginIfSignedOut takes it from here)", () => {
  authState = { user: null, checked: true, setUser: () => {} };
  searchParamsValue = new URLSearchParams();
  const html = renderPage();
  assert.match(html, /My Events/);
  assert.ok(!html.includes("Link your Best Coast Pairings profile"));
});

test("prompts linking a BCP profile for a signed-in account with none linked", () => {
  authState = {
    checked: true,
    setUser: () => {},
    user: { id: 1, email: "a@b.com", name: "A B", avatarUrl: "", bcpUserId: "", role: "user", status: "approved" },
  };
  searchParamsValue = new URLSearchParams();
  const html = renderPage();
  assert.match(html, /Link your Best Coast Pairings profile/);
});

test("shows a pending-approval message instead of content for a signed-in, not-yet-approved account", () => {
  authState = {
    checked: true,
    setUser: () => {},
    user: { id: 1, email: "a@b.com", name: "A B", avatarUrl: "", bcpUserId: "u1", role: "user", status: "pending" },
  };
  searchParamsValue = new URLSearchParams();
  const html = renderPage();
  assert.match(html, /pending approval/);
  assert.ok(!html.includes("Link your Best Coast Pairings profile"));
});

test("shows the Past/Ongoing/Future tabs for a fully linked account, defaulting to Ongoing", () => {
  authState = {
    checked: true,
    setUser: () => {},
    user: { id: 1, email: "a@b.com", name: "A B", avatarUrl: "", bcpUserId: "u1", role: "user", status: "approved" },
  };
  searchParamsValue = new URLSearchParams();
  const html = renderPage();
  assert.match(html, />Past</);
  assert.match(html, />Ongoing</);
  assert.match(html, />Future</);
  // "Ongoing" is the default tab (no ?tab= in the URL) and should be the
  // one Radix marks selected (data-state="active"/aria-selected="true");
  // the other two shouldn't. This tab row is now built on
  // ui/tabs.tsx's Radix-backed Tabs primitive — see tabBar.test.ts's note
  // on why this checks Radix's own state attributes rather than a
  // hardcoded active-tab class.
  const buttons = html.split("<button").slice(1);
  const ongoing = buttons.find((b) => b.includes(">Ongoing<"));
  const past = buttons.find((b) => b.includes(">Past<"));
  assert.ok(ongoing?.includes('aria-selected="true"'));
  assert.ok(past?.includes('aria-selected="false"'));
});

test("respects a ?tab= query param for which tab starts active", () => {
  authState = {
    checked: true,
    setUser: () => {},
    user: { id: 1, email: "a@b.com", name: "A B", avatarUrl: "", bcpUserId: "u1", role: "user", status: "approved" },
  };
  searchParamsValue = new URLSearchParams("tab=past");
  const html = renderPage();
  const buttons = html.split("<button").slice(1);
  const past = buttons.find((b) => b.includes(">Past<"));
  assert.ok(past?.includes('aria-selected="true"'));
});
