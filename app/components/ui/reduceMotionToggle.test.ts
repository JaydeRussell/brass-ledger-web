import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderStatic } from "../../lib/testUtils.ts";

// This component calls useReduceMotion (which itself calls useState/
// useEffect), so it's tested via renderStatic (SSR) — same "static pass
// only ever sees the pre-hydration default" caveat lib/motionPrefs.ts's
// own useReduceMotion doc comment describes. The actual click → toggle →
// localStorage/data-attribute round-trip is verified live instead.

const { default: ReduceMotionToggle } = await import("./reduceMotionToggle.tsx");

test("renders off by default (before localStorage sync runs)", () => {
  const html = renderStatic(React.createElement(ReduceMotionToggle));
  assert.match(html, /Reduce motion/);
  assert.match(html, /aria-checked="false"/);
  assert.match(html, /role="switch"/);
});
