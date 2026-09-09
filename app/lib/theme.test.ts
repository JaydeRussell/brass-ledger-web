import { test } from "node:test";
import assert from "node:assert/strict";

const { parseTheme, resolveTheme } = await import("./theme.ts");

test("parseTheme: recognizes the three real values", () => {
  assert.equal(parseTheme("light"), "light");
  assert.equal(parseTheme("dark"), "dark");
  assert.equal(parseTheme("system"), "system");
});

test("parseTheme: defaults anything else to system", () => {
  assert.equal(parseTheme(null), "system");
  assert.equal(parseTheme(""), "system");
  assert.equal(parseTheme("blorp"), "system");
});

test("resolveTheme: light/dark pass through regardless of system preference", () => {
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("light", false), "light");
  assert.equal(resolveTheme("dark", true), "dark");
  assert.equal(resolveTheme("dark", false), "dark");
});

test("resolveTheme: system defers to the system preference", () => {
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("system", false), "light");
});
