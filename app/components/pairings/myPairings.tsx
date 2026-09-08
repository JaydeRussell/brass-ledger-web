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
import Spinner from "../shared/spinner";
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
    (matchups: TeamBoardMatchup[]) => {
      if (!itcLeagueId) return;
      const userIds = new Set<string>();
      matchups.forEach((m) => {
        if (m.player1UserId) userIds.add(m.player1UserId);
        if (m.player2UserId) userIds.add(m.player2UserId);
      });
      userIds.forEach((userId) => {
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
        loadItcFor(matchups);
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
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">{whoLabel}</p>
            <ItcBadge
              ranking={ownItc}
              bcpUserId={ownBcpUserId}
              leagueId={itcLeagueId}
              title={`View ${whoLabel}'s full ITC history on BCP`}
            />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Pairings by round</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Unfollow
        </button>
      </div>

      <div className="p-3">
        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            Couldn&apos;t load pairings: {error}
          </p>
        )}

        {!error && loading && (
          <div className="p-2">
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Spinner size="sm" />
              <span>Checking published rounds…</span>
            </div>
            {slowLoad && (
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Taking longer than usual — first look at this event.
              </p>
            )}
          </div>
        )}

        {!error && !loading && upToRound === 0 && (
          <p className="p-2 text-sm text-zinc-500 dark:text-zinc-400">
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
                  className="rounded-xl border border-zinc-200 text-sm dark:border-zinc-800"
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
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">
                      Round {round}
                    </span>
                    {pairing?.published ? (
                      <span className="flex items-center gap-2 truncate">
                        <span className="truncate text-zinc-600 dark:text-zinc-300">
                          vs {pairing.opponentName}
                          {pairing.table && (
                            <span className="ml-1.5 text-xs text-zinc-400 dark:text-zinc-500">
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
                            className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500"
                          >
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-500">
                        Not published yet
                      </span>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="flex flex-col gap-1 border-t border-zinc-100 px-2.5 pb-2.5 pt-1.5 dark:border-zinc-800">
                      {boardState?.loading && (
                        <div className="flex items-center gap-1.5 px-1 py-1 text-xs text-zinc-500 dark:text-zinc-400">
                          <Spinner size="sm" />
                          <span>Loading boards…</span>
                        </div>
                      )}
                      {boardState?.error && (
                        <p className="px-1 py-1 text-xs text-rose-600 dark:text-rose-400">
                          Couldn&apos;t load boards: {boardState.error}
                        </p>
                      )}
                      {boardState &&
                        !boardState.loading &&
                        !boardState.error &&
                        boardState.matchups.length === 0 && (
                          <p className="px-1 py-1 text-xs text-zinc-500 dark:text-zinc-400">
                            No individual boards published for this matchup yet.
                          </p>
                        )}
                      {boardState?.matchups.map((m, mi) => (
                        <div
                          key={mi}
                          className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-zinc-50 px-2 py-1.5 text-xs dark:bg-zinc-950/40"
                        >
                          <span className="w-8 shrink-0 text-zinc-400 dark:text-zinc-500">
                            {m.table ? `Bd ${m.table}` : ""}
                          </span>
                          <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-zinc-600 dark:text-zinc-300">
                            <span className="truncate">{m.player1Name}</span>
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
                          <span className="text-zinc-400 dark:text-zinc-500">vs</span>
                          <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-zinc-600 dark:text-zinc-300">
                            <span className="truncate">{m.player2Name}</span>
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
    </div>
  );
}
