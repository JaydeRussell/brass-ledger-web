import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveRosterPlayer } from "./players.ts";

const players: Player[] = [
  { id: "p1", name: "Jayde Russell", faction: "World Eaters", bcpUserId: "u1" },
  { id: "p2", name: "Andy Shellenbarger", faction: "Necrons", bcpUserId: "u2" },
];

test("finds the matching roster entry by bcpUserId", () => {
  const player = resolveRosterPlayer("u2", "Andy Shellenbarger", players);
  assert.equal(player.faction, "Necrons");
  assert.equal(player.bcpUserId, "u2");
});

test("falls back to a bare stand-in when there's no match", () => {
  const player = resolveRosterPlayer("u-unknown", "Some Name", players);
  assert.deepEqual(player, { id: "u-unknown", name: "Some Name", faction: "", bcpUserId: "u-unknown" });
});

test("falls back to a bare stand-in when bcpUserId is undefined", () => {
  const player = resolveRosterPlayer(undefined, "Some Name", players);
  assert.deepEqual(player, { id: "Some Name", name: "Some Name", faction: "", bcpUserId: undefined });
});
