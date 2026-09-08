"use client";
import React from "react";
import {
  fetchItcRanking,
  fetchTeamPairingBoards,
  type BoardPairing,
  type ItcRanking,
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

type RoundBoardProps = {
  eventId: string;
  round: number;
  minRound: number;
  maxRound: number;
  entries: BoardPairing[];
  loading: boolean;
  error: string | null;
  onRoundChange: (round: number) => void;
  followedIds?: Set<string>; // ids of followed teams/players, highlighted if present in this round
  // Whether this round's entries are team-vs-team pairings — only those
  // can expand into individual boards; a singles-event row is already an
  // individual matchup.
  teamEvent: boolean;
  // BCP's current flagship ITC ranking league id — used the same way as
  // the rest of the app, to show each expanded board player's already-
  // published score/rank. Undefined/null just means it hasn't resolved
  // yet; expanded boards show no rating until it does.
  itcLeagueId?: string | null;
  // Overrides the "nothing published yet" message below — used when
  // `entries` came back empty because a search filter matched nothing,
  // rather than because BCP has nothing published for this round.
  emptyMessage?: string;
};

/**
 * The full pairings board for one round — every matchup BCP has published
 * for it, not just a single tracked team/player. Same scope rule as the
 * rest of the app: this only displays a pairing decision BCP already made
 * and published, never one this app computes.
 *
 * In a team event, clicking a team-vs-team row expands it in place to show
 * the individual board matchups underneath it (each player on one team
 * against their counterpart on the other) along with each player's
 * already-published ITC score/rank — the same information a singles-event
 * row already shows inline, just one level down. Boards (and each
 * player's ITC ranking) are only ever fetched for a pairing once it's
 * actually expanded, never for the whole round up front.
 */
export default function RoundBoard({
  eventId,
  round,
  minRound,
  maxRound,
  entries,
  loading,
  error,
  onRoundChange,
  followedIds,
  teamEvent,
  itcLeagueId,
  emptyMessage,
}: RoundBoardProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [boardsById, setBoardsById] = React.useState<Record<string, BoardsState>>({});
  const [itcByUserId, setItcByUserId] = React.useState<Record<string, ItcRanking | null>>({});
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
            setItcByUserId((prev) => ({ ...prev, [userId]: ranking }));
          })
          .catch(() => {
            requestedItcIdsRef.current.delete(userId);
          });
      });
    },
    [itcLeagueId]
  );

  const toggleExpand = (entry: BoardPairing) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(entry.id)) {
        next.delete(entry.id);
        return next;
      }
      next.add(entry.id);
      return next;
    });

    if (boardsById[entry.id]) return; // already fetched (or in flight)

    setBoardsById((prev) => ({
      ...prev,
      [entry.id]: { loading: true, error: null, matchups: [] },
    }));

    fetchTeamPairingBoards(eventId, round, entry.id)
      .then((matchups) => {
        setBoardsById((prev) => ({ ...prev, [entry.id]: { loading: false, error: null, matchups } }));
        loadItcFor(matchups);
      })
      .catch((err) => {
        setBoardsById((prev) => ({
          ...prev,
          [entry.id]: {
            loading: false,
            error: err instanceof Error ? err.message : "Failed to load boards",
            matchups: [],
          },
        }));
      });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
        <p className="font-semibold text-zinc-900 dark:text-zinc-50">Round pairings</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onRoundChange(round - 1)}
            disabled={round <= minRound}
            aria-label="Previous round"
            className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm text-zinc-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
          >
            ‹
          </button>
          <span className="min-w-[5.5rem] text-center text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Round {round}
          </span>
          <button
            type="button"
            onClick={() => onRoundChange(round + 1)}
            disabled={round >= maxRound}
            aria-label="Next round"
            className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm text-zinc-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
          >
            ›
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto p-3">
        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            Couldn&apos;t load round {round}: {error}
          </p>
        )}

        {!error && loading && (
          <div className="p-2">
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Spinner size="sm" />
              <span>Loading round {round}…</span>
            </div>
            {slowLoad && (
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Taking longer than usual — first look at this round.
              </p>
            )}
          </div>
        )}

        {!error && !loading && entries.length === 0 && (
          <p className="p-2 text-sm text-zinc-500 dark:text-zinc-400">
            {emptyMessage ?? `No pairings published yet for round ${round}.`}
          </p>
        )}

        {!error && !loading && entries.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {entries.map((entry) => {
              const side1Followed = Boolean(entry.side1Id && followedIds?.has(entry.side1Id));
              const side2Followed = Boolean(entry.side2Id && followedIds?.has(entry.side2Id));
              const isFollowed = side1Followed || side2Followed;
              const canExpand = teamEvent && !entry.isBye;
              const isExpanded = canExpand && expanded.has(entry.id);
              const boardState = boardsById[entry.id];

              // Color the final score from whichever side is followed,
              // when exactly one is — so a followed row reads as "are
              // they winning" — otherwise side1 by default (an arbitrary
              // but consistent anchor).
              const scoreOutcome =
                entry.side1Score !== undefined && entry.side2Score !== undefined
                  ? classifyScore(
                      side2Followed && !side1Followed ? entry.side2Score : entry.side1Score,
                      side2Followed && !side1Followed ? entry.side1Score : entry.side2Score
                    )
                  : undefined;

              return (
                <li
                  key={entry.id}
                  className={`rounded-xl border text-sm ${
                    isFollowed
                      ? "border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/30"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <div
                    role={canExpand ? "button" : undefined}
                    tabIndex={canExpand ? 0 : undefined}
                    onClick={canExpand ? () => toggleExpand(entry) : undefined}
                    onKeyDown={
                      canExpand
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleExpand(entry);
                            }
                          }
                        : undefined
                    }
                    className={`flex items-center gap-3 p-2 ${canExpand ? "cursor-pointer" : ""}`}
                  >
                    <span className="w-12 shrink-0 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                      {entry.table ? `Tbl ${entry.table}` : ""}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-zinc-700 dark:text-zinc-200">
                      <span className={side1Followed ? "font-semibold" : undefined}>
                        {entry.side1Name}
                      </span>
                      <span className="mx-1.5 text-zinc-400 dark:text-zinc-500">vs</span>
                      <span className={side2Followed ? "font-semibold" : undefined}>
                        {entry.side2Name}
                      </span>
                    </span>
                    {!entry.published ? (
                      <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                        unpublished
                      </span>
                    ) : entry.isDone ? (
                      scoreOutcome ? (
                        <span
                          className={`shrink-0 text-xs font-medium ${SCORE_OUTCOME_CLASSES[scoreOutcome]}`}
                        >
                          {entry.side1Score}–{entry.side2Score}
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs text-emerald-600 dark:text-emerald-400">
                          done
                        </span>
                      )
                    ) : (
                      <span className="shrink-0 text-xs text-amber-600 dark:text-amber-400">
                        in progress
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
                  </div>

                  {isExpanded && (
                    <div className="flex flex-col gap-1 border-t border-zinc-100 px-2 pb-2 pt-1.5 dark:border-zinc-800">
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
                      {boardState && !boardState.loading && !boardState.error &&
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
                              ranking={m.player1UserId ? itcByUserId[m.player1UserId] : undefined}
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
                              ranking={m.player2UserId ? itcByUserId[m.player2UserId] : undefined}
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
