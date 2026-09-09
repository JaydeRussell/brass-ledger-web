import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import TabBar from "./tabBar.tsx";
import { renderStatic } from "../../lib/testUtils.ts";

// TabBar is now built on ui/tabs.tsx's Radix-backed Tabs primitive, which
// uses hooks internally — it can no longer be called directly as a plain
// function and walked (see testUtils.ts's note on walk/find only working
// for hookless components). Rendered via renderStatic (real SSR) instead.
// Unlike Dialog/DropdownMenu, Radix's Tabs has no Portal, so its real
// output — including the data-state/aria-selected attributes driven by
// the `active` prop — is fully inspectable this way. What's NOT covered
// here: actual click/arrow-key interaction (no DOM to dispatch real
// events into) — verified via a real browser during this migration
// instead; see CLAUDE.md on jsdom/@testing-library/react not yet being
// wired up for automated coverage of that.

test("TabBar renders one tab per section in a fixed order", () => {
  const html = renderStatic(React.createElement(TabBar, { active: "overview", onChange: () => {} }));
  const order = ["Overview", "Roster", "Pairings", "Placings"];
  let lastIndex = -1;
  for (const label of order) {
    assert.match(html, new RegExp(`>${label}<`));
    const index = html.indexOf(`>${label}<`);
    assert.ok(index > lastIndex, `expected ${label} to appear after the previous tab`);
    lastIndex = index;
  }
});

test("TabBar marks only the active tab as selected", () => {
  const html = renderStatic(React.createElement(TabBar, { active: "pairings", onChange: () => {} }));
  const buttons = html.split("<button").slice(1);
  assert.equal(buttons.length, 4);
  const pairingsButton = buttons.find((b) => b.includes(">Pairings<"));
  const otherButtons = buttons.filter((b) => !b.includes(">Pairings<"));
  assert.equal(otherButtons.length, 3);
  assert.ok(pairingsButton?.includes('aria-selected="true"'));
  otherButtons.forEach((b) => assert.ok(b.includes('aria-selected="false"')));
});

test("the tab list has an accessible name", () => {
  const html = renderStatic(React.createElement(TabBar, { active: "overview", onChange: () => {} }));
  assert.match(html, /aria-label="Event sections"/);
});
