import { test } from "node:test";
import assert from "node:assert/strict";
import { DISPOSITIONS, isDisposition, dispositionSlug } from "./dispositions.ts";

test("DISPOSITIONS has exactly the five known Force Dispositions", () => {
  assert.deepEqual(
    [...DISPOSITIONS].sort(),
    ["Disruption", "Priority Assets", "Purge the Foe", "Reconnaissance", "Take and Hold"].sort()
  );
});

test("isDisposition accepts every known value and rejects everything else", () => {
  for (const d of DISPOSITIONS) {
    assert.ok(isDisposition(d), `${d} should be recognized`);
  }
  assert.ok(!isDisposition(undefined));
  assert.ok(!isDisposition(""));
  assert.ok(!isDisposition("Something Else"));
});

test("dispositionSlug lowercases and hyphenates", () => {
  assert.equal(dispositionSlug("Take and Hold"), "take-and-hold");
  assert.equal(dispositionSlug("Purge the Foe"), "purge-the-foe");
  assert.equal(dispositionSlug("Disruption"), "disruption");
});
