import { test } from "node:test";
import assert from "node:assert/strict";
import { DISPOSITIONS } from "./dispositions.ts";
import { getMissionMatchup, deploymentMapImages, MISSION_MATCHUPS } from "./missionMatchups.ts";

test("all 15 unordered disposition pairings have matchup content", () => {
  const seen = new Set<string>();
  for (const a of DISPOSITIONS) {
    for (const b of DISPOSITIONS) {
      const key = [a, b].sort().join("|");
      seen.add(key);
    }
  }
  assert.equal(seen.size, 15);
  for (const a of DISPOSITIONS) {
    for (const b of DISPOSITIONS) {
      assert.doesNotThrow(() => getMissionMatchup(a, b), `${a} vs ${b} should have matchup content`);
    }
  }
});

test("lookup is order-independent", () => {
  const ab = getMissionMatchup("Reconnaissance", "Priority Assets");
  const ba = getMissionMatchup("Priority Assets", "Reconnaissance");
  assert.equal(ab, ba);
});

test("every matchup has a non-empty summary and at least one tactic", () => {
  for (const matchup of MISSION_MATCHUPS) {
    assert.ok(matchup.summary.length > 0);
    assert.ok(matchup.tactics.length > 0);
  }
});

test("deploymentMapImages resolves the same 3 paths regardless of argument order", () => {
  const forward = deploymentMapImages("Disruption", "Priority Assets");
  const backward = deploymentMapImages("Priority Assets", "Disruption");
  assert.deepEqual(forward, backward);
  assert.equal(forward.length, 3);
  assert.deepEqual(
    forward.map((l) => l.layout),
    ["A", "B", "C"]
  );
  for (const layout of forward) {
    assert.match(layout.src, /^\/deployment-maps\/disruption-vs-priority-assets\/[abc]\.webp$/);
  }
});
