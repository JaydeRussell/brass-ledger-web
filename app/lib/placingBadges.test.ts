import { test } from "node:test";
import assert from "node:assert/strict";
import type { PlacingEntry } from "./bcp.ts";

const { computePlacingBadges } = await import("./placingBadges.ts");

function entry(overrides: Partial<PlacingEntry> & { id: string }): PlacingEntry {
  return { name: "Someone", metrics: [], ...overrides };
}

test("computePlacingBadges: awards best-in-faction and best-in-super-faction to the top-placed entry", () => {
  const entries = [
    entry({ id: "p1", placing: 1, faction: "Necrons" }), // best Necrons, best Xenos
    entry({ id: "p2", placing: 2, faction: "Orks" }),
    entry({ id: "p3", placing: 3, faction: "Necrons" }),
    entry({ id: "p4", placing: 4, faction: "Blood Angels" }), // best Imperium
  ];
  const badges = computePlacingBadges(entries);

  assert.deepEqual(badges.get("p1"), { bestFaction: "Necrons", bestSuperFaction: "Xenos" });
  // p2 is the only Orks entry, so it's still "best Orks" — just not the
  // best Xenos entry overall (Necrons' p1 beats it for that).
  assert.deepEqual(badges.get("p2"), { bestFaction: "Orks" });
  assert.equal(badges.get("p3"), undefined); // 2nd-place Necrons: beaten for both
  assert.deepEqual(badges.get("p4"), { bestFaction: "Blood Angels", bestSuperFaction: "Imperium" });
});

test("computePlacingBadges: a tie for best-in-faction awards every tied entry", () => {
  const entries = [
    entry({ id: "p1", placing: 1, faction: "Necrons" }),
    entry({ id: "p2", placing: 1, faction: "Necrons" }),
  ];
  const badges = computePlacingBadges(entries);
  assert.equal(badges.get("p1")?.bestFaction, "Necrons");
  assert.equal(badges.get("p2")?.bestFaction, "Necrons");
});

test("computePlacingBadges: an entry with no faction (team-event row) is never awarded anything", () => {
  const entries = [entry({ id: "t1", placing: 1 })];
  const badges = computePlacingBadges(entries);
  assert.equal(badges.size, 0);
});

test("computePlacingBadges: an entry with no placing yet is never awarded anything", () => {
  const entries = [entry({ id: "p1", faction: "Necrons" })];
  const badges = computePlacingBadges(entries);
  assert.equal(badges.size, 0);
});

test("computePlacingBadges: an unrecognized faction can still win best-in-faction but not best-in-super-faction", () => {
  const entries = [entry({ id: "p1", placing: 1, faction: "Not A Real Faction" })];
  const badges = computePlacingBadges(entries);
  assert.deepEqual(badges.get("p1"), { bestFaction: "Not A Real Faction" });
});
