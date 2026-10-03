import { test } from "node:test";
import assert from "node:assert/strict";
import { safeReturnPath } from "./safeReturnPath.ts";

test("keeps ordinary same-origin paths", () => {
  assert.equal(safeReturnPath("/my-events"), "/my-events");
  assert.equal(safeReturnPath("/event?tab=roster&q=a%20b"), "/event?tab=roster&q=a%20b");
});

test("drops anything that would leave the site", () => {
  for (const p of [null, "", "my-events", "//evil.com", "https://evil.com", "/x?u=https://evil.com", "/\\evil.com", "/\tevil.com", "/\t/evil.com", "/\n/evil.com", "\\\\evil.com"]) {
    assert.equal(safeReturnPath(p), undefined, JSON.stringify(p));
  }
});
