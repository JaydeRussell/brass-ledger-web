import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DISPLAY_PREFS_INIT_SCRIPT, TEXT_SIZES, isTextSize } from "./displayPrefs.ts";

test("layout.tsx's inline script is an exact copy of DISPLAY_PREFS_INIT_SCRIPT", () => {
  const layout = readFileSync(new URL("../layout.tsx", import.meta.url), "utf8");
  assert.ok(layout.includes(DISPLAY_PREFS_INIT_SCRIPT));
});

test("the init script applies exactly the non-default text sizes", () => {
  const nonDefault = TEXT_SIZES.filter((s) => s.value !== "md").map((s) => s.value);
  for (const size of nonDefault) assert.ok(DISPLAY_PREFS_INIT_SCRIPT.includes(`s==="${size}"`));
  assert.ok(!DISPLAY_PREFS_INIT_SCRIPT.includes('s==="md"'));
});

test("globals.css defines a scale for every non-default text size, matching TEXT_SIZES", () => {
  const css = readFileSync(new URL("../globals.css", import.meta.url), "utf8");
  for (const size of TEXT_SIZES.filter((s) => s.value !== "md")) {
    assert.match(
      css,
      new RegExp(`data-text-size="${size.value}"\\]\\s*\\{\\s*--app-text-scale:\\s*${size.scale};`)
    );
  }
});

test("recognises only the known text sizes", () => {
  assert.ok(isTextSize("lg"));
  assert.ok(!isTextSize("huge"));
  assert.ok(!isTextSize(null));
});
