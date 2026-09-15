import { test } from "node:test";
import assert from "node:assert/strict";

const { superFactionOf } = await import("./superFaction.ts");

test("superFactionOf: recognizes every canonical faction name", () => {
  const cases: [string, string][] = [
    ["Adepta Sororitas", "Imperium"],
    ["Adeptus Custodes", "Imperium"],
    ["Adeptus Mechanicus", "Imperium"],
    ["Adeptus Titanicus", "Imperium"],
    ["Astra Militarum", "Imperium"],
    ["Black Templars", "Imperium"],
    ["Blood Angels", "Imperium"],
    ["Dark Angels", "Imperium"],
    ["Deathwatch", "Imperium"],
    ["Grey Knights", "Imperium"],
    ["Imperial Agents", "Imperium"],
    ["Imperial Knights", "Imperium"],
    ["Space Marines", "Imperium"],
    ["Space Wolves", "Imperium"],
    ["Chaos Daemons", "Chaos"],
    ["Chaos Knights", "Chaos"],
    ["Chaos Space Marines", "Chaos"],
    ["Death Guard", "Chaos"],
    ["Emperor's Children", "Chaos"],
    ["Thousand Sons", "Chaos"],
    ["World Eaters", "Chaos"],
    ["Aeldari", "Xenos"],
    ["Drukhari", "Xenos"],
    ["Genestealer Cults", "Xenos"],
    ["Leagues of Votann", "Xenos"],
    ["Necrons", "Xenos"],
    ["Orks", "Xenos"],
    ["T'au Empire", "Xenos"],
    ["Tyranids", "Xenos"],
  ];
  for (const [faction, expected] of cases) {
    assert.equal(superFactionOf(faction), expected, `expected ${faction} to be ${expected}`);
  }
});

test("superFactionOf: tolerates real-world BCP spelling drift", () => {
  // Confirmed against a real event on 2026-09-14 — see this module's own
  // doc comment.
  assert.equal(superFactionOf("Space Marines (Astartes)"), "Imperium");
  assert.equal(superFactionOf("Genestealer Cult"), "Xenos");
  // Fixture-tested elsewhere in this app (bcp test fixtures use bare "Tau").
  assert.equal(superFactionOf("Tau"), "Xenos");
  assert.equal(superFactionOf("Tau Empire"), "Xenos");
});

test("superFactionOf: is case-insensitive", () => {
  assert.equal(superFactionOf("necrons"), "Xenos");
  assert.equal(superFactionOf("NECRONS"), "Xenos");
});

test("superFactionOf: leaves an unrecognized faction unclassified", () => {
  assert.equal(superFactionOf("Not A Real Faction"), undefined);
  assert.equal(superFactionOf(undefined), undefined);
  assert.equal(superFactionOf(""), undefined);
});
