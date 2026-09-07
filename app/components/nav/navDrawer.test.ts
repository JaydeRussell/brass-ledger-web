import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NavProvider } from "./navContext.tsx";

// navDrawer.tsx calls next/navigation's usePathname(), which needs a real
// Next.js App Router context to work — outside of one (as here, a plain
// react-dom/server pass with no Next runtime) it throws. Mocked the same
// way this project mocks its own lib/* modules for hook-heavy components
// (see accountSection.test.ts) rather than pulling in Next's own test
// harness, which isn't installable here either (see CLAUDE.md).
//
// One shared mutable variable backing the mock, set per test right before
// rendering, rather than calling mock.module() again per test — a second
// mock.module() call for the same specifier isn't guaranteed to affect an
// already-linked ESM import binding the same way a plain mutation is.
let currentPath = "/";
mock.module("next/navigation", {
  namedExports: { usePathname: () => currentPath },
});
const { default: NavDrawer } = await import("./navDrawer.tsx");

test("highlights the link matching the current path", () => {
  currentPath = "/my-events";
  const html = renderToStaticMarkup(
    React.createElement(NavProvider, null, React.createElement(NavDrawer))
  );
  assert.match(html, /Event/);
  assert.match(html, /My Events/);
  // Only "My Events" should carry the active-link highlight class.
  const links = html.split("<a").slice(1);
  const eventLink = links.find((l) => l.includes(">Event<"));
  const myEventsLink = links.find((l) => l.includes(">My Events<"));
  assert.ok(!eventLink?.includes("bg-indigo-50"));
  assert.ok(myEventsLink?.includes("bg-indigo-50"));
});

test("closed by default (translate-x-full)", () => {
  currentPath = "/";
  const html = renderToStaticMarkup(
    React.createElement(NavProvider, null, React.createElement(NavDrawer))
  );
  assert.match(html, /-translate-x-full/);
});
