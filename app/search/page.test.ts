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
