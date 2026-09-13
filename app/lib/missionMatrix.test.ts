import { test } from "node:test";
import assert from "node:assert/strict";
import { DISPOSITIONS } from "./dispositions.ts";
import { getPrimaryMission, MISSION_MATRIX } from "./missionMatrix.ts";
import { MISSION_NAMES } from "./missions.ts";

test("every one of the 25 disposition combinations resolves to a known mission", () => {
  for (const mine of DISPOSITIONS) {
    for (const opponent of DISPOSITIONS) {
      const mission = getPrimaryMission(mine, opponent);
      assert.ok(mission, `${mine} vs ${opponent} should resolve to a mission`);
      assert.ok(
        (MISSION_NAMES as readonly string[]).includes(mission),
        `${mine} vs ${opponent} -> "${mission}" should be a known mission name`
      );
    }
  }
});

test("a mirror matchup gives both sides the same mission", () => {
  for (const d of DISPOSITIONS) {
    assert.equal(getPrimaryMission(d, d), MISSION_MATRIX[d][d]);
  }
});

test("known asymmetric pairings resolve to the officially documented missions", () => {
  assert.equal(getPrimaryMission("Take and Hold", "Purge the Foe"), "Immovable Object");
  assert.equal(getPrimaryMission("Purge the Foe", "Take and Hold"), "Unstoppable Force");
  assert.equal(getPrimaryMission("Disruption", "Priority Assets"), "Locate and Deny");
  assert.equal(getPrimaryMission("Priority Assets", "Disruption"), "Extract Relic");
});

test("all 25 mission slots are filled with no accidental duplicate coverage gap", () => {
  const used = new Set<string>();
  for (const mine of DISPOSITIONS) {
    for (const opponent of DISPOSITIONS) {
      used.add(`${mine}|${opponent}`);
    }
  }
  assert.equal(used.size, 25);
});
