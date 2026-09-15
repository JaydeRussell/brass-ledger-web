import { test, mock } from "node:test";
import assert from "node:assert/strict";
import type { EventInfo, MyPairing, TeamBoardMatchup } from "./bcp.ts";
import type { MyStats } from "./myStats.ts";

// One shared mutable fixture set per mocked module, mutated per test
// right before calling fetchHeadToHead — same convention as this app's
// other module-mocked test files (see calendar/page.test.ts's note on
// why a plain mutation is used instead of re-calling mock.module()).
let statsByBcpUserId: Record<string, MyStats> = {};
let eventInfoByEventId: Record<string, Pick<EventInfo, "numberOfRounds" | "teamEvent">> = {};
let rostersByEventId: Record<string, Player[]> = {};
let individualPairingsByEventId: Record<string, MyPairing[]> = {};
let teamPairingsByEventId: Record<string, MyPairing[]> = {};
let teamBoardsByKey: Record<string, TeamBoardMatchup[]> = {};
let individualPairingsCalls: { eventId: string; playerId: string }[] = [];
let eventInfoCalls: string[] = [];
let throwForEventIds = new Set<string>();

mock.module("./myStats.ts", {
  namedExports: {
    fetchPlayerStats: async (bcpUserId: string) => statsByBcpUserId[bcpUserId],
  },
});
mock.module("./bcp.ts", {
  namedExports: {
    fetchBcpEventInfo: async (eventId: string) => {
      eventInfoCalls.push(eventId);
      return eventInfoByEventId[eventId] ?? { numberOfRounds: 0, teamEvent: false };
    },
    fetchBcpPlayers: async (eventId: string) => rostersByEventId[eventId] ?? [],
    fetchMyIndividualPairings: async (eventId: string, playerId: string) => {
      individualPairingsCalls.push({ eventId, playerId });
      if (throwForEventIds.has(eventId)) throw new Error("BCP is down");
      return individualPairingsByEventId[eventId] ?? [];
    },
    fetchMyTeamPairings: async (eventId: string) => teamPairingsByEventId[eventId] ?? [],
    fetchTeamPairingBoards: async (eventId: string, round: number, teamPairingId: string) =>
      teamBoardsByKey[`${eventId}:${round}:${teamPairingId}`] ?? [],
  },
});

const { fetchHeadToHead } = await import("./headToHead.ts");

function stats(history: MyStats["history"]): MyStats {
  return { linked: true, totalEvents: history.length, factions: [], history };
}

function resetFixtures() {
  statsByBcpUserId = {};
  eventInfoByEventId = {};
  rostersByEventId = {};
  individualPairingsByEventId = {};
  teamPairingsByEventId = {};
  teamBoardsByKey = {};
  individualPairingsCalls = [];
  eventInfoCalls = [];
  throwForEventIds = new Set();
}

test("no shared events: nothing checked, no encounters", async () => {
  resetFixtures();
  statsByBcpUserId["me"] = stats([{ eventId: "e1", eventName: "Mine Only", eventDate: "2026-01-01", placing: 1 }]);
  statsByBcpUserId["them"] = stats([{ eventId: "e2", eventName: "Theirs Only", eventDate: "2026-01-01", placing: 1 }]);

  const result = await fetchHeadToHead("me", "them");
  assert.deepEqual(result, { sharedEventsChecked: 0, encounters: [] });
});

