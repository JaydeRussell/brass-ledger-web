import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NavProvider } from "../components/nav/navContext.tsx";

let authState: { user: unknown; checked: boolean } = { user: null, checked: false };
let searchParamsValue = new URLSearchParams();

mock.module("../lib/auth.ts", { namedExports: { useCurrentUser: () => authState } });
mock.module("next/navigation", {
  namedExports: {
    usePathname: () => "/search",
    useRouter: () => ({ push: () => {}, replace: () => {} }),
    useSearchParams: () => searchParamsValue,
  },
});

const { default: SearchPage } = await import("./page.tsx");

function renderPage(): string {
  return renderToStaticMarkup(React.createElement(NavProvider, null, React.createElement(SearchPage)));
}

const approved = { id: 1, email: "a@b.com", name: "A B", avatarUrl: "", bcpUserId: "", role: "user", status: "approved" };

test("an approved account gets the search form, filled from ?q=", () => {
  authState = { user: approved, checked: true };
  searchParamsValue = new URLSearchParams("q=kawartha");
  const html = renderPage();
  assert.match(html, /role="search"/);
  assert.match(html, /value="kawartha"/);
});

test("a pending account sees the approval message instead of the form", () => {
  authState = { user: { ...approved, status: "pending" }, checked: true };
  searchParamsValue = new URLSearchParams();
  const html = renderPage();
  assert.match(html, /pending approval/);
  assert.ok(!html.includes('role="search"'));
});

test("fills the dates from the URL and asks for a name or location when there's neither", () => {
  authState = { user: approved, checked: true };
  searchParamsValue = new URLSearchParams("from=2026-10-10&to=2026-10-12");
  const html = renderPage();
  assert.match(html, /value="2026-10-10"/);
  assert.match(html, /value="2026-10-12"/);
  assert.match(html, /Add at least 3 characters of a name, or a location/);
});

test("ignores a malformed date in the URL", () => {
  authState = { user: approved, checked: true };
  searchParamsValue = new URLSearchParams("q=open&from=10/31/2026");
  const html = renderPage();
  assert.doesNotMatch(html, /value="10\/31\/2026"/);
});
