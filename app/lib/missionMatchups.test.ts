import { test } from "node:test";
import assert from "node:assert/strict";
import { deploymentMapImages } from "./missionMatchups.ts";

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
