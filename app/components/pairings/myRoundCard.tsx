"use client";
import React from "react";
import type { MyPairing, TeamBoardMatchup } from "../../lib/bcp";
import { classifyScore, SCORE_OUTCOME_CLASSES } from "../../lib/scoreColor";
import PlayerStatsLink from "../shared/playerStatsLink";
import PlayerStatsPanel from "../myEvents/playerStatsPanel";
import TeamRosterFallback from "./teamRosterFallback";
import Spinner from "../shared/spinner";
import Card from "../ui/card";
import ErrorAlert from "../ui/errorAlert";
import { useDelayedFlag } from "../../lib/useDelayedFlag";

type MyRoundCardProps = {
  loading: boolean;
  error: string | null;
  // The round this card is showing — eventInfo.ended ? numberOfRounds :
  // currentRound, computed once by the caller (app/page.tsx already
  // computes this same value for its own board-round state).
  round: number;
  // My pairing for `round`, from fetchMyIndividualPairings (singles) or
  // fetchMyTeamPairings (team events) — team-level only for a team
  // event, since that function has no notion of an individual board.
  pairing: MyPairing | null;
  // My own individual board within `pairing`'s team-vs-team matchup, once
  // BCP has published individual boards for it — only ever set for a team
  // event. null while unresolved/not yet published; then `pairing`'s
  // team-level opponent (a team, not a person) is shown instead.
  board: TeamBoardMatchup | null;
  // My own BCP global account id — used to work out which side of `board`
  // is mine (its player1/player2 order is tied to team1/team2, not to
  // "mine" — same reasoning as myPairings.tsx's orientMatchup).
  myBcpUserId?: string;
  // This event's full roster — used only to look up my opponent's
  // faction/subfaction for this specific event, the same already-fetched
  // data every other tab already has in hand.
  players: Player[];
  // My own BCP teamPlayer id, set only for a team event — paired with
  // pairing.opponentTeamPlayerId and rosterByTeamId below to show both
  // sides' rosters (via TeamRosterFallback, same component RoundBoard and
  // MyPairings already use) when BCP has published the team-vs-team
  // pairing but not yet the individual boards within it, instead of
  // showing nothing but the opposing team's name.
  myTeamPlayerId?: string;
  // teamPlayerId -> that team's roster, already built once by the caller
  // for Roster/Pairings (see app/page.tsx's rosterByTeamId).
  rosterByTeamId?: Map<string, Player[]>;
  // Already-fetched by the caller for other tabs' ITC badges — passed
  // through to TeamRosterFallback's roster rows below rather than
  // fetching a second copy just for this card.
  itcLeagueId?: string | null;
};

type ResolvedOpponent = {
  table?: number;
  opponentName: string;
  opponentBcpUserId?: string;
  published: boolean;
  isDone: boolean;
  myScore?: number;
  opponentScore?: number;
};

/** Picks my board's own two players apart into "me" vs "opponent". */
function resolveFromBoard(board: TeamBoardMatchup, myBcpUserId?: string): ResolvedOpponent {
  const iAmPlayer1 = Boolean(myBcpUserId) && board.player1UserId === myBcpUserId;
  return {
    table: board.table,
    opponentName: iAmPlayer1 ? board.player2Name : board.player1Name,
    opponentBcpUserId: iAmPlayer1 ? board.player2UserId : board.player1UserId,
    published: board.published,
    isDone: board.isDone,
    myScore: iAmPlayer1 ? board.player1Score : board.player2Score,
    opponentScore: iAmPlayer1 ? board.player2Score : board.player1Score,
  };
}

function resolveFromPairing(pairing: MyPairing): ResolvedOpponent {
  return {
    table: pairing.table,
    opponentName: pairing.opponentName,
    opponentBcpUserId: pairing.opponentUserId,
    published: pairing.published,
    isDone: pairing.isDone,
    myScore: pairing.myScore,
    opponentScore: pairing.opponentScore,
  };
}

/**
 * "One screen: current round, my table, my opponent" (roadmap #2) — the
 * signed-in account's own current-round pairing, found automatically (no
 * manual follow step) via their linked BCP profile. Read-only display of
 * an already-published BCP pairing, same scope rule as the rest of this
 * app.
 *
 * Folds in roadmap #1 ("opponent quick-look") directly: once the
 * opponent's BCP account id is known, their faction for this event (from
 * the already-fetched roster) and their full stats/ITC/history
 * (PlayerStatsPanel, already built for the player-stats pages) render
 * right here — no extra plumbing, since PlayerStatsPanel fetches its own
 * data given just a bcpUserId.
 */
