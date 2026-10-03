import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { REDUCE_MOTION_INIT_SCRIPT, motionReduced } from "./motionPrefs.ts";

test("layout.tsx's inline script is an exact copy of REDUCE_MOTION_INIT_SCRIPT", () => {
  const layout = readFileSync(new URL("../layout.tsx", import.meta.url), "utf8");
  assert.ok(layout.includes(REDUCE_MOTION_INIT_SCRIPT));
});

test("motionReduced is false where there is no document (server render)", () => {
  assert.equal(motionReduced(), false);
});
