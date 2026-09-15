// Finds past head-to-head encounters between the signed-in account and
// another player — "have we played before, and how did it go" — built
// entirely from BCP data this app already fetches elsewhere; no new
// backend endpoint needed. See components/pairings/headToHead.tsx for
// the UI this backs (a manual "check history" button, never automatic —
// see this file's own doc comments below for why that matters).
//
// The approach: fetchPlayerStats already returns any player's placing
// history (event ids they've placed in) — not just the signed-in
// account's own, see myStats.ts's fetchPlayerStats doc comment. Fetching
// it for both sides and intersecting the event-id lists (free, no BCP
// traffic) narrows the search to only events both people actually
// attended, before spending any BCP requests checking whether they were
// literally paired in one of them (Swiss pairings don't guarantee that
// just because two people were at the same event).
//
// This is real BCP traffic per shared event (event info + roster +
// up to that event's round count in pairing fetches, one more for a
// team-event board lookup) — deliberately never automatic (see
// headToHead.tsx: a manual "check history" button, not fired on page
// load) and capped at MAX_SHARED_EVENTS_CHECKED most-recent shared
// events, so a very active pair of regulars can't turn one click into
// dozens of round-by-round fetches. It's also cheaper than it looks:
// internal/bcp's round-pairings fetch is durably cached forever once an
// event has concluded (see brass-ledger-api's placings.go/pairings.go),
// so the very first check of a given (event, round) is the only one
// that ever costs a real BCP request — every check after that, by
// anyone, is free.

import {
  fetchBcpEventInfo,
  fetchBcpPlayers,
  fetchMyIndividualPairings,
  fetchMyTeamPairings,
  fetchTeamPairingBoards,
} from "./bcp";
import { fetchPlayerStats } from "./myStats";

const MAX_SHARED_EVENTS_CHECKED = 10;

export type HeadToHeadEncounter = {
  eventId: string;
  eventName: string;
  round: number;
  myScore?: number;
  opponentScore?: number;
  outcome?: "win" | "loss" | "draw";
};

export type HeadToHeadResult = {
  // How many shared events were actually checked (after the
  // MAX_SHARED_EVENTS_CHECKED cap) — lets the UI say "across your last 6
  // shared events" rather than implying every event you've both ever
  // attended was searched.
  sharedEventsChecked: number;
  // Newest first.
  encounters: HeadToHeadEncounter[];
};

function outcomeFrom(myScore?: number, opponentScore?: number): "win" | "loss" | "draw" | undefined {
  if (myScore === undefined || opponentScore === undefined) return undefined;
  if (myScore > opponentScore) return "win";
  if (myScore < opponentScore) return "loss";
  return "draw";
}

/** Checks one shared event for a head-to-head encounter, singles or
 * team — returns null if the two players were never actually paired
 * there (or either side can't be resolved on that event's roster). */
async function checkSharedEvent(
  eventId: string,
  eventName: string,
  myBcpUserId: string,
  opponentBcpUserId: string
): Promise<HeadToHeadEncounter | null> {
  const [info, roster] = await Promise.all([fetchBcpEventInfo(eventId), fetchBcpPlayers(eventId)]);
  const me = roster.find((p) => p.bcpUserId === myBcpUserId);
  const opponent = roster.find((p) => p.bcpUserId === opponentBcpUserId);
  if (!me || !opponent) return null; // couldn't resolve one/both sides on this event's roster

  if (!info.teamEvent) {
    const pairings = await fetchMyIndividualPairings(eventId, String(me.id), info.numberOfRounds);
    const match = pairings.find((p) => p.opponentUserId === opponentBcpUserId);
    if (!match) return null;
    return {
      eventId,
      eventName,
      round: match.round,
      myScore: match.myScore,
      opponentScore: match.opponentScore,
      outcome: match.outcome,
    };
  }

  if (!me.teamPlayerId || !opponent.teamPlayerId) return null;
  const teamPairings = await fetchMyTeamPairings(eventId, me.teamPlayerId, info.numberOfRounds);
  const teamMatch = teamPairings.find((p) => p.opponentTeamPlayerId === opponent.teamPlayerId);
  if (!teamMatch?.teamPairingId) return null; // our teams never played each other

  // Our teams played, but Swiss board assignment within a team pairing
  // doesn't guarantee we were personally matched — check the actual
  // individual boards for that round's team pairing.
  const boards = await fetchTeamPairingBoards(eventId, teamMatch.round, teamMatch.teamPairingId);
  const board = boards.find(
    (b) =>
      (b.player1UserId === myBcpUserId && b.player2UserId === opponentBcpUserId) ||
      (b.player2UserId === myBcpUserId && b.player1UserId === opponentBcpUserId)
  );
  if (!board) return null;

  const iAmPlayer1 = board.player1UserId === myBcpUserId;
  const myScore = iAmPlayer1 ? board.player1Score : board.player2Score;
  const opponentScore = iAmPlayer1 ? board.player2Score : board.player1Score;
  return { eventId, eventName, round: teamMatch.round, myScore, opponentScore, outcome: outcomeFrom(myScore, opponentScore) };
}

/**
 * Finds every past head-to-head encounter between the signed-in account
 * and another player, across their most recent shared events. See this
 * file's own top-of-file doc comment for the approach and why it's
 * bounded/cheap enough to be worth building.
 */
export async function fetchHeadToHead(
  myBcpUserId: string,
  opponentBcpUserId: string
): Promise<HeadToHeadResult> {
  const [myStats, opponentStats] = await Promise.all([
    fetchPlayerStats(myBcpUserId),
    fetchPlayerStats(opponentBcpUserId),
  ]);

  const myEventIds = new Set(myStats.history.map((h) => h.eventId));
  const sharedEvents = opponentStats.history
    .filter((h) => myEventIds.has(h.eventId))
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
    .slice(0, MAX_SHARED_EVENTS_CHECKED);

  const encounters: HeadToHeadEncounter[] = [];
  // Sequential, not Promise.all — this already fans out into several BCP
  // requests per event; running every shared event at once would turn a
  // deliberately gentle, capped check into a burst. A few extra seconds
  // for a manually-triggered, once-in-a-while lookup is the right trade.
  for (const shared of sharedEvents) {
    try {
      const encounter = await checkSharedEvent(shared.eventId, shared.eventName, myBcpUserId, opponentBcpUserId);
      if (encounter) encounters.push(encounter);
    } catch {
      // One event's data failing to resolve shouldn't fail the whole
      // check — skip just that event, same "fail quietly" posture
      // CLAUDE.md's third-party-API rules ask for elsewhere.
    }
  }

  const dateByEventId = new Map(sharedEvents.map((h) => [h.eventId, h.eventDate]));
  encounters.sort(
    (a, b) =>
      new Date(dateByEventId.get(b.eventId) ?? 0).getTime() - new Date(dateByEventId.get(a.eventId) ?? 0).getTime()
  );

  return { sharedEventsChecked: sharedEvents.length, encounters };
}
