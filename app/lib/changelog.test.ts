import { test } from "node:test";
import assert from "node:assert/strict";
import { CHANGELOG } from "./changelog.ts";
import packageJson from "../../package.json" with { type: "json" };

test("CHANGELOG is non-empty and sorted newest-first by version", () => {
  assert.ok(CHANGELOG.length > 0);
  const versions = CHANGELOG.map((r) => r.version);
  const sorted = [...versions].sort((a, b) => {
    const [aMaj, aMin, aPatch] = a.split(".").map(Number);
    const [bMaj, bMin, bPatch] = b.split(".").map(Number);
    return bMaj - aMaj || bMin - aMin || bPatch - aPatch;
  });
  assert.deepEqual(versions, sorted);
});

test("every release has a version, date, title, and at least one highlight", () => {
  for (const release of CHANGELOG) {
    assert.match(release.version, /^\d+\.\d+\.\d+$/, `version ${release.version}`);
    assert.match(release.date, /^\d{4}-\d{2}-\d{2}$/, `date for v${release.version}`);
    assert.ok(release.title.length > 0, `title for v${release.version}`);
    assert.ok(release.highlights.length > 0, `highlights for v${release.version}`);
  }
});

test("the newest CHANGELOG entry matches package.json's current version", () => {
  assert.equal(CHANGELOG[0].version, packageJson.version);
});
