import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderStatic } from "./testUtils.ts";
import { useLazyComponent } from "./useLazyComponent.ts";

// The hook loads in an effect, and effects never run under renderStatic
// (see testUtils.ts) — so what's assertable here is the state every
// caller renders first, and must therefore handle: nothing loaded yet.
// The loaded path is exercised live in a real browser (the nav drawer,
// the feedback panel, the ⌘K palette all open).

function Probe({ shouldLoad }: { shouldLoad: boolean }) {
  const Loaded = useLazyComponent(async () => ({ default: () => React.createElement("b", null, "loaded") }), shouldLoad);
  return React.createElement("span", null, Loaded ? "ready" : "pending");
}

test("returns null before the module has loaded, whether or not loading was asked for", () => {
  assert.match(renderStatic(React.createElement(Probe, { shouldLoad: false })), />pending</);
  assert.match(renderStatic(React.createElement(Probe, { shouldLoad: true })), />pending</);
});