test("singles: a shared event where we were actually paired is a real encounter", async () => {
  resetFixtures();
  statsByBcpUserId["me"] = stats([{ eventId: "e1", eventName: "Shared GT", eventDate: "2026-01-01", placing: 1 }]);
  statsByBcpUserId["them"] = stats([{ eventId: "e1", eventName: "Shared GT", eventDate: "2026-01-01", placing: 2 }]);
  eventInfoByEventId["e1"] = { numberOfRounds: 5, teamEvent: false };
  rostersByEventId["e1"] = [
    { id: "p-me", name: "Me", faction: "Orks", bcpUserId: "me" },
    { id: "p-them", name: "Them", faction: "Necrons", bcpUserId: "them" },
  ];
  individualPairingsByEventId["e1"] = [
    { round: 3, published: true, isDone: true, opponentName: "Them", opponentUserId: "them", myScore: 60, opponentScore: 40, outcome: "win" },
  ];

  const result = await fetchHeadToHead("me", "them");
  assert.equal(result.sharedEventsChecked, 1);
  assert.deepEqual(result.encounters, [
    { eventId: "e1", eventName: "Shared GT", round: 3, myScore: 60, opponentScore: 40, outcome: "win" },
  ]);
  // Looked up using MY per-event player id, not the bare bcpUserId.
  assert.deepEqual(individualPairingsCalls, [{ eventId: "e1", playerId: "p-me" }]);
});

test("singles: attending the same event doesn't mean we were paired", async () => {
  resetFixtures();
  statsByBcpUserId["me"] = stats([{ eventId: "e1", eventName: "Shared GT", eventDate: "2026-01-01", placing: 1 }]);
  statsByBcpUserId["them"] = stats([{ eventId: "e1", eventName: "Shared GT", eventDate: "2026-01-01", placing: 2 }]);
  eventInfoByEventId["e1"] = { numberOfRounds: 5, teamEvent: false };
  rostersByEventId["e1"] = [
    { id: "p-me", name: "Me", faction: "Orks", bcpUserId: "me" },
    { id: "p-them", name: "Them", faction: "Necrons", bcpUserId: "them" },
  ];
  individualPairingsByEventId["e1"] = [
    { round: 1, published: true, isDone: true, opponentName: "Someone Else", opponentUserId: "u-other" },
  ];

  const result = await fetchHeadToHead("me", "them");
  assert.equal(result.sharedEventsChecked, 1);
  assert.deepEqual(result.encounters, []);
});

test("team event: teams played, but board assignment never personally matched us", async () => {
  resetFixtures();
  statsByBcpUserId["me"] = stats([{ eventId: "e1", eventName: "Team GT", eventDate: "2026-01-01", placing: 1 }]);
  statsByBcpUserId["them"] = stats([{ eventId: "e1", eventName: "Team GT", eventDate: "2026-01-01", placing: 2 }]);
  eventInfoByEventId["e1"] = { numberOfRounds: 3, teamEvent: true };
  rostersByEventId["e1"] = [
    { id: "p-me", name: "Me", faction: "Orks", bcpUserId: "me", teamPlayerId: "team-a" },
    { id: "p-them", name: "Them", faction: "Necrons", bcpUserId: "them", teamPlayerId: "team-b" },
  ];
  teamPairingsByEventId["e1"] = [
    { round: 2, published: true, isDone: true, opponentName: "Team B", opponentTeamPlayerId: "team-b", teamPairingId: "tp-1" },
  ];
  teamBoardsByKey["e1:2:tp-1"] = [
    { table: 1, player1Name: "Someone", player1UserId: "u-someone", player2Name: "Someone Else", player2UserId: "u-else", published: true, isDone: true },
  ];

  const result = await fetchHeadToHead("me", "them");
  assert.equal(result.sharedEventsChecked, 1);
  assert.deepEqual(result.encounters, []);
});

