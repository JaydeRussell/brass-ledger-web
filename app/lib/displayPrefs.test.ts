import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DENSITIES, DISPLAY_PREFS_INIT_SCRIPT, TEXT_SIZES, isDensity, isTextSize } from "./displayPrefs.ts";

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

test("the init script and globals.css cover every non-default density, matching DENSITIES", () => {
  const css = readFileSync(new URL("../globals.css", import.meta.url), "utf8");
  for (const d of DENSITIES.filter((x) => x.value !== "default")) {
    assert.ok(DISPLAY_PREFS_INIT_SCRIPT.includes(`n==="${d.value}"`));
    assert.match(css, new RegExp(`data-density="${d.value}"\\]\\s*\\{\\s*--density:\\s*${d.scale};`));
  }
});

test("recognises only the known densities", () => {
  assert.ok(isDensity("compact"));
  assert.ok(!isDensity("tiny"));
});
