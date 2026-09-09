import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderStatic } from "../../lib/testUtils.ts";
import { Tabs } from "./tabs.tsx";

// Tabs is the one Radix-backed primitive here with no Portal involved, so
// (unlike Dialog/DropdownMenu, see their own .test.ts files) real
// structural output — including Radix's own generated ARIA attributes —
// is genuinely visible to renderToStaticMarkup, not just a mount check.

const tabs = [
  { value: "a" as const, label: "Alpha" },
  { value: "b" as const, label: "Beta" },
];

test("renders every tab with a real tablist and accessible label", () => {
  const html = renderStatic(
    React.createElement(Tabs, { value: "a", onValueChange: () => {}, tabs, label: "Test sections" })
  );
  assert.match(html, /role="tablist"/);
  assert.match(html, /aria-label="Test sections"/);
  assert.match(html, />Alpha</);
  assert.match(html, />Beta</);
});

test("marks the active tab via aria-selected and data-state, not just styling", () => {
  const html = renderStatic(
    React.createElement(Tabs, { value: "b", onValueChange: () => {}, tabs, label: "Test sections" })
  );
  // Beta (the active one) comes second in the markup — check each tab's
  // own aria-selected value by pairing it with its label text.
  const alphaTag = html.match(/<button[^>]*>Alpha<\/button>/)?.[0] ?? "";
  const betaTag = html.match(/<button[^>]*>Beta<\/button>/)?.[0] ?? "";
  assert.match(alphaTag, /aria-selected="false"/);
  assert.match(alphaTag, /data-state="inactive"/);
  assert.match(betaTag, /aria-selected="true"/);
  assert.match(betaTag, /data-state="active"/);
});

test("uses the horizontal-scroll pattern the pre-Radix TabBar relied on", () => {
  const html = renderStatic(
    React.createElement(Tabs, { value: "a", onValueChange: () => {}, tabs, label: "Test sections" })
  );
  assert.match(html, /scrollbar-none/);
  assert.match(html, /overflow-x-auto/);
});
