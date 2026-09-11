import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import RefreshButton from "./refreshButton.tsx";

// RefreshButton keeps its cooldown entirely in useState/useRef/effects,
// so a static SSR pass (no DOM to let a real click or CSS transition
// run; see app/lib/testUtils.ts) can only ever show the very first
// render, before any click has happened — no cooldown bar, button
// enabled unless `loading` says otherwise. The click-triggered cooldown
// itself (canRefreshNow's timing decision) is covered directly in
// refreshCooldown.test.ts.

test("renders an enabled button with no cooldown bar on first paint", () => {
  const html = renderToStaticMarkup(
    React.createElement(RefreshButton, { onRefresh: () => {}, loading: false, label: "pairings" })
  );
  assert.match(html, /aria-label="Check for updated pairings"/);
  assert.ok(!/\sdisabled=""/.test(html));
  assert.ok(!html.includes("bg-brass-500")); // the drain bar's fill color, absent until cooling
});

test("disables the button while loading, even before any click", () => {
  const html = renderToStaticMarkup(
    React.createElement(RefreshButton, { onRefresh: () => {}, loading: true, label: "placings" })
  );
  assert.match(html, /aria-label="Check for updated placings"/);
  assert.match(html, /\sdisabled=""/);
});
