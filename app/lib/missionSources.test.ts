import { test } from "node:test";
import assert from "node:assert/strict";
import { MISSION_SOURCES, type MissionSource } from "./missionSources.ts";

test("every source has a name and a well-formed asOf date", () => {
  for (const [key, source] of Object.entries(MISSION_SOURCES)) {
    assert.ok(source.name.length > 0, `${key} should have a name`);
    assert.match(source.asOf, /^\d{4}-\d{2}-\d{2}$/, `${key}'s asOf should be YYYY-MM-DD`);
  }
});

test("a source without a GW version explains why via `note`", () => {
  for (const [key, source] of Object.entries(MISSION_SOURCES) as [string, MissionSource][]) {
    if (!source.version) {
      assert.ok(source.note, `${key} has no version, so it should explain why via note`);
    }
  }
});