export default function MyRoundCard({
  loading,
  error,
  round,
  pairing,
  board,
  myBcpUserId,
  players,
  myTeamPlayerId,
  rosterByTeamId,
  itcLeagueId,
}: MyRoundCardProps) {
  const slowLoad = useDelayedFlag(loading);

  if (error) {
    return (
      <Card className="p-4 shadow-sm">
        <p className="font-semibold text-text-primary">Your round</p>
        <ErrorAlert size="sm" className="mt-2">
          Couldn&apos;t load your round: {error}
        </ErrorAlert>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-4 shadow-sm">
        <p className="font-semibold text-text-primary">Your round</p>
        <div className="mt-2 flex items-center gap-2 text-sm text-text-secondary">
          <Spinner size="sm" />
          <span>Checking your round…</span>
        </div>
        {slowLoad && (
          <p className="mt-1 text-xs text-text-tertiary">Taking longer than usual.</p>
        )}
      </Card>
    );
  }

  if (!pairing) {
    return (
      <Card className="p-4 shadow-sm">
        <p className="font-semibold text-text-primary">Your round</p>
        <p className="mt-1 text-sm text-text-secondary">
          No pairing published for round {round} yet.
        </p>
      </Card>
    );
  }

  const resolved = board ? resolveFromBoard(board, myBcpUserId) : resolveFromPairing(pairing);
  const opponentPlayer = resolved.opponentBcpUserId
    ? players.find((p) => p.bcpUserId === resolved.opponentBcpUserId)
    : undefined;
  const scoreOutcome =
    resolved.myScore !== undefined && resolved.opponentScore !== undefined
      ? classifyScore(resolved.myScore, resolved.opponentScore)
      : undefined;
  // A team-vs-team pairing BCP has published, but not yet the individual
  // boards within it — same situation RoundBoard/MyPairings already
  // handle with TeamRosterFallback instead of showing nothing.
  const unresolvedTeamPairing = !board && pairing.opponentTeamPlayerId;
  const myRoster = myTeamPlayerId ? rosterByTeamId?.get(myTeamPlayerId) : undefined;
  const opponentRoster = pairing.opponentTeamPlayerId
    ? rosterByTeamId?.get(pairing.opponentTeamPlayerId)
    : undefined;

  return (
    <Card className="p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-text-primary">Your round</p>
        <span className="text-xs text-text-tertiary">Round {round}</span>
      </div>

      <div className="mt-2 flex items-center gap-3 text-sm">
        <span className="shrink-0 text-text-tertiary">
          {resolved.table ? `Table ${resolved.table}` : "Table TBD"}
        </span>
        <span className="min-w-0 flex-1 truncate text-text-primary">
          vs{" "}
          <PlayerStatsLink name={resolved.opponentName} bcpUserId={resolved.opponentBcpUserId} />
          {opponentPlayer?.faction && (
            <span className="ml-1.5 text-xs text-text-tertiary">({opponentPlayer.faction})</span>
          )}
        </span>
        {!resolved.published ? (
          <span className="shrink-0 text-xs text-text-tertiary">unpublished</span>
        ) : resolved.isDone ? (
          scoreOutcome ? (
            <span className={`shrink-0 text-xs font-medium ${SCORE_OUTCOME_CLASSES[scoreOutcome]}`}>
              {resolved.myScore}–{resolved.opponentScore}
            </span>
          ) : (
            <span className="shrink-0 text-xs text-success-600 dark:text-success-400">done</span>
          )
        ) : (
          <span className="shrink-0 text-xs text-warning-600 dark:text-warning-400">in progress</span>
        )}
      </div>

      {resolved.opponentBcpUserId && (
        <div className="mt-3 border-t border-surface-border pt-3">
          <PlayerStatsPanel
            mode="player"
            bcpUserId={resolved.opponentBcpUserId}
            playerName={resolved.opponentName}
          />
        </div>
      )}

      {unresolvedTeamPairing && (myRoster?.length || opponentRoster?.length) ? (
        <div className="mt-3 border-t border-surface-border pt-3">
          <TeamRosterFallback
            side1Name="Your team"
            side1Players={myRoster ?? []}
            side2Name={resolved.opponentName}
            side2Players={opponentRoster ?? []}
            itcLeagueId={itcLeagueId}
          />
        </div>
      ) : null}
    </Card>
  );
}
