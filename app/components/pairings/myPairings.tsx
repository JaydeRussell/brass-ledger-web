"use client";
import React from "react";
import {
  fetchItcRanking,
  fetchTeamPairingBoards,
  type ItcRanking,
  type MyPairing,
  type TeamBoardMatchup,
} from "../../lib/bcp";
import { classifyScore, SCORE_OUTCOME_CLASSES } from "../../lib/scoreColor";
import ItcBadge from "../shared/itcBadge";
import PlayerStatsLink from "../shared/playerStatsLink";
import Spinner from "../shared/spinner";
import TeamRosterFallback from "./teamRosterFallback";
import Button from "../ui/button";
import Card from "../ui/card";
import ErrorAlert from "../ui/errorAlert";
import { useDelayedFlag } from "../../lib/useDelayedFlag";

type BoardsState = {
  loading: boolean;
  error: string | null;
  matchups: TeamBoardMatchup[];
};

/**
 * Swaps a board matchup's two sides. Used to reorient BCP's raw
 * player1/player2 order (tied to team1/team2, not to "mine") so the
 * followed team's player always displays first — see toggleExpand below.
 * Pure display reordering of an already-published result, nothing computed.
 */
function orientMatchup(m: TeamBoardMatchup): TeamBoardMatchup {
  return {
    table: m.table,
    player1Name: m.player2Name,
    player1UserId: m.player2UserId,
    player2Name: m.player1Name,
    player2UserId: m.player1UserId,
    published: m.published,
    isDone: m.isDone,
    player1Score: m.player2Score,
    player2Score: m.player1Score,
  };
}

type MyPairingsProps = {
  eventId: string;
  whoLabel: string; // display name of whoever this "my pairings" card is following
  loading: boolean;
  error: string | null;
  pairings: MyPairing[];
  upToRound: number;
  onClear: () => void;
  // ITC ranking (already-published score + rank) for whoever this card is
  // following — only set for individual players, since a team doesn't have
  // one personal ranking. `itcByUserId` is also used to look up each
  // round's opponent's ranking, when the opponent is an individual.
  ownItc?: ItcRanking | null;
  ownBcpUserId?: string;
  itcByUserId?: Record<string, ItcRanking | null>;
  itcLeagueId?: string | null;
  // This followed team's own BCP teamPlayer id, and every tournament
  // team's roster keyed by that same id — used together to fall back to
  // "who's on each team" when a round's individual boards aren't
  // published yet. Undefined/omitted for a followed individual player,
  // who has no team-vs-team pairing to expand this way in the first place.
  myTeamPlayerId?: string;
  rosterByTeamId?: Map<string, Player[]>;
};

/**
 * Read-only display of already-published round pairings for one team or
 * player, pulled straight from BCP. This is a lookup of a decision the
 * tournament (organizers/captains) already made and published — it does
 * not compute, rank, or suggest anything itself.
 *
 * For a followed team, clicking a published round expands it in place to
 * show that round's individual boards (each player on the team against
 * their counterpart on the opposing team) and each player's already-
 * published ITC score/rank — the same expand-to-boards behavior as the
 * full round board, just scoped to this one followed team's rounds.
 * Boards (and each player's ITC ranking) are only fetched once a round is
 * actually expanded.
 */
