import { test } from "node:test";
import assert from "node:assert/strict";
import { canRefreshNow, REFRESH_COOLDOWN_MS } from "./refreshCooldown.ts";

// RefreshButton wraps a ref/timer/CSS-animation around this pure
// decision — see its own doc comment for why the timing logic is split
// out here instead of being tested through a component render (this
// project's SSR-only test harness can't simulate a real click sequence
// or a CSS transition anyway; see app/lib/testUtils.ts).

test("canRefreshNow: allows a call exactly cooldownMs after the last one", () => {
  assert.equal(canRefreshNow(1000, 1000 + REFRESH_COOLDOWN_MS, REFRESH_COOLDOWN_MS), true);
});

test("canRefreshNow: blocks a call before cooldownMs has elapsed", () => {
  assert.equal(canRefreshNow(1000, 1000 + REFRESH_COOLDOWN_MS - 1, REFRESH_COOLDOWN_MS), false);
});

test("canRefreshNow: allows the very first call (lastAcceptedAt = 0, a long time in the past)", () => {
  assert.equal(canRefreshNow(0, Date.now(), REFRESH_COOLDOWN_MS), true);
});

test("canRefreshNow: the default cooldown is 2 seconds, matching the backend's manual-invalidate floor", () => {
  assert.equal(REFRESH_COOLDOWN_MS, 2000);
});