test("team event: teams played and we were personally matched on a board", async () => {
  resetFixtures();
  statsByBcpUserId["me"] = stats([{ eventId: "e1", eventName: "Team GT", eventDate: "2026-01-01", placing: 1 }]);
  statsByBcpUserId["them"] = stats([{ eventId: "e1", eventName: "Team GT", eventDate: "2026-01-01", placing: 2 }]);
  eventInfoByEventId["e1"] = { numberOfRounds: 3, teamEvent: true };
  rostersByEventId["e1"] = [
    { id: "p-me", name: "Me", faction: "Orks", bcpUserId: "me", teamPlayerId: "team-a" },
    { id: "p-them", name: "Them", faction: "Necrons", bcpUserId: "them", teamPlayerId: "team-b" },
  ];
  teamPairingsByEventId["e1"] = [
    { round: 2, published: true, isDone: true, opponentName: "Team B", opponentTeamPlayerId: "team-b", teamPairingId: "tp-1" },
  ];
  teamBoardsByKey["e1:2:tp-1"] = [
    { table: 3, player1Name: "Them", player1UserId: "them", player2Name: "Me", player2UserId: "me", published: true, isDone: true, player1Score: 30, player2Score: 70 },
  ];

  const result = await fetchHeadToHead("me", "them");
  assert.deepEqual(result.encounters, [
    { eventId: "e1", eventName: "Team GT", round: 2, myScore: 70, opponentScore: 30, outcome: "win" },
  ]);
});

test("caps at the 10 most recent shared events, skipping older ones", async () => {
  resetFixtures();
  const myHistory: MyStats["history"] = [];
  const theirHistory: MyStats["history"] = [];
  for (let i = 0; i < 15; i++) {
    const eventId = `e${i}`;
    const eventDate = `2026-01-${String(i + 1).padStart(2, "0")}`;
    myHistory.push({ eventId, eventName: eventId, eventDate, placing: 1 });
    theirHistory.push({ eventId, eventName: eventId, eventDate, placing: 2 });
    eventInfoByEventId[eventId] = { numberOfRounds: 1, teamEvent: false };
    rostersByEventId[eventId] = [];
  }
  statsByBcpUserId["me"] = stats(myHistory);
  statsByBcpUserId["them"] = stats(theirHistory);

  const result = await fetchHeadToHead("me", "them");
  assert.equal(result.sharedEventsChecked, 10);
  // The most recent 10 by date (e5..e14), not the first 10 encountered.
  const checkedIds = new Set(eventInfoCalls);
  assert.equal(checkedIds.size, 10);
  for (let i = 5; i < 15; i++) assert.ok(checkedIds.has(`e${i}`), `expected e${i} to be checked`);
  for (let i = 0; i < 5; i++) assert.ok(!checkedIds.has(`e${i}`), `expected e${i} NOT to be checked`);
});

test("one event failing to resolve doesn't fail the whole check", async () => {
  resetFixtures();
  statsByBcpUserId["me"] = stats([
    { eventId: "bad", eventName: "Bad Event", eventDate: "2026-01-01", placing: 1 },
    { eventId: "good", eventName: "Good Event", eventDate: "2026-01-02", placing: 1 },
  ]);
  statsByBcpUserId["them"] = stats([
    { eventId: "bad", eventName: "Bad Event", eventDate: "2026-01-01", placing: 2 },
    { eventId: "good", eventName: "Good Event", eventDate: "2026-01-02", placing: 2 },
  ]);
  eventInfoByEventId["good"] = { numberOfRounds: 1, teamEvent: false };
  rostersByEventId["good"] = [
    { id: "p-me", name: "Me", faction: "Orks", bcpUserId: "me" },
    { id: "p-them", name: "Them", faction: "Necrons", bcpUserId: "them" },
  ];
  individualPairingsByEventId["good"] = [
    { round: 1, published: true, isDone: true, opponentName: "Them", opponentUserId: "them", outcome: "draw" },
  ];
  eventInfoByEventId["bad"] = { numberOfRounds: 1, teamEvent: false };
  rostersByEventId["bad"] = [
    { id: "p-me", name: "Me", faction: "Orks", bcpUserId: "me" },
    { id: "p-them", name: "Them", faction: "Necrons", bcpUserId: "them" },
  ];
  throwForEventIds.add("bad");

  const result = await fetchHeadToHead("me", "them");
  assert.equal(result.sharedEventsChecked, 2);
  assert.deepEqual(result.encounters, [
    { eventId: "good", eventName: "Good Event", round: 1, myScore: undefined, opponentScore: undefined, outcome: "draw" },
  ]);
});