export default function MyPairings({
  eventId,
  whoLabel,
  loading,
  error,
  pairings,
  upToRound,
  onClear,
  ownItc,
  ownBcpUserId,
  itcByUserId,
  itcLeagueId,
  myTeamPlayerId,
  rosterByTeamId,
}: MyPairingsProps) {
  const byRound = new Map(pairings.map((p) => [p.round, p]));

  const [expandedRounds, setExpandedRounds] = React.useState<Set<number>>(new Set());
  const [boardsByRound, setBoardsByRound] = React.useState<Record<number, BoardsState>>({});
  const [boardItcByUserId, setBoardItcByUserId] = React.useState<Record<string, ItcRanking | null>>(
    {}
  );
  const requestedItcIdsRef = React.useRef<Set<string>>(new Set());
  const slowLoad = useDelayedFlag(loading);

  const loadItcFor = React.useCallback(
    (userIds: Iterable<string>) => {
      if (!itcLeagueId) return;
      Array.from(new Set(userIds)).forEach((userId) => {
        if (requestedItcIdsRef.current.has(userId)) return;
        requestedItcIdsRef.current.add(userId);
        fetchItcRanking(userId, itcLeagueId)
          .then((ranking) => {
            setBoardItcByUserId((prev) => ({ ...prev, [userId]: ranking }));
          })
          .catch(() => {
            requestedItcIdsRef.current.delete(userId);
          });
      });
    },
    [itcLeagueId]
  );

  const toggleExpand = (pairing: MyPairing) => {
    if (!pairing.teamPairingId) return;
    const round = pairing.round;
    // BCP's raw player1/player2 order on each board is tied to which side
    // was teamPlayer1/teamPlayer2, not to which side is "mine" — so when
    // the followed team was teamPlayer2, swap each board's sides here to
    // keep "my side first," matching how myScore/opponentScore above are
    // already oriented.
    const mySideIsTeam1 = pairing.mySideIsTeam1;

    setExpandedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(round)) {
        next.delete(round);
        return next;
      }
      next.add(round);
      return next;
    });

    if (boardsByRound[round]) return; // already fetched (or in flight)

    setBoardsByRound((prev) => ({ ...prev, [round]: { loading: true, error: null, matchups: [] } }));

    fetchTeamPairingBoards(eventId, round, pairing.teamPairingId)
      .then((rawMatchups) => {
        const matchups =
          mySideIsTeam1 === false ? rawMatchups.map(orientMatchup) : rawMatchups;
        setBoardsByRound((prev) => ({ ...prev, [round]: { loading: false, error: null, matchups } }));
        if (matchups.length > 0) {
          loadItcFor(
            matchups.flatMap((m) => [m.player1UserId, m.player2UserId].filter((id): id is string => Boolean(id)))
          );
        } else if (myTeamPlayerId) {
          // No individual boards yet — fall back to showing each side's
          // roster instead, so their ITC ratings are still worth fetching.
          const myRoster = rosterByTeamId?.get(myTeamPlayerId) ?? [];
          const opponentRoster = pairing.opponentTeamPlayerId
            ? rosterByTeamId?.get(pairing.opponentTeamPlayerId) ?? []
            : [];
          loadItcFor(
            [...myRoster, ...opponentRoster]
              .map((p) => p.bcpUserId)
              .filter((id): id is string => Boolean(id))
          );
        }
      })
      .catch((err) => {
        setBoardsByRound((prev) => ({
          ...prev,
          [round]: {
            loading: false,
            error: err instanceof Error ? err.message : "Failed to load boards",
            matchups: [],
          },
        }));
      });
  };

  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-surface-border bg-surface-2 px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-text-primary">
              <PlayerStatsLink name={whoLabel} bcpUserId={ownBcpUserId} />
            </p>
            <ItcBadge
              ranking={ownItc}
              bcpUserId={ownBcpUserId}
              leagueId={itcLeagueId}
              title={`View ${whoLabel}'s full ITC history on BCP`}
            />
          </div>
          <p className="text-sm text-text-secondary">Pairings by round</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onClear} className="shrink-0">
          Unfollow
        </Button>
      </div>

      <div className="p-3">
        {error && <ErrorAlert size="sm">Couldn&apos;t load pairings: {error}</ErrorAlert>}

        {!error && loading && (
          <div className="p-2">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Spinner size="sm" />
              <span>Checking published rounds…</span>
            </div>
            {slowLoad && (
              <p className="mt-1 text-xs text-text-tertiary">
                Taking longer than usual — first look at this event.
              </p>
            )}
          </div>
        )}

        {!error && !loading && upToRound === 0 && (
          <p className="p-2 text-sm text-text-secondary">
            Pairings haven&apos;t started for this event yet.
          </p>
        )}

        {!error && !loading && upToRound > 0 && (
          <ul className="flex flex-col gap-2">
            {Array.from({ length: upToRound }, (_, i) => i + 1).map((round) => {
              const pairing = byRound.get(round);
              const canExpand = Boolean(pairing?.published && pairing.teamPairingId);
              const isExpanded = canExpand && expandedRounds.has(round);
              const boardState = boardsByRound[round];

              return (
                <li
                  key={round}
                  className="rounded-md border border-surface-border text-sm"
                >
                  <div
                    role={canExpand ? "button" : undefined}
                    tabIndex={canExpand ? 0 : undefined}
                    onClick={canExpand && pairing ? () => toggleExpand(pairing) : undefined}
                    onKeyDown={
                      canExpand && pairing
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleExpand(pairing);
                            }
                          }
                        : undefined
                    }
                    className={`flex items-center justify-between gap-3 p-2.5 ${
                      canExpand ? "cursor-pointer" : ""
                    }`}
                  >
                    <span className="shrink-0 font-medium text-text-primary">
                      Round {round}
                    </span>
                    {pairing?.published ? (
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-text-secondary">
                          vs <PlayerStatsLink name={pairing.opponentName} bcpUserId={pairing.opponentUserId} />
                          {pairing.table && (
                            <span className="ml-1.5 text-xs text-text-tertiary">
                              (table {pairing.table})
                            </span>
                          )}
                        </span>
                        <ItcBadge
                          ranking={
                            pairing.opponentUserId ? itcByUserId?.[pairing.opponentUserId] : undefined
                          }
                          bcpUserId={pairing.opponentUserId}
                          leagueId={itcLeagueId}
                          title={`View ${pairing.opponentName}'s full ITC history on BCP`}
                        />
                        {pairing.myScore !== undefined && pairing.opponentScore !== undefined && (
                          <span
                            className={`shrink-0 text-xs font-semibold ${
                              SCORE_OUTCOME_CLASSES[classifyScore(pairing.myScore, pairing.opponentScore)]
                            }`}
                          >
                            {pairing.myScore}–{pairing.opponentScore}
                          </span>
                        )}
                        {canExpand && (
                          <span
                            aria-hidden
                            className="shrink-0 text-xs text-text-tertiary"
                          >
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-text-tertiary">
                        Not published yet
                      </span>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="flex flex-col gap-1 border-t border-surface-border px-2.5 pb-2.5 pt-1.5">
                      {boardState?.loading && (
                        <div className="flex items-center gap-1.5 px-1 py-1 text-xs text-text-secondary">
                          <Spinner size="sm" />
                          <span>Loading boards…</span>
                        </div>
                      )}
                      {boardState?.error && (
                        <p className="px-1 py-1 text-xs text-danger-600 dark:text-danger-400">
                          Couldn&apos;t load boards: {boardState.error}
                        </p>
                      )}
                      {boardState &&
                        !boardState.loading &&
                        !boardState.error &&
                        boardState.matchups.length === 0 &&
                        (() => {
                          const myRoster = myTeamPlayerId ? rosterByTeamId?.get(myTeamPlayerId) : undefined;
                          const opponentRoster = pairing?.opponentTeamPlayerId
                            ? rosterByTeamId?.get(pairing.opponentTeamPlayerId)
                            : undefined;
                          return myRoster?.length || opponentRoster?.length ? (
                            <TeamRosterFallback
                              side1Name={whoLabel}
                              side1Players={myRoster ?? []}
                              side2Name={pairing?.opponentName ?? "Opponent"}
                              side2Players={opponentRoster ?? []}
                              itcByUserId={boardItcByUserId}
                              itcLeagueId={itcLeagueId}
                            />
                          ) : (
                            <p className="px-1 py-1 text-xs text-text-secondary">
                              No individual boards published for this matchup yet.
                            </p>
                          );
                        })()}
                      {boardState?.matchups.map((m, mi) => (
                        <div
                          key={mi}
                          className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-surface-2 px-2 py-1.5 text-xs"
                        >
                          <span className="w-8 shrink-0 text-text-tertiary">
                            {m.table ? `Bd ${m.table}` : ""}
                          </span>
                          <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-text-secondary">
                            <span className="truncate">
                              <PlayerStatsLink name={m.player1Name} bcpUserId={m.player1UserId} />
                            </span>
                            <ItcBadge
                              ranking={
                                m.player1UserId ? boardItcByUserId[m.player1UserId] : undefined
                              }
                              bcpUserId={m.player1UserId}
                              leagueId={itcLeagueId}
                              title={`View ${m.player1Name}'s full ITC history on BCP`}
                              size="xs"
                            />
                          </span>
                          <span className="text-text-tertiary">vs</span>
                          <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-text-secondary">
                            <span className="truncate">
                              <PlayerStatsLink name={m.player2Name} bcpUserId={m.player2UserId} />
                            </span>
                            <ItcBadge
                              ranking={
                                m.player2UserId ? boardItcByUserId[m.player2UserId] : undefined
                              }
                              bcpUserId={m.player2UserId}
                              leagueId={itcLeagueId}
                              title={`View ${m.player2Name}'s full ITC history on BCP`}
                              size="xs"
                            />
                          </span>
                          {m.player1Score !== undefined && m.player2Score !== undefined && (
                            <span
                              className={`ml-auto shrink-0 font-medium ${
                                SCORE_OUTCOME_CLASSES[classifyScore(m.player1Score, m.player2Score)]
                              }`}
                            >
                              {m.player1Score}–{m.player2Score}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
