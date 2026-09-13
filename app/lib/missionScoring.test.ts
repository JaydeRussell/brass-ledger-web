import { test } from "node:test";
import assert from "node:assert/strict";
import { MISSION_NAMES } from "./missions.ts";
import { MISSION_SCORING } from "./missionScoring.ts";

test("every mission name has a scoring entry with at least one band", () => {
  for (const name of MISSION_NAMES) {
    const scoring = MISSION_SCORING[name];
    assert.ok(scoring, `${name} should have a MISSION_SCORING entry`);
    assert.ok(scoring.bands.length > 0, `${name} should have at least one scoring band`);
  }
});

test("every band has at least one condition, and every condition has a positive VP value", () => {
  for (const [name, scoring] of Object.entries(MISSION_SCORING)) {
    for (const band of scoring.bands) {
      assert.ok(band.conditions.length > 0, `${name}'s "${band.when}" band should have conditions`);
      for (const condition of band.conditions) {
        assert.ok(condition.vp > 0, `${name}'s "${condition.text}" should have a positive VP value`);
      }
    }
  }
});
