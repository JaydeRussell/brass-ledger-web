import { test } from "node:test";
import assert from "node:assert/strict";
import TabBar, { type TabKey } from "./tabBar.tsx";
import { findAll } from "../../lib/testUtils.ts";

// TabBar has no hooks of its own, so it can be called directly as a plain
// function — the returned element tree still has real onClick callbacks we
// can invoke, giving genuine interaction coverage without a DOM. See
// app/lib/testUtils.ts for why this project doesn't have jsdom/RTL yet.

test("TabBar renders one button per tab in a fixed order", () => {
  const tree = TabBar({ active: "overview", onChange: () => {} });
  const buttons = findAll(tree, (el) => el.type === "button");
  assert.deepEqual(
    buttons.map((b) => b.props.children),
    ["Overview", "Roster", "Pairings", "Placings"]
  );
});

test("TabBar marks only the active tab with aria-current", () => {
  const tree = TabBar({ active: "pairings", onChange: () => {} });
  const buttons = findAll(tree, (el) => el.type === "button");
  const current = buttons.filter((b) => b.props["aria-current"] === "page");
  assert.equal(current.length, 1);
  assert.equal(current[0].props.children, "Pairings");
});

test("clicking a tab calls onChange with that tab's key", () => {
  const calls: TabKey[] = [];
  const tree = TabBar({ active: "overview", onChange: (tab) => calls.push(tab) });
  const buttons = findAll(tree, (el) => el.type === "button");
  const rosterButton = buttons.find((b) => b.props.children === "Roster");
  assert.ok(rosterButton, "expected a Roster tab button");
  rosterButton!.props.onClick();
  assert.deepEqual(calls, ["roster"]);
});
