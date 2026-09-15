import { test } from "node:test";
import assert from "node:assert/strict";
import { MISSION_SCORING } from "./missionScoring.ts";
import { SPECIAL_ACTION_DEFINITIONS } from "./missionActionGlossary.ts";

test("every specialTerms entry cited by a mission has a glossary definition", () => {
  for (const [name, scoring] of Object.entries(MISSION_SCORING)) {
    for (const term of scoring.specialTerms ?? []) {
      assert.ok(
        SPECIAL_ACTION_DEFINITIONS[term],
        `${name} cites "${term}" but SPECIAL_ACTION_DEFINITIONS has no entry for it`
      );
    }
  }
});

test("every glossary definition is actually cited by some mission", () => {
  const citedTerms = new Set(
    Object.values(MISSION_SCORING).flatMap((scoring) => scoring.specialTerms ?? [])
  );
  for (const term of Object.keys(SPECIAL_ACTION_DEFINITIONS)) {
    assert.ok(citedTerms.has(term), `"${term}" is defined but no mission's specialTerms cites it`);
  }
});
