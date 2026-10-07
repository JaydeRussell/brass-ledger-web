import { test } from "node:test";
import assert from "node:assert/strict";

import { canJoin, mineEmptyMessage, possessive, resolvePerspective } from "./spectating.ts";

const olive: Player = { id: "p1", name: "Olive Owner", faction: "Necrons", bcpUserId: "u-olive" };
const oscar: Player = { id: "p2", name: "Oscar Other", faction: "Orks", bcpUserId: "u-oscar" };
const roster = [olive, oscar];

test("resolvePerspective: a viewer on the roster sees their own side", () => {
  const p = resolvePerspective(roster, "u-olive", null, false);
  assert.equal(p.subject, olive);
  assert.equal(p.spectating, false);
});

test("resolvePerspective: a viewer not playing sees the followed player's side", () => {
  const p = resolvePerspective(roster, undefined, "p2", false);
  assert.equal(p.subject, oscar);
  assert.equal(p.spectating, true);
});

test("resolvePerspective: a player who also follows someone keeps their own view until they switch", () => {
  const own = resolvePerspective(roster, "u-olive", "p2", false);
  assert.equal(own.subject, olive);
  assert.equal(own.followedPlayer, oscar);
  assert.equal(own.spectating, false);

  const switched = resolvePerspective(roster, "u-olive", "p2", true);
  assert.equal(switched.subject, oscar);
  assert.equal(switched.spectating, true);
});

test("resolvePerspective: opening your own follow link is just your own view", () => {
  const p = resolvePerspective(roster, "u-olive", "p1", true);
  assert.equal(p.subject, olive);
  assert.equal(p.followedPlayer, undefined);
  assert.equal(p.spectating, false);
});

test("resolvePerspective: a followed player who left the roster shows no one", () => {
  const p = resolvePerspective(roster, undefined, "p9", false);
  assert.equal(p.subject, undefined);
  assert.equal(p.spectating, false);
});

test("canJoin: only before the event starts, and only for someone not on the roster", () => {
  const upcoming = { started: false, ended: false };
  assert.equal(canJoin(upcoming, undefined), true, "signed out, or signed in and not registered");
  assert.equal(canJoin(upcoming, olive), false, "already on the roster");
  assert.equal(canJoin({ started: true, ended: false }, undefined), false, "underway");
  assert.equal(canJoin({ started: true, ended: true }, undefined), false, "finished");
  assert.equal(canJoin(null, undefined), false, "event not loaded yet");
});

test("mineEmptyMessage: names the followed player, or says they left", () => {
  const base = { linked: false, onRoster: false, followedMissing: false };
  assert.equal(
    mineEmptyMessage({ ...base, showingFollowed: true, followedName: "Olive Owner" }),
    "Olive's round will show here once the event starts."
  );
  assert.equal(
    mineEmptyMessage({ ...base, showingFollowed: true, followedMissing: true }),
    "The player you're following is no longer on this event's roster."
  );
  assert.match(mineEmptyMessage({ ...base, showingFollowed: false }), /Link your BCP profile/);
  assert.match(mineEmptyMessage({ ...base, showingFollowed: false, linked: true }), /isn't on this event's roster/);
});

test("possessive: uses the first name", () => {
  assert.equal(possessive("Olive Owner"), "Olive's");
  assert.equal(possessive("James Smith"), "James'");
  assert.equal(possessive("  Cher "), "Cher's");
});
