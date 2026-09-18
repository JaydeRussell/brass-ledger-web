import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CommandPaletteProvider } from "../shared/commandPaletteContext.tsx";

// BottomTabBar depends on usePathname() (throws outside a real Next.js
// App Router context) — mocked the same way this project's other
// hook-heavy components are (see feedbackWidget.test.ts's identical
// setup). Its own useState/click-to-open-the-palette interaction is a
// stateful transition a static SSR pass can't simulate — verified live
// instead.
let mockPathname = "/";
mock.module("next/navigation", {
  namedExports: { usePathname: () => mockPathname },
});
const { default: BottomTabBar } = await import("./bottomTabBar.tsx");

function render(): string {
  return renderToStaticMarkup(React.createElement(CommandPaletteProvider, null, React.createElement(BottomTabBar)));
}

test("renders all three destinations, hidden at sm: and up", () => {
  mockPathname = "/";
  const html = render();
  assert.match(html, />Home</);
  assert.match(html, />My Events</);
  assert.match(html, />Search</);
  assert.match(html, /sm:hidden/);
});

test("marks Home as the current page when pathname is '/'", () => {
  mockPathname = "/";
  const html = render();
  const homeLink = html.match(/<a[^>]*href="\/"[^>]*>/)?.[0] ?? "";
  assert.match(homeLink, /aria-current="page"/);
  assert.match(homeLink, /text-brass-400/);
});

test("marks My Events (not Home) as current on an /my-events sub-path", () => {
  mockPathname = "/my-events?tab=past";
  const html = render();
  const homeLink = html.match(/<a[^>]*href="\/"[^>]*>/)?.[0] ?? "";
  const eventsLink = html.match(/<a[^>]*href="\/my-events"[^>]*>/)?.[0] ?? "";
  assert.ok(!homeLink.includes("aria-current"));
  assert.match(eventsLink, /aria-current="page"/);
});

test("Search is a real button (opens the command palette), not a link", () => {
  mockPathname = "/";
  const html = render();
  const searchButton = html.match(/<button[^>]*>[\s\S]*?Search<\/button>/)?.[0] ?? "";
  assert.ok(searchButton.length > 0);
});
