import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NavProvider } from "../components/nav/navContext.tsx";
import { ToastProvider } from "../components/shared/toastContext.tsx";

// Same mocking approach as my-events/page.test.ts: this page leans on
// lib/auth (real fetch on mount) and lib/friends, and renders FriendRow,
// which pulls in lib/friends too — every export any of those touch has
// to be covered here, since mocking a module replaces its exports
// wholesale for every importer. fetchFriendEvents is never actually
// called in these tests (it only fires on a click FriendRow's own
// "Their events" toggle, which renderToStaticMarkup can't simulate — no
// DOM, no effects), so it's mocked to throw if reached, same pattern
// headToHead.test.ts uses for fetchHeadToHead.
let authState: { user: unknown; checked: boolean } = { user: null, checked: false };
let requestsValue: unknown[] = [];
let friendsValue: unknown[] = [];

mock.module("../lib/auth.ts", {
  namedExports: { useCurrentUser: () => authState },
});
mock.module("../lib/friends.ts", {
  namedExports: {
    fetchIncomingFriendRequests: async () => requestsValue,
    fetchFriends: async () => friendsValue,
    acceptFriendRequest: async () => {},
    declineFriendRequest: async () => {},
    removeFriend: async () => {},
    fetchFriendEvents: async () => {
      throw new Error("should not be called before the Their events toggle is clicked");
    },
  },
});
mock.module("../lib/clientLog.ts", { namedExports: { logClientEvent: () => {} } });
mock.module("next/navigation", {
  namedExports: {
    usePathname: () => "/friends",
    useRouter: () => ({ replace: () => {} }),
  },
});

const { default: FriendsPage } = await import("./page.tsx");

function renderPage(): string {
  return renderToStaticMarkup(
    React.createElement(ToastProvider, null, React.createElement(NavProvider, null, React.createElement(FriendsPage)))
  );
}

test("shows nothing but the header while the sign-in check is in flight", () => {
  authState = { user: null, checked: false };
  const html = renderPage();
  assert.match(html, /Friends/);
  assert.ok(!html.includes("Not friends with anyone"));
});

test("shows nothing once checked and signed out (useRedirectToLoginIfSignedOut takes it from here)", () => {
  authState = { user: null, checked: true };
  const html = renderPage();
  assert.match(html, /Friends/);
  assert.ok(!html.includes("Not friends with anyone"));
});

test("shows a pending-approval message instead of content for a signed-in, not-yet-approved account", () => {
  authState = { user: { id: 1, status: "pending" }, checked: true };
  const html = renderPage();
  assert.match(html, /pending approval/);
});

test("shows a loading state for an approved account before the fetch resolves", () => {
  authState = { user: { id: 1, status: "approved" }, checked: true };
  requestsValue = [];
  friendsValue = [];
  const html = renderPage();
  // The fetch itself never resolves in a static render (no effects run,
  // no DOM) — see this file's own doc comment. The eventual
  // requests-inbox/friends-list/empty-state rendering is verified live
  // instead.
  assert.match(html, /Loading…/);
});
