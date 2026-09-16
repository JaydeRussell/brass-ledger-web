import { test } from "node:test";
import assert from "node:assert/strict";

const { parseAccentTheme, reconcileAccountAccentTheme, ACCENT_THEMES } = await import("./theme.ts");

test("parseAccentTheme: recognizes every real value", () => {
  for (const option of ACCENT_THEMES) {
    assert.equal(parseAccentTheme(option.value), option.value);
  }
});

test("parseAccentTheme: defaults anything else to brass", () => {
  assert.equal(parseAccentTheme(null), "brass");
  assert.equal(parseAccentTheme(""), "brass");
  assert.equal(parseAccentTheme("blorp"), "brass");
});

test("ACCENT_THEMES: every value is unique", () => {
  const values = ACCENT_THEMES.map((option) => option.value);
  assert.equal(new Set(values).size, values.length);
});

test("reconcileAccountAccentTheme: a real account preference wins over local", () => {
  assert.deepEqual(reconcileAccountAccentTheme("sanguine", "waaagh"), {
    resolved: "sanguine",
    pushLocalUp: false,
  });
  // Even when local already agrees, this is not a "push" — the account
  // value is just used as-is.
  assert.deepEqual(reconcileAccountAccentTheme("sanguine", "sanguine"), {
    resolved: "sanguine",
    pushLocalUp: false,
  });
});

test("reconcileAccountAccentTheme: an account still at the default defers to a real local choice", () => {
  assert.deepEqual(reconcileAccountAccentTheme("brass", "waaagh"), { resolved: "waaagh", pushLocalUp: true });
});

test("reconcileAccountAccentTheme: both at the default is not a push", () => {
  assert.deepEqual(reconcileAccountAccentTheme("brass", "brass"), { resolved: "brass", pushLocalUp: false });
});
