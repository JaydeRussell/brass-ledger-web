import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// fetchCalendarUrl's real implementation does a fetch on mount — mocked
// the same way other lib/* modules are mocked elsewhere in this app
// (see accountSection.test.ts). Its resolved value never actually shows
// up in these tests: renderToStaticMarkup never runs useEffect, so only
// the pre-fetch ("Loading…") render is checkable here — the same
// established limitation every effect-driven component's test in this
// app works within.
mock.module("../../lib/calendar.ts", {
  namedExports: { fetchCalendarUrl: async () => "http://localhost:8080/api/calendar/abc123.ics" },
});
mock.module("../../lib/clientLog.ts", { namedExports: { logClientEvent: () => {} } });

const { default: CalendarSubscribe } = await import("./calendarSubscribe.tsx");

function render(): string {
  return renderToStaticMarkup(React.createElement(CalendarSubscribe));
}

test("renders the subscribe heading, instructions, and a loading placeholder before the fetch resolves", () => {
  const html = render();
  assert.match(html, /Subscribe/);
  assert.match(html, /URL subscription/);
  assert.match(html, /value="Loading…"/);
});

test("doesn't throw and renders a read-only input when the Clipboard API isn't available (this test's own Node environment)", () => {
  // Also exercises the real-world case of an actual browser without
  // Clipboard API support (e.g. a non-HTTPS context) — the component
  // must degrade gracefully rather than crash on `navigator.clipboard`
  // being undefined, and this environment already doesn't have it.
  const html = render();
  const inputTag = html.match(/<input[^>]*>/)?.[0] ?? "";
  assert.match(inputTag, /readonly/i);
});
