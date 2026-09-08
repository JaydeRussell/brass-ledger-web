import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NavProvider } from "../components/nav/navContext.tsx";

// Same mocking approach as app/my-events/page.test.ts: this page leans
// on this app's own lib/auth + lib/myEvents (both do real fetches on
// mount) plus, uniquely to this page, lib/calendar.ts (CalendarSubscribe
// fetches the .ics URL on mount). One shared mutable object per mocked
// module, set per test, rather than re-calling mock.module() per test —
// see navDrawer.test.ts's note on why.
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
// linkBcpProfile has to be mocked too, even though this page never calls
// it directly — the "no profile linked yet" branch renders the real
// BcpProfileLinker component, which imports it from this same module —
// same reasoning as my-events/page.test.ts.
mock.module("../lib/myEvents.ts", {
  namedExports: {
    fetchMyEvents: async () => ({ linked: true, past: [], present: [], future: [] }),
    linkBcpProfile: async () => "u1",
  },
});
mock.module("../lib/calendar.ts", {
  namedExports: {
    fetchCalendarUrl: async () => "http://localhost:8080/api/calendar/abc123.ics",
  },
});
mock.module("../lib/clientLog.ts", { namedExports: { logClientEvent: () => {} } });

const { default: CalendarPage } = await import("./page.tsx");

// The page's own HamburgerButton needs a NavProvider ancestor — normally
// supplied once by app/layout.tsx, so tests supply their own.
function renderPage(): string {
  return renderToStaticMarkup(React.createElement(NavProvider, null, React.createElement(CalendarPage)));
}

test("shows nothing but the header while the sign-in check is in flight", () => {
  authState = { user: null, checked: false, setUser: () => {} };
  const html = renderPage();
  assert.match(html, /Calendar/);
  assert.ok(!html.includes("Sign in to see"));
});

test("prompts sign-in once checked and signed out", () => {
  authState = { user: null, checked: true, setUser: () => {} };
  const html = renderPage();
  assert.match(html, /Sign in to see your upcoming events on a calendar\./);
  assert.match(html, /href="http:\/\/localhost:8080\/auth\/google\/login"/);
});

test("prompts linking a BCP profile for a signed-in account with none linked", () => {
  authState = {
    checked: true,
    setUser: () => {},
    user: { id: 1, email: "a@b.com", name: "A B", avatarUrl: "", bcpUserId: "" },
  };
  const html = renderPage();
  assert.match(html, /Link your Best Coast Pairings profile/);
});

test("shows the month grid, subscribe widget, and change-profile link for a fully linked account", () => {
  authState = {
    checked: true,
    setUser: () => {},
    user: { id: 1, email: "a@b.com", name: "A B", avatarUrl: "", bcpUserId: "u1" },
  };
  const html = renderPage();
  assert.match(html, /Subscribe/);
  assert.match(html, /Change profile/);
  // The month grid renders the current month's weekday header row
  // regardless of fetch timing (it doesn't wait on events to render its
  // own shell) — Sun is present in every month.
  assert.match(html, />Sun</);
});
