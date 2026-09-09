import { test } from "node:test";
import assert from "node:assert/strict";

const { parseTheme, resolveTheme, reconcileAccountTheme } = await import("./theme.ts");

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

test("reconcileAccountTheme: a real account preference wins over local", () => {
  assert.deepEqual(reconcileAccountTheme("dark", "light"), { resolved: "dark", pushLocalUp: false });
  assert.deepEqual(reconcileAccountTheme("light", "dark"), { resolved: "light", pushLocalUp: false });
  // Even when local already agrees, this is not a "push" — the account
  // value is just used as-is.
  assert.deepEqual(reconcileAccountTheme("dark", "dark"), { resolved: "dark", pushLocalUp: false });
});

test("reconcileAccountTheme: an account still at the default defers to a real local choice", () => {
  assert.deepEqual(reconcileAccountTheme("system", "dark"), { resolved: "dark", pushLocalUp: true });
  assert.deepEqual(reconcileAccountTheme("system", "light"), { resolved: "light", pushLocalUp: true });
});

test("reconcileAccountTheme: both at the default is not a push", () => {
  assert.deepEqual(reconcileAccountTheme("system", "system"), { resolved: "system", pushLocalUp: false });
});
