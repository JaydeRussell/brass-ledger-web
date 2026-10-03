import { test } from "node:test";
import assert from "node:assert/strict";
import { isRosterSortKey, sortPlayers } from "./rosterSort.ts";

const players: Player[] = [
  { id: "1", name: "Cara", faction: "Orks", homeClub: "Iron Halo", disposition: "Take and Hold" },
  { id: "2", name: "abe", faction: "Necrons", disposition: "Purge the Foe" },
  { id: "3", name: "Ben", faction: "Unknown", homeClub: "Dice Bums" },
  { id: "4", name: "Ada", faction: "Orks", homeClub: "iron halo" },
];

const names = (list: Player[]) => list.map((p) => p.name);

test("sorts by name, ignoring case", () => {
  assert.deepEqual(names(sortPlayers(players, "name")), ["abe", "Ada", "Ben", "Cara"]);
});

test("sorts by faction, ties by name, Unknown faction last", () => {
  assert.deepEqual(names(sortPlayers(players, "faction")), ["abe", "Ada", "Cara", "Ben"]);
});

test("sorts by club, ignoring case, players without a club last", () => {
  assert.deepEqual(names(sortPlayers(players, "club")), ["Ben", "Ada", "Cara", "abe"]);
});

test("sorts by disposition, players without one last", () => {
  assert.deepEqual(names(sortPlayers(players, "disposition")), ["abe", "Cara", "Ada", "Ben"]);
});

test("does not change the input array", () => {
  const before = names(players);
  sortPlayers(players, "faction");
  assert.deepEqual(names(players), before);
});

test("recognises only the known sort keys", () => {
  assert.ok(isRosterSortKey("club"));
  assert.ok(!isRosterSortKey("itc"));
  assert.ok(!isRosterSortKey(null));
});
